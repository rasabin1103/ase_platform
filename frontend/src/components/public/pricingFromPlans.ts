import type { BillingCycle, Plan } from '../../types/plan.types'

export type PricingTier = 'free' | 'pro' | 'business' | 'enterprise'

/** Display order for tiers when they exist in the catalog. */
export const PRICING_TIER_ORDER: PricingTier[] = ['free', 'pro', 'business', 'enterprise']

export function tierFromPlanCode(code: string): PricingTier | null {
  const c = code.trim().toLowerCase()
  if (c === 'free' || c.startsWith('free_')) return 'free'
  if (c.includes('enterprise')) return 'enterprise'
  if (c === 'business' || c.startsWith('business_')) return 'business'
  if (c === 'pro' || c.startsWith('pro_')) return 'pro'
  return null
}

function parseAmount(price: string | null | undefined): number | null {
  if (price === null || price === undefined || price === '') return null
  const n = Number(price)
  return Number.isFinite(n) ? n : null
}

export function isEnterpriseCustom(plan: Plan): boolean {
  if (!plan.code.toLowerCase().includes('enterprise')) return false
  const n = parseAmount(plan.price)
  return n === null || n === 0
}

export function formatPlanPrice(plan: Plan): string {
  if (isEnterpriseCustom(plan)) {
    return '' // caller uses Custom label
  }
  const n = parseAmount(plan.price)
  if (n === null) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: plan.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${plan.price} ${plan.currency}`
  }
}

function pickPlanForTier(
  tier: PricingTier,
  billingPreference: 'monthly' | 'yearly',
  plans: Plan[],
): Plan | null {
  const inTier = plans.filter((p) => tierFromPlanCode(p.code) === tier)
  if (inTier.length === 0) return null

  if (tier === 'free') {
    return (
      inTier.find((p) => p.billing_cycle === 'one_time') ??
      inTier.find((p) => p.billing_cycle === 'monthly') ??
      inTier[0]
    )
  }

  const want: BillingCycle = billingPreference === 'monthly' ? 'monthly' : 'yearly'
  const exact = inTier.find((p) => p.billing_cycle === want)
  if (exact) return exact
  return inTier[0]
}

export type TierViewModel = {
  tier: PricingTier
  plan: Plan
  priceLabel: string
  isCustom: boolean
  suffix: string
}

export function buildTierViewModels(
  activePlans: Plan[],
  billingPreference: 'monthly' | 'yearly',
  suffixMonthly: string,
  suffixYearly: string,
  customLabel: string,
): TierViewModel[] {
  const active = activePlans.filter((p) => p.is_active)
  const out: TierViewModel[] = []

  for (const tier of PRICING_TIER_ORDER) {
    const plan = pickPlanForTier(tier, billingPreference, active)
    if (!plan) continue

    const isCustom = isEnterpriseCustom(plan)
    const priceLabel = isCustom ? customLabel : formatPlanPrice(plan)

    let suffix = ''
    if (!isCustom) {
      if (tier === 'free' && plan.billing_cycle === 'one_time') {
        suffix = ''
      } else if (plan.billing_cycle === 'monthly') {
        suffix = suffixMonthly
      } else if (plan.billing_cycle === 'yearly') {
        suffix = suffixYearly
      }
    }

    out.push({ tier, plan, priceLabel, isCustom, suffix })
  }

  return out
}
