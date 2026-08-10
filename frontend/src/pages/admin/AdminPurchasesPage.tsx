import { useQuery } from '@tanstack/react-query'
import { getAdminPurchasesSummary, listAdminPurchases } from '../../api/adminDashboard.api'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  PremiumHero,
  PremiumInsightsCard,
  PremiumMetricCard,
  PremiumOrb,
} from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function AdminPurchasesPage() {
  const { t } = useI18n()
  const summaryQuery = useQuery({ queryKey: ['admin-purchases-summary'], queryFn: getAdminPurchasesSummary })
  const listQuery = useQuery({ queryKey: ['admin-purchases'], queryFn: () => listAdminPurchases({ limit: 50 }) })
  const summary = summaryQuery.data

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="amber"
        badge={t('adminDashboard.heroBadge')}
        title={t('adminPurchases.title')}
        subtitle={t('adminPurchases.subtitle')}
        sidePanel={
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-bg2/45 p-5 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('adminPurchases.topUsers')}</div>
            <div className="mt-4 space-y-2">
              {(summary?.top_users ?? []).length === 0 ? (
                <p className="text-sm text-ase-muted">—</p>
              ) : (
                (summary?.top_users ?? []).map((u, i) => (
                  <div
                    key={u.email}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                  >
                    <span className="truncate text-sm text-ase-text">
                      <span className="mr-2 text-amber-300">#{i + 1}</span>
                      {u.email}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-ase-muted">
                      {u.purchase_count} {t('adminPurchases.purchasesCount')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PremiumMetricCard
          label={t('adminPurchases.totalPurchases')}
          value={summary?.purchases_total ?? 0}
          icon="🛒"
          accent="from-violet-300 to-fuchsia-500"
        />
        <PremiumMetricCard
          label={t('adminPurchases.totalRevenue')}
          value={summary?.revenue_total ?? 0}
          icon="€"
          accent="from-amber-300 to-orange-500"
          format="currency"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {listQuery.isLoading ? (
            <Skeleton className="h-64 rounded-[2rem]" />
          ) : listQuery.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
          ) : (
            <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-0 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur">
              <div className="grid grid-cols-[1fr_1fr_100px_160px] gap-2 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase text-ase-muted">
                <span>{t('adminPurchases.colUser')}</span>
                <span>{t('adminPurchases.colItem')}</span>
                <span>{t('adminPurchases.colType')}</span>
                <span>{t('adminPurchases.colDate')}</span>
              </div>
              {(listQuery.data?.items ?? []).map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1fr_100px_160px] gap-2 px-4 py-3 text-sm text-ase-text2"
                >
                  <span className="text-ase-text">{row.user_email}</span>
                  <span className="font-medium text-ase-text">{row.item_title}</span>
                  <span>{row.item_type}</span>
                  <span>{fmtDate(row.created_at)}</span>
                </div>
              ))}
            </Card>
          )}
        </div>

        <PremiumInsightsCard title={t('adminPurchases.insights')}>
          <div className="grid grid-cols-2 gap-3">
            <PremiumOrb label={t('adminPurchases.totalPurchases')} value={summary?.purchases_total ?? 0} tone="violet" />
            <PremiumOrb
              label={t('adminPurchases.totalRevenue')}
              value={(summary?.revenue_total ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              tone="warning"
            />
          </div>
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('adminPurchases.recent')}</div>
            <div className="mt-3 space-y-2">
              {(listQuery.data?.items ?? []).slice(0, 5).map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="truncate text-sm font-medium text-ase-text">{row.item_title}</div>
                  <div className="mt-1 truncate text-xs text-ase-muted">{row.user_email}</div>
                </div>
              ))}
            </div>
          </section>
        </PremiumInsightsCard>
      </div>
    </div>
  )
}
