import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Heart, PiggyBank, ShoppingBag, Wallet } from 'lucide-react'
import { listConsumerCatalog } from '../../../api/consumerCatalog.api'
import { listPlansCatalog } from '../../../api/plansCatalog.api'
import { Eyebrow } from '../../ui/Eyebrow'
import { Card } from '../../ui/Card'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'
import { useAuth } from '../../../hooks/useAuth'
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
  const { currentUser } = useAuth()

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

  // Only fetched when the user actually has an active plan — used solely to
  // compute the "saved with your plan" stat below.
  const plansQuery = useQuery({
    queryKey: ['plans-catalog', 'savings'],
    queryFn: listPlansCatalog,
    enabled: Boolean(currentUser?.plan_code),
    staleTime: 60_000,
  })

  const purchasedItems = useMemo(() => purchasedQuery.data?.items ?? [], [purchasedQuery.data])
  const favoritesCount = favoritesQuery.data?.total ?? favoritesQuery.data?.items.length ?? 0

  const { chartData, totalSpent, currency, planSavings } = useMemo(() => {
    const byType = new Map<CatalogItemType, number>()
    // "Total invertido" counts what was paid for directly (individual
    // purchases) plus, separately, what the active plan itself costs — an
    // item the user only has access to because their org's plan includes it
    // (isPlanIncluded) was never bought at its own listed price, so summing
    // that in would make a €9.99/mo plan look like it cost the sum of
    // everything it happens to unlock. But someone who both bought an item
    // individually AND pays for a plan (e.g. an €8.99 item plus a €9.99/mo
    // subscription) really has spent 18.98 — the plan's own price has to be
    // added in too, not just skipped, since it's real money that isn't
    // reflected by any single catalog item's price.
    let individualSum = 0
    let planItemsValue = 0
    let curr = 'EUR'
    for (const item of purchasedItems) {
      byType.set(item.type, (byType.get(item.type) ?? 0) + 1)
      const price = Number(item.price)
      if (!Number.isNaN(price)) {
        if (item.isPlanIncluded) {
          planItemsValue += price
        } else {
          individualSum += price
        }
      }
      if (item.currency) curr = item.currency
    }
    const data = (Array.from(byType.entries()) as Array<[CatalogItemType, number]>).map(([type, count]) => ({
      type,
      count,
      name: t(`catalog.groupLabels.${type}`) as string,
      color: TYPE_COLORS[type],
    }))

    const currentPlan = plansQuery.data?.find((p) => p.code === currentUser?.plan_code)
    const planPrice = currentPlan?.price != null ? Number(currentPlan.price) : null
    const validPlanPrice = planPrice != null && !Number.isNaN(planPrice) ? planPrice : 0

    // Savings = what the plan-included items would have cost bought one by
    // one, minus what the plan itself costs — only meaningful (and only
    // shown) once we know the current plan's price.
    const savings = planPrice != null && !Number.isNaN(planPrice) ? planItemsValue - planPrice : null

    return {
      chartData: data,
      totalSpent: individualSum + validPlanPrice,
      currency: curr,
      planSavings: savings,
    }
  }, [purchasedItems, t, plansQuery.data, currentUser?.plan_code])

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

          <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-7', Boolean(planSavings && planSavings > 0) && 'sm:grid-cols-2 lg:grid-cols-4')}>
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
            {planSavings && planSavings > 0 ? (
              <StatTile
                icon={<PiggyBank className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                label={t('independentDashboard.progress.planSavings')}
                value={formatMoney(planSavings, currency)}
                highlight
              />
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}

function StatTile({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <Card
      interactive
      className={cn('flex flex-col gap-3 p-4', highlight && 'border-emerald-400/30 bg-emerald-400/[0.06]')}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border',
          highlight
            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
            : 'border-ase-brand/25 bg-ase-brand/10 text-ase-brand',
        )}
      >
        {icon}
      </span>
      <div>
        <div className={cn('text-lg font-extrabold', highlight ? 'text-emerald-300' : 'text-ase-text')}>{value}</div>
        <div className="text-xs font-medium text-ase-muted">{label}</div>
      </div>
    </Card>
  )
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: { name?: string; count?: number } }>
}) {
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
