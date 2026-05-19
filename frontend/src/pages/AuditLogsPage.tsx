import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { z } from 'zod'
import { listAuditLogs } from '../api/audit-logs.api'
import type { AuditLog } from '../types/audit-log.types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { cn } from '../components/ui/cn'

const ACTIONS = ['CREATED', 'UPDATED', 'DELETED', 'LOGIN', 'FAILED_LOGIN'] as const
const ENTITIES = ['User', 'Organization', 'Plan', 'Subscription', 'Product', 'Course', 'Auth'] as const

const schema = z.object({
  organization: z.string().optional().or(z.literal('')),
  actor: z.string().optional().or(z.literal('')),
  entity_type: z.string().optional().or(z.literal('')),
  action: z.string().optional().or(z.literal('')),
  date_from: z.string().optional().or(z.literal('')),
  date_to: z.string().optional().or(z.literal('')),
})

type Filters = z.infer<typeof schema>
type TFn = (key: string) => unknown

function formatDate(iso: string, language: string) {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function toIsoDate(value?: string, endOfDay = false) {
  if (!value) return null
  const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000'
  return new Date(`${value}${suffix}`).toISOString()
}

function formatRelative(iso: string, t: TFn) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return String(t('auditLogsPage.relative.now'))
  if (minutes < 60) return String(t('auditLogsPage.relative.minutes')).replace('{{count}}', String(minutes))
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return String(t('auditLogsPage.relative.hours')).replace('{{count}}', String(hours))
  return String(t('auditLogsPage.relative.days')).replace('{{count}}', String(Math.floor(hours / 24)))
}

function actorName(log: AuditLog, t: TFn) {
  const metadataActor = typeof log.metadata_json?.actor === 'string' ? log.metadata_json.actor : null
  return log.actor_display_name || metadataActor || (log.actor_user_id ? String(t('auditLogsPage.actors.unknown')) : String(t('auditLogsPage.actors.system')))
}

function organizationName(log: AuditLog, t: TFn) {
  return log.organization_name || (log.organization_id ? String(t('auditLogsPage.organizations.unknown')) : String(t('auditLogsPage.organizations.platform')))
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'A') + (parts[1]?.[0] ?? '')
}

function detailText(log: AuditLog, t: TFn) {
  const metadata = log.metadata_json
  for (const key of ['detail', 'message', 'description', 'change']) {
    const value = metadata?.[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return String(t('auditLogsPage.detailFallback'))
}

function entityLabel(entity: string, t: TFn) {
  return ENTITIES.includes(entity as (typeof ENTITIES)[number]) ? String(t(`auditLogsPage.entities.${entity}`)) : entity
}

function actionVariant(action: string) {
  if (action === 'CREATED' || action === 'LOGIN') return 'success'
  if (action === 'UPDATED') return 'info'
  if (action === 'DELETED') return 'warning'
  if (action === 'FAILED_LOGIN') return 'error'
  return 'default'
}

function iconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function MetricCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="relative overflow-hidden border-white/[0.08] bg-ase-surface/70 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.36)]">
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', accent)} />
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ase-muted">{label}</div>
      <div className="mt-4 text-3xl font-semibold tabular-nums text-ase-text">{value.toLocaleString()}</div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn('h-full rounded-full bg-gradient-to-r', accent)} style={{ width: `${Math.min(100, 24 + value * 9)}%` }} />
      </div>
    </Card>
  )
}

