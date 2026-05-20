import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listPublicCatalogPricingPlans } from '../../api/publicCatalogPricing.api'
import { CatalogPublicPricing } from '../catalog/CatalogPublicPricing'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { filterPlansForBilling, type PublicBillingFilter } from './catalogPricingFilters'

export function PricingSection({ compact }: { compact?: boolean }) {
  const { t } = useI18n()
  const [billing, setBilling] = useState<PublicBillingFilter>('monthly')

  const plansQuery = useQuery({
    queryKey: ['public', 'catalog-pricing-plans'],
    queryFn: () => listPublicCatalogPricingPlans({ limit: 200 }),
    staleTime: 60_000,
  })

  const visiblePlans = useMemo(() => {
    const items = plansQuery.data?.items ?? []
    return filterPlansForBilling(items, billing)
  }, [plansQuery.data?.items, billing])

  const showBillingToggle = useMemo(
    () => (plansQuery.data?.items ?? []).some((p) => p.planType === 'subscription'),
    [plansQuery.data?.items],
  )

  return (
    <section className={cn('relative border-t border-white/5', compact ? 'py-0' : '')}>
      <div className={cn('mx-auto w-full max-w-[1440px] px-6 sm:px-8', compact ? 'py-16' : 'py-28')}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="info" className="w-fit">
              {t('pricing.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('pricing.title')}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-ase-text2 sm:text-lg">
              {t('pricing.subtitle')}
            </p>
          </div>

          {showBillingToggle ? (
            <div className="inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                disabled={plansQuery.isLoading}
                className={cn(
                  'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none',
                  billing === 'monthly' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
                  plansQuery.isLoading && 'pointer-events-none opacity-60',
                )}
              >
                {t('pricing.monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBilling('yearly')}
                disabled={plansQuery.isLoading}
                className={cn(
                  'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none',
                  billing === 'yearly' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
                  plansQuery.isLoading && 'pointer-events-none opacity-60',
                )}
              >
                {t('pricing.yearly')}
                <span className="ml-2 hidden rounded-full border border-ase-primary/30 bg-ase-primary/10 px-2 py-0.5 text-xs text-ase-primary sm:inline">
                  {t('pricing.save')}
                </span>
              </button>
            </div>
          ) : null}
        </div>

        {plansQuery.isError ? (
          <div className="mt-12 rounded-3xl border border-ase-error/25 bg-ase-error/5 px-6 py-8 text-center">
            <p className="text-sm text-ase-text2">{t('pricing.loadError')}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => plansQuery.refetch()}>
              {t('pricing.retry')}
            </Button>
          </div>
        ) : null}

        {plansQuery.isLoading ? (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : null}

        {!plansQuery.isLoading && !plansQuery.isError && visiblePlans.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-sm text-ase-text2">{t('pricing.empty')}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => plansQuery.refetch()}>
              {t('pricing.retry')}
            </Button>
          </div>
        ) : null}

        {!plansQuery.isLoading && !plansQuery.isError && visiblePlans.length > 0 ? (
          <div className="mt-12">
            <CatalogPublicPricing
              plans={visiblePlans}
              showCatalogItem
              onCta={(plan) => {
                const target =
                  plan.planType === 'request_quote' || plan.planType === 'free' ? '/contact' : '/register'
                window.location.assign(target)
              }}
            />
            <p className="mt-8 text-center text-sm text-ase-muted">
              <Link to="/login" className="text-cyan-300 hover:underline">
                {t('cta.clientLogin')}
              </Link>
              {' · '}
              <Link to="/contact" className="text-cyan-300 hover:underline">
                {t('nav.contact')}
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
