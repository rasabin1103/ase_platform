import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  FlaskConical,
  KeyRound,
  PlusCircle,
  RefreshCcw,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Suspense, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  createApiCredential,
  deleteTestRun,
  listApiCredentials,
  listMyTestRuns,
  listRunnableFrameworks,
  renameApiCredential,
  revokeApiCredential,
  type ApiCredentialCreateResponse,
  type TestRun,
} from '../../api/testExecution.api'
import { PremiumHero } from '../../components/admin/premium/PremiumHero'
import { ProductViewer } from '../../components/productTools/ProductViewer'
import { hasProductViewer } from '../../components/productTools/registry'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'
import { type GalleryView, readStoredView, storeView } from './galleryView'
import { ProductGallery, ViewToggle } from './ProductGallery'
import { RunResultPanel } from './RunResultPanel'
import { FrameworkRunPanel, ProgressBar } from './TestExecutionPage.parts'
import { CONCLUSION_BADGE, fmtDate, RUNS_LIMIT, STATUS_BADGE } from './TestExecutionPage.utils'

const RUN_DOT: Record<string, string> = {
  success: 'bg-emerald-400',
  failure: 'bg-rose-400',
  timed_out: 'bg-rose-400',
  cancelled: 'bg-amber-400',
  action_required: 'bg-amber-400',
}

function runDot(r: TestRun): string {
  if (r.status === 'failed_to_dispatch') return 'bg-rose-400'
  if (r.status !== 'completed') return 'bg-cyan-400 animate-pulse'
  return RUN_DOT[r.conclusion ?? ''] ?? 'bg-white/30'
}

/** Anillo de cuota: ejecuciones restantes sobre las incluidas. */
function QuotaRing({ remaining, total, label }: { remaining: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0
  const r = 26
  const c = 2 * Math.PI * r
  const color = pct > 0.5 ? 'stroke-emerald-400' : pct > 0.2 ? 'stroke-amber-400' : 'stroke-rose-400'
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 py-2.5 pl-3 pr-5">
      <div className="relative h-[72px] w-[72px] shrink-0" role="img" aria-label={`${label}: ${remaining}/${total}`}>
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-white/10" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className={`${color} transition-all duration-700`}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-xl font-semibold tabular-nums text-ase-text">{remaining}</span>
          <span className="mt-1 text-[10px] tabular-nums text-ase-muted">/ {total}</span>
        </span>
      </div>
      <div className="leading-tight">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
        <div className="mt-1 text-sm text-ase-text2">
          {remaining} / {total}
        </div>
      </div>
    </div>
  )
}

/** Cabecera del área de trabajo: identidad del producto, última ejecución y cuota. */
function WorkspaceHeader({
  title,
  slug,
  remaining,
  total,
  lastRun,
  tool,
}: {
  title: string
  slug: string
  remaining?: number
  total?: number
  lastRun?: TestRun | null
  tool?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/[0.12] via-ase-surface to-violet-500/[0.10] p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/25">
            <FlaskConical className="h-7 w-7" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold text-ase-text">{title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-ase-muted">/test-execution/{slug}</span>
              {tool ? (
                <Badge variant="info">{t('testExecution.frameworks.toolBadge')}</Badge>
              ) : lastRun ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-ase-text2">
                  <span className={`h-2 w-2 rounded-full ${runDot(lastRun)}`} />
                  {t('testExecution.workspace.lastRun')} · {fmtDate(lastRun.createdAt)}
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-ase-muted">
                  {t('testExecution.workspace.neverRun')}
                </span>
              )}
            </div>
          </div>
        </div>
        {remaining !== undefined && total !== undefined ? (
          <QuotaRing remaining={remaining} total={total} label={t('testExecution.workspace.quota') as string} />
        ) : null}
      </div>
    </div>
  )
}

