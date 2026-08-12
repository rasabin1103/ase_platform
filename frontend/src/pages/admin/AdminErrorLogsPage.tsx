import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { listErrorLogs, type ErrorLog } from '../../api/errorLogs.api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Modal } from '../../components/ui/Modal'
import { Table, TBody, TD, THead, TH, TR } from '../../components/ui/Table'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { downloadCsv } from '../../utils/csv'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

const LIMIT = 50

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function AdminErrorLogsPage() {
  const { t } = useI18n()
  const [errorType, setErrorType] = useState('')
  const [path, setPath] = useState('')
  const [method, setMethod] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [offset, setOffset] = useState(0)
  const [detail, setDetail] = useState<ErrorLog | null>(null)

  const filters = useMemo(
    () => ({
      limit: LIMIT,
      offset,
      error_type: errorType || undefined,
      path: path || undefined,
      method: method || undefined,
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
    }),
    [errorType, path, method, dateFrom, dateTo, offset],
  )

  const query = useQuery({ queryKey: ['admin-error-logs', filters], queryFn: () => listErrorLogs(filters) })
  const items = query.data?.items ?? []

  const handleExport = () => {
    downloadCsv(
      'error-logs',
      items.map((row) => ({
        date: row.occurred_at,
        method: row.method,
        path: row.path,
        status_code: row.status_code,
        error_type: row.error_type,
        message: row.message,
        user: row.user_email ?? '',
        ip: row.ip_address ?? '',
      })),
    )
  }

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="amber"
        badge={t('adminErrorLogs.heroBadge')}
        title={t('adminErrorLogs.title')}
        subtitle={t('adminErrorLogs.subtitle')}
      />

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-ase-muted">{t('adminErrorLogs.filters.errorType')}</label>
            <Input
              placeholder="ProgrammingError"
              value={errorType}
              onChange={(e) => { setErrorType(e.target.value); setOffset(0) }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ase-muted">{t('adminErrorLogs.filters.path')}</label>
            <Input
              placeholder="/api/v1/auth/login"
              value={path}
              onChange={(e) => { setPath(e.target.value); setOffset(0) }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ase-muted">{t('adminErrorLogs.filters.method')}</label>
            <Select value={method} onChange={(e) => { setMethod(e.target.value); setOffset(0) }}>
              <option value="">{t('adminErrorLogs.filters.all')}</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ase-muted">{t('adminErrorLogs.filters.from')}</label>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setOffset(0) }} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ase-muted">{t('adminErrorLogs.filters.to')}</label>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setOffset(0) }} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" onClick={handleExport} disabled={items.length === 0}>
            <Download className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            {t('private.common.exportCsv')}
          </Button>
        </div>
      </Card>

      {query.isLoading ? (
        <Skeleton className="h-64 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminErrorLogs.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('adminErrorLogs.empty')} description={t('adminErrorLogs.emptyHint')} />
      ) : (
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-0 shadow-soft">
          <Table className="table-fixed">
            <THead>
              <TR>
                <TH className="w-[16%]">{t('adminErrorLogs.columns.date')}</TH>
                <TH className="w-[9%]">{t('adminErrorLogs.columns.method')}</TH>
                <TH className="w-[22%]">{t('adminErrorLogs.columns.path')}</TH>
                <TH className="w-[18%]">{t('adminErrorLogs.columns.errorType')}</TH>
                <TH className="w-[17%]">{t('adminErrorLogs.columns.user')}</TH>
                <TH className="w-[18%]">{t('adminErrorLogs.columns.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((row) => (
                <TR key={row.id}>
                  <TD className="text-ase-muted">{fmtDate(row.occurred_at)}</TD>
                  <TD>
                    <Badge variant="default">{row.method}</Badge>
                  </TD>
                  <TD className="truncate text-xs text-ase-text2">{row.path}</TD>
                  <TD>
                    <Badge variant="error">{row.error_type}</Badge>
                  </TD>
                  <TD className="truncate text-xs text-ase-muted">{row.user_email ?? '—'}</TD>
                  <TD>
                    <Button variant="ghost" size="sm" onClick={() => setDetail(row)}>
                      {t('adminErrorLogs.viewDetail')}
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination limit={LIMIT} offset={offset} total={query.data?.total ?? 0} onOffsetChange={setOffset} />
        </Card>
      )}

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.method} ${detail.path}` : ''}
        closeLabel={t('adminErrorLogs.close')}
        className="max-w-2xl"
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="text-ase-muted">{fmtDate(detail.occurred_at)}</div>
            <div>
              <span className="font-semibold text-ase-text">{t('adminErrorLogs.columns.errorType')}: </span>
              <span className="text-ase-text2">{detail.error_type}</span>
            </div>
            <div>
              <span className="font-semibold text-ase-text">{t('adminErrorLogs.detail.message')}: </span>
              <span className="text-ase-text2">{detail.message}</span>
            </div>
            {detail.user_email && (
              <div>
                <span className="font-semibold text-ase-text">{t('adminErrorLogs.columns.user')}: </span>
                <span className="text-ase-text2">{detail.user_email}</span>
              </div>
            )}
            {detail.ip_address && (
              <div>
                <span className="font-semibold text-ase-text">{t('adminErrorLogs.detail.ip')}: </span>
                <span className="text-ase-text2">{detail.ip_address}</span>
              </div>
            )}
            <div>
              <div className="mb-1 font-semibold text-ase-text">{t('adminErrorLogs.detail.traceback')}</div>
              <pre className="max-h-80 overflow-auto rounded-lg border border-ase-border bg-ase-bg2 p-3 text-xs text-ase-text2">
                {detail.traceback}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
