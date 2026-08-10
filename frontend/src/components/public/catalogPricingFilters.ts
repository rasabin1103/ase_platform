import type { PublicCatalogPricingPlan } from '../../types/catalog.types'
import type { PricingBillingInterval } from '../../api/pricingAdmin.api'

export type PublicBillingFilter = 'monthly' | 'yearly'

/** Non-subscription plans always visible; subscriptions match the billing toggle. */
export function filterPlansForBilling(
  plans: PublicCatalogPricingPlan[],
  billing: PublicBillingFilter,
): PublicCatalogPricingPlan[] {
  return plans.filter((plan) => {
    if (plan.planType !== 'subscription') return true
    const interval = plan.billingInterval as PricingBillingInterval
    if (billing === 'monthly') {
      return interval === 'monthly' || interval === 'quarterly'
    }
    return interval === 'yearly'
  })
}
