import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Heart, ShoppingBag, Wallet } from 'lucide-react'
import { listConsumerCatalog } from '../../../api/consumerCatalog.api'
import { Eyebrow } from '../../ui/Eyebrow'
import { Card } from '../../ui/Card'
import { useI18n } from '../../../i18n'
import type { CatalogItemType } from '../../../types/catalog.types'
import { CATALOG_TYPE_COLORS as TYPE_COLORS } from '../../catalog/catalogTypeColors'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function IndependentProgressPanel() {
  const { t } = useI18n()

  const purchasedQuery = useQuery({
    queryKey: ['consumer-catalog', 'strip', 'purchased-summary'],
    queryFn: () => listConsumerCatalog({ purchased_only: true, limit: 100 }),
    staleTime: 30_000,
  })

  const favoritesQuery = useQuery({
    queryKey: ['consumer-catalog', 'strip', 'favorites-summary'],
    queryFn: () => listConsumerCatalog({ favorites_only: true, limit: 100 }),
    staleTime: 30_000,
  })

  const purchasedItems = purchasedQuery.data?.items ?? []
  const favoritesCount = favoritesQuery.data?.total ?? favoritesQuery.data?.items.length ?? 0

  const { chartData, totalSpent, currency } = useMemo(() => {
    const byType = new Map<CatalogItemType, number>()
    let sum = 0
    let curr = 'EUR'
    for (const item of purchasedItems) {
      byType.set(item.type, (byType.get(item.type) ?? 0) + 1)
      const price = Number(item.price)
      if (!Number.isNaN(price)) sum += price
      if (item.currency) curr = item.currency
    }
    const data = (Array.from(byType.entries()) as Array<[CatalogItemType, number]>).map(([type, count]) => ({
      type,
      count,
      name: t(`catalog.groupLabels.${type}`) as string,
      color: TYPE_COLORS[type],
    }))
    return { chartData: data, totalSpent: sum, currency: curr }
  }, [purchasedItems, t])

  const isLoading = purchasedQuery.isLoading || favoritesQuery.isLoading
  const hasPurchases = purchasedItems.length > 0

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-8">
      <Eyebrow>{t('independentDashboard.progress.badge')}</Eyebrow>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
        {t('independentDashboard.progress.title')}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ase-text2 sm:text-base">{t('independentDashboard.progress.subtitle')}</p>

      {isLoading ? (
        <div className="mt-8 h-[220px] animate-pulse rounded-2xl bg-white/[0.03]" />
      ) : !hasPurchases ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center">
          <p className="text-sm font-semibold text-ase-text">{t('independentDashboard.progress.emptyTitle')}</p>
          <p className="mt-1.5 text-sm text-ase-text2">{t('independentDashboard.progress.emptyBody')}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="relative h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<DonutTooltip />} />
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.type} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-ase-text">{purchasedItems.length}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                  {t('independentDashboard.progress.itemsLabel')}
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 lg:justify-start">
              {chartData.map((entry) => (
                <div key={entry.type} className="flex items-center gap-1.5 text-xs text-ase-text2">
                  <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                  {entry.name} ({entry.count})
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-7">
            <StatTile
              icon={<Wallet className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              label={t('independentDashboard.progress.totalSpent')}
              value={formatMoney(totalSpent, currency)}
            />
            <StatTile
              icon={<ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              label={t('independentDashboard.progress.itemsOwned')}
              value={String(purchasedItems.length)}
            />
            <StatTile
              icon={<Heart className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              label={t('independentDashboard.progress.favoritesSaved')}
              value={String(favoritesCount)}
            />
          </div>
        </div>
      )}
    </section>
  )
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card interactive className="flex flex-col gap-3 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
        {icon}
      </span>
      <div>
        <div className="text-lg font-extrabold text-ase-text">{value}</div>
        <div className="text-xs font-medium text-ase-muted">{label}</div>
      </div>
    </Card>
  )
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-xl border border-white/[0.12] bg-ase-bg2 px-3 py-2 text-xs text-ase-text2 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{p.name}</div>
      <div className="mt-1 text-sm font-extrabold text-ase-text">{p.count}</div>
    </div>
  )
}