const PANEL_TONE = {
  setup: {
    box: 'border-cyan-400/25 bg-white/[0.02]',
    head: 'border-cyan-400/20 bg-cyan-400/[0.08]',
    badge: 'bg-cyan-400 text-slate-950',
    icon: 'text-cyan-300',
  },
  result: {
    box: 'border-violet-400/25 bg-black/20',
    head: 'border-violet-400/20 bg-violet-400/[0.08]',
    badge: 'bg-violet-400 text-slate-950',
    icon: 'text-violet-300',
  },
} as const

/** Panel con cabecera numerada y color propio: separa con claridad el paso
 * de preparar la ejecución (1) del de ver su resultado (2). */
function PanelFrame({
  step,
  tone,
  title,
  Icon,
  id,
  children,
}: {
  step: number
  tone: keyof typeof PANEL_TONE
  title: string
  Icon: LucideIcon
  id?: string
  children: ReactNode
}) {
  const c = PANEL_TONE[tone]
  return (
    <section id={id} aria-label={title} className={`scroll-mt-4 overflow-hidden rounded-3xl border ${c.box}`}>
      <header className={`flex items-center gap-3 border-b px-5 py-3.5 ${c.head}`}>
        <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${c.badge}`}>{step}</span>
        <Icon className={`h-4 w-4 ${c.icon}`} strokeWidth={1.75} aria-hidden />
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ase-text">{title}</h3>
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

/** Flecha entre los dos pasos: horizontal en pantallas anchas, vertical si se apilan. */
function StepArrow() {
  return (
    <div aria-hidden className="grid place-items-center">
      <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-ase-muted">
        <ArrowRight className="hidden h-4 w-4 xl:block" strokeWidth={1.75} />
        <ArrowDown className="h-4 w-4 xl:hidden" strokeWidth={1.75} />
      </span>
    </div>
  )
}

/** Credenciales de API para lanzar ejecuciones desde un CI/CD propio. Oculto de
 * momento: poner a `true` para volver a mostrar la sección. */
const SHOW_API_CREDENTIALS = false

export function TestExecutionPage() {
  const { t, language } = useI18n()
  const queryClient = useQueryClient()

  const [newCredentialName, setNewCredentialName] = useState('')
  const [createdSecret, setCreatedSecret] = useState<ApiCredentialCreateResponse | null>(null)
  const [copied, setCopied] = useState<'id' | 'secret' | null>(null)
  const [credentialsOpen, setCredentialsOpen] = useState(false)

  // El producto activo vive en la URL (/test-execution/:slug): enlace directo,
  // botón «atrás» y recarga conservan lo que se está probando.
  const { slug: slugParam } = useParams<{ slug?: string }>()
  const [view, setView] = useState<GalleryView>(readStoredView)
  const [runsOffset, setRunsOffset] = useState(0)
  const [selectedRunUuid, setSelectedRunUuid] = useState<string | null>(null)

  const credentialsQuery = useQuery({
    queryKey: ['test-execution-credentials'],
    queryFn: listApiCredentials,
    enabled: SHOW_API_CREDENTIALS,
  })
  const frameworksQuery = useQuery({
    queryKey: ['test-execution-frameworks'],
    queryFn: listRunnableFrameworks,
  })

  // Los nombres de producto se muestran en el idioma activo (con respaldo en español).
  const frameworksRaw = frameworksQuery.data
  const frameworks = useMemo(
    () => (frameworksRaw ?? []).map((f) => ({ ...f, title: localizedCatalogText(language, f.title, f.titleEn) })),
    [frameworksRaw, language],
  )
  const credentials = credentialsQuery.data ?? []

  const selectedSlug = slugParam && frameworks.some((f) => f.slug === slugParam) ? slugParam : null
  // Un slug que no existe / no está disponible vuelve al listado de productos.
  const redirectTo = frameworksQuery.isSuccess && slugParam && selectedSlug === null ? '/test-execution' : null

  // Reset pagination whenever the selected framework changes.
  const [prevSlugForOffset, setPrevSlugForOffset] = useState(selectedSlug)
  if (selectedSlug !== prevSlugForOffset) {
    setPrevSlugForOffset(selectedSlug)
    setRunsOffset(0)
    setSelectedRunUuid(null)
  }

  const selectedFramework = frameworks.find((f) => f.slug === selectedSlug) ?? null
  // Un producto con visor propio (p. ej. una API) no genera ejecuciones de
  // workflow: ni cuota ni historial de runs.
  const hasToolViewer = hasProductViewer(selectedFramework?.viewer)
  const isWorkflow = selectedFramework !== null && !hasToolViewer

  const runsQuery = useQuery({
    queryKey: ['test-execution-runs', selectedSlug, runsOffset],
    queryFn: () =>
      listMyTestRuns({
        slug: selectedSlug ?? undefined,
        limit: RUNS_LIMIT,
        offset: runsOffset,
      }),
    enabled: isWorkflow,
    // Runs are updated server-side by a polling job against GitHub Actions —
    // refetch on a similar cadence so status/progress show up without the
    // user having to manually refresh.
    refetchInterval: 10000,
  })

  const createMut = useMutation({
    mutationFn: () => createApiCredential(newCredentialName.trim()),
    onSuccess: (created) => {
      setCreatedSecret(created)
      setNewCredentialName('')
      queryClient.invalidateQueries({
        queryKey: ['test-execution-credentials'],
      })
    },
  })

  const renameMut = useMutation({
    mutationFn: ({ uuid, name }: { uuid: string; name: string }) => renameApiCredential(uuid, name),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['test-execution-credentials'],
      }),
  })

  const revokeMut = useMutation({
    mutationFn: (uuid: string) => revokeApiCredential(uuid),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['test-execution-credentials'],
      }),
  })

  const deleteMut = useMutation({
    mutationFn: (runUuid: string) => deleteTestRun(runUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-execution-runs'] }),
  })

  const runs = runsQuery.data?.items ?? []
  const activeRunUuid = selectedRunUuid ?? runs[0]?.uuid ?? null
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

  if (redirectTo) return <Navigate to={redirectTo} replace />

  if (!slugParam) {
    return (
      <div className="space-y-8 pb-16">
        <PremiumHero
          accent="cyan"
          badge={t('testExecution.heroBadge')}
          title={t('testExecution.title')}
          subtitle={t('testExecution.subtitle')}
        />
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ase-text">{t('testExecution.workspace.galleryTitle')}</h2>
              <p className="mt-1 max-w-2xl text-sm text-ase-text2">{t('testExecution.picker.hint')}</p>
            </div>
            <ViewToggle
              view={view}
              onChange={(v) => {
                setView(v)
                storeView(v)
              }}
            />
          </div>
          {frameworksQuery.isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : frameworksQuery.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('testExecution.loadError')} />
          ) : frameworks.length === 0 ? (
            <EmptyState
              title={t('testExecution.frameworks.empty')}
              description={t('testExecution.frameworks.emptyHint')}
            />
          ) : (
            <ProductGallery frameworks={frameworks} view={view} />
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      <Link
        to="/test-execution"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ase-text2 transition hover:text-ase-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/60"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        {t('testExecution.workspace.back')}
      </Link>

      {/* --- 2. Configure + run ------------------------------------------------ */}
      {selectedFramework && hasToolViewer ? (
        <Card
          key={selectedFramework.slug}
          className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft"
        >
          <WorkspaceHeader title={selectedFramework.title} slug={selectedFramework.slug} tool />
          <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
            <ProductViewer viewer={selectedFramework.viewer} />
          </Suspense>
        </Card>
      ) : null}
      {isWorkflow && selectedFramework ? (
        <Card
          key={selectedFramework.slug}
          className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft sm:p-6"
        >
          <WorkspaceHeader
            title={selectedFramework.title}
            slug={selectedFramework.slug}
            remaining={selectedFramework.remainingRuns}
            total={selectedFramework.includedRuns}
            lastRun={runs[0] ?? null}
          />
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,5fr)_auto_minmax(0,6fr)] xl:gap-5">
            <PanelFrame
              step={1}
              tone="setup"
              title={t('testExecution.workspace.configure') as string}
              Icon={SlidersHorizontal}
            >
              <FrameworkRunPanel
                framework={selectedFramework}
                onTriggered={() => {
                  setRunsOffset(0)
                  setSelectedRunUuid(null)
                  queryClient.invalidateQueries({
                    queryKey: ['test-execution-runs'],
                  })
                }}
              />
            </PanelFrame>
            <StepArrow />
            <PanelFrame
              id="run-result"
              step={2}
              tone="result"
              title={t('testExecution.workspace.result') as string}
              Icon={ClipboardCheck}
            >
              {activeRunUuid ? (
                <RunResultPanel key={activeRunUuid} runUuid={activeRunUuid} />
              ) : (
                <EmptyState
                  title={t('testExecution.workspace.resultEmpty')}
                  description={t('testExecution.workspace.resultEmptyHint')}
                />
              )}
            </PanelFrame>
          </div>
        </Card>
      ) : null}

      {/* --- 3. History --------------------------------------------------------- */}
      {isWorkflow ? (
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
          <p className="mb-4 max-w-2xl text-sm text-ase-text2">{t('testExecution.workspace.historyHint')}</p>

          {runsQuery.isLoading ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : runsQuery.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('testExecution.loadError')} />
          ) : runs.length === 0 ? (
            <EmptyState title={t('testExecution.runs.empty')} description={t('testExecution.runs.emptyHint')} />
          ) : (
            <>
              <ul className="space-y-2">
                {runs.map((r) => {
                  const selected = r.uuid === activeRunUuid
                  return (
                    <li key={r.uuid} className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedRunUuid(r.uuid)
                          document.getElementById('run-result')?.scrollIntoView({ block: 'start' })
                        }}
                        className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/60 ${
                          selected
                            ? 'border-ase-primary bg-ase-primary/10'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${runDot(r)}`} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ase-text">{fmtDate(r.createdAt)}</span>
                          {r.status !== 'completed' && r.progressPercent !== null ? (
                            <ProgressBar percent={r.progressPercent} />
                          ) : r.errorMessage ? (
                            <span className="block truncate text-xs text-rose-300">{r.errorMessage}</span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Badge variant={STATUS_BADGE[r.status]}>{t(`testExecution.status.${r.status}`)}</Badge>
                          {r.conclusion ? (
                            <Badge variant={CONCLUSION_BADGE[r.conclusion]}>
                              {t(`testExecution.conclusion.${r.conclusion}`)}
                            </Badge>
                          ) : null}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-ase-error hover:text-ase-error"
                        aria-label={t('testExecution.runs.confirmDelete') as string}
                        title={t('testExecution.runs.confirmDelete') as string}
                        onClick={() => {
                          if (window.confirm(t('testExecution.runs.confirmDelete') as string)) {
                            if (r.uuid === selectedRunUuid) setSelectedRunUuid(null)
                            deleteMut.mutate(r.uuid)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </Button>
                    </li>
                  )
                })}
              </ul>
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
      {SHOW_API_CREDENTIALS ? (
        <>
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
                          <TD className="text-ase-muted">
                            {c.lastUsedAt ? fmtDate(c.lastUsedAt) : t('testExecution.credentials.never')}
                          </TD>
                          <TD className="text-right">
                            {c.status === 'active' ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const next = window.prompt(
                                      t('testExecution.credentials.renamePrompt') as string,
                                      c.name,
                                    )
                                    if (next && next.trim() && next.trim() !== c.name) {
                                      renameMut.mutate({
                                        uuid: c.uuid,
                                        name: next.trim(),
                                      })
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
                    {renameMut.isError
                      ? t('testExecution.credentials.renameError')
                      : t('testExecution.credentials.revokeError')}
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
                    leftIcon={
                      copied === 'id' ? (
                        <Check className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Copy className="h-4 w-4" strokeWidth={1.75} />
                      )
                    }
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
                    leftIcon={
                      copied === 'secret' ? (
                        <Check className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Copy className="h-4 w-4" strokeWidth={1.75} />
                      )
                    }
                  >
                    {copied === 'secret' ? t('testExecution.secretModal.copied') : t('testExecution.secretModal.copy')}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        </>
      ) : null}
    </div>
  )
}
