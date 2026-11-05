import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  FileText,
  Loader2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { getTestRunLogs, getTestRunReport, getTestRunSummary, type TestRunSummary } from '../../api/testExecution.api'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n'
import { parseApiError } from '../../utils/apiError'
import { localizedCatalogText } from '../../utils/localizedCatalogText'
import { RunPdfPreview } from './RunPdfPreview'
import { CountTile, DynamicRequestCard, MiniStat, ToolResultCard } from './TestExecutionPage.parts'
import { fmtDate, fmtDuration, ghTone, ghToneTextClass } from './TestExecutionPage.utils'

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const TONE_STYLE: Record<Tone, { box: string; icon: string; bar: string }> = {
  success: {
    box: 'border-emerald-400/30 bg-gradient-to-br from-emerald-400/[0.14] to-transparent',
    icon: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
    bar: 'bg-emerald-400',
  },
  warning: {
    box: 'border-amber-400/30 bg-gradient-to-br from-amber-400/[0.14] to-transparent',
    icon: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
    bar: 'bg-amber-400',
  },
  error: {
    box: 'border-rose-400/30 bg-gradient-to-br from-rose-400/[0.14] to-transparent',
    icon: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
    bar: 'bg-rose-400',
  },
  info: {
    box: 'border-cyan-400/30 bg-gradient-to-br from-cyan-400/[0.12] to-transparent',
    icon: 'bg-cyan-400/15 text-cyan-300 ring-cyan-400/30',
    bar: 'bg-cyan-400',
  },
  neutral: {
    box: 'border-white/10 bg-white/[0.03]',
    icon: 'bg-white/10 text-ase-text2 ring-white/15',
    bar: 'bg-white/40',
  },
}

/** Tono y símbolo del resultado: manda el veredicto del producto si existe,
 * si no la conclusión de la ejecución. */
function outcomeOf(s: TestRunSummary): { tone: Tone; Icon: LucideIcon; spin: boolean } {
  if (s.status === 'queued' || s.status === 'in_progress' || s.status === 'pending') {
    return { tone: 'info', Icon: Loader2, spin: true }
  }
  if (s.status === 'failed_to_dispatch') return { tone: 'error', Icon: XCircle, spin: false }
  const v = s.toolResult?.verdict
  if (v === 'pass') return { tone: 'success', Icon: CheckCircle2, spin: false }
  if (v === 'warn') return { tone: 'warning', Icon: AlertTriangle, spin: false }
  if (v === 'fail' || v === 'error') return { tone: 'error', Icon: XCircle, spin: false }
  if (s.conclusion === 'success') return { tone: 'success', Icon: CheckCircle2, spin: false }
  if (s.conclusion === 'cancelled' || s.conclusion === 'action_required') {
    return { tone: 'warning', Icon: AlertTriangle, spin: false }
  }
  if (s.conclusion) return { tone: 'error', Icon: XCircle, spin: false }
  return { tone: 'neutral', Icon: CircleDashed, spin: false }
}

/**
 * Resultado de una ejecución, en línea (sin modal): banner con el veredicto,
 * métricas, hallazgos, pasos y salida detallada. Se actualiza solo mientras la
 * ejecución sigue activa.
 */
