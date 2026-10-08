import { type RunnableFramework, type TestRunConclusion, type TestRunStatus } from '../../api/testExecution.api'

export const RUNS_LIMIT = 10

export function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export const STATUS_BADGE: Record<TestRunStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  pending: 'default',
  queued: 'info',
  in_progress: 'info',
  completed: 'success',
  failed_to_dispatch: 'error',
}

export const CONCLUSION_BADGE: Record<TestRunConclusion, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  success: 'success',
  failure: 'error',
  cancelled: 'warning',
  timed_out: 'error',
  action_required: 'warning',
  unknown: 'default',
}

export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

export type FrameworkRunPanelProps = {
  framework: RunnableFramework
  onTriggered: () => void
}

export function fmtDuration(seconds: number | null): string {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// Maps GitHub's own job/step status+conclusion vocabulary onto a color —
// used for both the job header badge and the per-step text, kept separate
// from STATUS_BADGE/CONCLUSION_BADGE above since those are keyed by our own
// TestRunStatus/TestRunConclusion enums, not GitHub's raw job-level strings.
export function ghTone(
  status: string | null,
  conclusion: string | null,
): 'default' | 'info' | 'success' | 'warning' | 'error' {
  if (conclusion === 'success') return 'success'
  if (conclusion === 'failure' || conclusion === 'timed_out') return 'error'
  if (conclusion === 'cancelled' || conclusion === 'action_required') return 'warning'
  if (conclusion) return 'default'
  if (status === 'in_progress' || status === 'queued') return 'info'
  return 'default'
}

export function ghToneTextClass(status: string | null, conclusion: string | null): string {
  const tone = ghTone(status, conclusion)
  if (tone === 'success') return 'text-emerald-300'
  if (tone === 'error') return 'text-ase-error'
  if (tone === 'warning') return 'text-amber-300'
  if (tone === 'info') return 'text-cyan-300'
  return 'text-ase-muted'
}

export const DYNAMIC_RESULT_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PASSED: 'success',
  FAILED: 'error',
  REPORTED: 'info',
}

export type RunReportModalProps = {
  runUuid: string
  onClose: () => void
}
