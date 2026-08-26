import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileDown } from 'lucide-react'
import { getAdminAnalytics, getAdminStats, getApplicationMap } from '../../api/adminDashboard.api'
import { getCatalogTestStatsSummary } from '../../api/catalogAdmin.api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { Table, TBody, TD, THead, TH, TR } from '../../components/ui/Table'
import { ApplicationMapTree } from '../../components/admin/premium/ApplicationMapTree'
import {
  InsightBar,
  PremiumBreakdownCard,
  PremiumChartCard,
  PremiumHero,
  PremiumInsightsCard,
  PremiumMetricCard,
  PremiumOrb,
  PremiumSplitStat,
} from '../../components/admin/premium/PremiumAdminUi'
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

const QUICK_LINKS = [
  { to: '/admin/catalog', labelKey: 'adminDashboard.actions.manageCatalog', icon: '◇' },
  { to: '/users', labelKey: 'adminDashboard.actions.manageUsers', icon: '◉' },
  { to: '/admin/purchases', labelKey: 'adminDashboard.actions.viewPurchases', icon: '🛒' },
  { to: '/requests', labelKey: 'adminDashboard.actions.reviewRequests', icon: '◐' },
  { to: '/profile', labelKey: 'adminDashboard.actions.myProfile', icon: '◎' },
] as const

