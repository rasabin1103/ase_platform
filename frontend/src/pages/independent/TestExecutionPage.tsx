import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, ChevronUp, Copy, FileText, KeyRound, PlusCircle, RefreshCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  createApiCredential,
  deleteTestRun,
  listApiCredentials,
  listMyTestRuns,
  listRunnableFrameworks,
  renameApiCredential,
  revokeApiCredential,
  type ApiCredentialCreateResponse,
} from '../../api/testExecution.api'
import { PremiumHero } from '../../components/admin/premium/PremiumHero'
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
import { FrameworkRunPanel, ProgressBar, RunReportModal } from './TestExecutionPage.parts'
import { CONCLUSION_BADGE, fmtDate, RUNS_LIMIT, STATUS_BADGE } from './TestExecutionPage.utils'

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
          <EmptyState
            title={t('testExecution.frameworks.empty')}
            description={t('testExecution.frameworks.emptyHint')}
          />
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
                          <Badge variant={CONCLUSION_BADGE[r.conclusion]}>
                            {t(`testExecution.conclusion.${r.conclusion}`)}
                          </Badge>
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
                            aria-label={t('testExecution.runs.confirmDelete') as string}
                            title={t('testExecution.runs.confirmDelete') as string}
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

      {reportModalRunUuid ? (
        <RunReportModal runUuid={reportModalRunUuid} onClose={() => setReportModalRunUuid(null)} />
      ) : null}
    </div>
  )
}
