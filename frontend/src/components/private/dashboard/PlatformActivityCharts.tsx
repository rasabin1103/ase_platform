import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../../ui/Badge'
import { Card } from '../../ui/Card'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'
import { listOrganizations } from '../../../api/organizations.api'
import { listUsers } from '../../../api/users.api'
import { listSubscriptions } from '../../../api/subscriptions.api'

export function PlatformActivityCharts() {
  const { t } = useI18n()

  const orgsQuery = useQuery({ queryKey: ['organizations', 'activity-seed'], queryFn: listOrganizations, staleTime: 60_000 })
  const usersQuery = useQuery({ queryKey: ['users', 'activity-seed'], queryFn: () => listUsers({ limit: 1, offset: 0 }), staleTime: 60_000 })
  const subsQuery = useQuery({ queryKey: ['subscriptions', 'activity-seed'], queryFn: () => listSubscriptions({ limit: 1, offset: 0 }), staleTime: 60_000 })

  const seed = (orgsQuery.data?.total ?? 0) + (usersQuery.data?.total ?? 0) + (subsQuery.data?.total ?? 0)

  const areaData = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        m: i + 1,
        v: Math.max(0, Math.round((seed % 50) + i * 3 + (i % 2 ? 4 : 0))),
      })),
    [seed],
  )

  const activeUsers = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        d: i + 1,
        v: Math.max(0, Math.round((seed % 30) + (i % 5) * 2 + (i % 3 ? 3 : 0))),
      })),
    [seed],
  )

  const subsByPlan = useMemo(() => {
    const a = Math.max(1, (seed % 7) + 2)
    const b = Math.max(1, (seed % 5) + 1)
    const c = Math.max(1, (seed % 9) + 1)
    return [
      { name: t('dashboardPage.activity.planNames.starter') as string, value: a, color: 'rgba(56,189,248,0.75)' },
      { name: t('dashboardPage.activity.planNames.team') as string, value: b, color: 'rgba(34,211,238,0.65)' },
      { name: t('dashboardPage.activity.planNames.enterprise') as string, value: c, color: 'rgba(248,250,252,0.35)' },
    ]
  }, [seed, t])

  const productUsage = useMemo(() => {
    const base = seed % 10
    return [
      { k: t('dashboardPage.activity.productNames.core') as string, v: 10 + base },
      { k: t('dashboardPage.activity.productNames.billing') as string, v: 6 + (base % 5) },
      { k: t('dashboardPage.activity.productNames.rbac') as string, v: 8 + (base % 4) },
      { k: t('dashboardPage.activity.productNames.audit') as string, v: 5 + (base % 6) },
    ]
  }, [seed, t])

  const isEmpty = (orgsQuery.data?.total ?? 0) === 0 && (usersQuery.data?.total ?? 0) === 0 && (subsQuery.data?.total ?? 0) === 0

  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(34,211,238,0.06),transparent_60%)]" />
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
            {t('dashboardPage.activity.badge')}
          </Badge>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{t('dashboardPage.activity.title')}</h2>
          <p className="mt-2 max-w-3xl text-sm text-ase-text2 sm:text-base">{t('dashboardPage.activity.subtitle')}</p>
        </div>
      </div>

      {isEmpty ? (
        <Card className="mt-6 rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-8 text-center backdrop-blur-md" interactive>
          <div className="text-lg font-extrabold text-ase-text">{t('dashboardPage.activity.empty.title')}</div>
          <div className="mt-2 text-sm text-ase-text2">{t('dashboardPage.activity.empty.body')}</div>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <ChartCard className="lg:col-span-7" title={t('dashboardPage.activity.charts.orgGrowth') as string}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(56,189,248,0.55)" />
                    <stop offset="100%" stopColor="rgba(56,189,248,0.0)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<SoftTooltip />} />
                <Area type="monotone" dataKey="v" stroke="rgba(56,189,248,0.9)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard className="lg:col-span-5" title={t('dashboardPage.activity.charts.subsByPlan') as string}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<SoftTooltip />} />
                    <Pie data={subsByPlan} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                      {subsByPlan.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="rgba(255,255,255,0.08)" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 sm:pt-6 lg:pt-0">
                {subsByPlan.map((p) => (
                  <div key={p.name} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-ase-text2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      <span>{p.name}</span>
                    </div>
                    <span className="font-semibold text-ase-text">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard className="lg:col-span-7" title={t('dashboardPage.activity.charts.activeUsers') as string}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activeUsers} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.45)" />
                    <stop offset="100%" stopColor="rgba(34,211,238,0.0)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<SoftTooltip />} />
                <Area type="monotone" dataKey="v" stroke="rgba(34,211,238,0.9)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard className="lg:col-span-5" title={t('dashboardPage.activity.charts.productUsage') as string}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productUsage} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="k" stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<SoftTooltip />} />
                <Bar dataKey="v" radius={[10, 10, 0, 0]} fill="rgba(56,189,248,0.55)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </section>
  )
}

function ChartCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <Card
      interactive
      className={cn(
        'relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-5 backdrop-blur-md',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_55px_rgba(0,0,0,0.55)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 hover:opacity-100">
        <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.12),transparent_55%)]" />
      </div>
      <div className="relative z-[1] text-xs font-semibold uppercase tracking-wide text-ase-muted">{title}</div>
      <div className="relative z-[1] mt-4">{children}</div>
    </Card>
  )
}

function SoftTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/[0.12] bg-ase-bg2/90 px-3 py-2 text-xs text-ase-text2 shadow-[0_18px_50px_rgba(0,0,0,0.65)] backdrop-blur-md">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{String(label)}</div>
      <div className="mt-1 text-sm font-extrabold text-ase-text">{payload[0].value}</div>
    </div>
  )
}

