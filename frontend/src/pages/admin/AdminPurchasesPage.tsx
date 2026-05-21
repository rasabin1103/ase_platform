import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminPurchasesSummary, listAdminPurchases, type AdminPurchase } from '../../api/adminDashboard.api'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'
import {
  PremiumHero,
  PremiumInsightsCard,
  PremiumMetricCard,
  PremiumOrb,
} from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { Button } from '../../components/ui/Button'

type ViewMode = 'table' | 'cards' | 'by_user' | 'by_type' | 'by_item'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function fmtMoney(amount: string | number, currency: string) {
  const n = Number(amount)
  if (!n) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

type GroupRow = {
  key: string
  label: string
  purchase_count: number
  revenue_total: number
  currency: string
}

function buildGroups(items: AdminPurchase[], mode: 'by_user' | 'by_type' | 'by_item'): GroupRow[] {
  const map = new Map<string, GroupRow>()
  for (const row of items) {
    const key =
      mode === 'by_user'
        ? row.user_email
        : mode === 'by_type'
          ? row.item_type
          : `${row.catalog_item_id}:${row.item_title}`
    const label =
      mode === 'by_user' ? row.user_email : mode === 'by_type' ? row.item_type : row.item_title
    const prev = map.get(key)
    const amount = Number(row.amount) || 0
    if (prev) {
      prev.purchase_count += 1
      prev.revenue_total += amount
    } else {
      map.set(key, {
        key,
        label,
        purchase_count: 1,
        revenue_total: amount,
        currency: row.currency,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.revenue_total - a.revenue_total)
}

export function AdminPurchasesPage() {
  const { t } = useI18n()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [search, setSearch] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const summaryQuery = useQuery({ queryKey: ['admin-purchases-summary'], queryFn: getAdminPurchasesSummary })
  const listQuery = useQuery({
    queryKey: ['admin-purchases', search, userEmail, typeFilter],
    queryFn: () =>
      listAdminPurchases({
        limit: 500,
        search: search.trim() || undefined,
        user_email: userEmail.trim() || undefined,
        item_type: typeFilter || undefined,
      }),
  })

  const summary = summaryQuery.data
  const items = listQuery.data?.items ?? []
  const groups = useMemo(() => {
    if (viewMode === 'by_user') return buildGroups(items, 'by_user')
    if (viewMode === 'by_type') return buildGroups(items, 'by_type')
    if (viewMode === 'by_item') return buildGroups(items, 'by_item')
    return []
  }, [items, viewMode])

  const filteredRevenue = useMemo(
    () => items.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [items],
  )

  const VIEW_TABS: { key: ViewMode; labelKey: string }[] = [
    { key: 'table', labelKey: 'adminPurchases.viewTable' },
    { key: 'cards', labelKey: 'adminPurchases.viewCards' },
    { key: 'by_user', labelKey: 'adminPurchases.viewByUser' },
    { key: 'by_type', labelKey: 'adminPurchases.viewByType' },
    { key: 'by_item', labelKey: 'adminPurchases.viewByItem' },
  ]

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
          value={listQuery.data?.total ?? summary?.purchases_total ?? 0}
          icon="🛒"
          accent="from-violet-300 to-fuchsia-500"
        />
        <PremiumMetricCard
          label={t('adminPurchases.totalRevenue')}
          value={filteredRevenue || summary?.revenue_total || 0}
          icon="€"
          accent="from-amber-300 to-orange-500"
          format="currency"
        />
        <PremiumMetricCard
          label={t('adminPurchases.colUser')}
          value={new Set(items.map((i) => i.user_email)).size}
          icon="◉"
          accent="from-cyan-300 to-blue-500"
        />
      </div>

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-5">
        <div className="flex flex-wrap gap-2">
          {VIEW_TABS.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={viewMode === tab.key ? 'primary' : 'outline'}
              onClick={() => setViewMode(tab.key)}
            >
              {t(tab.labelKey)}
            </Button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input
            className="h-11 rounded-xl border-white/10 bg-ase-bg2/50 md:col-span-1"
            placeholder={t('adminPurchases.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
            placeholder={t('adminPurchases.filterUserEmail')}
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <Select
            className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">{t('adminPurchases.filterTypeAll')}</option>
            <option value="product">product</option>
            <option value="course">course</option>
            <option value="book">book</option>
            <option value="resource">resource</option>
          </Select>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {listQuery.isLoading ? (
            <Skeleton className="h-64 rounded-[2rem]" />
          ) : listQuery.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
          ) : items.length === 0 ? (
            <EmptyState title={t('adminPurchases.noResults')} description={t('adminPurchases.subtitle')} />
          ) : viewMode === 'table' ? (
            <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-0 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur">
              <div className="grid grid-cols-[1fr_1fr_80px_100px_160px] gap-2 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase text-ase-muted">
                <span>{t('adminPurchases.colUser')}</span>
                <span>{t('adminPurchases.colItem')}</span>
                <span>{t('adminPurchases.colType')}</span>
                <span>{t('adminPurchases.colAmount')}</span>
                <span>{t('adminPurchases.colDate')}</span>
              </div>
              {items.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1fr_80px_100px_160px] gap-2 px-4 py-3 text-sm text-ase-text2"
                >
                  <span className="truncate text-ase-text">{row.user_email}</span>
                  <span className="truncate font-medium text-ase-text">{row.item_title}</span>
                  <span>{row.item_type}</span>
                  <span className="font-semibold text-ase-text">{fmtMoney(row.amount, row.currency)}</span>
                  <span>{fmtDate(row.created_at)}</span>
                </div>
              ))}
            </Card>
          ) : viewMode === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((row) => (
                <Card key={row.id} className="rounded-2xl border-white/[0.08] bg-ase-surface/60 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="info">{row.item_type}</Badge>
                    <span className="text-lg font-bold text-ase-text">{fmtMoney(row.amount, row.currency)}</span>
                  </div>
                  <h3 className="mt-3 font-semibold text-ase-text">{row.item_title}</h3>
                  <p className="mt-1 text-sm text-ase-muted">{row.user_email}</p>
                  <p className="mt-3 text-xs text-ase-muted">{fmtDate(row.created_at)}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {groups.map((g) => (
                <Card
                  key={g.key}
                  className="rounded-2xl border-violet-300/15 bg-gradient-to-br from-ase-surface/70 to-ase-bg2/50 p-5"
                >
                  <h3 className="truncate text-lg font-semibold text-ase-text">{g.label}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase text-ase-muted">{t('adminPurchases.groupPurchases')}</p>
                      <p className="mt-1 text-xl font-bold text-ase-text">{g.purchase_count}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ase-muted">{t('adminPurchases.groupRevenue')}</p>
                      <p className="mt-1 text-xl font-bold text-amber-200/95">
                        {fmtMoney(g.revenue_total, g.currency)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <PremiumInsightsCard title={t('adminPurchases.insights')}>
          <div className="grid grid-cols-2 gap-3">
            <PremiumOrb label={t('adminPurchases.totalPurchases')} value={items.length} tone="violet" />
            <PremiumOrb
              label={t('adminPurchases.totalRevenue')}
              value={filteredRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              tone="warning"
            />
          </div>
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('adminPurchases.recent')}</div>
            <div className="mt-3 space-y-2">
              {items.slice(0, 5).map((row) => (
                <div key={row.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate text-sm font-medium text-ase-text">{row.item_title}</div>
                    <span className="shrink-0 text-xs font-semibold text-amber-200/90">
                      {fmtMoney(row.amount, row.currency)}
                    </span>
                  </div>
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