export function AuditLogsPage() {
  const { t, language } = useI18n()
  const locale = language === 'es' ? 'es-ES' : 'en-US'
  const form = useForm<Filters>({
    resolver: zodResolver(schema),
    defaultValues: { organization: '', actor: '', entity_type: '', action: '', date_from: '', date_to: '' },
  })

  const values = form.watch()
  const params = {
    limit: 200,
    offset: 0,
    entity_type: values.entity_type || null,
    action: values.action || null,
    date_from: toIsoDate(values.date_from),
    date_to: toIsoDate(values.date_to, true),
  }

  const logsQuery = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => listAuditLogs(params),
  })

  const items = logsQuery.data?.items ?? []
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const organizationOptions = useMemo(
    () => Array.from(new Set(items.map((log) => organizationName(log, t)))).sort((a, b) => a.localeCompare(b, locale)),
    [items, locale, t],
  )
  const actorOptions = useMemo(
    () => Array.from(new Set(items.map((log) => actorName(log, t)))).sort((a, b) => a.localeCompare(b, locale)),
    [items, locale, t],
  )

  const filteredItems = useMemo(
    () =>
      items.filter((log) => {
        if (values.organization && organizationName(log, t) !== values.organization) return false
        if (values.actor && actorName(log, t) !== values.actor) return false
        return true
      }),
    [items, t, values.actor, values.organization],
  )

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    return {
      total: filteredItems.length,
      organizations: new Set(filteredItems.map((log) => organizationName(log, t))).size,
      actors: new Set(filteredItems.map((log) => actorName(log, t))).size,
      today: filteredItems.filter((log) => new Date(log.created_at).toDateString() === today).length,
    }
  }, [filteredItems, t])

  const summary = useMemo(
    () =>
      [
        { key: 'created', label: t('auditLogsPage.summary.created') as string, value: filteredItems.filter((log) => log.action === 'CREATED').length, color: '#22c55e' },
        { key: 'updated', label: t('auditLogsPage.summary.updated') as string, value: filteredItems.filter((log) => log.action === 'UPDATED').length, color: '#38bdf8' },
        { key: 'deleted', label: t('auditLogsPage.summary.deleted') as string, value: filteredItems.filter((log) => log.action === 'DELETED').length, color: '#f59e0b' },
        { key: 'login', label: t('auditLogsPage.summary.login') as string, value: filteredItems.filter((log) => log.action === 'LOGIN').length, color: '#a78bfa' },
        { key: 'failedLogin', label: t('auditLogsPage.summary.failedLogin') as string, value: filteredItems.filter((log) => log.action === 'FAILED_LOGIN').length, color: '#ef4444' },
      ],
    [filteredItems, t],
  )

  const topEntities = useMemo(() => {
    const counts = new Map<string, number>()
    filteredItems.forEach((log) => counts.set(log.entity_type, (counts.get(log.entity_type) ?? 0) + 1))
    return Array.from(counts.entries())
      .map(([entity, count]) => ({ entity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredItems])

  const maxEntityCount = Math.max(1, ...topEntities.map((item) => item.count))

  return (
    <div className="space-y-8 pb-16">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)] md:p-8">
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="relative">
          <h1 className="text-3xl font-semibold tracking-tight text-ase-text md:text-4xl">{t('auditLogsPage.title')}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">{t('auditLogsPage.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('auditLogsPage.stats.total') as string} value={stats.total} accent="from-cyan-300 to-blue-500" />
        <MetricCard label={t('auditLogsPage.stats.organizations') as string} value={stats.organizations} accent="from-violet-300 to-fuchsia-500" />
        <MetricCard label={t('auditLogsPage.stats.actors') as string} value={stats.actors} accent="from-emerald-300 to-teal-500" />
        <MetricCard label={t('auditLogsPage.stats.today') as string} value={stats.today} accent="from-amber-300 to-orange-500" />
      </div>

      <Card className="border-white/[0.08] bg-ase-surface/65 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-semibold text-ase-text">{t('auditLogsPage.filters.title')}</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => form.reset({ organization: '', actor: '', entity_type: '', action: '', date_from: '', date_to: '' })}
          >
            {t('auditLogsPage.filters.reset')}
          </Button>
        </div>

        <form className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1.5">
            <span className="block text-xs font-medium text-ase-text2">{t('auditLogsPage.filters.organization')}</span>
            <Select {...form.register('organization')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
              <option value="">{t('auditLogsPage.placeholders.organization')}</option>
              {organizationOptions.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs font-medium text-ase-text2">{t('auditLogsPage.filters.actor')}</span>
            <Select {...form.register('actor')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
              <option value="">{t('auditLogsPage.placeholders.actor')}</option>
              {actorOptions.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs font-medium text-ase-text2">{t('auditLogsPage.filters.entityType')}</span>
            <Select {...form.register('entity_type')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
              <option value="">{t('auditLogsPage.placeholders.entityType')}</option>
              {ENTITIES.map((entity) => (
                <option key={entity} value={entity}>
                  {t(`auditLogsPage.entities.${entity}`)}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs font-medium text-ase-text2">{t('auditLogsPage.filters.action')}</span>
            <Select {...form.register('action')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
              <option value="">{t('auditLogsPage.placeholders.action')}</option>
              {ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs font-medium text-ase-text2">{t('auditLogsPage.filters.dateFrom')}</span>
            <Input type="date" {...form.register('date_from')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50" />
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs font-medium text-ase-text2">{t('auditLogsPage.filters.dateTo')}</span>
            <Input type="date" {...form.register('date_to')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50" />
          </label>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="overflow-hidden border-white/[0.08] bg-ase-surface/65 p-0 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur">
          <div className="border-b border-white/[0.06] p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ase-text md:text-xl">{t('auditLogsPage.list.title')}</h2>
                <p className="mt-1 text-sm text-ase-text2">{t('auditLogsPage.list.subtitle')}</p>
              </div>
              <div className="text-xs text-ase-muted">
                {logsQuery.isFetching
                  ? (t('auditLogsPage.list.meta.updating') as string)
                  : String(t('auditLogsPage.list.meta.total')).replace('{{count}}', String(filteredItems.length))}
              </div>
            </div>
          </div>

          {logsQuery.isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-11/12 rounded-xl" />
            </div>
          ) : logsQuery.isError ? (
            <div className="p-6">
              <EmptyState title={t('auditLogsPage.error') as string} description="" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-6">
              <EmptyState title={t('auditLogsPage.empty.title') as string} description={t('auditLogsPage.empty.subtitle') as string} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="bg-ase-surface/95 text-xs uppercase tracking-[0.16em] text-ase-muted">
                  <tr>
                    <th className="border-b border-white/[0.06] px-5 py-4 font-semibold">{t('auditLogsPage.list.columns.date')}</th>
                    <th className="border-b border-white/[0.06] px-5 py-4 font-semibold">{t('auditLogsPage.list.columns.actor')}</th>
                    <th className="border-b border-white/[0.06] px-5 py-4 font-semibold">{t('auditLogsPage.list.columns.organization')}</th>
                    <th className="border-b border-white/[0.06] px-5 py-4 font-semibold">{t('auditLogsPage.list.columns.action')}</th>
                    <th className="border-b border-white/[0.06] px-5 py-4 font-semibold">{t('auditLogsPage.list.columns.entity')}</th>
                    <th className="border-b border-white/[0.06] px-5 py-4 font-semibold">{t('auditLogsPage.list.columns.detail')}</th>
                    <th className="border-b border-white/[0.06] px-5 py-4 text-right font-semibold">{t('auditLogsPage.list.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((log) => {
                    const actor = actorName(log, t)
                    return (
                      <tr key={log.id} className="border-b border-white/[0.04] transition hover:bg-white/[0.035]">
                        <td className="whitespace-nowrap px-5 py-4 text-ase-text2">{formatDate(log.created_at, language)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ase-primary/35 to-ase-accent/20 text-xs font-semibold text-ase-text ring-1 ring-white/10">
                              {initials(actor)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-medium text-ase-text">{actor}</div>
                              {log.actor_email ? <div className="truncate text-xs text-ase-muted">{log.actor_email}</div> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-ase-text2">{organizationName(log, t)}</td>
                        <td className="px-5 py-4">
                          <Badge variant={actionVariant(log.action)} className="font-semibold tracking-wide">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-ase-text2">
                            {entityLabel(log.entity_type, t)}
                          </span>
                        </td>
                        <td className="max-w-[360px] px-5 py-4 text-ase-text2">
                          <span className="line-clamp-2">{detailText(log, t)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button size="sm" variant="ghost" leftIcon={iconEye()} onClick={() => setSelectedLog(log)}>
                            {t('auditLogsPage.actions.view')}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <aside className="space-y-6">
          <Card className="border-white/[0.08] bg-ase-surface/65 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ase-text">{t('auditLogsPage.realtime.title')}</h2>
              <Badge variant="success" className="gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ase-success shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
                {t('auditLogsPage.realtime.live')}
              </Badge>
            </div>
            <div className="mt-5 space-y-4">
              {filteredItems.slice(0, 5).map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-ase-primary shadow-[0_0_18px_rgba(34,211,238,0.75)]" />
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-medium text-ase-text">{actorName(log, t)}</div>
                      <div className="whitespace-nowrap text-xs text-ase-muted">{formatRelative(log.created_at, t)}</div>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                      <span className="truncate text-xs text-ase-text2">{entityLabel(log.entity_type, t)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-white/[0.08] bg-ase-surface/65 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur">
            <h2 className="text-base font-semibold text-ase-text">{t('auditLogsPage.summary.title')}</h2>
            <div className="mt-4 grid grid-cols-[150px_1fr] items-center gap-4">
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={summary} dataKey="value" nameKey="label" innerRadius={44} outerRadius={64} paddingAngle={4}>
                      {summary.map((item) => (
                        <Cell key={item.key} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {summary.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-ase-text2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-ase-text">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="border-white/[0.08] bg-ase-surface/65 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur">
            <h2 className="text-base font-semibold text-ase-text">{t('auditLogsPage.topEntities.title')}</h2>
            <div className="mt-5 space-y-4">
              {topEntities.map((item) => (
                <div key={item.entity}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ase-text2">{entityLabel(item.entity, t)}</span>
                    <span className="tabular-nums text-ase-muted">{item.count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-ase-primary to-ase-accent"
                      style={{ width: `${Math.max(12, (item.count / maxEntityCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {selectedLog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div className="w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
          <Card className="border-white/[0.1] bg-ase-surface p-6 shadow-[0_34px_120px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ase-text">{t('auditLogsPage.detail.title')}</h2>
                <p className="mt-1 text-sm text-ase-text2">{formatDate(selectedLog.created_at, language)}</p>
              </div>
              <Badge variant={actionVariant(selectedLog.action)}>{selectedLog.action}</Badge>
            </div>
            <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-relaxed text-ase-text2">
              {detailText(selectedLog, t)}
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="text-xs text-ase-muted">{t('auditLogsPage.list.columns.actor')}</div>
                <div className="mt-1 font-medium text-ase-text">{actorName(selectedLog, t)}</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="text-xs text-ase-muted">{t('auditLogsPage.list.columns.organization')}</div>
                <div className="mt-1 font-medium text-ase-text">{organizationName(selectedLog, t)}</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="text-xs text-ase-muted">{t('auditLogsPage.list.columns.entity')}</div>
                <div className="mt-1 font-medium text-ase-text">{entityLabel(selectedLog.entity_type, t)}</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="text-xs text-ase-muted">{t('auditLogsPage.list.columns.action')}</div>
                <div className="mt-1 font-medium text-ase-text">{selectedLog.action}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                {t('auditLogsPage.actions.close')}
              </Button>
            </div>
          </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}

