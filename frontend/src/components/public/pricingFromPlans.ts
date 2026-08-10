import type { BillingCycle, Plan } from '../../types/plan.types'

export type PricingTier = 'free' | 'pro' | 'business' | 'enterprise'

/** Display order for tiers when they exist in the catalog. */
export const PRICING_TIER_ORDER: PricingTier[] = ['free', 'pro', 'business', 'enterprise']

export function tierFromPlanCode(code: string): PricingTier | null {
  const c = code.trim().toLowerCase()
  if (c === 'free' || c.startsWith('free_') || c === 'starter' || c.startsWith('starter_')) return 'free'
  if (c.includes('enterprise')) return 'enterprise'
  if (c === 'business' || c.startsWith('business_')) return 'business'
  if (c === 'pro' || c.startsWith('pro_') || c === 'professional' || c.includes('professional')) return 'pro'
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

/** All active catalog plans for a billing tab, sorted by display_order. */
export function catalogPlansForBilling(plans: Plan[], billingPreference: 'monthly' | 'yearly'): Plan[] {
  const active = [...plans].filter((p) => p.is_active)
  const dualPriced = active.some((p) => p.annual_price != null && p.annual_price !== '')

  if (dualPriced) {
    return active.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
  }

  const want = billingPreference === 'monthly' ? 'monthly' : 'yearly'

  let matched = active.filter((p) => p.billing_cycle === want)
  if (matched.length === 0 && want === 'yearly') {
    matched = active.filter((p) => p.billing_cycle === 'monthly')
  }
  if (matched.length === 0) {
    matched = active
  }

  return matched.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
}

export function planPriceView(
  plan: Plan,
  customLabel: string,
  suffixMonthly: string,
  suffixYearly: string,
  billing: 'monthly' | 'yearly' = 'monthly',
): { priceLabel: string; suffix: string } {
  const useAnnual = billing === 'yearly' && plan.annual_price != null && plan.annual_price !== ''
  const pricedPlan: Plan = useAnnual
    ? { ...plan, price: plan.annual_price ?? plan.price, billing_cycle: 'yearly' }
    : plan

  const isCustom = isEnterpriseCustom(pricedPlan)
  const priceLabel = isCustom ? customLabel : formatPlanPrice(pricedPlan)
  let suffix = ''
  if (!isCustom) {
    if (pricedPlan.billing_cycle === 'monthly') suffix = suffixMonthly
    else if (pricedPlan.billing_cycle === 'yearly') suffix = suffixYearly
  }
  return { priceLabel, suffix }
}

export function planFeatureLines(plan: Plan): string[] {
  const rows = (plan.features ?? []).filter((f) => f.is_active !== false)
  return [...rows].sort((a, b) => a.display_order - b.display_order).map((f) => f.text)
}
