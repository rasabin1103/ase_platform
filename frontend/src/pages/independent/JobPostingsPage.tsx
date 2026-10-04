import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Eye, FileText, Sparkles, X } from 'lucide-react'
import {
  deleteMyCv,
  getMyCvProfile,
  listJobPostingCategories,
  listJobPostings,
  trackJobPostingClick,
  trackJobPostingView,
  uploadMyCv,
  type JobPosting,
} from '../../api/jobPostings.api'
import type { JobContractType, JobScheduleType, JobWorkMode } from '../../api/jobPostingsAdmin.api'
import { AuthenticatedImage } from '../../components/ui/AuthenticatedImage'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonAnchor, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { CompatibilityAnalysis, CompatibilityPeekBadge, InterviewTipsPeek } from '../../components/jobPostings/CompatibilityAnalysis'
import { useAiQuota, useAnalysisBlocked } from '../../components/jobPostings/useAiQuota'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'

/** Translation helper for the few keys above that carry a `{token}`
 * placeholder — the i18n helper (`t`) only does path lookups, no built-in
 * interpolation, so templating happens here at the call site. */
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

/** Fires trackJobPostingView once per posting id the first time it renders
 * in the list — not on every filter re-fetch of the same item, and not
 * for postings the user never actually saw (filtered out). A plain
 * module-level-per-mount Set (via useRef) is enough; it doesn't need to
 * survive a full page reload. */
function useViewTracking(items: JobPosting[]) {
  const trackedRef = useRef<Set<number>>(new Set())
  useEffect(() => {
    for (const item of items) {
      if (!trackedRef.current.has(item.id)) {
        trackedRef.current.add(item.id)
        void trackJobPostingView(item.id)
      }
    }
  }, [items])
}

/** The per-posting "individual analysis" surface — fetched on demand (not
 * shipped with every list item). The card's "Analizar" button already is
 * the user's confirmation to run it, so this opens straight into the
 * calculation (autoAnalyze) instead of showing a second "Analizar" button
 * inside the modal — one click, one result. See
 * components/jobPostings/CompatibilityAnalysis.tsx. */
function CompatibilityModal({ posting, hasCv, onClose }: { posting: JobPosting; hasCv: boolean; onClose: () => void }) {
  const { t } = useI18n()

  return (
    <Modal open title={tpl(t('jobPostingsPage.cv.analyzeTitle'), { title: posting.title })} onClose={onClose}>
      {!hasCv ? (
        <p className="text-sm text-ase-text2">{t('jobPostingsPage.cv.needsCv')}</p>
      ) : (
        <CompatibilityAnalysis posting={posting} hasCv={hasCv} autoAnalyze />
      )}
    </Modal>
  )
}

