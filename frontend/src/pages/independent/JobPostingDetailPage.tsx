import { useEffect } from 'react'
import { JobDescriptionView, JobHighlights } from '../../components/jobPostings/JobDescriptionView'
import { formatJobTitle, parseJobDescription } from '../../utils/jobDescription'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Sparkles, Briefcase } from 'lucide-react'
import {
  getJobPosting,
  getMyCvProfile,
  trackJobPostingClick,
  trackJobPostingView,
  type JobPosting,
} from '../../api/jobPostings.api'
import { AuthenticatedImage } from '../../components/ui/AuthenticatedImage'
import { Badge } from '../../components/ui/Badge'
import { ButtonAnchor } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { CompatibilityAnalysis, CompatibilityPeekBadge } from '../../components/jobPostings/CompatibilityAnalysis'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'

function tpl(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), template)
}

function formatSalary(posting: JobPosting, salarySuffix: string): string {
  const min = Number(posting.salary_amount)
  const max = posting.salary_amount_max != null ? Number(posting.salary_amount_max) : null
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  const base = max != null && max !== min ? `${fmt(min)}–${fmt(max)}€` : `${fmt(min)}€`
  return `${base} ${salarySuffix}`
}

/** Clicking "Analyze" inside CompatibilityAnalysis launches the keyword
 * breakdown and the AI analysis together, automatically — no percentage
 * shown until then, and no way to re-trigger once it's computed. See
 * components/jobPostings/CompatibilityAnalysis.tsx. */
function CompatibilitySection({ posting, hasCv }: { posting: JobPosting; hasCv: boolean }) {
  const { t } = useI18n()

  if (!hasCv) return null

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-ase-brand" strokeWidth={1.75} />
        <h2 className="text-sm font-bold text-ase-text">{t('jobPostingsPage.cv.title')}</h2>
      </div>
      <CompatibilityAnalysis posting={posting} hasCv={hasCv} />
    </Card>
  )
}

export function JobPostingDetailPage() {
  const { t, language } = useI18n()
  const { id } = useParams<{ id: string }>()
  const postingId = id ? Number(id) : undefined

  const query = useQuery({
    queryKey: ['job-posting', postingId],
    queryFn: () => getJobPosting(postingId as number),
    enabled: postingId !== undefined && !Number.isNaN(postingId),
  })

  const cvQuery = useQuery({ queryKey: ['job-postings-my-cv'], queryFn: getMyCvProfile })
  const hasCv = Boolean(cvQuery.data?.has_cv)

  const posting = query.data
  useEffect(() => {
    if (posting) void trackJobPostingView(posting.id)
  }, [posting])

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (query.isError || !posting) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/job-postings" className="text-xs text-ase-muted hover:text-ase-text">
          {t('jobPostingsPage.detail.backToList')}
        </Link>
        <EmptyState title={t('jobPostingsPage.detail.notFound')} description={t('jobPostingsPage.detail.loadError')} />
      </div>
    )
  }

  const salarySuffix = t(`jobPostingsPage.salary.${posting.salary_type}`) as string
  const title = formatJobTitle(localizedCatalogText(language, posting.title, posting.title_en))
  const description = localizedCatalogText(language, posting.description, posting.description_en)
  const parsed = parseJobDescription(description)

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <Link to="/job-postings" className="text-xs text-ase-muted hover:text-ase-text">
        {t('jobPostingsPage.detail.backToList')}
      </Link>

      <Card className="flex flex-col gap-6 rounded-3xl border-white/10 bg-ase-surface/80 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:h-40 sm:w-40">
            {posting.image_url ? (
              <AuthenticatedImage src={posting.image_url} alt="" className="h-full w-full" fit="cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sky-300">
                <Briefcase className="h-10 w-10" strokeWidth={1.4} aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="font-display text-2xl font-semibold leading-tight text-ase-text sm:text-3xl">{title}</h1>
              <CompatibilityPeekBadge postingId={posting.id} hasCv={hasCv} className="shrink-0" />
            </div>
            <p className="mt-1 text-base font-semibold text-sky-300">{formatSalary(posting, salarySuffix)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="info">{t(`adminJobPostings.contractType.${posting.contract_type}`)}</Badge>
              <Badge variant="default">{t(`adminJobPostings.workMode.${posting.work_mode}`)}</Badge>
              <Badge variant="default">{t(`adminJobPostings.scheduleType.${posting.schedule_type}`)}</Badge>
              <Badge variant="default">{posting.category}</Badge>
            </div>
            {posting.published_at ? (
              <p className="mt-3 text-xs text-ase-muted">
                {tpl(t('jobPostingsPage.detail.publishedOn'), {
                  date: new Date(posting.published_at).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { dateStyle: 'long' }),
                })}
              </p>
            ) : null}
          </div>
        </div>

        <JobHighlights items={parsed.highlights} />
        <JobDescriptionView
          parsed={parsed}
          missingLabel={t('jobPostingsPage.notSpecified') as string}
          factsTitle={t('jobPostingsPage.detail.keyFacts') as string}
        />

        <ButtonAnchor
          href={posting.link_url}
          target="_blank"
          rel="noreferrer"
          className="self-start"
          rightIcon={<ExternalLink className="h-4 w-4" strokeWidth={1.75} />}
          onClick={() => void trackJobPostingClick(posting.id)}
        >
          {t('jobPostingsPage.applyCta')}
        </ButtonAnchor>
      </Card>

      <CompatibilitySection posting={posting} hasCv={hasCv} />
    </div>
  )
}
