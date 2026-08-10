import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { rateCatalogItem, removeCatalogItemRating } from '../../api/consumerCatalog.api'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'
import { IMPACT_TAGS } from './impactTags'
import type { CatalogItem } from '../../types/catalog.types'

const MAX_TAGS = 3

/**
 * Deliberately not a star rating: thumbs up/down + a small set of impact
 * tags. Gives qualitative feedback (which tags dominate) and a net score
 * that can be used to rank "best" items. Not available to super_admin.
 */
export function RatingWidget({ item, compact = false }: { item: CatalogItem; compact?: boolean }) {
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const qc = useQueryClient()
  const isSuperAdmin = Boolean(currentUser?.is_superuser)

  const [pendingTags, setPendingTags] = useState<string[]>(item.myRating?.tags ?? [])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    qc.invalidateQueries({ queryKey: ['org-catalog-items'] })
  }

  const rateMutation = useMutation({
    mutationFn: (payload: { isPositive: boolean; tags: string[] }) => rateCatalogItem(item.slug, payload),
    onSuccess: (updated) => {
      setPendingTags(updated.myRating?.tags ?? [])
      invalidate()
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => removeCatalogItemRating(item.slug),
    onSuccess: () => {
      setPendingTags([])
      invalidate()
    },
  })

  const hasVoted = Boolean(item.myRating)
  const netScore = item.netScore ?? 0
  const netScoreClass =
    netScore > 0 ? 'text-emerald-300' : netScore < 0 ? 'text-rose-300' : 'text-ase-muted'

  const currentTags = useMemo(() => (hasVoted ? pendingTags : []), [hasVoted, pendingTags])

  const handleVote = (isPositive: boolean) => {
    rateMutation.mutate({ isPositive, tags: pendingTags })
  }

  const handleToggleTag = (tag: string) => {
    if (!hasVoted || !item.myRating) return
    const next = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : currentTags.length >= MAX_TAGS
        ? currentTags
        : [...currentTags, tag]
    setPendingTags(next)
    rateMutation.mutate({ isPositive: item.myRating.isPositive, tags: next })
  }

  if (isSuperAdmin) {
    return (
      <div className="flex items-center gap-2 text-xs text-ase-muted">
        <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>{item.upvotes ?? 0}</span>
        <ThumbsDown className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>{item.downvotes ?? 0}</span>
        <span className={cn('font-semibold', netScoreClass)}>({netScore >= 0 ? '+' : ''}{netScore})</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={rateMutation.isPending}
          onClick={() => handleVote(true)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
            item.myRating?.isPositive
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-white/10 bg-white/[0.03] text-ase-text2 hover:border-white/20 hover:bg-white/[0.06]',
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.75} fill={item.myRating?.isPositive ? 'currentColor' : 'none'} />
          {item.upvotes ?? 0}
        </button>
        <button
          type="button"
          disabled={rateMutation.isPending}
          onClick={() => handleVote(false)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
            item.myRating && !item.myRating.isPositive
              ? 'border-rose-400/40 bg-rose-500/15 text-rose-200'
              : 'border-white/10 bg-white/[0.03] text-ase-text2 hover:border-white/20 hover:bg-white/[0.06]',
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" strokeWidth={1.75} fill={item.myRating && !item.myRating.isPositive ? 'currentColor' : 'none'} />
          {item.downvotes ?? 0}
        </button>
        {hasVoted ? (
          <button
            type="button"
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
            className="ml-auto flex items-center gap-1 text-[11px] text-ase-muted transition hover:text-ase-text"
          >
            <X className="h-3 w-3" strokeWidth={2} />
            {t('catalog.rating.removeMyRating')}
          </button>
        ) : null}
      </div>

      {!compact ? (
        <div className="flex flex-wrap gap-1.5">
          {IMPACT_TAGS.map((tag) => {
            const selected = currentTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                disabled={!hasVoted || rateMutation.isPending}
                onClick={() => handleToggleTag(tag)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[11px] transition',
                  selected
                    ? 'border-ase-brand/40 bg-ase-brand/15 text-ase-brand'
                    : 'border-white/10 bg-white/[0.02] text-ase-muted',
                  !hasVoted && 'cursor-not-allowed opacity-50',
                )}
              >
                {t(`catalog.rating.tags.${tag}`)}
              </button>
            )
          })}
        </div>
      ) : null}
      {!compact && !hasVoted ? (
        <p className="text-[11px] text-ase-muted">{t('catalog.rating.votePrompt')}</p>
      ) : null}
    </div>
  )
}
