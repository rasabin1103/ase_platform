import { useMemo } from 'react'
import { Badge } from '../../ui/Badge'
import { Card } from '../../ui/Card'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'
import { useQuery } from '@tanstack/react-query'
import { me } from '../../../api/auth.api'
import { listOrganizations } from '../../../api/organizations.api'
import { getActiveOrganizationUuid } from '../../../auth/auth.store'
import { useAuth } from '../../../hooks/useAuth'

function timeGreetingKey(hours: number): 'morning' | 'afternoon' | 'evening' {
  if (hours < 12) return 'morning'
  if (hours < 19) return 'afternoon'
  return 'evening'
}

export function DashboardHero() {
  const { t } = useI18n()
  const auth = useAuth()

  const now = useMemo(() => new Date(), [])
  const greetingKey = useMemo(() => timeGreetingKey(now.getHours()), [now])

  const meQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: me, staleTime: 60_000 })
  const orgsQuery = useQuery({ queryKey: ['organizations', 'active-context'], queryFn: listOrganizations, staleTime: 60_000 })

  const activeOrgUuid = getActiveOrganizationUuid()
  const na = t('dashboardPage.common.na') as string
  const activeOrgName = orgsQuery.data?.items?.find((o) => o.uuid === activeOrgUuid)?.name ?? orgsQuery.data?.items?.[0]?.name ?? na

  const displayName =
    meQuery.data?.display_name ??
    meQuery.data?.email ??
    auth.currentUser?.display_name ??
    auth.currentUser?.email ??
    (t('dashboardPage.hero.unknownUser') as string)

  const role = (meQuery.data as any)?.role ?? (auth.currentUser as any)?.role ?? na
  const systemState: 'online' | 'degraded' = orgsQuery.isError || meQuery.isError ? 'degraded' : 'online'

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/40 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_0%,rgba(56,189,248,0.10),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-ase-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t(`dashboardPage.hero.greeting.${greetingKey}`)}
            </Badge>
            <Badge
              variant="info"
              className={cn(
                'border-white/10 bg-white/[0.04] text-ase-text2',
                systemState === 'online' && 'border-ase-success/25 bg-ase-success/10 text-ase-success',
              )}
            >
              <span className="mr-2 inline-flex h-1.5 w-1.5 items-center justify-center rounded-full bg-current/80 shadow-[0_0_14px_rgba(34,211,238,0.18)]" />
              {t(systemState === 'online' ? 'dashboardPage.hero.systemOnline' : 'dashboardPage.hero.systemDegraded')}
            </Badge>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
            {t(`dashboardPage.hero.greeting.${greetingKey}`)} {displayName}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ase-text2">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-ase-text2">
              {activeOrgName}
            </span>
            <span className="text-ase-muted">·</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-ase-text2">
              {role}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[min(560px,52%)]">
          <KpiCard titleKey="dashboardPage.hero.activeOrgLabel" value={activeOrgName} />
          <KpiCard titleKey="dashboardPage.hero.roleLabel" value={role} />
          <KpiCard
            titleKey="dashboardPage.hero.systemLabel"
            value={t(systemState === 'online' ? 'dashboardPage.hero.systemOnline' : 'dashboardPage.hero.systemDegraded') as string}
          />
        </div>
      </div>
    </section>
  )
}

function KpiCard({ titleKey, value }: { titleKey: string; value: string }) {
  const { t } = useI18n()
  return (
    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm" interactive>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{t(titleKey)}</div>
      <div className="mt-2 truncate text-sm font-semibold text-ase-text2">{value}</div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
        <div className="h-1.5 w-[62%] rounded-full bg-gradient-to-r from-ase-primary/70 to-ase-accent/40" />
      </div>
    </Card>
  )
}

