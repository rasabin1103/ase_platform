import { useState } from 'react'
import type { PublicCatalogPricingPlan, PublicPricingPlan } from '../../types/catalog.types'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'
import { PremiumPricingGrid } from '../public/PremiumPricingGrid'
import { BillingPeriodToggle } from '../public/BillingPeriodToggle'
import type { PublicBillingFilter } from '../public/catalogPricingFilters'

type Plan = PublicPricingPlan | PublicCatalogPricingPlan

type Props = {
  plans: Plan[]
  onCta?: (plan: Plan) => void
  disabled?: boolean
  showCatalogItem?: boolean
}

export function CatalogPublicPricing({ plans, onCta, disabled, showCatalogItem = false }: Props) {
  const { t } = useI18n()
  const [billing, setBilling] = useState<PublicBillingFilter>('monthly')

  if (!plans.length) {
    return (
      <Card className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
        <p className="text-lg font-medium text-ase-text">{t('catalogPricing.public.noPlans')}</p>
      </Card>
    )
  }

  const showToggle = plans.some((p) => p.planType === 'subscription')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
          {t('catalogPricing.public.title')}
        </h2>
        {showToggle ? <BillingPeriodToggle billing={billing} onChange={setBilling} className="sm:items-center" /> : null}
      </div>
      <PremiumPricingGrid
        plans={plans}
        billing={billing}
        onCta={onCta}
        disabled={disabled}
        showCatalogItem={showCatalogItem}
      />
    </div>
  )
}
