import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Wand2 } from 'lucide-react'
import {
  analyzeJobPostingSemanticCompatibility,
  getJobPostingCompatibility,
  peekJobPostingSemanticCompatibility,
  type JobPosting,
} from '../../api/jobPostings.api'
import { useI18n } from '../../i18n'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { localizedCatalogList, localizedCatalogText } from '../../utils/localizedCatalogText'
import { compatibilityTier } from './compatibilityTiers'
import { AI_QUOTA_QUERY_KEY, useAiQuota } from './useAiQuota'

function tpl(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), template)
}

export function CompatibilityTierBadge({ percentage, className }: { percentage: number; className?: string }) {
  const { t } = useI18n()
  const tier = compatibilityTier(percentage)
  return (
    <Badge variant={tier.variant} className={className}>
      {tpl(t('jobPostingsPage.cv.badgeWithTier'), { percent: String(percentage), tier: t(tier.labelKey) as string })}
    </Badge>
  )
}

/** Read-only peek — shows the AI percentage wherever a posting is referenced
 * (card, detail header) if it was already analyzed before, with no extra
 * click. Never calls Groq; the queryKey matches the one CompatibilityAnalysis
 * uses, so opening the full analysis afterward reuses this cached result
 * instead of fetching it twice. Renders nothing while loading or if there's
 * no cached result yet. */
export function CompatibilityPeekBadge({
  postingId,
  hasCv,
  className,
}: {
  postingId: number
  hasCv: boolean
  className?: string
}) {
  const peekQuery = useQuery({
    queryKey: ['job-posting-semantic', postingId],
    queryFn: () => peekJobPostingSemanticCompatibility(postingId),
    enabled: hasCv,
  })
  if (!peekQuery.data) return null
  return <CompatibilityTierBadge percentage={peekQuery.data.percentage} className={className} />
}

/** The 5 AI interview-prep tips for a posting, shown directly on its card.
 * Reads the same cached peek query as the badge (no extra request, never
 * calls Groq) and picks the ES/EN version for the active language. Renders
 * nothing until the posting has been analyzed (or if the saved analysis
 * predates the tips feature). */
export function InterviewTipsPeek({ postingId, hasCv }: { postingId: number; hasCv: boolean }) {
  const { t, language } = useI18n()
  const peekQuery = useQuery({
    queryKey: ['job-posting-semantic', postingId],
    queryFn: () => peekJobPostingSemanticCompatibility(postingId),
    enabled: hasCv,
  })
  const data = peekQuery.data
  if (!data) return null
  const tips = localizedCatalogList(language, data.interview_tips ?? [], data.interview_tips_en)
  if (tips.length === 0) return null
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <h3 className="text-xs font-semibold text-ase-text">{t('jobPostingsPage.cv.semantic.interviewTips')}</h3>
      <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-ase-text2">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ol>
    </div>
  )
}

/** The compatibility analysis for one posting — shared between the list's
 * CompatibilityModal and the detail page's CompatibilitySection so both
 * behave identically:
 *
 * - Nothing is calculated until the user clicks "Analyze".
 * - That single click launches the free keyword breakdown AND the AI
 *   ("semantic") analysis together, automatically, in one request — no
 *   second button to trigger the AI step separately.
 * - The AI's percentage is what's shown as THE compatibility score (not
 *   the keyword one) once it's available, colored by compatibilityTier.
 * - The AI result is computed at most once per (user, posting): the
 *   backend persists it, so revisiting this posting later shows the same
 *   cached result automatically (via the read-only "peek" below) and
 *   there is no button to re-run it — only a retry if the attempt failed.
 *
 * `autoAnalyze` is for callers that already asked the user to confirm the
 * action one level up (e.g. a card's own "Analizar" button that opens a
 * modal around this component) — in that case this component starts the
 * calculation itself as soon as it mounts, instead of showing yet another
 * "Analizar" button the user would have to click a second time.
 */
