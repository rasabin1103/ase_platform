import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  KeyRound,
  Pencil,
  PlayCircle,
  PlusCircle,
  RefreshCcw,
  Star,
  Trash2,
} from 'lucide-react'
import {
  createApiCredential,
  createFrameworkScenario,
  deleteFrameworkScenario,
  deleteTestRun,
  getFrameworkScenario,
  getTestRunLogs,
  getTestRunReport,
  getTestRunSummary,
  listApiCredentials,
  listApprovedRefs,
  listFrameworkScenarios,
  listMyTestRuns,
  listRunnableFrameworks,
  renameApiCredential,
  revokeApiCredential,
  setDefaultFrameworkScenario,
  triggerTestRun,
  updateFrameworkScenario,
  type ApiCredentialCreateResponse,
  type DynamicRequestDetail,
  type RunnableFramework,
  type TestRunConclusion,
  type TestRunStatus,
} from '../../api/testExecution.api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, TBody, TD, THead, TH, TR } from '../../components/ui/Table'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { parseApiError } from '../../utils/apiError'

const RUNS_LIMIT = 10

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

const STATUS_BADGE: Record<TestRunStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  pending: 'default',
  queued: 'info',
  in_progress: 'info',
  completed: 'success',
  failed_to_dispatch: 'error',
}

const CONCLUSION_BADGE: Record<TestRunConclusion, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  success: 'success',
  failure: 'error',
  cancelled: 'warning',
  timed_out: 'error',
  action_required: 'warning',
  unknown: 'default',
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className="mt-1.5 h-1.5 w-full max-w-[8rem] overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-ase-primary transition-all" style={{ width: `${clamped}%` }} />
    </div>
  )
}

function isValidJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

type FrameworkRunPanelProps = {
  framework: RunnableFramework
  onTriggered: () => void
}

/** Inline scenario-picker + config-fields + run panel — replaces the old
 * single-implicit-config flow. A buyer can save more than one named
 * "scenario" of values per framework (e.g. "Staging", "Production creds")
 * and switch between them; exactly one is flagged default and is what runs
 * when nothing else is picked. Saving and triggering stay combined into one
 * action ("Run it") so nobody has to save first and separately remember to
 * come back and trigger — "Save without running" stays available too. */
