import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ChevronDown, ChevronUp, Download, Trash2 } from 'lucide-react'
import {
  deleteDataResetRows,
  exportDataResetRows,
  listDataResetDomains,
  listDataResetRows,
  resetAllData,
  resetDataDomain,
  type DataDomain,
  type DataRow,
} from '../../api/adminDataReset.api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'

type PendingTarget = { kind: 'domain'; domain: DataDomain } | { kind: 'all' }
type PendingRowDelete = { domainKey: string; table: string; ids: number[] }

// Defaults small, but the admin can raise it (up to the backend's own cap —
// see _MAX_PAGE_SIZE in service.py) when they need to select more than a
// page's worth of rows to delete at once.
const DEFAULT_ROWS_PAGE_SIZE = 10
const ROWS_PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100]

/** Per-domain, per-table row browser — lets a super admin drill into a
 * domain's actual rows and delete a hand-picked few, instead of the
 * all-or-nothing TRUNCATE the domain card's own "Delete" button performs.
 * Deliberately scoped server-side to `domain.tables` only (see
 * _resolve_browsable_table in service.py), so this never exposes the wider
 * FK-cascade tables shown in the domain preview above. */
function DomainRowBrowser({
  domain,
  onRequestDelete,
}: {
  domain: DataDomain
  onRequestDelete: (payload: PendingRowDelete) => void
}) {
  const { t } = useI18n()
  const [table, setTable] = useState<string>(domain.tables[0])
  const [pageSize, setPageSize] = useState(DEFAULT_ROWS_PAGE_SIZE)
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const page = Math.floor(offset / pageSize) + 1
  const query = useQuery({
    queryKey: ['admin-data-reset-rows', domain.key, table, page, pageSize],
    queryFn: () => listDataResetRows(domain.key, table, page, pageSize),
  })

  function switchTable(next: string) {
    setTable(next)
    setOffset(0)
    setSelected(new Set())
  }

  function switchPageSize(next: number) {
    setPageSize(next)
    setOffset(0)
    setSelected(new Set())
  }

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const rows = query.data?.rows ?? []
  const columns = query.data?.columns ?? []
  // Rows flagged `protected` (the acting super admin's own user/org row on a
  // special domain) never enter the selectable set, so "select all" can't
  // silently include the one row that would break the admin's own access.
  const selectableRows = rows.filter((r) => !r.protected)
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => selected.has(r.id))

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) selectableRows.forEach((r) => next.delete(r.id))
      else selectableRows.forEach((r) => next.add(r.id))
      return next
    })
  }

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
      <div className="flex flex-wrap items-end gap-3">
        {domain.tables.length > 1 && (
          <div className="max-w-xs">
            <label className="mb-1 block text-xs text-ase-muted">{t('adminDataReset.rowsTableLabel')}</label>
            <Select
              value={table}
              onChange={(e) => switchTable((e.target as HTMLSelectElement).value)}
              aria-label={t('adminDataReset.rowsTableLabel')}
            >
              {domain.tables.map((tbl) => (
                <option key={tbl} value={tbl}>
                  {tbl}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="w-32">
          <label className="mb-1 block text-xs text-ase-muted">{t('adminDataReset.rowsPageSizeLabel')}</label>
          <Select
            value={String(pageSize)}
            onChange={(e) => switchPageSize(Number((e.target as HTMLSelectElement).value))}
            aria-label={t('adminDataReset.rowsPageSizeLabel')}
          >
            {ROWS_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminDataReset.rowsLoadError')} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-ase-muted">{t('adminDataReset.rowsEmpty')}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-ase-muted">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-ase-border"
              />
              {t('adminDataReset.rowsSelectAll')}
            </label>
            {selected.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-ase-muted">
                  {String(t('adminDataReset.rowsSelectedCount')).replace('{{count}}', String(selected.size))}
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onRequestDelete({ domainKey: domain.key, table, ids: Array.from(selected) })}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                  {t('adminDataReset.rowsDeleteSelected')}
                </Button>
              </div>
            )}
          </div>

          <Table>
            <THead>
              <TR>
                <TH className="w-10" />
                {columns.map((col) => (
                  <TH key={col}>{col}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {rows.map((row: DataRow) => (
                <TR key={row.id} data-selected={selected.has(row.id)}>
                  <TD>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      disabled={row.protected}
                      onChange={() => toggleRow(row.id)}
                      className="h-4 w-4 rounded border-ase-border disabled:opacity-40"
                      title={row.protected ? t('adminDataReset.rowsProtectedHint') : undefined}
                    />
                  </TD>
                  {columns.map((col) => (
                    <TD key={col} className="max-w-xs truncate">
                      {row.columns[col] ?? '—'}
                    </TD>
                  ))}
                </TR>
              ))}
            </TBody>
          </Table>

          <Pagination
            limit={pageSize}
            offset={offset}
            total={query.data?.total ?? 0}
            onOffsetChange={(next) => {
              setOffset(next)
              setSelected(new Set())
            }}
          />
        </>
      )}
    </div>
  )
}

export function AdminDataResetPanel() {
  const { t, language } = useI18n()
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin-data-reset-domains'], queryFn: listDataResetDomains })

  const [pending, setPending] = useState<PendingTarget | null>(null)
  const [phraseInput, setPhraseInput] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  // Which domain card, if any, currently has its row browser expanded — only
  // one at a time, to keep the page from firing a dozen row queries at once.
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [pendingRowDelete, setPendingRowDelete] = useState<PendingRowDelete | null>(null)
  const [rowDeletePassword, setRowDeletePassword] = useState('')
  const [rowDeleteSubmitting, setRowDeleteSubmitting] = useState(false)
  const [rowDeleteError, setRowDeleteError] = useState<string | null>(null)

  // Shared "download before you delete" backup used by both danger-zone
  // modals below — a single table's worth of rows (or a hand-picked `ids`
  // subset) as a branded .xlsx, via the same client-side utility the other
  // admin export buttons already use.
  const [backupDownloading, setBackupDownloading] = useState(false)
  const [backupError, setBackupError] = useState<string | null>(null)

  async function downloadTableBackup(domainKey: string, table: string, ids?: number[]) {
    const result = await exportDataResetRows(domainKey, table, ids)
    if (result.rows.length === 0) return
    const today = new Date().toISOString().slice(0, 10)
    const { downloadBrandedExcel } = await import('../../utils/exportExcel')
    await downloadBrandedExcel({
      filename: `ase-backup-${table}-${today}.xlsx`,
      sheetName: table,
      title: `${t('adminDataReset.downloadBackupButton')} — ${table}`,
      subtitle: result.truncated ? t('adminDataReset.backupTruncatedNote') : undefined,
      generatedBy: currentUser?.email,
      lang: language === 'en' ? 'en' : 'es',
      rows: result.rows,
    })
  }

  async function handleDownloadBackup(targets: { domainKey: string; table: string; ids?: number[] }[]) {
    setBackupDownloading(true)
    setBackupError(null)
    try {
      // Sequential, not Promise.all: firing several triggered downloads at
      // once is exactly the pattern browsers' popup/download-flood
      // heuristics are built to block.
      for (const target of targets) {
        await downloadTableBackup(target.domainKey, target.table, target.ids)
      }
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err instanceof Error ? err.message : String(err))
      setBackupError(detail || t('adminDataReset.backupError'))
    } finally {
      setBackupDownloading(false)
    }
  }

  const domains = query.data?.domains ?? []
  const masterPhrase = query.data?.master_confirm_phrase ?? ''
  const superAdminEmail = query.data?.super_admin_email ?? ''

  const expectedPhrase = pending == null ? '' : pending.kind === 'all' ? masterPhrase : pending.domain.confirm_phrase

  function closeModal() {
    setPending(null)
    setPhraseInput('')
    setPassword('')
    setModalError(null)
    setBackupError(null)
  }

  async function handleConfirm() {
    if (!pending) return
    setSubmitting(true)
    setModalError(null)
    try {
      const result =
        pending.kind === 'all'
          ? await resetAllData(phraseInput, password)
          : await resetDataDomain(pending.domain.key, phraseInput, password)
      setBanner({ kind: 'success', text: `${t('adminDataReset.successPrefix')} ${result.message}` })
      closeModal()
      queryClient.invalidateQueries({ queryKey: ['admin-data-reset-domains'] })
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err instanceof Error ? err.message : String(err))
      setModalError(detail)
    } finally {
      setSubmitting(false)
    }
  }

  const canConfirm = phraseInput.trim() === expectedPhrase && password.length > 0 && !submitting

  function closeRowDeleteModal() {
    setPendingRowDelete(null)
    setRowDeletePassword('')
    setRowDeleteError(null)
    setBackupError(null)
  }

  async function handleConfirmRowDelete() {
    if (!pendingRowDelete) return
    setRowDeleteSubmitting(true)
    setRowDeleteError(null)
    try {
      const result = await deleteDataResetRows(
        pendingRowDelete.domainKey,
        pendingRowDelete.table,
        pendingRowDelete.ids,
        rowDeletePassword,
      )
      setBanner({ kind: 'success', text: `${t('adminDataReset.successPrefix')} ${result.message}` })
      closeRowDeleteModal()
      // Prefix-matches every page/table combo cached for this domain's row
      // browser, plus the domain cards' own row counts.
      queryClient.invalidateQueries({ queryKey: ['admin-data-reset-rows', pendingRowDelete.domainKey] })
      queryClient.invalidateQueries({ queryKey: ['admin-data-reset-domains'] })
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err instanceof Error ? err.message : String(err))
      setRowDeleteError(detail)
    } finally {
      setRowDeleteSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {banner && (
        <div
          className={
            banner.kind === 'success'
              ? 'rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300'
              : 'rounded-2xl border border-ase-error/30 bg-ase-error/10 px-5 py-4 text-sm text-ase-error'
          }
        >
          {banner.text}
        </div>
      )}

      <Card className="rounded-[2rem] border-ase-error/30 bg-ase-error/[0.04] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-ase-error" strokeWidth={1.75} />
            <div>
              <div className="text-base font-semibold text-ase-text">{t('adminDataReset.masterTitle')}</div>
              <p className="mt-1 max-w-xl text-sm text-ase-text2">{t('adminDataReset.masterSubtitle')}</p>
              {superAdminEmail && (
                <p className="mt-2 text-xs text-ase-muted">
                  {t('adminDataReset.preservedNotePrefix')} <span className="font-medium text-ase-text2">{superAdminEmail}</span>
                </p>
              )}
            </div>
          </div>
          <Button variant="danger" onClick={() => setPending({ kind: 'all' })} disabled={query.isLoading}>
            <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            {t('adminDataReset.masterButton')}
          </Button>
        </div>
      </Card>

      {query.isLoading ? (
        <Skeleton className="h-64 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminDataReset.loadError')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {domains.map((domain) => {
            const isExpanded = expandedKey === domain.key
            return (
              <Card key={domain.key} className="rounded-2xl border-white/[0.08] bg-ase-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-ase-text">{domain.label}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={domain.row_count > 0 ? 'warning' : 'default'}>
                        {domain.row_count} {t('adminDataReset.rowsLabel')}
                      </Badge>
                      {domain.is_special && <Badge variant="info">super admin</Badge>}
                    </div>
                    {domain.extra_tables.length > 0 && (
                      <p className="mt-2 text-xs text-ase-muted">
                        {t('adminDataReset.extraTablesLabel')} {domain.extra_tables.join(', ')}
                      </p>
                    )}
                    {domain.key === 'organizations' && (
                      <p className="mt-2 text-xs text-ase-muted">{t('adminDataReset.specialOrgHint')}</p>
                    )}
                    {domain.key === 'users' && (
                      <p className="mt-2 text-xs text-ase-muted">{t('adminDataReset.specialUserHint')}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPending({ kind: 'domain', domain })}
                      disabled={domain.row_count === 0}
                    >
                      {t('adminDataReset.deleteDomainButton')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedKey(isExpanded ? null : domain.key)}
                      disabled={domain.row_count === 0}
                    >
                      {isExpanded ? (
                        <ChevronUp className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <ChevronDown className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                      )}
                      {isExpanded ? t('adminDataReset.rowsToggleHide') : t('adminDataReset.rowsToggleShow')}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <DomainRowBrowser domain={domain} onRequestDelete={(payload) => setPendingRowDelete(payload)} />
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={pending !== null}
        onClose={closeModal}
        closeLabel={t('adminDataReset.cancel')}
        title={pending?.kind === 'all' ? t('adminDataReset.modalTitleAll') : pending?.domain.label}
        className="max-w-lg"
      >
        <div className="space-y-4 text-sm">
          {pending && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-ase-border bg-ase-bg2 px-3 py-2.5">
              <span className="text-xs text-ase-muted">{t('adminDataReset.downloadBackupButton')}</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={backupDownloading}
                onClick={() =>
                  handleDownloadBackup(
                    pending.kind === 'all'
                      ? domains.flatMap((d) => d.tables.map((table) => ({ domainKey: d.key, table })))
                      : pending.domain.tables.map((table) => ({ domainKey: pending.domain.key, table })),
                  )
                }
              >
                <Download className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                {backupDownloading ? t('adminDataReset.downloadingBackup') : t('adminDataReset.downloadBackupButton')}
              </Button>
            </div>
          )}
          <div>
            <div className="mb-1 text-ase-muted">{t('adminDataReset.typePhraseLabel')}</div>
            <div className="rounded-lg border border-ase-border bg-ase-bg2 px-3 py-2 font-mono text-xs text-ase-text">
              {expectedPhrase}
            </div>
          </div>
          <div>
            <Input
              value={phraseInput}
              onChange={(e) => setPhraseInput(e.target.value)}
              placeholder={t('adminDataReset.phraseInputPlaceholder')}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="admin-data-reset-password" className="mb-1 block text-xs text-ase-muted">{t('adminDataReset.passwordLabel')}</label>
            <Input
              id="admin-data-reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('adminDataReset.passwordPlaceholder')}
              autoComplete="current-password"
            />
          </div>
          {backupError && <div className="text-xs text-ase-error">{backupError}</div>}
          {modalError && <div className="text-xs text-ase-error">{modalError}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              {t('adminDataReset.cancel')}
            </Button>
            <Button variant="danger" onClick={handleConfirm} disabled={!canConfirm}>
              {submitting ? t('adminDataReset.deleting') : t('adminDataReset.confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lighter-weight than the domain-wipe modal above: password only, no
          confirm phrase to type — deleting a handful of hand-picked rows is
          meant to feel less heavyweight than an all-or-nothing TRUNCATE. */}
      <Modal
        open={pendingRowDelete !== null}
        onClose={closeRowDeleteModal}
        closeLabel={t('adminDataReset.cancel')}
        title={t('adminDataReset.rowDeleteModalTitle')}
        className="max-w-lg"
      >
        {pendingRowDelete && (
          <div className="space-y-4 text-sm">
            <p className="text-ase-text2">
              {String(t('adminDataReset.rowDeleteModalBody'))
                .replace('{{count}}', String(pendingRowDelete.ids.length))
                .replace('{{table}}', pendingRowDelete.table)}
            </p>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-ase-border bg-ase-bg2 px-3 py-2.5">
              <span className="text-xs text-ase-muted">{t('adminDataReset.downloadBackupButton')}</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={backupDownloading}
                onClick={() =>
                  handleDownloadBackup([
                    { domainKey: pendingRowDelete.domainKey, table: pendingRowDelete.table, ids: pendingRowDelete.ids },
                  ])
                }
              >
                <Download className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                {backupDownloading ? t('adminDataReset.downloadingBackup') : t('adminDataReset.downloadBackupButton')}
              </Button>
            </div>
            <div>
              <label htmlFor="admin-data-reset-row-password" className="mb-1 block text-xs text-ase-muted">
                {t('adminDataReset.passwordLabel')}
              </label>
              <Input
                id="admin-data-reset-row-password"
                type="password"
                value={rowDeletePassword}
                onChange={(e) => setRowDeletePassword(e.target.value)}
                placeholder={t('adminDataReset.passwordPlaceholder')}
                autoComplete="current-password"
              />
            </div>
            {backupError && <div className="text-xs text-ase-error">{backupError}</div>}
            {rowDeleteError && <div className="text-xs text-ase-error">{rowDeleteError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeRowDeleteModal} disabled={rowDeleteSubmitting}>
                {t('adminDataReset.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmRowDelete}
                disabled={rowDeletePassword.length === 0 || rowDeleteSubmitting}
              >
                {rowDeleteSubmitting ? t('adminDataReset.deleting') : t('adminDataReset.rowDeleteConfirmButton')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
