import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listOrganizations } from '../../../api/organizations.api'
import { listUsers } from '../../../api/users.api'
import { listPlans } from '../../../api/plans.api'
import { listProducts } from '../../../api/products.api'
import { listSubscriptions } from '../../../api/subscriptions.api'
import { Card } from '../../ui/Card'
import { Skeleton } from '../../ui/Skeleton'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

type MetricId = 'organizations' | 'users' | 'plans' | 'products' | 'subscriptions'

const METRICS: Array<{ id: MetricId; href: string; icon: string }> = [
  { id: 'organizations', href: '/organizations', icon: '⬡' },
  { id: 'users', href: '/users', icon: '◉' },
  { id: 'plans', href: '/plans', icon: '◈' },
  { id: 'products', href: '/products', icon: '◇' },
  { id: 'subscriptions', href: '/subscriptions', icon: '▣' },
]

export function MetricsOverview() {
  const { t } = useI18n()

  const orgsQuery = useQuery({ queryKey: ['organizations', 'summary'], queryFn: listOrganizations, staleTime: 60_000 })
  const usersQuery = useQuery({ queryKey: ['users', 'summary'], queryFn: () => listUsers({ limit: 1, offset: 0 }), staleTime: 60_000 })
  const plansQuery = useQuery({ queryKey: ['plans', 'summary'], queryFn: () => listPlans({ limit: 1, offset: 0 }), staleTime: 60_000 })
  const productsQuery = useQuery({ queryKey: ['products', 'summary'], queryFn: () => listProducts({ limit: 1, offset: 0 }), staleTime: 60_000 })
  const subsQuery = useQuery({ queryKey: ['subscriptions', 'summary'], queryFn: () => listSubscriptions({ limit: 1, offset: 0 }), staleTime: 60_000 })

  const totals: Record<MetricId, number | undefined> = {
    organizations: orgsQuery.data?.total ?? (orgsQuery.isLoading ? undefined : 0),
    users: usersQuery.data?.total ?? (usersQuery.isLoading ? undefined : 0),
    plans: plansQuery.data?.total ?? (plansQuery.isLoading ? undefined : 0),
    products: productsQuery.data?.total ?? (productsQuery.isLoading ? undefined : 0),
    subscriptions: subsQuery.data?.total ?? (subsQuery.isLoading ? undefined : 0),
  }

  const anyError = orgsQuery.isError || usersQuery.isError || plansQuery.isError || productsQuery.isError || subsQuery.isError

  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(56,189,248,0.06),transparent_60%)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {METRICS.map((m) => (
          <Link key={m.id} to={m.href} className="block">
            <Card
              interactive
              className={cn(
                'group relative overflow-hidden rounded-3xl border-white/[0.08] bg-ase-surface/40 p-5 backdrop-blur-md',
                'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_55px_rgba(0,0,0,0.55)]',
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.12),transparent_55%)]" />
              </div>
              <div className="relative z-[1] flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xs text-ase-text">
                      {m.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold uppercase tracking-wide text-ase-muted">
                        {t(`dashboardPage.metrics.${m.id}.title`)}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-ase-text2">{t(`dashboardPage.metrics.${m.id}.subtitle`)}</div>
                    </div>
                  </div>
                </div>
                <span className="mt-2 h-2 w-2 rounded-full bg-ase-primary shadow-[0_0_18px_rgba(56,189,248,0.35)]" />
              </div>

              <div className="relative z-[1] mt-4">
                {typeof totals[m.id] === 'number' ? (
                  <div className="text-3xl font-extrabold tracking-tight text-ase-text">{totals[m.id]}</div>
                ) : (
                  <Skeleton className="h-9 w-16 rounded-lg" />
                )}
              </div>

              <div className="relative z-[1] mt-3 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-ase-text2">{t(`dashboardPage.metrics.${m.id}.trendUp`)}</div>
                <MiniSparkline seed={m.id} />
              </div>

              <div className="relative z-[1] mt-2 text-xs text-ase-muted">{t(`dashboardPage.metrics.${m.id}.micro`)}</div>

              {anyError ? <div className="relative z-[1] mt-2 text-[11px] text-ase-warning">{t('private.common.couldNotLoad')}</div> : null}
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

function MiniSparkline({ seed }: { seed: string }) {
  const values = useMemo(() => {
    const base = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 7
    return Array.from({ length: 14 }).map((_, i) => 10 + ((i * 7 + base * 13) % 18))
  }, [seed])

  return (
    <div className="flex h-8 w-16 items-end gap-0.5">
      {values.map((v, i) => (
        <div key={i} className="w-full rounded-sm bg-white/10">
          <div className="rounded-sm bg-gradient-to-t from-ase-primary/60 to-ase-accent/30" style={{ height: `${v}px` }} />
        </div>
      ))}
    </div>
  )
}