export function RunResultPanel({ runUuid }: { runUuid: string }) {
  const { t, language } = useI18n()
  const summaryQuery = useQuery({
    queryKey: ['test-execution-run-summary', runUuid],
    queryFn: () => getTestRunSummary(runUuid),
    refetchInterval: (q) => {
      const st = q.state.data?.status
      return st === 'completed' || st === 'failed_to_dispatch' ? false : 5000
    },
  })
  const [stepsOpen, setStepsOpen] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)
  const [originalBusy, setOriginalBusy] = useState(false)
  const [originalError, setOriginalError] = useState<string | null>(null)

  const logsQuery = useQuery({
    queryKey: ['test-execution-run-logs', runUuid],
    queryFn: () => getTestRunLogs(runUuid),
    enabled: logsOpen,
  })

  const openOriginal = async () => {
    setOriginalError(null)
    const win = window.open('', '_blank')
    setOriginalBusy(true)
    try {
      const html = await getTestRunReport(runUuid)
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      if (win) win.location.href = url
      else window.open(url, '_blank')
    } catch (err) {
      win?.close()
      setOriginalError(parseApiError(err, t('testExecution.report.originalError') as string).message)
    } finally {
      setOriginalBusy(false)
    }
  }

  if (summaryQuery.isLoading) return <Skeleton className="h-64 rounded-3xl" />
  if (summaryQuery.isError || !summaryQuery.data) {
    return <EmptyState title={t('private.common.couldNotLoad')} description={t('testExecution.loadError')} />
  }

  const s = summaryQuery.data
  const { tone, Icon, spin } = outcomeOf(s)
  const style = TONE_STYLE[tone]
  const active = s.status === 'queued' || s.status === 'in_progress' || s.status === 'pending'
  const steps = s.jobs.flatMap((j) => j.steps)
  const stepsDone = steps.filter((x) => x.conclusion).length
  const title = active
    ? (t('testExecution.workspace.running') as string)
    : s.toolResult?.headline ||
      (s.conclusion
        ? (t(`testExecution.conclusion.${s.conclusion}`) as string)
        : (t(`testExecution.status.${s.status}`) as string))

  return (
    <div className="space-y-4">
      <div className={`relative overflow-hidden rounded-3xl border p-5 ${style.box}`}>
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${style.icon}`}>
            <Icon className={`h-6 w-6 ${spin ? 'animate-spin' : ''}`} strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {localizedCatalogText(language, s.frameworkTitle, s.frameworkTitleEn)}
              {s.toolResult
                ? ` · ${t(`testExecution.report.toolResult.verdict.${s.toolResult.verdict}`) as string}`
                : ''}
            </p>
            <h3 className="mt-1 text-xl font-semibold leading-snug text-ase-text">{title}</h3>
            {s.toolResult?.explanation && !active ? (
              <p className="mt-1.5 text-sm text-ase-text2">{s.toolResult.explanation}</p>
            ) : null}
            {s.errorMessage ? <p className="mt-1.5 text-sm text-rose-300">{s.errorMessage}</p> : null}
          </div>
        </div>

        {active ? (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
                style={{ width: `${Math.max(6, s.progressPercent ?? 6)}%` }}
              />
            </div>
            {steps.length > 0 ? (
              <p className="mt-1.5 text-xs text-ase-muted">
                {stepsDone}/{steps.length} · {t('testExecution.workspace.steps') as string}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label={t('testExecution.report.started') as string} value={fmtDate(s.startedAt ?? s.createdAt)} />
          <MiniStat label={t('testExecution.report.completed') as string} value={fmtDate(s.completedAt)} />
          <MiniStat label={t('testExecution.report.duration') as string} value={fmtDuration(s.durationSeconds)} />
          <MiniStat
            label={t('testExecution.runs.columns.status') as string}
            value={t(`testExecution.status.${s.status}`) as string}
          />
        </div>
      </div>

      {s.toolResult ? <ToolResultCard result={s.toolResult} /> : null}
      {(s.pdfAvailable || s.toolResult?.hasPdf) && s.status === 'completed' ? (
        <RunPdfPreview runUuid={s.runUuid} />
      ) : null}

      {s.toolResult ? null : s.testSummary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {s.testSummary.passed != null ? (
            <CountTile label={t('testExecution.report.passed') as string} value={s.testSummary.passed} tone="success" />
          ) : null}
          {s.testSummary.failed != null ? (
            <CountTile label={t('testExecution.report.failed') as string} value={s.testSummary.failed} tone="error" />
          ) : null}
          {s.testSummary.skipped != null ? (
            <CountTile
              label={t('testExecution.report.skipped') as string}
              value={s.testSummary.skipped}
              tone="warning"
            />
          ) : null}
          {s.testSummary.error != null ? (
            <CountTile label={t('testExecution.report.errors') as string} value={s.testSummary.error} tone="error" />
          ) : null}
        </div>
      ) : !active ? (
        <p className="text-sm text-ase-muted">{t('testExecution.report.noSummary')}</p>
      ) : null}

      {s.dynamicRequest ? <DynamicRequestCard detail={s.dynamicRequest} /> : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => setStepsOpen((v) => !v)}
          aria-expanded={stepsOpen}
        >
          <span className="text-sm font-semibold text-ase-text">
            {t('testExecution.report.jobs')}
            {steps.length > 0 ? (
              <span className="ml-2 text-xs font-normal text-ase-muted">
                {stepsDone}/{steps.length}
              </span>
            ) : null}
          </span>
          {stepsOpen ? (
            <ChevronUp className="h-4 w-4 text-ase-muted" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="h-4 w-4 text-ase-muted" strokeWidth={1.75} />
          )}
        </button>
        {stepsOpen ? (
          <div className="border-t border-white/[0.07] px-4 py-3">
            {s.jobs.length === 0 ? (
              <p className="text-sm text-ase-muted">{t('testExecution.report.noJobsYet')}</p>
            ) : (
              <div className="space-y-4">
                {s.jobs.map((job, i) => (
                  <div key={i}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ase-muted">{job.name}</p>
                    <ol className="relative space-y-2 border-l border-white/10 pl-4">
                      {job.steps.map((step, si) => {
                        const toneName = ghTone(step.status, step.conclusion)
                        const dot =
                          toneName === 'success'
                            ? 'bg-emerald-400'
                            : toneName === 'error'
                              ? 'bg-rose-400'
                              : toneName === 'warning'
                                ? 'bg-amber-400'
                                : toneName === 'info'
                                  ? 'bg-cyan-400 animate-pulse'
                                  : 'bg-white/30'
                        return (
                          <li key={si} className="relative flex items-center justify-between gap-3 text-xs">
                            <span
                              className={`absolute -left-[1.3rem] h-2.5 w-2.5 rounded-full ring-2 ring-ase-surface ${dot}`}
                            />
                            <span className="truncate text-ase-text2">{step.name}</span>
                            <span className={`shrink-0 ${ghToneTextClass(step.status, step.conclusion)}`}>
                              {step.conclusion ?? step.status ?? '—'}
                            </span>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => setLogsOpen((v) => !v)}
          aria-expanded={logsOpen}
        >
          <span className="text-sm font-semibold text-ase-text">{t('testExecution.report.logsTitle')}</span>
          {logsOpen ? (
            <ChevronUp className="h-4 w-4 text-ase-muted" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="h-4 w-4 text-ase-muted" strokeWidth={1.75} />
          )}
        </button>
        {logsOpen ? (
          <div className="border-t border-white/[0.07] p-3">
            {logsQuery.isLoading ? (
              <Skeleton className="h-32 rounded-xl" />
            ) : logsQuery.isError ? (
              <p className="text-sm text-ase-muted">{t('testExecution.report.logsError')}</p>
            ) : (
              <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-snug text-ase-text2">
                {logsQuery.data}
              </pre>
            )}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={openOriginal}
          disabled={originalBusy || !s.originalReportAvailable}
          leftIcon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
        >
          {originalBusy ? t('testExecution.runs.reportLoading') : t('testExecution.report.viewOriginal')}
        </Button>
        {originalError ? <span className="text-sm text-rose-300">{originalError}</span> : null}
      </div>
    </div>
  )
}
