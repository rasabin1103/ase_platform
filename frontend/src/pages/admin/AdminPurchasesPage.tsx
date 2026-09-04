import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Info } from 'lucide-react'
import {
  getAdminPurchasesSummary,
  listAdminPurchases,
  listAdminSubscriptions,
  type AdminPurchase,
  type AdminSubscription,
} from '../../api/adminDashboard.api'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import {
  PremiumHero,
  PremiumInsightsCard,
  PremiumMetricCard,
  PremiumOrb,
} from '../../components/admin/premium/PremiumAdminUi'
import { cn } from '../../components/ui/cn'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'
import { downloadCsv } from '../../utils/csv'

const LIMIT = 50

type PurchasesTab = 'items' | 'plans'
const TABS: { key: PurchasesTab; labelKey: string }[] = [
  { key: 'items', labelKey: 'adminPurchases.tabs.items' },
  { key: 'plans', labelKey: 'adminPurchases.tabs.plans' },
]

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function fmtMoney(value: number | null, currency: string) {
  if (value == null) return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export function AdminPurchasesPage() {
  const { t, language } = useI18n()
  const { currentUser } = useAuth()
  const [tab, setTab] = useState<PurchasesTab>('items')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [itemsOffset, setItemsOffset] = useState(0)
  const [plansOffset, setPlansOffset] = useState(0)

  const summaryQuery = useQuery({ queryKey: ['admin-purchases-summary'], queryFn: getAdminPurchasesSummary })

  const itemsFilters = useMemo(
    () => ({
      limit: LIMIT,
      offset: itemsOffset,
      search: search.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [search, dateFrom, dateTo, itemsOffset],
  )
  const plansFilters = useMemo(
    () => ({
      limit: LIMIT,
      offset: plansOffset,
      search: search.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [search, dateFrom, dateTo, plansOffset],
  )

  const itemsQuery = useQuery({ queryKey: ['admin-purchases', itemsFilters], queryFn: () => listAdminPurchases(itemsFilters) })
  // Only fetched once the "Planes" tab is actually opened — no reason to
  // pay for a second list query on every visit to this page when most
  // admin traffic is probably still checking individual purchases.
  const plansQuery = useQuery({
    queryKey: ['admin-subscriptions', plansFilters],
    queryFn: () => listAdminSubscriptions(plansFilters),
    enabled: tab === 'plans',
  })

  const summary = summaryQuery.data
  const items = itemsQuery.data?.items ?? []
  const plans = plansQuery.data?.items ?? []

  const hasFilters = Boolean(search || dateFrom || dateTo)
  const clearFilters = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setItemsOffset(0)
    setPlansOffset(0)
  }

  const sourceLabel = (source: string) => (t(`adminPurchases.sourceLabels.${source}`) as string) ?? source
  const statusLabel = (status: string) => (t(`adminPurchases.statusLabels.${status}`) as string) ?? status

  const handleExportItems = () => {
    downloadCsv(
      'purchases',
      items.map((row) => ({
        id: row.id,
        user_email: row.user_email,
        item_title: row.item_title,
        item_type: row.item_type,
        source: row.source,
        created_at: row.created_at,
      })),
    )
  }

  const handleExportItemsExcel = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { downloadBrandedExcel } = await import('../../utils/exportExcel')
    downloadBrandedExcel({
      filename: `ase-compras-${today}.xlsx`,
      sheetName: t('adminPurchases.title'),
      title: t('adminPurchases.title'),
      generatedBy: currentUser?.email,
      lang: language === 'en' ? 'en' : 'es',
      rows: items.map((row) => ({
        [t('adminPurchases.colUser')]: row.user_email,
        [t('adminPurchases.colItem')]: row.item_title,
        [t('adminPurchases.colType')]: row.item_type,
        [t('adminPurchases.colSource')]: sourceLabel(row.source),
        [t('adminPurchases.colDate')]: fmtDate(row.created_at),
      })),
    })
  }

  const handleExportPlans = () => {
    downloadCsv(
      'subscriptions',
      plans.map((row) => ({
        id: row.id,
        organization_name: row.organization_name,
        owner_email: row.owner_email,
        plan_name: row.plan_name,
        plan_price: row.plan_price,
        status: row.status,
        tenure_months: row.tenure_months,
        starts_at: row.starts_at,
      })),
    )
  }

  const handleExportPlansExcel = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { downloadBrandedExcel } = await import('../../utils/exportExcel')
    downloadBrandedExcel({
      filename: `ase-planes-${today}.xlsx`,
      sheetName: t('adminPurchases.tabs.plans'),
      title: t('adminPurchases.tabs.plans'),
      generatedBy: currentUser?.email,
      lang: language === 'en' ? 'en' : 'es',
      rows: plans.map((row) => ({
        [t('adminPurchases.colOrg')]: row.organization_name,
        [t('adminPurchases.colOwner')]: row.owner_email,
        [t('adminPurchases.colPlan')]: row.plan_name,
        [t('adminPurchases.colPrice')]: fmtMoney(row.plan_price, row.plan_currency),
        [t('adminPurchases.colStatus')]: statusLabel(row.status),
        [t('adminPurchases.colTenure')]: row.tenure_months,
        [t('adminPurchases.colStarted')]: fmtDate(row.starts_at),
      })),
    })
  }

  const isItemsTab = tab === 'items'

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

      <div className="grid gap-4 md:grid-cols-3">
        <PremiumMetricCard
          label={t('adminPurchases.totalPurchases')}
          value={summary?.purchases_total ?? 0}
          icon="🛒"
          accent="from-violet-300 to-fuchsia-500"
        />
        <PremiumMetricCard
          label={t('adminPurchases.totalPlanSubscriptions')}
          value={summary?.plan_subscriptions_total ?? 0}
          icon="📋"
          accent="from-cyan-300 to-blue-500"
        />
        <PremiumMetricCard
          label={t('adminPurchases.totalRevenue')}
          value={summary?.revenue_total ?? 0}
          icon="€"
          accent="from-amber-300 to-orange-500"
          format="currency"
        />
      </div>

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-semibold transition',
                tab === item.key
                  ? 'border-amber-300/40 bg-amber-400/15 text-amber-100'
                  : 'border-white/10 bg-white/[0.03] text-ase-muted hover:text-ase-text',
              )}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <Input
                  placeholder={t('adminPurchases.filters.search')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setItemsOffset(0)
                    setPlansOffset(0)
                  }}
                />
              </div>
              <Input
                type="date"
                aria-label={t('adminPurchases.filters.dateFrom')}
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setItemsOffset(0)
                  setPlansOffset(0)
                }}
              />
              <Input
                type="date"
                aria-label={t('adminPurchases.filters.dateTo')}
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setItemsOffset(0)
                  setPlansOffset(0)
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilters}>
                {t('adminPurchases.filters.clear')}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={isItemsTab ? handleExportItems : handleExportPlans}
                  disabled={isItemsTab ? items.length === 0 : plans.length === 0}
                >
                  <Download className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                  {t('private.common.exportCsv')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={isItemsTab ? handleExportItemsExcel : handleExportPlansExcel}
                  disabled={isItemsTab ? items.length === 0 : plans.length === 0}
                >
                  <FileSpreadsheet className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                  {t('private.common.exportExcel')}
                </Button>
              </div>
            </div>
          </Card>

          {isItemsTab ? (
            itemsQuery.isLoading ? (
              <Skeleton className="h-64 rounded-[2rem]" />
            ) : itemsQuery.isError ? (
              <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
            ) : (
              <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-0 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur">
                <div className="grid grid-cols-[1fr_1fr_90px_100px_150px] gap-2 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase text-ase-muted">
                  <span>{t('adminPurchases.colUser')}</span>
                  <span>{t('adminPurchases.colItem')}</span>
                  <span>{t('adminPurchases.colType')}</span>
                  <span>{t('adminPurchases.colSource')}</span>
                  <span>{t('adminPurchases.colDate')}</span>
                </div>
                {items.length === 0 ? (
                  <div className="px-4 py-10">
                    <EmptyState title={t('adminPurchases.emptyItems')} />
                  </div>
                ) : (
                  items.map((row: AdminPurchase) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_1fr_90px_100px_150px] gap-2 px-4 py-3 text-sm text-ase-text2"
                    >
                      <span className="truncate text-ase-text">{row.user_email}</span>
                      <span className="truncate font-medium text-ase-text">{row.item_title}</span>
                      <span>{row.item_type}</span>
                      <span>
                        <Badge variant={row.source === 'stripe_checkout' ? 'success' : 'default'}>
                          {sourceLabel(row.source)}
                        </Badge>
                      </span>
                      <span>{fmtDate(row.created_at)}</span>
                    </div>
                  ))
                )}
                <Pagination limit={LIMIT} offset={itemsOffset} total={itemsQuery.data?.total ?? 0} onOffsetChange={setItemsOffset} />
              </Card>
            )
          ) : plansQuery.isLoading ? (
            <Skeleton className="h-64 rounded-[2rem]" />
          ) : plansQuery.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
          ) : (
            <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-0 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur">
              <div className="grid grid-cols-[1fr_1fr_110px_90px_110px_130px] gap-2 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase text-ase-muted">
                <span>{t('adminPurchases.colOrg')}</span>
                <span>{t('adminPurchases.colOwner')}</span>
                <span>{t('adminPurchases.colPlan')}</span>
                <span>{t('adminPurchases.colStatus')}</span>
                <span>{t('adminPurchases.colTenure')}</span>
                <span>{t('adminPurchases.colStarted')}</span>
              </div>
              {plans.length === 0 ? (
                <div className="px-4 py-10">
                  <EmptyState title={t('adminPurchases.emptyPlans')} />
                </div>
              ) : (
                plans.map((row: AdminSubscription) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_1fr_110px_90px_110px_130px] gap-2 px-4 py-3 text-sm text-ase-text2"
                  >
                    <span className="truncate text-ase-text">{row.organization_name}</span>
                    <span className="truncate">{row.owner_email}</span>
                    <span className="flex min-w-0 items-center gap-1.5 truncate font-medium text-ase-text">
                      <span className="truncate">{row.plan_name}</span>
                      <span
                        className="inline-flex shrink-0"
                        role="img"
                        aria-label={`${t('adminPurchases.colPrice')}: ${fmtMoney(row.plan_price, row.plan_currency)}`}
                        title={`${t('adminPurchases.colPrice')}: ${fmtMoney(row.plan_price, row.plan_currency)}`}
                      >
                        <Info className="h-3.5 w-3.5 text-ase-muted" strokeWidth={1.75} />
                      </span>
                    </span>
                    <span>
                      <Badge variant={row.status === 'active' ? 'success' : row.status === 'trialing' ? 'info' : 'warning'}>
                        {statusLabel(row.status)}
                      </Badge>
                    </span>
                    <span className="tabular-nums">
                      {row.tenure_months} {t('adminPurchases.months')}
                    </span>
                    <span>{fmtDate(row.starts_at)}</span>
                  </div>
                ))
              )}
              <Pagination limit={LIMIT} offset={plansOffset} total={plansQuery.data?.total ?? 0} onOffsetChange={setPlansOffset} />
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
              {items.slice(0, 5).map((row) => (
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
