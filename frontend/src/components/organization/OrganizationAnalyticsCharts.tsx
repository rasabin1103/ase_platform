import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getMemberCatalogStats, getOrganizationAnalytics } from '../../api/orgCatalog.api'
import { Eyebrow } from '../ui/Eyebrow'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { CATALOG_TYPE_COLORS, CATALOG_TYPE_ORDER } from '../catalog/catalogTypeColors'
import type { CatalogItemType } from '../../types/catalog.types'

const ROLE_COLORS: Record<string, string> = {
  org_owner: 'rgba(56,189,248,0.85)',
  org_admin: 'rgba(34,211,238,0.75)',
  member: 'rgba(167,139,250,0.8)',
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${amount.toFixed(0)} ${currency}`
  }
}

export function OrganizationAnalyticsCharts() {
  const { t } = useI18n()

  const analyticsQuery = useQuery({
    queryKey: ['org-analytics'],
    queryFn: getOrganizationAnalytics,
    staleTime: 15_000,
  })

  const memberStatsQuery = useQuery({
    queryKey: ['org-member-catalog-stats'],
    queryFn: getMemberCatalogStats,
    staleTime: 15_000,
  })

  const analytics = analyticsQuery.data
  const currency = analytics?.currency ?? 'EUR'
  const totalSpend = Number(analytics?.totalSpend ?? 0)

  const spendData = useMemo(() => {
    const byType = new Map<string, number>()
    for (const row of analytics?.spendByType ?? []) byType.set(row.type, Number(row.totalSpend))
    return CATALOG_TYPE_ORDER.map((type) => ({
      type,
      name: t(`catalog.groupLabels.${type}`) as string,
      value: byType.get(type) ?? 0,
    }))
  }, [analytics, t])

  const catalogData = useMemo(() => {
    const byType = new Map<string, number>()
    for (const row of analytics?.catalogByType ?? []) byType.set(row.type, row.count)
    return CATALOG_TYPE_ORDER.map((type) => ({
      type,
      name: t(`catalog.groupLabels.${type}`) as string,
      value: byType.get(type) ?? 0,
    }))
  }, [analytics, t])

  const roleData = useMemo(() => {
    return (analytics?.membersByRole ?? []).map((row) => ({
      roleCode: row.roleCode,
      name: (t(`organizationWorkspace.analytics.roleLabels.${row.roleCode}`) as string) || row.roleCode,
      value: row.count,
      color: ROLE_COLORS[row.roleCode] ?? 'rgba(148,163,184,0.6)',
    }))
  }, [analytics, t])

  const courseData = useMemo(
    () =>
      (analytics?.courseRecipients ?? [])
        .slice(0, 6)
        .map((row) => ({ name: row.title, value: row.recipientCount })),
    [analytics],
  )

  const sentVsConsumedData = useMemo(() => {
    const items = memberStatsQuery.data?.items ?? []
    const totalSent = items.reduce((acc, i) => acc + i.sentCount, 0)
    const totalConsumed = items.reduce((acc, i) => acc + i.consumedCount, 0)
    return [
      { name: t('organizationWorkspace.analytics.sentLegend') as string, value: totalSent, color: 'rgba(56,189,248,0.85)' },
      { name: t('organizationWorkspace.analytics.consumedLegend') as string, value: totalConsumed, color: 'rgba(52,211,153,0.8)' },
    ]
  }, [memberStatsQuery.data, t])

  const isLoading = analyticsQuery.isLoading || memberStatsQuery.isLoading
  const hasSpend = spendData.some((d) => d.value > 0)
  const hasCatalog = catalogData.some((d) => d.value > 0)
  const hasRoles = roleData.some((d) => d.value > 0)
  const hasCourses = courseData.length > 0
  const hasSentVsConsumed = sentVsConsumedData.some((d) => d.value > 0)

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-8">
      <Eyebrow>{t('organizationWorkspace.analytics.badge')}</Eyebrow>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
        {t('organizationWorkspace.analytics.title')}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ase-text2 sm:text-base">{t('organizationWorkspace.analytics.subtitle')}</p>

      {isLoading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-[240px] animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
              {t('organizationWorkspace.analytics.totalSpendLabel')}
            </h3>
            <div className="mt-2 text-4xl font-extrabold tabular-nums text-ase-text">
              {formatMoney(totalSpend, currency)}
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <BarPanel
              title={t('organizationWorkspace.analytics.spendByTypeTitle') as string}
              data={spendData}
              hasData={hasSpend}
              emptyLabel={t('organizationWorkspace.analytics.spendEmpty') as string}
              colorFor={(d) => CATALOG_TYPE_COLORS[d.type as CatalogItemType]}
              valueFormatter={(v) => formatMoney(v, currency)}
            />
            <BarPanel
              title={t('organizationWorkspace.analytics.catalogByTypeTitle') as string}
              data={catalogData}
              hasData={hasCatalog}
              emptyLabel={t('organizationWorkspace.analytics.catalogEmpty') as string}
              colorFor={(d) => CATALOG_TYPE_COLORS[d.type as CatalogItemType]}
              valueFormatter={(v) => String(v)}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
                {t('organizationWorkspace.analytics.membersByRoleTitle')}
              </h3>
              {!hasRoles ? (
                <EmptyChart label={t('organizationWorkspace.analytics.membersEmpty') as string} />
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<PieTooltip />} />
                        <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={4}>
                          {roleData.map((entry) => (
                            <Cell key={entry.roleCode} fill={entry.color} stroke="rgba(255,255,255,0.08)" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 self-center">
                    {roleData.map((r) => (
                      <div
                        key={r.roleCode}
                        className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-ase-text2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                          <span>{r.name}</span>
                        </div>
                        <span className="font-semibold text-ase-text">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <BarPanel
              title={t('organizationWorkspace.analytics.sentVsConsumedTitle') as string}
              data={sentVsConsumedData}
              hasData={hasSentVsConsumed}
              emptyLabel={t('organizationWorkspace.analytics.sentVsConsumedEmpty') as string}
              colorFor={(d) => (d as { color: string }).color}
              valueFormatter={(v) => String(v)}
            />
          </div>

          <Card className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
              {t('organizationWorkspace.analytics.courseRecipientsTitle')}
            </h3>
            {!hasCourses ? (
              <EmptyChart label={t('organizationWorkspace.analytics.courseRecipientsEmpty') as string} />
            ) : (
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'rgba(226,232,240,0.65)', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                      tickLine={false}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis hide domain={[0, 'dataMax']} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const p = payload[0]?.payload as { name: string; value: number } | undefined
                        if (!p) return null
                        return (
                          <div className="rounded-xl border border-white/[0.12] bg-ase-bg2 px-3 py-2 text-xs text-ase-text2 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{p.name}</div>
                            <div className="mt-1 text-sm font-extrabold text-ase-text">{p.value}</div>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48} fill={CATALOG_TYPE_COLORS.course} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}
    </section>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="mt-4 flex h-[180px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
      <p className="text-sm text-ase-muted">{label}</p>
    </div>
  )
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-xl border border-white/[0.12] bg-ase-bg2/90 px-3 py-2 text-xs text-ase-text2 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{p.name}</div>
      <div className="mt-1 text-sm font-extrabold text-ase-text">{p.value}</div>
    </div>
  )
}

function BarPanel({
  title,
  data,
  hasData,
  emptyLabel,
  colorFor,
  valueFormatter,
}: {
  title: string
  data: Array<{ name: string; value: number } & Record<string, unknown>>
  hasData: boolean
  emptyLabel: string
  colorFor: (d: Record<string, unknown>) => string
  valueFormatter: (value: number) => string
}) {
  return (
    <Card className={cn('p-5')}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{title}</h3>
      {!hasData ? (
        <EmptyChart label={emptyLabel} />
      ) : (
        <div className="mt-4 h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(226,232,240,0.65)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis hide domain={[0, 'dataMax']} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0]?.payload as { name: string; value: number } | undefined
                  if (!p) return null
                  return (
                    <div className="rounded-xl border border-white/[0.12] bg-ase-bg2 px-3 py-2 text-xs text-ase-text2 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{p.name}</div>
                      <div className="mt-1 text-sm font-extrabold text-ase-text">{valueFormatter(p.value)}</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={colorFor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
