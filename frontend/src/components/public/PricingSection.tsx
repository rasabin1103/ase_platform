import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listPublicCatalogPricingPlans } from '../../api/publicCatalogPricing.api'
import { PremiumPricingGrid } from './PremiumPricingGrid'
import { BillingPeriodToggle } from './BillingPeriodToggle'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import type { PublicBillingFilter } from './catalogPricingFilters'

export function PricingSection({ compact }: { compact?: boolean }) {
  const { t } = useI18n()
  const [billing, setBilling] = useState<PublicBillingFilter>('monthly')

  const plansQuery = useQuery({
    queryKey: ['public', 'catalog-pricing-plans'],
    queryFn: () => listPublicCatalogPricingPlans({ limit: 200 }),
    staleTime: 60_000,
  })

  const plans = plansQuery.data?.items ?? []

  const showBillingToggle = useMemo(
    () =>
      plans.some(
        (p) =>
          p.planType === 'subscription' &&
          (p.monthlyPrice != null || p.annualPrice != null || p.billingInterval !== 'none'),
      ),
    [plans],
  )

  return (
    <section className={cn('relative border-t border-white/5', compact ? 'py-0' : '')}>
      {!compact ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.08),transparent)]" />
      ) : null}
      <div className={cn('relative mx-auto w-full max-w-[1440px] px-6 sm:px-8', compact ? 'py-16' : 'py-28')}>
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
            <BillingPeriodToggle billing={billing} onChange={setBilling} disabled={plansQuery.isLoading} />
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
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : null}

        {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-sm text-ase-text2">{t('pricing.empty')}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => plansQuery.refetch()}>
              {t('pricing.retry')}
            </Button>
          </div>
        ) : null}

        {!plansQuery.isLoading && !plansQuery.isError && plans.length > 0 ? (
          <div className="mt-12">
            <PremiumPricingGrid
              plans={plans}
              billing={billing}
              showCatalogItem
              onCta={(plan) => {
                const target =
                  plan.planType === 'request_quote' || plan.planType === 'free' ? '/contact' : '/register'
                window.location.assign(target)
              }}
            />
            <p className="mt-10 text-center text-sm text-ase-muted">{t('pricing.trialFooter')}</p>
            <p className="mt-4 text-center text-sm text-ase-muted">
              <Link to="/login" className="text-cyan-300 transition hover:underline">
                {t('cta.clientLogin')}
              </Link>
              {' · '}
              <Link to="/contact" className="text-cyan-300 transition hover:underline">
                {t('nav.contact')}
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
