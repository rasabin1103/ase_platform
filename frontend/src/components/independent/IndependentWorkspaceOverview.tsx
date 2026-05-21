import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listConsumerCatalog } from '../../api/consumerCatalog.api'
import { CatalogImage } from '../catalog/CatalogImage'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'
import type { CatalogItem } from '../../types/catalog.types'

function formatMemberSince(createdAt: string, t: (key: string) => string) {
  const start = new Date(createdAt)
  const now = new Date()
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000))
  if (days < 1) return t('independentDashboard.memberSince.today')
  if (days < 30) {
    return t('independentDashboard.memberSince.days').replace('{n}', String(days))
  }
  const months = Math.floor(days / 30)
  if (months < 12) {
    return t('independentDashboard.memberSince.months').replace('{n}', String(months))
  }
  const years = Math.floor(months / 12)
  return t('independentDashboard.memberSince.years').replace('{n}', String(years))
}

function typeLabelKey(type: CatalogItem['type']) {
  const map = {
    product: 'catalog.typeProduct',
    course: 'catalog.typeCourse',
    book: 'catalog.typeBook',
    resource: 'catalog.typeResource',
  } as const
  return map[type]
}

export function IndependentWorkspaceOverview() {
  const { t } = useI18n()
  const { currentUser } = useAuth()

  const purchasesQuery = useQuery({
    queryKey: ['consumer-catalog', 'dashboard-purchases'],
    queryFn: () => listConsumerCatalog({ purchased_only: true, limit: 12 }),
    staleTime: 30_000,
  })

  const purchases = purchasesQuery.data?.items ?? []
  const memberSince = currentUser?.created_at
    ? formatMemberSince(currentUser.created_at, t)
    : '—'

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]">
      <Card className="relative overflow-hidden rounded-[2rem] border-cyan-300/15 bg-gradient-to-br from-ase-surface/70 via-ase-bg2/80 to-ase-bg/90 p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
          {t('independentDashboard.workspace.currentPlan')}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ase-text">{t('independentDashboard.workspace.planName')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ase-text2">
          {t('independentDashboard.workspace.planDescription')}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="info">{t('independentDashboard.workspace.planBadge')}</Badge>
          <Badge variant="default">
            {t('independentDashboard.workspace.purchasesCount').replace('{n}', String(purchases.length))}
          </Badge>
        </div>
        <div className="mt-6 space-y-2 border-t border-white/[0.08] pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-ase-muted">{t('independentDashboard.workspace.memberSince')}</span>
            <span className="font-medium text-ase-text">{memberSince}</span>
          </div>
        </div>
        <Link to="/plans" className="mt-6 inline-block">
          <Button variant="outline" size="sm">
            {t('independentDashboard.workspace.viewPlans')}
          </Button>
        </Link>
      </Card>

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ase-text">
              {t('independentDashboard.workspace.yourProducts')}
            </h2>
            <p className="mt-1 text-sm text-ase-text2">{t('independentDashboard.workspace.yourProductsHint')}</p>
          </div>
          <Link to="/my-purchases" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            {t('independentDashboard.workspace.viewAllPurchases')} →
          </Link>
        </div>

        {purchasesQuery.isLoading ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : purchases.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-8 text-center text-sm text-ase-muted">
            {t('independentDashboard.workspace.noProducts')}
          </p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {purchases.map((item) => (
              <li key={item.slug}>
                <Link
                  to={`/catalog/${item.type}/${item.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-cyan-300/20"
                >
                  <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg">
                    <CatalogImage
                      src={item.imageUrl}
                      type={item.type}
                      variant="card"
                      alt={item.title}
                      cacheKey={item.updatedAt}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ase-text">{item.title}</p>
                    <p className="text-xs text-ase-muted">{t(typeLabelKey(item.type))}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
