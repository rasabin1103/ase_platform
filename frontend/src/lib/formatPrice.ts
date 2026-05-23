import type { PublicPricingPlan } from '../types/catalog.types'

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
}

export function formatPrice(
  price: string | number | null | undefined,
  currency: string,
  options?: { suffix?: string },
): string {
  if (price == null || price === '') return ''
  const amount = Number(price)
  if (Number.isNaN(amount)) return String(price)
  if (amount === 0) return options?.suffix ? `0${options.suffix}` : '0'

  const code = currency.toUpperCase()
  const symbol = CURRENCY_SYMBOL[code]
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  let out = symbol
    ? code === 'EUR'
      ? `${formatted}${symbol}`
      : `${symbol}${formatted}`
    : new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount)

  if (options?.suffix) out += options.suffix
  return out
}

export function isEnterprisePlan(plan: PublicPricingPlan): boolean {
  return (
    plan.planType === 'request_quote' ||
    plan.supportLevel === 'enterprise' ||
    /enterprise/i.test(plan.slug) ||
    /enterprise/i.test(plan.displayName ?? plan.name)
  )
}

export function orderPlansForDisplay(plans: PublicPricingPlan[]): PublicPricingPlan[] {
  const sorted = [...plans].sort((a, b) => {
    const orderA = a.orderIndex ?? 1_000_000
    const orderB = b.orderIndex ?? 1_000_000
    if (orderA !== orderB) return orderA - orderB
    return Number(a.monthlyPrice ?? a.price) - Number(b.monthlyPrice ?? b.price)
  })

  if (sorted.length < 3) return sorted
  const popularIdx = sorted.findIndex((p) => p.isPopular)
  if (popularIdx === -1) return sorted

  const popular = sorted[popularIdx]
  const rest = sorted.filter((_, i) => i !== popularIdx)
  if (rest.length < 2) return sorted

  return [rest[0], popular, rest[1], ...rest.slice(2)]
}

export function planDisplayPrice(
  plan: PublicPricingPlan,
  billing: 'monthly' | 'yearly',
): { amount: string; periodLabel: 'month' | 'year'; savings?: string } {
  if (billing === 'yearly' && plan.annualPrice != null) {
    return {
      amount: plan.formattedAnnualPrice || formatPrice(plan.annualPrice, plan.currency),
      periodLabel: 'year',
      savings:
        plan.annualSavingsAmount != null
          ? formatPrice(plan.annualSavingsAmount, plan.currency)
          : undefined,
    }
  }
  const monthly = plan.monthlyPrice ?? plan.price
  return {
    amount: plan.formattedMonthlyPrice || formatPrice(monthly, plan.currency),
    periodLabel: 'month',
  }
}
