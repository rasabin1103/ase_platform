import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { listConsumerCatalog } from '../../../api/consumerCatalog.api'
import { Eyebrow } from '../../ui/Eyebrow'
import { Card } from '../../ui/Card'
import { useI18n } from '../../../i18n'
import type { CatalogItem, CatalogItemType } from '../../../types/catalog.types'
import { CATALOG_TYPE_COLORS, CATALOG_TYPE_ORDER } from '../../catalog/catalogTypeColors'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${amount.toFixed(0)} ${currency}`
  }
}

type BarDatum = { type: CatalogItemType; name: string; value: number }

/**
 * Two small real-data bar charts: total spend per catalog type and number of
 * favorited items per catalog type. Both are simple counts/sums over the
 * user's own purchases and favorites — no synthetic or estimated data.
 */
export function CategoryBarCharts() {
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

  const purchasedItems = useMemo(() => purchasedQuery.data?.items ?? [], [purchasedQuery.data])
  const favoriteItems = useMemo(() => favoritesQuery.data?.items ?? [], [favoritesQuery.data])

  const { spendData, currency } = useMemo(() => {
    const byType = new Map<CatalogItemType, number>()
    let curr = 'EUR'
    for (const item of purchasedItems as CatalogItem[]) {
      const price = Number(item.price)
      if (!Number.isNaN(price)) byType.set(item.type, (byType.get(item.type) ?? 0) + price)
      if (item.currency) curr = item.currency
    }
    const data: BarDatum[] = CATALOG_TYPE_ORDER.map((type) => ({
      type,
      name: t(`catalog.groupLabels.${type}`) as string,
      value: byType.get(type) ?? 0,
    }))
    return { spendData: data, currency: curr }
  }, [purchasedItems, t])

  const savedData = useMemo(() => {
    const byType = new Map<CatalogItemType, number>()
    for (const item of favoriteItems as CatalogItem[]) {
      byType.set(item.type, (byType.get(item.type) ?? 0) + 1)
    }
    const data: BarDatum[] = CATALOG_TYPE_ORDER.map((type) => ({
      type,
      name: t(`catalog.groupLabels.${type}`) as string,
      value: byType.get(type) ?? 0,
    }))
    return data
  }, [favoriteItems, t])

  const isLoading = purchasedQuery.isLoading || favoritesQuery.isLoading
  const hasSpend = spendData.some((d) => d.value > 0)
  const hasSaved = savedData.some((d) => d.value > 0)

  if (!isLoading && !hasSpend && !hasSaved) return null

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-8">
      <Eyebrow>{t('independentDashboard.categoryCharts.badge')}</Eyebrow>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
        {t('independentDashboard.categoryCharts.title')}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ase-text2 sm:text-base">
        {t('independentDashboard.categoryCharts.subtitle')}
      </p>

      {isLoading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="h-[220px] animate-pulse rounded-2xl bg-white/[0.03]" />
          <div className="h-[220px] animate-pulse rounded-2xl bg-white/[0.03]" />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <BarPanel
            title={t('independentDashboard.categoryCharts.spendTitle')}
            data={spendData}
            hasData={hasSpend}
            emptyLabel={t('independentDashboard.categoryCharts.spendEmpty')}
            valueFormatter={(v) => formatMoney(v, currency)}
          />
          <BarPanel
            title={t('independentDashboard.categoryCharts.savedTitle')}
            data={savedData}
            hasData={hasSaved}
            emptyLabel={t('independentDashboard.categoryCharts.savedEmpty')}
            valueFormatter={(v) => String(v)}
          />
        </div>
      )}
    </section>
  )
}

function BarPanel({
  title,
  data,
  hasData,
  emptyLabel,
  valueFormatter,
}: {
  title: string
  data: BarDatum[]
  hasData: boolean
  emptyLabel: string
  valueFormatter: (value: number) => string
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{title}</h3>
      {!hasData ? (
        <div className="mt-4 flex h-[180px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <p className="text-sm text-ase-muted">{emptyLabel}</p>
        </div>
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
                  const p = payload[0]?.payload as BarDatum | undefined
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
                {data.map((entry) => (
                  <Cell key={entry.type} fill={CATALOG_TYPE_COLORS[entry.type]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