function JobPostingCard({
  posting,
  hasCv,
  onAnalyze,
}: {
  posting: JobPosting
  hasCv: boolean
  onAnalyze: (posting: JobPosting) => void
}) {
  const { t, language } = useI18n()
  const { blocked: analysisBlocked, analyzed } = useAnalysisBlocked(posting.id, hasCv)
  const salarySuffix = t(`jobPostingsPage.salary.${posting.salary_type}`) as string
  const title = localizedCatalogText(language, posting.title, posting.title_en)
  const description = localizedCatalogText(language, posting.description, posting.description_en)

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          {posting.image_url ? (
            <AuthenticatedImage src={posting.image_url} alt="" className="h-full w-full" fit="cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-ase-muted">◇</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold text-ase-text">
              <Link to={`/job-postings/${posting.id}`} className="hover:text-ase-brand hover:underline">
                {title}
              </Link>
            </h2>
            <CompatibilityPeekBadge postingId={posting.id} hasCv={hasCv} className="shrink-0" />
          </div>
          <p className="mt-0.5 text-sm font-semibold text-ase-brand">{formatSalary(posting, salarySuffix)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="info">{t(`adminJobPostings.contractType.${posting.contract_type}`)}</Badge>
            <Badge variant="default">{t(`adminJobPostings.workMode.${posting.work_mode}`)}</Badge>
            <Badge variant="default">{t(`adminJobPostings.scheduleType.${posting.schedule_type}`)}</Badge>
            <Badge variant="default">{posting.category}</Badge>
          </div>
        </div>
      </div>
      <p className="line-clamp-4 text-sm leading-relaxed text-ase-text2">{description}</p>
      <InterviewTipsPeek postingId={posting.id} hasCv={hasCv} />
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink
          to={`/job-postings/${posting.id}`}
          variant="secondary"
          size="sm"
          leftIcon={<Eye className="h-3.5 w-3.5" strokeWidth={1.75} />}
        >
          {t('jobPostingsPage.viewDetails')}
        </ButtonLink>
        <ButtonAnchor
          href={posting.link_url}
          target="_blank"
          rel="noreferrer"
          size="sm"
          rightIcon={<ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />}
          onClick={() => void trackJobPostingClick(posting.id)}
        >
          {t('jobPostingsPage.applyCta')}
        </ButtonAnchor>
        {hasCv ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />}
            disabled={analysisBlocked}
            title={analysisBlocked ? (t('jobPostingsPage.cv.quotaExhaustedShort') as string) : undefined}
            onClick={() => onAnalyze(posting)}
          >
            {analyzed ? t('jobPostingsPage.cv.viewAnalysis') : t('jobPostingsPage.cv.analyze')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

function CvUploadSection() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const cvQuery = useQuery({ queryKey: ['job-postings-my-cv'], queryFn: getMyCvProfile })

  const uploadMut = useMutation({
    mutationFn: uploadMyCv,
    onSuccess: (profile) => {
      setError(null)
      queryClient.setQueryData(['job-postings-my-cv'], profile)
      void queryClient.invalidateQueries({ queryKey: ['job-postings'] })
    },
    onError: () => setError(t('jobPostingsPage.cv.uploadError')),
  })

  const removeMut = useMutation({
    mutationFn: deleteMyCv,
    onSuccess: () => {
      setError(null)
      queryClient.setQueryData(['job-postings-my-cv'], { has_cv: false, filename: null, uploaded_at: null })
      void queryClient.invalidateQueries({ queryKey: ['job-postings'] })
    },
    onError: () => setError(t('jobPostingsPage.cv.removeError')),
  })

  const profile = cvQuery.data

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-ase-brand" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-ase-text">{t('jobPostingsPage.cv.title')}</h2>
          <p className="mt-0.5 text-sm text-ase-text2">{t('jobPostingsPage.cv.hint')}</p>
          {profile?.has_cv ? (
            <p className="mt-1.5 text-xs text-ase-muted">
              {tpl(t('jobPostingsPage.cv.currentFile'), { filename: profile.filename ?? '' })}
            </p>
          ) : null}
          {error ? <p className="mt-1.5 text-xs text-ase-error">{error}</p> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) uploadMut.mutate(file)
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploadMut.isPending || removeMut.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMut.isPending
            ? t('jobPostingsPage.cv.uploading')
            : profile?.has_cv
              ? t('jobPostingsPage.cv.replace')
              : t('jobPostingsPage.cv.upload')}
        </Button>
        {profile?.has_cv ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploadMut.isPending || removeMut.isPending}
            leftIcon={<X className="h-3.5 w-3.5" strokeWidth={1.75} />}
            onClick={() => removeMut.mutate()}
          >
            {removeMut.isPending ? t('jobPostingsPage.cv.removing') : t('jobPostingsPage.cv.remove')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

export function JobPostingsPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [contractType, setContractType] = useState<JobContractType | ''>('')
  const [workMode, setWorkMode] = useState<JobWorkMode | ''>('')
  const [scheduleType, setScheduleType] = useState<JobScheduleType | ''>('')
  const [analyzing, setAnalyzing] = useState<JobPosting | null>(null)

  const cvQuery = useQuery({ queryKey: ['job-postings-my-cv'], queryFn: getMyCvProfile })
  const hasCv = Boolean(cvQuery.data?.has_cv)
  const { data: aiQuota } = useAiQuota(hasCv)

  const queryKey = useMemo(
    () => ['job-postings', search, category, contractType, workMode, scheduleType, hasCv],
    [search, category, contractType, workMode, scheduleType, hasCv],
  )

  const query = useQuery({
    queryKey,
    queryFn: () =>
      listJobPostings({
        limit: 100,
        search: search.trim() || undefined,
        category: category || undefined,
        contract_type: contractType || undefined,
        work_mode: workMode || undefined,
        schedule_type: scheduleType || undefined,
        sort: hasCv ? 'compatibility' : undefined,
      }),
  })

  const categoriesQuery = useQuery({ queryKey: ['job-postings-categories'], queryFn: listJobPostingCategories })

  const items = query.data?.items ?? []
  useViewTracking(items)

  const hasActiveFilters = Boolean(search.trim() || category || contractType || workMode || scheduleType)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ase-text">{t('jobPostingsPage.title')}</h1>
        <p className="mt-1 text-sm text-ase-muted">{t('jobPostingsPage.subtitle')}</p>
      </div>

      <CvUploadSection />
      {hasCv ? <p className="text-sm text-ase-muted">{t('jobPostingsPage.cv.sortedNotice')}</p> : null}
      {hasCv && aiQuota && aiQuota.remaining !== null ? (
        <p className="text-sm text-ase-muted">
          {String(t('jobPostingsPage.cv.quotaRemaining'))
            .replace('{remaining}', String(aiQuota.remaining))
            .replace('{limit}', String(aiQuota.limit ?? 0))}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('jobPostingsPage.searchPlaceholder')}
          className="w-full max-w-md rounded-xl border border-white/10 bg-ase-surface px-4 py-2.5 text-sm text-ase-text outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
        />
        <Select className="w-auto min-w-[160px]" value={contractType} onChange={(e) => setContractType(e.target.value as JobContractType | '')}>
          <option value="">{t('jobPostingsPage.filters.contractType')} — {t('jobPostingsPage.filters.all')}</option>
          {(['permanent', 'temporary', 'freelance', 'internship'] as JobContractType[]).map((v) => (
            <option key={v} value={v}>
              {t(`adminJobPostings.contractType.${v}`)}
            </option>
          ))}
        </Select>
        <Select className="w-auto min-w-[160px]" value={workMode} onChange={(e) => setWorkMode(e.target.value as JobWorkMode | '')}>
          <option value="">{t('jobPostingsPage.filters.workMode')} — {t('jobPostingsPage.filters.all')}</option>
          {(['remote', 'hybrid', 'onsite'] as JobWorkMode[]).map((v) => (
            <option key={v} value={v}>
              {t(`adminJobPostings.workMode.${v}`)}
            </option>
          ))}
        </Select>
        <Select className="w-auto min-w-[160px]" value={scheduleType} onChange={(e) => setScheduleType(e.target.value as JobScheduleType | '')}>
          <option value="">{t('jobPostingsPage.filters.scheduleType')} — {t('jobPostingsPage.filters.all')}</option>
          {(['full_time', 'part_time'] as JobScheduleType[]).map((v) => (
            <option key={v} value={v}>
              {t(`adminJobPostings.scheduleType.${v}`)}
            </option>
          ))}
        </Select>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setCategory('')
              setContractType('')
              setWorkMode('')
              setScheduleType('')
            }}
            className="rounded-xl border border-white/10 bg-ase-surface px-3 py-2.5 text-sm font-semibold text-ase-text2 transition hover:border-white/20"
          >
            {t('jobPostingsPage.filters.clear')}
          </button>
        ) : null}
      </div>

      <TagFilterBar
        tags={categoriesQuery.data ?? []}
        selected={category ? [category] : []}
        onToggle={(tg) => setCategory((prev) => (prev === tg ? '' : tg))}
        onClear={() => setCategory('')}
        label={t('jobPostingsPage.filters.category')}
        clearLabel={t('jobPostingsPage.filters.clear')}
      />

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('jobPostingsPage.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('jobPostingsPage.empty')} description={t('jobPostingsPage.emptyHint')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((posting) => (
            <JobPostingCard key={posting.id} posting={posting} hasCv={hasCv} onAnalyze={setAnalyzing} />
          ))}
        </div>
      )}

      {analyzing ? (
        <CompatibilityModal posting={analyzing} hasCv={hasCv} onClose={() => setAnalyzing(null)} />
      ) : null}
    </div>
  )
}