function FrameworkRunPanel({ framework, onTriggered }: FrameworkRunPanelProps) {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const scenariosKey = ['test-execution-scenarios', framework.slug]
  const scenariosQuery = useQuery({ queryKey: scenariosKey, queryFn: () => listFrameworkScenarios(framework.slug) })
  const scenarios = scenariosQuery.data ?? []

  // Admin-approved branches this buyer may run instead of the default
  // branch (see TestApprovedRef) — the "clone the framework, push a
  // branch, get it reviewed" flow. Empty for everyone until an admin
  // approves at least one ref, so the selector below only ever appears
  // once there's actually a choice to make.
  const approvedRefsQuery = useQuery({
    queryKey: ['test-execution-approved-refs', framework.slug],
    queryFn: () => listApprovedRefs(framework.slug),
  })
  const approvedRefs = approvedRefsQuery.data ?? []
  const [selectedRef, setSelectedRef] = useState<string>('')

  const [scenarioUuid, setScenarioUuid] = useState<string | null>(null)
  // Auto-pick the default (or first) scenario once the list loads for this
  // framework — a manual switch afterward sticks even if this query
  // refetches, since this guard only fires once per framework.
  const [autoPickedFor, setAutoPickedFor] = useState<string | null>(null)
  if (autoPickedFor !== framework.slug && !scenariosQuery.isLoading) {
    setAutoPickedFor(framework.slug)
    setScenarioUuid(scenarios.length > 0 ? (scenarios.find((s) => s.isDefault)?.uuid ?? scenarios[0].uuid) : null)
  }

  const scenarioDetailQuery = useQuery({
    queryKey: ['test-execution-scenario-detail', framework.slug, scenarioUuid],
    queryFn: () => getFrameworkScenario(framework.slug, scenarioUuid as string),
    enabled: scenarioUuid !== null,
  })

  // With no saved scenario yet, the fields still render straight off the
  // framework's declared schema (all unset) — the first save/run creates
  // the buyer's first ("Predeterminado") scenario implicitly.
  const values =
    scenarioUuid !== null
      ? scenarioDetailQuery.data?.values ?? []
      : framework.inputSchema.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          description: f.description ?? null,
          options: f.options ?? null,
          default: f.default ?? null,
          hasValue: false,
          value: f.type !== 'secret' && f.default ? f.default : (null as string | null),
        }))
  const valuesLoading = scenarioUuid !== null && scenarioDetailQuery.isLoading

  const [draft, setDraft] = useState<Record<string, string>>({})
  const [touchedSecrets, setTouchedSecrets] = useState<Record<string, boolean>>({})
  const resetKey = `${framework.slug}-${scenarioUuid}-${valuesLoading ? 'loading' : 'loaded'}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    if (!valuesLoading) {
      const initial: Record<string, string> = {}
      for (const v of values) {
        if (v.type !== 'secret' && v.value) initial[v.key] = v.value
      }
      setDraft(initial)
      setTouchedSecrets({})
    }
  }

  const buildPayload = () => {
    const payload: Record<string, string> = {}
    for (const v of values) {
      if (v.type === 'secret') {
        if (touchedSecrets[v.key]) payload[v.key] = draft[v.key] ?? ''
      } else {
        payload[v.key] = draft[v.key] ?? ''
      }
    }
    return payload
  }

  const invalidateScenario = () => {
    queryClient.invalidateQueries({ queryKey: scenariosKey })
    queryClient.invalidateQueries({ queryKey: ['test-execution-scenario-detail', framework.slug, scenarioUuid] })
  }

  // Creates the buyer's very first scenario for this framework, named
  // "Predeterminado"/"Default" — used implicitly by save/run when nothing's
  // been saved yet, so a first-time buyer never has to think about
  // scenarios at all unless they want more than one.
  const ensureScenario = async (payload: Record<string, string>) => {
    if (scenarioUuid !== null) {
      await updateFrameworkScenario(framework.slug, scenarioUuid, { values: payload })
      return scenarioUuid
    }
    const created = await createFrameworkScenario(framework.slug, t('testExecution.scenarios.defaultName') as string, payload)
    setScenarioUuid(created.uuid)
    return created.uuid
  }

  const saveMut = useMutation({
    mutationFn: () => ensureScenario(buildPayload()),
    onSuccess: invalidateScenario,
  })

  const runMut = useMutation({
    mutationFn: async () => {
      const uuid = await ensureScenario(buildPayload())
      return triggerTestRun(framework.slug, { scenarioUuid: uuid, ref: selectedRef || undefined })
    },
    onSuccess: () => {
      invalidateScenario()
      queryClient.invalidateQueries({ queryKey: ['test-execution-frameworks'] })
      onTriggered()
    },
  })

  const addScenarioMut = useMutation({
    mutationFn: (name: string) => createFrameworkScenario(framework.slug, name),
    onSuccess: (created) => {
      setScenarioUuid(created.uuid)
      queryClient.invalidateQueries({ queryKey: scenariosKey })
    },
  })

  const renameScenarioMut = useMutation({
    mutationFn: ({ uuid, name }: { uuid: string; name: string }) =>
      updateFrameworkScenario(framework.slug, uuid, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scenariosKey }),
  })

  const setDefaultScenarioMut = useMutation({
    mutationFn: (uuid: string) => setDefaultFrameworkScenario(framework.slug, uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scenariosKey }),
  })

  const deleteScenarioMut = useMutation({
    mutationFn: (uuid: string) => deleteFrameworkScenario(framework.slug, uuid),
    onSuccess: () => {
      setScenarioUuid(null)
      setAutoPickedFor(null)
      queryClient.invalidateQueries({ queryKey: scenariosKey })
    },
  })

  const hasInvalidJson = values.some((v) => {
    if (v.type !== 'json') return false
    const raw = draft[v.key] ?? ''
    return raw.trim() !== '' && !isValidJson(raw)
  })

  const canRun = framework.remainingRuns > 0
  const remainingLabel = String(t('testExecution.panel.remaining'))
    .replace('{{remaining}}', String(framework.remainingRuns))
    .replace('{{total}}', String(framework.includedRuns))

  const busy =
    saveMut.isPending ||
    runMut.isPending ||
    addScenarioMut.isPending ||
    renameScenarioMut.isPending ||
    setDefaultScenarioMut.isPending ||
    deleteScenarioMut.isPending

  // Tooltip text explaining why a disabled action button can't be used right
  // now — checked in priority order (a quota block is more informative than
  // a generic "busy" message, for example). Returns undefined when the
  // button is actually enabled, so callers can pass it straight to `title`.
  const runDisabledReason = (): string | undefined => {
    if (!canRun) return t('testExecution.panel.disabledQuota') as string
    if (hasInvalidJson) return t('testExecution.panel.disabledInvalidJson') as string
    if (valuesLoading) return t('testExecution.panel.disabledLoading') as string
    if (busy) return t('testExecution.panel.disabledBusy') as string
    return undefined
  }

  const saveDisabledReason = (): string | undefined => {
    if (hasInvalidJson) return t('testExecution.panel.disabledInvalidJson') as string
    if (valuesLoading) return t('testExecution.panel.disabledLoading') as string
    if (busy) return t('testExecution.panel.disabledBusy') as string
    return undefined
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ase-text2">{t('testExecution.panel.hint')}</p>
      <p className="text-xs text-ase-muted">{remainingLabel}</p>

      {/* --- Version picker (original vs. an admin-approved branch) ------ */}
      {approvedRefs.length > 0 ? (
        <label className="block max-w-xs">
          <span className="mb-1 block text-xs text-ase-muted">{t('testExecution.panel.versionLabel')}</span>
          <Select value={selectedRef} onChange={(e) => setSelectedRef(e.target.value)}>
            <option value="">{t('testExecution.panel.versionOriginal')}</option>
            {approvedRefs.map((r) => (
              <option key={r.ref} value={r.ref}>
                {r.label || r.ref}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      {/* --- Scenario picker --------------------------------------------- */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('testExecution.scenarios.title')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            title={busy ? (t('testExecution.panel.disabledBusy') as string) : undefined}
            onClick={() => {
              const name = window.prompt(t('testExecution.scenarios.addPrompt') as string)
              if (name && name.trim()) addScenarioMut.mutate(name.trim())
            }}
            leftIcon={<PlusCircle className="h-4 w-4" strokeWidth={1.75} />}
          >
            {t('testExecution.scenarios.add')}
          </Button>
        </div>
        <p className="mb-3 text-xs text-ase-muted">{t('testExecution.scenarios.hint')}</p>

        {scenarios.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <div
                key={s.uuid}
                className={`flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-xs ${
                  s.uuid === scenarioUuid
                    ? 'border-ase-primary bg-ase-primary/10 text-ase-text'
                    : 'border-white/10 bg-white/5 text-ase-text2'
                }`}
              >
                <button type="button" className="flex items-center gap-1" onClick={() => setScenarioUuid(s.uuid)}>
                  {s.isDefault ? <Star className="h-3 w-3 fill-current text-amber-300" strokeWidth={0} /> : null}
                  {s.name}
                </button>
                {s.uuid === scenarioUuid ? (
                  <div className="flex items-center">
                    {!s.isDefault ? (
                      <button
                        type="button"
                        title={t('testExecution.scenarios.setDefault') as string}
                        className="rounded-full p-1 text-ase-muted hover:text-amber-300"
                        onClick={() => setDefaultScenarioMut.mutate(s.uuid)}
                      >
                        <Star className="h-3 w-3" strokeWidth={1.75} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      title={t('testExecution.scenarios.rename') as string}
                      className="rounded-full p-1 text-ase-muted hover:text-ase-text"
                      onClick={() => {
                        const name = window.prompt(t('testExecution.scenarios.renamePrompt') as string, s.name)
                        if (name && name.trim() && name.trim() !== s.name) {
                          renameScenarioMut.mutate({ uuid: s.uuid, name: name.trim() })
                        }
                      }}
                    >
                      <Pencil className="h-3 w-3" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      title={t('testExecution.scenarios.delete') as string}
                      className="rounded-full p-1 text-ase-muted hover:text-ase-error"
                      onClick={() => {
                        if (window.confirm(t('testExecution.scenarios.confirmDelete') as string)) {
                          deleteScenarioMut.mutate(s.uuid)
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {addScenarioMut.isError ||
        renameScenarioMut.isError ||
        setDefaultScenarioMut.isError ||
        deleteScenarioMut.isError ? (
          <p className="mt-2 text-xs text-ase-error">
            {
              parseApiError(
                addScenarioMut.error ?? renameScenarioMut.error ?? setDefaultScenarioMut.error ?? deleteScenarioMut.error,
                t(
                  addScenarioMut.isError
                    ? 'testExecution.scenarios.createError'
                    : renameScenarioMut.isError
                      ? 'testExecution.scenarios.renameError'
                      : setDefaultScenarioMut.isError
                        ? 'testExecution.scenarios.setDefaultError'
                        : 'testExecution.scenarios.deleteError',
                ) as string,
              ).message
            }
          </p>
        ) : null}
      </div>

      {valuesLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : scenarioDetailQuery.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('testExecution.loadError')} />
      ) : values.length === 0 ? (
        <p className="text-sm text-ase-muted">{t('testExecution.config.empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v) => {
            const rawValue = draft[v.key] ?? ''
            const jsonError = v.type === 'json' && rawValue.trim() !== '' ? isValidJson(rawValue) : true
            return (
              <label key={v.key} className={`block ${v.type === 'json' ? 'sm:col-span-2' : ''}`}>
                <span className="mb-1 block text-xs text-ase-muted">
                  {v.label}
                  {v.required ? <span className="text-ase-error"> *</span> : null}
                </span>
                {v.type === 'choice' ? (
                  <Select
                    value={rawValue}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [v.key]: e.target.value }))}
                  >
                    <option value="">—</option>
                    {(v.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || '—'}
                      </option>
                    ))}
                  </Select>
                ) : v.type === 'json' ? (
                  <>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-ase-text focus:border-ase-brand/40 focus:outline-none"
                      value={rawValue}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [v.key]: e.target.value }))}
                    />
                    {!jsonError ? (
                      <p className="mt-1 text-[11px] text-ase-error">{t('testExecution.config.invalidJson')}</p>
                    ) : null}
                  </>
                ) : (
                  <Input
                    type={v.type === 'secret' ? 'password' : 'text'}
                    placeholder={v.type === 'secret' && v.hasValue ? (t('testExecution.config.alreadySet') as string) : ''}
                    value={rawValue}
                    onChange={(e) => {
                      setDraft((prev) => ({ ...prev, [v.key]: e.target.value }))
                      if (v.type === 'secret') setTouchedSecrets((prev) => ({ ...prev, [v.key]: true }))
                    }}
                  />
                )}
                {v.description ? <p className="mt-1 text-[11px] leading-snug text-ase-muted">{v.description}</p> : null}
              </label>
            )
          })}
        </div>
      )}

      {saveMut.isError || runMut.isError ? (
        <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
          {
            parseApiError(
              runMut.isError ? runMut.error : saveMut.error,
              t(runMut.isError ? 'testExecution.frameworks.triggerError' : 'testExecution.config.saveError') as string,
            ).message
          }
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {values.length > 0 ? (
          <Button
            variant="secondary"
            onClick={() => saveMut.mutate()}
            disabled={busy || valuesLoading || hasInvalidJson}
            title={saveDisabledReason()}
          >
            {saveMut.isPending ? t('testExecution.config.saving') : t('testExecution.config.save')}
          </Button>
        ) : null}
        <Button
          onClick={() => runMut.mutate()}
          disabled={!canRun || busy || valuesLoading || hasInvalidJson}
          title={runDisabledReason()}
          leftIcon={<PlayCircle className="h-4 w-4" strokeWidth={1.75} />}
        >
          {runMut.isPending ? t('testExecution.frameworks.triggering') : t('testExecution.frameworks.tryNow')}
        </Button>
      </div>
    </div>
  )
}

function fmtDuration(seconds: number | null): string {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// Maps GitHub's own job/step status+conclusion vocabulary onto a color —
// used for both the job header badge and the per-step text, kept separate
// from STATUS_BADGE/CONCLUSION_BADGE above since those are keyed by our own
// TestRunStatus/TestRunConclusion enums, not GitHub's raw job-level strings.
function ghTone(status: string | null, conclusion: string | null): 'default' | 'info' | 'success' | 'warning' | 'error' {
  if (conclusion === 'success') return 'success'
  if (conclusion === 'failure' || conclusion === 'timed_out') return 'error'
  if (conclusion === 'cancelled' || conclusion === 'action_required') return 'warning'
  if (conclusion) return 'default'
  if (status === 'in_progress' || status === 'queued') return 'info'
  return 'default'
}

function ghToneTextClass(status: string | null, conclusion: string | null): string {
  const tone = ghTone(status, conclusion)
  if (tone === 'success') return 'text-emerald-300'
  if (tone === 'error') return 'text-ase-error'
  if (tone === 'warning') return 'text-amber-300'
  if (tone === 'info') return 'text-cyan-300'
  return 'text-ase-muted'
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="text-sm font-medium text-ase-text">{value}</div>
    </div>
  )
}

// Pretty-prints an arbitrary JSON-ish value (or shows it as-is if it's
// already a plain string, e.g. a non-JSON response body) — shared by the
// dynamic-request card's params/body/response blocks below.
function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-ase-muted">—</span>
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] leading-snug text-ase-text2">
      {text}
    </pre>
  )
}

const DYNAMIC_RESULT_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PASSED: 'success',
  FAILED: 'error',
  REPORTED: 'info',
}

/** Renders the buyer's arbitrary-endpoint call (method/url/status/body) as
 * its own card, parsed server-side from the `request_result.json` artifact
 * their test_dynamic_request.py produces — see
 * TestExecutionService._get_dynamic_request_detail. Only rendered when that
 * artifact exists for this run (health-only runs, or frameworks whose repo
 * doesn't produce one, simply don't show this section). */
function DynamicRequestCard({ detail }: { detail: DynamicRequestDetail }) {
  const { t } = useI18n()
  const statusTone = detail.statusCode >= 200 && detail.statusCode < 300 ? 'success' : detail.statusCode >= 400 ? 'error' : 'warning'
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ase-text">{t('testExecution.report.dynamicRequest.title')}</h3>
        <div className="flex items-center gap-2">
          <Badge variant={statusTone}>{detail.statusCode}</Badge>
          <Badge variant={DYNAMIC_RESULT_BADGE[detail.result] ?? 'default'}>
            {t(`testExecution.report.dynamicRequest.result.${detail.result}`) as string}
          </Badge>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs">
        <span className="rounded-md bg-white/10 px-2 py-1 font-semibold uppercase text-ase-text">{detail.method}</span>
        <span className="truncate text-ase-text2">{detail.url}</span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {detail.elapsedMs !== null ? (
          <MiniStat label={t('testExecution.report.dynamicRequest.elapsed') as string} value={`${Math.round(detail.elapsedMs)} ms`} />
        ) : null}
        {detail.expectedStatus !== null ? (
          <MiniStat label={t('testExecution.report.dynamicRequest.expectedStatus') as string} value={String(detail.expectedStatus)} />
        ) : null}
      </div>

      {detail.schemaError ? (
        <div className="mb-3 rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-xs text-ase-error">
          {t('testExecution.report.dynamicRequest.schemaError')}: {detail.schemaError}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {detail.body != null ? (
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide text-ase-muted">
              {t('testExecution.report.dynamicRequest.requestBody')}
            </div>
            <JsonBlock value={detail.body} />
          </div>
        ) : null}
        {detail.params != null ? (
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide text-ase-muted">
              {t('testExecution.report.dynamicRequest.requestParams')}
            </div>
            <JsonBlock value={detail.params} />
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-ase-muted">
            {t('testExecution.report.dynamicRequest.responseBody')}
          </div>
          <JsonBlock value={detail.responseBody} />
        </div>
      </div>
    </div>
  )
}

function CountTile({ label, value, tone }: { label: string; value: number; tone: 'success' | 'error' | 'warning' }) {
  const toneClass = tone === 'success' ? 'text-emerald-300' : tone === 'error' ? 'text-ase-error' : 'text-amber-300'
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ase-muted">{label}</div>
    </div>
  )
}

type RunReportModalProps = {
  runUuid: string
  onClose: () => void
}

/** ASE-branded report view — built from GitHub's own Jobs API plus a
 * best-effort pass/fail scrape (see the backend's get_run_summary), rather
 * than just dumping the raw pytest-html artifact in an iframe. A secondary
 * "view original report" button still opens that raw artifact in a new
 * tab (same authenticated-fetch-then-blob-URL pattern as before) for full
 * tool-specific detail — this view is a branded summary, not a replacement
 * for it. */
function RunReportModal({ runUuid, onClose }: RunReportModalProps) {
  const { t } = useI18n()
  const summaryQuery = useQuery({
    queryKey: ['test-execution-run-summary', runUuid],
    queryFn: () => getTestRunSummary(runUuid),
    // The report can still be filling in (job not started, artifact not
    // uploaded yet) while the modal is open — keep it reasonably fresh
    // without being as aggressive as the run-history table's poll.
    refetchInterval: 15000,
  })
  const [originalBusy, setOriginalBusy] = useState(false)
  const [originalError, setOriginalError] = useState<string | null>(null)

  // Detailed output (raw job console log) is fetched lazily, only once the
  // buyer expands it — it can be sizeable, and most of the time the
  // summary/report above is all anyone needs.
  const [logsOpen, setLogsOpen] = useState(false)
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
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      if (win) win.location.href = url
      else window.open(url, '_blank')
    } catch (err) {
      win?.close()
      setOriginalError(parseApiError(err, t('testExecution.report.originalError') as string).message)
    } finally {
      setOriginalBusy(false)
    }
  }

  const s = summaryQuery.data

  return (
    <Modal
      open
      onClose={onClose}
      title={t('testExecution.report.title')}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button variant="secondary" onClick={openOriginal} disabled={originalBusy || !s?.originalReportAvailable}>
            {originalBusy ? t('testExecution.runs.reportLoading') : t('testExecution.report.viewOriginal')}
          </Button>
          <Button onClick={onClose}>{t('testExecution.report.close')}</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {summaryQuery.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : summaryQuery.isError ? (
          <EmptyState title={t('private.common.couldNotLoad')} description={t('testExecution.loadError')} />
        ) : s ? (
          <>
            <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
                    ASE · {t('testExecution.report.badge')}
                  </div>
                  <div className="text-lg font-semibold text-ase-text">{s.frameworkTitle}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE[s.status]}>{t(`testExecution.status.${s.status}`)}</Badge>
                  {s.conclusion ? (
                    <Badge variant={CONCLUSION_BADGE[s.conclusion]}>{t(`testExecution.conclusion.${s.conclusion}`)}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label={t('testExecution.report.started') as string} value={fmtDate(s.startedAt)} />
                <MiniStat label={t('testExecution.report.completed') as string} value={fmtDate(s.completedAt)} />
                <MiniStat label={t('testExecution.report.duration') as string} value={fmtDuration(s.durationSeconds)} />
                <MiniStat label={t('testExecution.report.created') as string} value={fmtDate(s.createdAt)} />
              </div>
            </div>

            {s.testSummary ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {s.testSummary.passed != null ? (
                  <CountTile label={t('testExecution.report.passed') as string} value={s.testSummary.passed} tone="success" />
                ) : null}
                {s.testSummary.failed != null ? (
                  <CountTile label={t('testExecution.report.failed') as string} value={s.testSummary.failed} tone="error" />
                ) : null}
                {s.testSummary.skipped != null ? (
                  <CountTile label={t('testExecution.report.skipped') as string} value={s.testSummary.skipped} tone="warning" />
                ) : null}
                {s.testSummary.error != null ? (
                  <CountTile label={t('testExecution.report.errors') as string} value={s.testSummary.error} tone="error" />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ase-muted">{t('testExecution.report.noSummary')}</p>
            )}

            {s.dynamicRequest ? <DynamicRequestCard detail={s.dynamicRequest} /> : null}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('testExecution.report.jobs')}</h3>
              {s.jobs.length === 0 ? (
                <p className="text-sm text-ase-muted">{t('testExecution.report.noJobsYet')}</p>
              ) : (
                <div className="space-y-3">
                  {s.jobs.map((job, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-ase-text">{job.name}</span>
                        <Badge variant={ghTone(job.status, job.conclusion)}>{job.conclusion ?? job.status ?? '—'}</Badge>
                      </div>
                      <ul className="space-y-1">
                        {job.steps.map((step, si) => (
                          <li key={si} className="flex items-center justify-between gap-2 text-xs text-ase-text2">
                            <span className="truncate">{step.name}</span>
                            <span className={ghToneTextClass(step.status, step.conclusion)}>
                              {step.conclusion ?? step.status ?? '—'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setLogsOpen((v) => !v)}
              >
                <h3 className="text-sm font-semibold text-ase-text">{t('testExecution.report.logsTitle')}</h3>
                {logsOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-ase-muted" strokeWidth={1.75} />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-ase-muted" strokeWidth={1.75} />
                )}
              </button>
              {logsOpen ? (
                <div className="mt-2">
                  {logsQuery.isLoading ? (
                    <Skeleton className="h-32 rounded-2xl" />
                  ) : logsQuery.isError ? (
                    <p className="text-sm text-ase-muted">{t('testExecution.report.logsError')}</p>
                  ) : (
                    <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-snug text-ase-text2">
                      {logsQuery.data}
                    </pre>
                  )}
                </div>
              ) : null}
            </div>

            {originalError ? (
              <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                {originalError}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Modal>
  )
}

export function TestExecutionPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const [newCredentialName, setNewCredentialName] = useState('')
  const [createdSecret, setCreatedSecret] = useState<ApiCredentialCreateResponse | null>(null)
  const [copied, setCopied] = useState<'id' | 'secret' | null>(null)
  const [credentialsOpen, setCredentialsOpen] = useState(false)

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [runsOffset, setRunsOffset] = useState(0)
  const [reportModalRunUuid, setReportModalRunUuid] = useState<string | null>(null)

  const credentialsQuery = useQuery({ queryKey: ['test-execution-credentials'], queryFn: listApiCredentials })
  const frameworksQuery = useQuery({ queryKey: ['test-execution-frameworks'], queryFn: listRunnableFrameworks })

  const frameworks = frameworksQuery.data ?? []
  const credentials = credentialsQuery.data ?? []

  // Auto-select the first available framework once the list loads — the
  // guard (`selectedSlug === null`) is false on every render after this
  // fires once, so it never loops ("adjust state while rendering").
  if (selectedSlug === null && frameworks.length > 0) {
    setSelectedSlug(frameworks[0].slug)
  }

  // Reset pagination whenever the selected framework changes.
  const [prevSlugForOffset, setPrevSlugForOffset] = useState(selectedSlug)
  if (selectedSlug !== prevSlugForOffset) {
    setPrevSlugForOffset(selectedSlug)
    setRunsOffset(0)
  }

  const runsQuery = useQuery({
    queryKey: ['test-execution-runs', selectedSlug, runsOffset],
    queryFn: () => listMyTestRuns({ slug: selectedSlug ?? undefined, limit: RUNS_LIMIT, offset: runsOffset }),
    enabled: selectedSlug !== null,
    // Runs are updated server-side by a polling job against GitHub Actions —
    // refetch on a similar cadence so status/progress show up without the
    // user having to manually refresh.
    refetchInterval: 20000,
  })

  const createMut = useMutation({
    mutationFn: () => createApiCredential(newCredentialName.trim()),
    onSuccess: (created) => {
      setCreatedSecret(created)
      setNewCredentialName('')
      queryClient.invalidateQueries({ queryKey: ['test-execution-credentials'] })
    },
  })

  const renameMut = useMutation({
    mutationFn: ({ uuid, name }: { uuid: string; name: string }) => renameApiCredential(uuid, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-execution-credentials'] }),
  })

  const revokeMut = useMutation({
    mutationFn: (uuid: string) => revokeApiCredential(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-execution-credentials'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (runUuid: string) => deleteTestRun(runUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-execution-runs'] }),
  })

  const selectedFramework = frameworks.find((f) => f.slug === selectedSlug) ?? null
  const runs = runsQuery.data?.items ?? []
  const runsTotal = runsQuery.data?.total ?? 0

  const copy = async (value: string, which: 'id' | 'secret') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard API can be unavailable (insecure context, permissions) —
      // the value is still selectable/visible in the modal either way.
    }
  }

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="cyan"
        badge={t('testExecution.heroBadge')}
        title={t('testExecution.title')}
        subtitle={t('testExecution.subtitle')}
      />

      {/* --- 1. Pick what to test -------------------------------------------- */}
      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft">
        <h2 className="mb-1 text-lg font-semibold text-ase-text">{t('testExecution.picker.title')}</h2>
        <p className="mb-4 max-w-2xl text-sm text-ase-text2">{t('testExecution.picker.hint')}</p>

        {frameworksQuery.isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : frameworksQuery.isError ? (
          <EmptyState title={t('private.common.couldNotLoad')} description={t('testExecution.loadError')} />
        ) : frameworks.length === 0 ? (
          <EmptyState title={t('testExecution.frameworks.empty')} description={t('testExecution.frameworks.emptyHint')} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {frameworks.map((f) => (
              <button
                key={f.slug}
                type="button"
                onClick={() => setSelectedSlug(f.slug)}
                className={`rounded-2xl border p-4 text-left transition ${
                  f.slug === selectedSlug
                    ? 'border-ase-primary bg-ase-primary/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="font-medium text-ase-text">{f.title}</div>
                <div className="mt-1 text-xs text-ase-muted">
                  {t('testExecution.frameworks.columns.remaining')}: {f.remainingRuns}/{f.includedRuns}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* --- 2. Configure + run ------------------------------------------------ */}
      {selectedFramework ? (
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-ase-text">{selectedFramework.title}</h2>
          <FrameworkRunPanel
            framework={selectedFramework}
            onTriggered={() => {
              setRunsOffset(0)
              queryClient.invalidateQueries({ queryKey: ['test-execution-runs'] })
            }}
          />
        </Card>
      ) : null}

      {/* --- 3. History --------------------------------------------------------- */}
      {selectedFramework ? (
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ase-text">{t('testExecution.runs.title')}</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => runsQuery.refetch()}
              leftIcon={<RefreshCcw className="h-4 w-4" strokeWidth={1.75} />}
            >
              {t('testExecution.runs.refresh')}
            </Button>
          </div>
          <p className="mb-4 max-w-2xl text-sm text-ase-text2">{t('testExecution.runs.hint')}</p>

          {runsQuery.isLoading ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : runsQuery.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('testExecution.loadError')} />
          ) : runs.length === 0 ? (
            <EmptyState title={t('testExecution.runs.empty')} description={t('testExecution.runs.emptyHint')} />
          ) : (
            <>
              <Table className="table-fixed">
                <THead>
                  <TR>
                    <TH className="w-[20%]">{t('testExecution.runs.columns.status')}</TH>
                    <TH className="w-[16%]">{t('testExecution.runs.columns.conclusion')}</TH>
                    <TH className="w-[22%]">{t('testExecution.runs.columns.created')}</TH>
                    <TH className="w-[42%]">{t('testExecution.runs.columns.report')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {runs.map((r) => (
                    <TR key={r.uuid}>
                      <TD>
                        <Badge variant={STATUS_BADGE[r.status]}>{t(`testExecution.status.${r.status}`)}</Badge>
                        {(r.status === 'queued' || r.status === 'in_progress') && r.progressPercent !== null ? (
                          <ProgressBar percent={r.progressPercent} />
                        ) : null}
                      </TD>
                      <TD>
                        {r.conclusion ? (
                          <Badge variant={CONCLUSION_BADGE[r.conclusion]}>{t(`testExecution.conclusion.${r.conclusion}`)}</Badge>
                        ) : (
                          <span className="text-ase-muted">—</span>
                        )}
                      </TD>
                      <TD className="text-ase-muted">{fmtDate(r.createdAt)}</TD>
                      <TD>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {r.status === 'completed' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReportModalRunUuid(r.uuid)}
                                leftIcon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
                              >
                                {t('testExecution.runs.viewReportBtn')}
                              </Button>
                            ) : r.errorMessage ? (
                              <span className="text-xs text-ase-error">{r.errorMessage}</span>
                            ) : (
                              <span className="text-ase-muted">{t('testExecution.runs.noReportYet')}</span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-ase-error hover:text-ase-error"
                            onClick={() => {
                              if (window.confirm(t('testExecution.runs.confirmDelete') as string)) {
                                deleteMut.mutate(r.uuid)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination limit={RUNS_LIMIT} offset={runsOffset} total={runsTotal} onOffsetChange={setRunsOffset} />
              {deleteMut.isError ? (
                <div className="mt-3 rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                  {t('testExecution.runs.deleteError')}
                </div>
              ) : null}
            </>
          )}
        </Card>
      ) : null}

      {/* --- API credentials (advanced, collapsed by default) ------------------ */}
      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setCredentialsOpen((v) => !v)}
        >
          <h2 className="text-lg font-semibold text-ase-text">{t('testExecution.credentials.title')}</h2>
          {credentialsOpen ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-ase-muted" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-ase-muted" strokeWidth={1.75} />
          )}
        </button>

        {credentialsOpen ? (
          <div className="mt-4">
            <p className="mb-4 max-w-2xl text-sm text-ase-text2">{t('testExecution.credentials.hint')}</p>

            <form
              className="mb-5 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                if (newCredentialName.trim() && !createMut.isPending) createMut.mutate()
              }}
            >
              <Input
                value={newCredentialName}
                onChange={(e) => setNewCredentialName(e.target.value)}
                placeholder={t('testExecution.credentials.namePlaceholder') as string}
                className="sm:max-w-xs"
              />
              <Button
                type="submit"
                disabled={!newCredentialName.trim() || createMut.isPending}
                title={
                  createMut.isPending
                    ? (t('testExecution.credentials.createDisabledBusy') as string)
                    : !newCredentialName.trim()
                      ? (t('testExecution.credentials.createDisabledEmpty') as string)
                      : undefined
                }
                leftIcon={<PlusCircle className="h-4 w-4" strokeWidth={1.75} />}
              >
                {t('testExecution.credentials.create')}
              </Button>
            </form>
            {createMut.isError ? (
              <div className="mb-4 rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                {t('testExecution.credentials.createError')}
              </div>
            ) : null}

            {credentialsQuery.isLoading ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : credentialsQuery.isError ? (
              <EmptyState title={t('private.common.couldNotLoad')} description={t('testExecution.loadError')} />
            ) : credentials.length === 0 ? (
              <EmptyState
                title={t('testExecution.credentials.empty')}
                description={t('testExecution.credentials.emptyHint')}
                icon={<KeyRound className="h-6 w-6" strokeWidth={1.5} />}
              />
            ) : (
              <Table className="table-fixed">
                <THead>
                  <TR>
                    <TH className="w-[24%]">{t('testExecution.credentials.columns.name')}</TH>
                    <TH className="w-[26%]">{t('testExecution.credentials.columns.clientId')}</TH>
                    <TH className="w-[12%]">{t('testExecution.credentials.columns.status')}</TH>
                    <TH className="w-[18%]">{t('testExecution.credentials.columns.lastUsed')}</TH>
                    <TH className="w-[20%]" />
                  </TR>
                </THead>
                <TBody>
                  {credentials.map((c) => (
                    <TR key={c.uuid}>
                      <TD className="text-ase-text">{c.name}</TD>
                      <TD className="font-mono text-xs text-ase-text2">{c.clientId}</TD>
                      <TD>
                        <Badge variant={c.status === 'active' ? 'success' : 'default'}>
                          {t(`testExecution.credentials.status.${c.status}`)}
                        </Badge>
                      </TD>
                      <TD className="text-ase-muted">{c.lastUsedAt ? fmtDate(c.lastUsedAt) : t('testExecution.credentials.never')}</TD>
                      <TD className="text-right">
                        {c.status === 'active' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const next = window.prompt(t('testExecution.credentials.renamePrompt') as string, c.name)
                                if (next && next.trim() && next.trim() !== c.name) {
                                  renameMut.mutate({ uuid: c.uuid, name: next.trim() })
                                }
                              }}
                            >
                              {t('testExecution.credentials.rename')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-ase-error hover:text-ase-error"
                              onClick={() => {
                                if (window.confirm(t('testExecution.credentials.confirmRevoke') as string)) {
                                  revokeMut.mutate(c.uuid)
                                }
                              }}
                            >
                              {t('testExecution.credentials.revoke')}
                            </Button>
                          </div>
                        ) : null}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
            {renameMut.isError || revokeMut.isError ? (
              <div className="mt-3 rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                {renameMut.isError ? t('testExecution.credentials.renameError') : t('testExecution.credentials.revokeError')}
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* --- One-time secret reveal modal -------------------------------------- */}
      <Modal
        open={createdSecret !== null}
        onClose={() => setCreatedSecret(null)}
        title={t('testExecution.secretModal.title')}
        footer={<Button onClick={() => setCreatedSecret(null)}>{t('testExecution.secretModal.done')}</Button>}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
            {t('testExecution.secretModal.warning')}
          </div>
          <div>
            <span className="mb-1 block text-xs text-ase-muted">{t('testExecution.secretModal.clientId')}</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg border border-ase-border bg-white/5 px-3 py-2 text-xs text-ase-text">
                {createdSecret?.clientId}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createdSecret && copy(createdSecret.clientId, 'id')}
                leftIcon={copied === 'id' ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
              >
                {copied === 'id' ? t('testExecution.secretModal.copied') : t('testExecution.secretModal.copy')}
              </Button>
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs text-ase-muted">{t('testExecution.secretModal.clientSecret')}</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg border border-ase-border bg-white/5 px-3 py-2 text-xs text-ase-text">
                {createdSecret?.clientSecret}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createdSecret && copy(createdSecret.clientSecret, 'secret')}
                leftIcon={copied === 'secret' ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
              >
                {copied === 'secret' ? t('testExecution.secretModal.copied') : t('testExecution.secretModal.copy')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {reportModalRunUuid ? (
        <RunReportModal runUuid={reportModalRunUuid} onClose={() => setReportModalRunUuid(null)} />
      ) : null}
    </div>
  )
}
