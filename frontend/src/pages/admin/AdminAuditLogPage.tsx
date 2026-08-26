import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet } from 'lucide-react'
import { listAuditLogs } from '../../api/auditLogs.api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Table, TBody, TD, THead, TH, TR } from '../../components/ui/Table'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'
import { downloadCsv } from '../../utils/csv'

const ENTITY_TYPES = ['user', 'catalog_item', 'access_request'] as const

const LIMIT = 50

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function actionTone(action: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (action.endsWith('.create')) return 'success'
  if (action.endsWith('.delete') || action.endsWith('.reject') || action.endsWith('.rejected')) return 'error'
  if (action.endsWith('.update')) return 'info'
  if (action.endsWith('.approve') || action.endsWith('.approved')) return 'success'
  return 'default'
}

export function AdminAuditLogPage() {
  const { t, language } = useI18n()
  const { currentUser } = useAuth()
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [offset, setOffset] = useState(0)

  const filters = useMemo(
    () => ({
      limit: LIMIT,
      offset,
      entity_type: entityType || undefined,
      action: action || undefined,
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
    }),
    [entityType, action, dateFrom, dateTo, offset],
  )

  const query = useQuery({ queryKey: ['admin-audit-logs', filters], queryFn: () => listAuditLogs(filters) })
  const items = query.data?.items ?? []

  const handleExport = () => {
    downloadCsv(
      'audit-log',
      items.map((row) => ({
        date: row.created_at,
        actor: row.actor_email ?? row.actor_display_name ?? '',
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id ?? '',
        organization: row.organization_name ?? '',
        metadata: row.metadata_json ? JSON.stringify(row.metadata_json) : '',
      })),
    )
  }

  const handleExportExcel = async () => {
    const today = new Date().toISOString().slice(0, 10)
    // Loaded on demand — ExcelJS is only needed if someone actually clicks
    // "Export Excel", not on every visit to this page.
    const { downloadBrandedExcel } = await import('../../utils/exportExcel')
    downloadBrandedExcel({
      filename: `ase-auditoria-${today}.xlsx`,
      sheetName: t('adminAuditLog.title'),
      title: t('adminAuditLog.title'),
      generatedBy: currentUser?.email,
      lang: language === 'en' ? 'en' : 'es',
      rows: items.map((row) => ({
        [t('adminAuditLog.columns.date')]: fmtDate(row.created_at),
        [t('adminAuditLog.columns.actor')]: row.actor_email ?? row.actor_display_name ?? '—',
        [t('adminAuditLog.columns.action')]: row.action,
        [t('adminAuditLog.columns.entity')]: row.entity_id ? `${row.entity_type} #${row.entity_id}` : row.entity_type,
        [t('adminAuditLog.columns.details')]: row.metadata_json ? JSON.stringify(row.metadata_json) : '—',
      })),
    })
  }

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="cyan"
        badge={t('adminAuditLog.heroBadge')}
        title={t('adminAuditLog.title')}
        subtitle={t('adminAuditLog.subtitle')}
      />

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="admin-audit-log-entity-type" className="mb-1 block text-xs text-ase-muted">{t('adminAuditLog.filters.entityType')}</label>
            <Select id="admin-audit-log-entity-type" value={entityType} onChange={(e) => { setEntityType(e.target.value); setOffset(0) }}>
              <option value="">{t('adminAuditLog.filters.all')}</option>
              {ENTITY_TYPES.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="admin-audit-log-action" className="mb-1 block text-xs text-ase-muted">{t('adminAuditLog.filters.action')}</label>
            <Input
              id="admin-audit-log-action"
              placeholder="user.update"
              value={action}
              onChange={(e) => { setAction(e.target.value); setOffset(0) }}
            />
          </div>
          <div>
            <label htmlFor="admin-audit-log-from" className="mb-1 block text-xs text-ase-muted">{t('adminAuditLog.filters.from')}</label>
            <Input id="admin-audit-log-from" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setOffset(0) }} />
          </div>
          <div>
            <label htmlFor="admin-audit-log-to" className="mb-1 block text-xs text-ase-muted">{t('adminAuditLog.filters.to')}</label>
            <Input id="admin-audit-log-to" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setOffset(0) }} />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="secondary" className="w-full" onClick={handleExport} disabled={items.length === 0}>
              <Download className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
              {t('private.common.exportCsv')}
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleExportExcel} disabled={items.length === 0}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
              {t('private.common.exportExcel')}
            </Button>
          </div>
        </div>
      </Card>

      {query.isLoading ? (
        <Skeleton className="h-64 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminAuditLog.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('adminAuditLog.empty')} description={t('adminAuditLog.emptyHint')} />
      ) : (
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-0 shadow-soft">
          <Table className="table-fixed">
            <THead>
              <TR>
                <TH className="w-[18%]">{t('adminAuditLog.columns.date')}</TH>
                <TH className="w-[22%]">{t('adminAuditLog.columns.actor')}</TH>
                <TH className="w-[20%]">{t('adminAuditLog.columns.action')}</TH>
                <TH className="w-[20%]">{t('adminAuditLog.columns.entity')}</TH>
                <TH className="w-[20%]">{t('adminAuditLog.columns.details')}</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((row) => (
                <TR key={row.id}>
                  <TD className="text-ase-muted">{fmtDate(row.created_at)}</TD>
                  <TD className="text-ase-text">{row.actor_email ?? row.actor_display_name ?? '—'}</TD>
                  <TD>
                    <Badge variant={actionTone(row.action)}>{row.action}</Badge>
                  </TD>
                  <TD className="text-ase-text2">
                    {row.entity_type}
                    {row.entity_id ? ` #${row.entity_id}` : ''}
                  </TD>
                  <TD className="truncate text-xs text-ase-muted">
                    {row.metadata_json ? JSON.stringify(row.metadata_json) : '—'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination limit={LIMIT} offset={offset} total={query.data?.total ?? 0} onOffsetChange={setOffset} />
        </Card>
      )}
    </div>
  )
}