export function AdminDashboardPage() {
  const { t, language } = useI18n()
  const { currentUser } = useAuth()
  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats })
  const analyticsQuery = useQuery({ queryKey: ['admin-analytics'], queryFn: getAdminAnalytics })
  const testStatsQuery = useQuery({ queryKey: ['admin-catalog-test-stats-summary'], queryFn: getCatalogTestStatsSummary })
  const applicationMapQuery = useQuery({ queryKey: ['admin-application-map'], queryFn: getApplicationMap })
  const applicationMap = applicationMapQuery.data
  const stats = statsQuery.data
  const analytics = analyticsQuery.data
  const testStatsRows = [...(testStatsQuery.data?.items ?? [])].sort((a, b) => b.total_runs - a.total_runs)

  const catalogTotal = stats?.catalog_total ?? 0
  const byType = analytics?.catalog_by_type ?? stats?.catalog_by_type ?? {}

  const handleExportPdf = async () => {
    const now = new Date()
    const dateSlug = now.toISOString().slice(0, 10)
    // Loaded on demand — jsPDF (and its optional html2canvas dependency)
    // add ~600KB and are only ever needed if someone actually clicks
    // "Export report", not on every dashboard visit.
    const { downloadAnalyticsPdf } = await import('../../utils/exportAnalyticsPdf')
    downloadAnalyticsPdf({
      title: t('adminDashboard.report.title'),
      dateLabel: `${t('adminDashboard.report.generatedOn')}: ${now.toLocaleString()}`,
      filename: `ase-analitica-${dateSlug}.pdf`,
      generatedBy: currentUser?.email,
      lang: language === 'en' ? 'en' : 'es',
      kpis: [
        { label: t('adminDashboard.metrics.catalog'), value: stats?.catalog_total ?? 0 },
        { label: t('adminDashboard.metrics.users'), value: stats?.users_total ?? 0 },
        { label: t('adminDashboard.metrics.usersActive'), value: stats?.users_active ?? 0 },
        { label: t('adminDashboard.metrics.purchases'), value: stats?.purchases_total ?? 0 },
        {
          label: t('adminDashboard.metrics.revenue'),
          value: (analytics?.revenue_total ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'EUR' }),
        },
        { label: t('adminDashboard.metrics.products'), value: byType.product ?? 0 },
        { label: t('adminDashboard.metrics.courses'), value: byType.course ?? 0 },
        { label: t('adminDashboard.metrics.books'), value: byType.book ?? 0 },
        { label: t('adminDashboard.metrics.resources'), value: byType.resource ?? 0 },
        { label: t('adminDashboard.sections.ratings.title') as string, value: analytics?.ratings_total ?? 0 },
      ],
      barCharts: [
        {
          title: language === 'en' ? 'Catalog by type' : 'Catálogo por tipo',
          data: [
            { label: t('adminDashboard.metrics.products'), value: byType.product ?? 0 },
            { label: t('adminDashboard.metrics.courses'), value: byType.course ?? 0 },
            { label: t('adminDashboard.metrics.books'), value: byType.book ?? 0 },
            { label: t('adminDashboard.metrics.resources'), value: byType.resource ?? 0 },
          ].filter((d) => d.value > 0),
        },
        {
          title: t('adminDashboard.sections.usersByRole.title') as string,
          data: Object.entries(analytics?.users_by_role ?? {})
            .map(([role, value]) => ({ label: (t(`adminDashboard.roleLabels.${role}`) as string) ?? role, value }))
            .filter((d) => d.value > 0),
        },
      ],
      pieCharts: [
        {
          title: t('adminDashboard.sections.organizations.title') as string,
          data: Object.entries(analytics?.organizations_by_type ?? {})
            .map(([type, value]) => ({ label: t(`organizationsPage.types.${type}`) as string, value }))
            .filter((d) => d.value > 0),
        },
        {
          title: t('adminDashboard.sections.requests.title') as string,
          data: Object.entries(analytics?.requests_by_status ?? {})
            .map(([reqStatus, value]) => ({ label: t(`adminDashboard.requestStatus.${reqStatus}`) as string, value }))
            .filter((d) => d.value > 0),
        },
      ],
    })
  }

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="cyan"
        badge={t('adminDashboard.heroBadge')}
        title={t('adminDashboard.title')}
        subtitle={t('adminDashboard.subtitle')}
        leading={<WelcomeBanner variant="lead" />}
        contextChips={
          <>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ase-text2">
              {t('adminDashboard.metrics.usersActive')}: {stats?.users_active ?? '—'}
            </span>
            <span className="rounded-full border border-ase-brand/25 bg-ase-brand/10 px-3 py-1.5 text-xs font-semibold text-ase-text">
              {t('adminDashboard.metrics.revenue')}:{' '}
              {(analytics?.revenue_total ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}
            </span>
          </>
        }
        sidePanel={
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('adminDashboard.pulse.title')}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <PremiumOrb label={t('adminDashboard.metrics.products')} value={byType.product ?? 0} tone="info" />
              <PremiumOrb label={t('adminDashboard.metrics.courses')} value={byType.course ?? 0} tone="info" />
              <PremiumOrb label={t('adminDashboard.metrics.books')} value={byType.book ?? 0} tone="success" />
            </div>
          </Card>
        }
      />

      {statsQuery.isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : statsQuery.isError ? (
        <EmptyState
          title={t('private.common.couldNotLoad')}
          description={t('adminDashboard.loadError')}
          actionLabel={t('adminDashboard.retry')}
          onAction={() => void statsQuery.refetch()}
        />
      ) : (
        <>
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportPdf}
            disabled={statsQuery.isLoading || analyticsQuery.isLoading}
          >
            <FileDown className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            {t('private.common.exportPdf')}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PremiumMetricCard
            label={t('adminDashboard.metrics.catalog')}
            hint={t('adminDashboard.metrics.catalogHint')}
            value={stats?.catalog_total ?? 0}
            icon="◇"
            accent="from-ase-brand to-ase-brand"
          />
          <PremiumMetricCard
            label={t('adminDashboard.metrics.users')}
            hint={t('adminDashboard.metrics.usersHint')}
            value={stats?.users_total ?? 0}
            icon="◉"
            accent="from-ase-brand to-ase-brand"
          />
          <PremiumMetricCard
            label={t('adminDashboard.metrics.purchases')}
            hint={t('adminDashboard.metrics.purchasesHint')}
            value={stats?.purchases_total ?? 0}
            icon="🛒"
            accent="from-ase-brand to-ase-brand"
          />
          <PremiumMetricCard
            label={t('adminDashboard.metrics.revenue')}
            hint={t('adminDashboard.metrics.revenueHint')}
            value={analytics?.revenue_total ?? 0}
            icon="€"
            accent="from-ase-brand to-ase-brand"
            format="currency"
          />
        </div>
        </>
      )}

      {testStatsRows.length > 0 || testStatsQuery.isLoading || testStatsQuery.isError ? (
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ase-text">{t('adminDashboard.sections.testExecutions.title')}</h2>
          <p className="mb-4 max-w-2xl text-sm text-ase-text2">{t('adminDashboard.sections.testExecutions.subtitle')}</p>
          {testStatsQuery.isLoading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : testStatsQuery.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('adminDashboard.testExecutionsLabels.loadError')} />
          ) : testStatsRows.length === 0 ? (
            <EmptyState title={t('adminDashboard.testExecutionsLabels.empty')} />
          ) : (
            <Table className="table-fixed">
              <THead>
                <TR>
                  <TH className="w-[40%]">{t('adminDashboard.testExecutionsLabels.columns.product')}</TH>
                  <TH className="w-[20%]">{t('adminDashboard.testExecutionsLabels.columns.included')}</TH>
                  <TH className="w-[20%]">{t('adminDashboard.testExecutionsLabels.columns.total')}</TH>
                  <TH className="w-[20%]">{t('adminDashboard.testExecutionsLabels.columns.lastRun')}</TH>
                </TR>
              </THead>
              <TBody>
                {testStatsRows.map((row) => (
                  <TR key={row.item_id}>
                    <TD className="text-ase-text">{row.item_title}</TD>
                    <TD className="text-ase-text2">{row.included_runs ?? '—'}</TD>
                    <TD>
                      <Badge variant={row.total_runs > 0 ? 'success' : 'default'}>{row.total_runs}</Badge>
                    </TD>
                    <TD className="text-ase-muted">
                      {row.last_run_at ? fmtDate(row.last_run_at) : t('adminDashboard.testExecutionsLabels.never')}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 lg:grid-cols-2">
          {analyticsQuery.isLoading ? (
            <Skeleton className="h-64 rounded-[2rem] lg:col-span-2" />
          ) : analyticsQuery.isError ? (
            <div className="lg:col-span-2">
              <EmptyState
                title={t('private.common.couldNotLoad')}
                description={t('adminDashboard.loadError')}
                actionLabel={t('adminDashboard.retry')}
                onAction={() => void analyticsQuery.refetch()}
              />
            </div>
          ) : (
            <>
              <PremiumChartCard
                title={t('adminDashboard.charts.users')}
                data={analytics?.users_growth ?? []}
                color="#22d3ee"
              />
              <PremiumChartCard
                title={t('adminDashboard.charts.catalog')}
                data={analytics?.catalog_growth ?? []}
                color="#a78bfa"
              />
              <PremiumChartCard
                title={t('adminDashboard.charts.purchases')}
                data={analytics?.purchases_growth ?? []}
                color="#34d399"
              />
              <PremiumChartCard
                title={t('adminDashboard.charts.revenue')}
                data={analytics?.revenue_growth ?? []}
                color="#fbbf24"
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

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {analyticsQuery.isLoading ? (
          <Skeleton className="h-72 rounded-[2rem] xl:col-span-4" />
        ) : analyticsQuery.isError ? (
          <div className="xl:col-span-4">
            <EmptyState
              title={t('private.common.couldNotLoad')}
              description={t('adminDashboard.loadError')}
              actionLabel={t('adminDashboard.retry')}
              onAction={() => void analyticsQuery.refetch()}
            />
          </div>
        ) : (
          <>
            <PremiumBreakdownCard
              title={t('adminDashboard.sections.organizations.title') as string}
              subtitle={t('adminDashboard.sections.organizations.subtitle') as string}
              items={Object.entries(analytics?.organizations_by_type ?? {}).map(([type, value]) => ({
                label: t(`organizationsPage.types.${type}`) as string,
                value,
              }))}
              emptyLabel={t('adminDashboard.emptyOrganizations') as string}
            />
            <PremiumBreakdownCard
              title={t('adminDashboard.sections.requests.title') as string}
              subtitle={t('adminDashboard.sections.requests.subtitle') as string}
              items={Object.entries(analytics?.requests_by_status ?? {}).map(([reqStatus, value]) => ({
                label: t(`adminDashboard.requestStatus.${reqStatus}`) as string,
                value,
              }))}
              emptyLabel={t('adminDashboard.emptyRequests') as string}
            />
            <PremiumBreakdownCard
              title={t('adminDashboard.sections.usersByRole.title') as string}
              subtitle={t('adminDashboard.sections.usersByRole.subtitle') as string}
              items={Object.entries(analytics?.users_by_role ?? {}).map(([role, value]) => ({
                label: (t(`adminDashboard.roleLabels.${role}`) as string) ?? role,
                value,
              }))}
              emptyLabel={t('adminDashboard.emptyRoles') as string}
            />
            <PremiumSplitStat
              title={t('adminDashboard.sections.ratings.title') as string}
              subtitle={t('adminDashboard.sections.ratings.subtitle') as string}
              totalLabel={t('adminDashboard.ratingsLabels.total') as string}
              total={analytics?.ratings_total ?? 0}
              positiveLabel={t('adminDashboard.ratingsLabels.upvotes') as string}
              positive={analytics?.ratings_upvotes ?? 0}
              negativeLabel={t('adminDashboard.ratingsLabels.downvotes') as string}
              negative={analytics?.ratings_downvotes ?? 0}
              tagsLabel={t('adminDashboard.ratingsLabels.topTags') as string}
              tags={(analytics?.ratings_top_tags ?? []).map((rt) => ({
                tag: rt.tag,
                count: rt.count,
                label: (t(`catalog.rating.tags.${rt.tag}`) as string) ?? rt.tag,
              }))}
              emptyLabel={t('adminDashboard.ratingsLabels.empty') as string}
            />
          </>
        )}
      </div>

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="info" className="mb-2">
              {t('adminDashboard.applicationMap.badge')}
            </Badge>
            <h2 className="text-lg font-semibold text-ase-text">{t('adminDashboard.applicationMap.title')}</h2>
            <p className="mt-1 text-sm text-ase-text2">{t('adminDashboard.applicationMap.subtitle')}</p>
          </div>
        </div>

        <ApplicationMapTree
          data={applicationMap}
          isLoading={applicationMapQuery.isLoading}
          isError={applicationMapQuery.isError}
          onRetry={() => void applicationMapQuery.refetch()}
        />
      </Card>
    </div>
  )
}