export function CompatibilityAnalysis({
  posting,
  hasCv,
  autoAnalyze = false,
}: {
  posting: JobPosting
  hasCv: boolean
  autoAnalyze?: boolean
}) {
  const { t, language } = useI18n()
  const queryClient = useQueryClient()

  const peekQuery = useQuery({
    queryKey: ['job-posting-semantic', posting.id],
    queryFn: () => peekJobPostingSemanticCompatibility(posting.id),
    enabled: hasCv,
  })

  const quotaQuery = useAiQuota(hasCv)
  const quota = quotaQuery.data
  const quotaExhausted = quota?.remaining === 0

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const [keyword, semantic] = await Promise.all([
        getJobPostingCompatibility(posting.id),
        analyzeJobPostingSemanticCompatibility(posting.id),
      ])
      return { keyword, semantic }
    },
    // Feed the shared peek cache so the card behind the modal (badge + tips)
    // updates immediately instead of waiting for a refetch.
    onSuccess: ({ semantic }) => {
      queryClient.setQueryData(['job-posting-semantic', posting.id], semantic)
      void queryClient.invalidateQueries({ queryKey: AI_QUOTA_QUERY_KEY })
    },
    // A 403 means the month's allowance ran out (e.g. spent in another tab):
    // refresh the counter so the UI flips to the "limit reached" state.
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: AI_QUOTA_QUERY_KEY })
    },
  })

  const semantic = analyzeMutation.data?.semantic ?? peekQuery.data ?? null
  const hasAnalysis = Boolean(semantic)

  // Once there's an AI result from the cache (not from this mutation run),
  // fetch the free keyword breakdown too so the matched/missing lists show
  // up alongside it — this call is instant/no-cost, unlike the AI one.
  const keywordQuery = useQuery({
    queryKey: ['job-posting-compatibility', posting.id],
    queryFn: () => getJobPostingCompatibility(posting.id),
    enabled: hasAnalysis && !analyzeMutation.data,
  })
  const keyword = analyzeMutation.data?.keyword ?? keywordQuery.data ?? null

  const canStartAnalysis =
    hasCv &&
    !peekQuery.isLoading &&
    !quotaQuery.isLoading &&
    !quotaExhausted &&
    !hasAnalysis &&
    !analyzeMutation.isPending &&
    !analyzeMutation.isError

  // Guards against firing the (real, billable-to-rate-limits) Groq call
  // twice for the same mount — React 18 StrictMode runs effects twice in
  // development, and without this a single "Analizar" click could fire
  // two concurrent POSTs for the same posting (the backend now tolerates
  // that race too, but there's no reason to make two calls at all).
  const autoAnalyzeFiredRef = useRef(false)
  useEffect(() => {
    if (autoAnalyze && canStartAnalysis && !autoAnalyzeFiredRef.current) {
      autoAnalyzeFiredRef.current = true
      analyzeMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze, canStartAnalysis])

  if (!hasCv) return null

  if (peekQuery.isLoading || quotaQuery.isLoading || (autoAnalyze && canStartAnalysis)) {
    return <Skeleton className="h-16 w-full rounded-xl" />
  }

  // Allowance spent and nothing saved for this posting: no button at all
  // (the server enforces it too — this is just the honest UI for it).
  if (!hasAnalysis && quotaExhausted && !analyzeMutation.isPending) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-ase-text2">
        {tpl(t('jobPostingsPage.cv.quotaExhausted'), { limit: String(quota?.limit ?? 0) })}
      </p>
    )
  }

  if (!hasAnalysis && !analyzeMutation.isPending && !analyzeMutation.isError) {
    return (
      <div className="space-y-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Wand2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
          onClick={() => analyzeMutation.mutate()}
        >
          {t('jobPostingsPage.cv.analyze')}
        </Button>
        {quota && quota.remaining !== null ? (
          <p className="text-xs text-ase-muted">
            {tpl(t('jobPostingsPage.cv.quotaRemaining'), {
              remaining: String(quota.remaining),
              limit: String(quota.limit ?? 0),
            })}
          </p>
        ) : null}
      </div>
    )
  }

  if (analyzeMutation.isPending) {
    return <Skeleton className="h-24 w-full rounded-xl" />
  }

  if (analyzeMutation.isError) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-ase-error">{t('jobPostingsPage.cv.analyzeError')}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => analyzeMutation.mutate()}>
          {t('jobPostingsPage.cv.retry')}
        </Button>
      </div>
    )
  }

  if (!semantic) return null

  const summary = localizedCatalogText(language, semantic.summary, semantic.summary_en)
  const strengths = localizedCatalogList(language, semantic.strengths, semantic.strengths_en)
  const gaps = localizedCatalogList(language, semantic.gaps, semantic.gaps_en)
  const interviewTips = localizedCatalogList(language, semantic.interview_tips ?? [], semantic.interview_tips_en)

  return (
    <div className="space-y-4">
      <CompatibilityTierBadge percentage={semantic.percentage} />
      {summary ? <p className="text-sm leading-relaxed text-ase-text2">{summary}</p> : null}
      {strengths.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-ase-text">{t('jobPostingsPage.cv.semantic.strengths')}</h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {strengths.map((s) => (
              <Badge key={s} variant="success">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      {gaps.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-ase-text">{t('jobPostingsPage.cv.semantic.gaps')}</h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {gaps.map((g) => (
              <Badge key={g} variant="default">
                {g}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {interviewTips.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-ase-text">{t('jobPostingsPage.cv.semantic.interviewTips')}</h4>
          <ol className="mt-1.5 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ase-text2">
            {interviewTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {keyword ? (
        <div className="space-y-3 border-t border-white/10 pt-3">
          <div>
            <h4 className="text-xs font-semibold text-ase-text">{t('jobPostingsPage.cv.matched')}</h4>
            {keyword.matched_keywords.length === 0 ? (
              <p className="mt-1 text-sm text-ase-text2">{t('jobPostingsPage.cv.noneMatched')}</p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {keyword.matched_keywords.map((kw) => (
                  <Badge key={kw} variant="success">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-ase-text">{t('jobPostingsPage.cv.missing')}</h4>
            {keyword.missing_keywords.length === 0 ? (
              <p className="mt-1 text-sm text-ase-text2">{t('jobPostingsPage.cv.noneMissing')}</p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {keyword.missing_keywords.map((kw) => (
                  <Badge key={kw} variant="default">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : keywordQuery.isLoading ? (
        <Skeleton className="h-12 w-full rounded-xl" />
      ) : null}
    </div>
  )
}
