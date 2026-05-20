import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAdminAnalytics, getAdminStats } from '../../api/adminDashboard.api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  InsightBar,
  PremiumChartCard,
  PremiumHero,
  PremiumInsightsCard,
  PremiumMetricCard,
  PremiumOrb,
  PremiumUsersMetricCard,
} from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { useAuth } from '../../auth/AuthProvider'

const QUICK_LINKS = [
  { to: '/admin/catalog', labelKey: 'adminDashboard.actions.manageCatalog', icon: '◇' },
  { to: '/users', labelKey: 'adminDashboard.actions.manageUsers', icon: '◉' },
  { to: '/admin/purchases', labelKey: 'adminDashboard.actions.viewPurchases', icon: '🛒' },
  { to: '/requests', labelKey: 'adminDashboard.actions.reviewRequests', icon: '◐' },
  { to: '/profile', labelKey: 'adminDashboard.actions.myProfile', icon: '◎' },
] as const

export function AdminDashboardPage() {
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const dashboardQueryOpts = {
    staleTime: 0,
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: true,
  }

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    ...dashboardQueryOpts,
  })
  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: getAdminAnalytics,
    ...dashboardQueryOpts,
  })
  const stats = statsQuery.data
  const analytics = analyticsQuery.data
  const name = currentUser?.display_name || currentUser?.email || ''

  const catalogTotal = stats?.catalog_total ?? 0
  const usersTotal = stats?.users_total ?? 0
  const purchasesTotal = stats?.purchases_total ?? 0
  const byType = analytics?.catalog_by_type ?? stats?.catalog_by_type ?? {}
  const chartEmptyMsg = t('adminDashboard.charts.empty')
  const chartsReady = !statsQuery.isLoading && !analyticsQuery.isLoading
  const loadError = statsQuery.isError || analyticsQuery.isError

  const refreshDashboard = () => {
    void statsQuery.refetch()
    void analyticsQuery.refetch()
  }

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="violet"
        badge={t('adminDashboard.heroBadge')}
        title={`${t('adminDashboard.title')}${name ? `, ${name}` : ''}`}
        subtitle={t('adminDashboard.subtitle')}
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={refreshDashboard} disabled={statsQuery.isFetching || analyticsQuery.isFetching}>
            {statsQuery.isFetching || analyticsQuery.isFetching
              ? (t('adminDashboard.refreshing') as string)
              : (t('adminDashboard.refresh') as string)}
          </Button>
        }
        contextChips={
          <>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ase-text2">
              {t('adminDashboard.metrics.usersActive')}: {stats?.users_active ?? '—'}
            </span>
            <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1.5 text-xs font-semibold text-violet-100">
              {t('adminDashboard.metrics.revenue')}:{' '}
              {(stats?.revenue_total ?? analytics?.revenue_total ?? 0).toLocaleString(undefined, {
                style: 'currency',
                currency: 'EUR',
              })}
            </span>
            {statsQuery.dataUpdatedAt ? (
              <span className="text-xs text-ase-muted">
                {t('adminDashboard.updatedAt')}: {new Date(statsQuery.dataUpdatedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </>
        }
        sidePanel={
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-bg2/45 p-5 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('adminDashboard.pulse.title')}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <PremiumOrb label={t('adminDashboard.metrics.products')} value={byType.product ?? 0} tone="info" />
              <PremiumOrb label={t('adminDashboard.metrics.courses')} value={byType.course ?? 0} tone="violet" />
              <PremiumOrb label={t('adminDashboard.metrics.books')} value={byType.book ?? 0} tone="success" />
            </div>
          </Card>
        }
      />

      {loadError ? (
        <Card className="rounded-2xl border-ase-error/30 bg-ase-error/10 p-4">
          <p className="text-sm text-ase-error">{t('adminDashboard.loadError')}</p>
          <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={refreshDashboard}>
            {t('adminDashboard.retry')}
          </Button>
        </Card>
      ) : null}

      {statsQuery.isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PremiumMetricCard
            label={t('adminDashboard.metrics.catalog')}
            hint={t('adminDashboard.metrics.catalogHint')}
            value={stats?.catalog_total ?? 0}
            icon="◇"
            accent="from-cyan-300 to-blue-500"
          />
          <PremiumUsersMetricCard
            label={t('adminDashboard.metrics.users')}
            hint={`${usersTotal.toLocaleString()} — ${t('adminDashboard.metrics.usersHint')}`}
            active={stats?.users_active ?? 0}
            inactive={stats?.users_inactive ?? 0}
            activeLabel={t('adminDashboard.metrics.usersActiveLabel')}
            inactiveLabel={t('adminDashboard.metrics.usersInactiveLabel')}
            icon="◉"
            accent="from-emerald-300 to-teal-500"
          />
          <PremiumMetricCard
            label={t('adminDashboard.metrics.purchases')}
            hint={t('adminDashboard.metrics.purchasesHint')}
            value={stats?.purchases_total ?? 0}
            icon="🛒"
            accent="from-violet-300 to-fuchsia-500"
          />
          <PremiumMetricCard
            label={t('adminDashboard.metrics.revenue')}
            hint={t('adminDashboard.metrics.revenueHint')}
            value={stats?.revenue_total ?? analytics?.revenue_total ?? 0}
            icon="€"
            accent="from-amber-300 to-orange-500"
            format="currency"
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 lg:grid-cols-2">
          {!chartsReady ? (
            <>
              <Skeleton className="h-[17rem] rounded-[2rem]" />
              <Skeleton className="h-[17rem] rounded-[2rem]" />
              <Skeleton className="h-[17rem] rounded-[2rem]" />
              <Skeleton className="h-[17rem] rounded-[2rem]" />
            </>
          ) : (
            <>
              <PremiumChartCard
                title={t('adminDashboard.charts.users')}
                data={analytics?.users_growth ?? []}
                color="#22d3ee"
                chartId="users-growth"
                emptyMessage={chartEmptyMsg}
                noTableData={usersTotal === 0}
              />
              <PremiumChartCard
                title={t('adminDashboard.charts.catalog')}
                data={analytics?.catalog_growth ?? []}
                color="#a78bfa"
                chartId="catalog-growth"
                emptyMessage={chartEmptyMsg}
                noTableData={catalogTotal === 0}
              />
              <PremiumChartCard
                title={t('adminDashboard.charts.purchases')}
                data={analytics?.purchases_growth ?? []}
                color="#34d399"
                chartId="purchases-growth"
                emptyMessage={chartEmptyMsg}
                noTableData={purchasesTotal === 0}
              />
              <PremiumChartCard
                title={t('adminDashboard.charts.revenue')}
                data={analytics?.revenue_growth ?? []}
                color="#fbbf24"
                chartId="revenue-growth"
                emptyMessage={chartEmptyMsg}
                noTableData={purchasesTotal === 0}
                valueFormatter={(v) => v.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}
              />
            </>
          )}
        </div>

        <aside className="space-y-6">
          <PremiumInsightsCard title={t('adminDashboard.insights.catalogMix')}>
            <section>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
                {t('adminDashboard.insights.byType')}
              </div>
              <div className="mt-3 space-y-3">
                <InsightBar label={t('adminDashboard.metrics.products')} value={byType.product ?? 0} total={catalogTotal || 1} />
                <InsightBar label={t('adminDashboard.metrics.courses')} value={byType.course ?? 0} total={catalogTotal || 1} />
                <InsightBar label={t('adminDashboard.metrics.books')} value={byType.book ?? 0} total={catalogTotal || 1} />
                <InsightBar label={t('adminDashboard.metrics.resources')} value={byType.resource ?? 0} total={catalogTotal || 1} />
              </div>
            </section>
            <section>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
                {t('adminDashboard.quickActions')}
              </div>
              <div className="mt-3 grid gap-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 transition hover:border-cyan-300/20"
                  >
                    <span className="text-base">{link.icon}</span>
                    <span className="text-sm font-medium text-ase-text">{t(link.labelKey)}</span>
                  </Link>
                ))}
              </div>
            </section>
          </PremiumInsightsCard>
        </aside>
      </div>
    </div>
  )
}
