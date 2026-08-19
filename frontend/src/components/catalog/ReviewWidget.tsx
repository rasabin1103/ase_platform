import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, X } from 'lucide-react'
import {
  listCatalogItemReviews,
  removeCatalogItemReview,
  submitCatalogItemReview,
} from '../../api/consumerCatalog.api'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import type { CatalogItem } from '../../types/catalog.types'

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          aria-label={`${n} / 5`}
          className="disabled:cursor-not-allowed"
        >
          <Star
            className={cn('h-6 w-6 transition', n <= shown ? 'text-amber-300' : 'text-white/20')}
            strokeWidth={1.75}
            fill={n <= shown ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )
}

function StaticStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('h-3.5 w-3.5', n <= Math.round(rating) ? 'text-amber-300' : 'text-white/15')}
          strokeWidth={1.75}
          fill={n <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

export function ReviewWidget({ item }: { item: CatalogItem }) {
  const { t, language } = useI18n()
  const qc = useQueryClient()

  const [rating, setRating] = useState(item.myReview?.rating ?? 0)
  const [comment, setComment] = useState(item.myReview?.comment ?? '')

  // Server data (item.myReview) only changes after a successful submit/remove
  // mutation refetches the item — when it does, resync the edit fields to
  // match. Adjusting state during render (guarded by a ref of the last seen
  // value) rather than in a useEffect, per React's recommended pattern for
  // resetting state when a prop changes.
  const [syncedReview, setSyncedReview] = useState(item.myReview ?? null)
  if (item.myReview?.rating !== syncedReview?.rating || item.myReview?.comment !== syncedReview?.comment) {
    setSyncedReview(item.myReview ?? null)
    setRating(item.myReview?.rating ?? 0)
    setComment(item.myReview?.comment ?? '')
  }

  const reviewsQuery = useQuery({
    queryKey: ['catalog-reviews', item.slug],
    queryFn: () => listCatalogItemReviews(item.slug, { limit: 20 }),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
    qc.invalidateQueries({ queryKey: ['catalog-reviews', item.slug] })
  }

  const submitMutation = useMutation({
    mutationFn: () => submitCatalogItemReview(item.slug, { rating, comment: comment.trim() || null }),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: () => removeCatalogItemReview(item.slug),
    onSuccess: () => {
      setRating(0)
      setComment('')
      invalidate()
    },
  })

  const hasReview = Boolean(item.myReview)
  const reviews = reviewsQuery.data?.items ?? []
  const average = item.averageRating ?? null
  const count = item.reviewCount ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{t('catalog.review.title')}</h2>
        {average != null && count > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-ase-muted">
            <StaticStars rating={average} />
            <span>
              {(count === 1 ? t('catalog.review.averageOne') : t('catalog.review.average'))
                .replace('{{rating}}', average.toFixed(1))
                .replace('{{count}}', String(count))}
            </span>
          </div>
        ) : null}
      </div>

      {item.isPurchased ? (
        <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold text-ase-text2">{t('catalog.review.writeTitle')}</p>
          <StarPicker value={rating} onChange={setRating} disabled={submitMutation.isPending} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('catalog.review.commentPlaceholder')}
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text placeholder:text-ase-muted focus:border-ase-brand/50 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={!rating || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {hasReview ? t('catalog.review.update') : t('catalog.review.submit')}
            </Button>
            {hasReview ? (
              <button
                type="button"
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
                className="flex items-center gap-1 text-[11px] text-ase-muted transition hover:text-ase-text"
              >
                <X className="h-3 w-3" strokeWidth={2} />
                {t('catalog.review.remove')}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-ase-muted">{t('catalog.review.purchaseRequired')}</p>
      )}

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-[11px] text-ase-muted">{t('catalog.review.empty')}</p>
        ) : (
          reviews.map((r, idx) => (
            <div key={`${r.userDisplayName}-${r.createdAt}-${idx}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ase-text">{r.userDisplayName}</span>
                <StaticStars rating={r.rating} />
              </div>
              {r.comment ? <p className="mt-1.5 text-sm text-ase-text2">{r.comment}</p> : null}
              <p className="mt-1.5 text-[11px] text-ase-muted">
                {new Date(r.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
