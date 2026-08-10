import { describe, expect, it } from 'vitest'
import type { PublicPricingPlan } from '../types/catalog.types'
import {
  formatPrice,
  orderPlansForDisplay,
  planDisplayPrice,
} from './formatPrice'

function plan(
  overrides: Partial<PublicPricingPlan> & Pick<PublicPricingPlan, 'id' | 'name' | 'slug' | 'price'>,
): PublicPricingPlan {
  return {
    planType: 'subscription',
    billingInterval: 'monthly',
    currency: 'EUR',
    isDefault: false,
    includesUpdates: false,
    includesSupport: false,
    supportLevel: 'none',
    features: ['Feature A'],
    limitations: [],
    ...overrides,
  }
}

describe('formatPrice', () => {
  it('formats EUR with trailing symbol', () => {
    expect(formatPrice(79, 'EUR')).toBe('79.00€')
    expect(formatPrice('19', 'EUR')).toBe('19.00€')
  })

  it('formats USD with leading symbol', () => {
    expect(formatPrice(79, 'USD')).toBe('$79.00')
  })
})

describe('orderPlansForDisplay', () => {
  it('sorts plans cheapest to most expensive by monthly price', () => {
    const ordered = orderPlansForDisplay([
      plan({ id: 3, name: 'Enterprise', slug: 'enterprise', price: '199', monthlyPrice: '199', orderIndex: 3 }),
      plan({ id: 1, name: 'Starter', slug: 'starter', price: '19', monthlyPrice: '19', orderIndex: 1 }),
      plan({ id: 2, name: 'Professional', slug: 'pro', price: '79', monthlyPrice: '79', orderIndex: 2, isPopular: true }),
    ])
    expect(ordered.map((p) => p.name)).toEqual(['Starter', 'Professional', 'Enterprise'])
  })

  it('places popular plan in the center when three tiers exist', () => {
    const ordered = orderPlansForDisplay([
      plan({ id: 1, name: 'Starter', slug: 'starter', price: '19', monthlyPrice: '19' }),
      plan({ id: 2, name: 'Professional', slug: 'pro', price: '79', monthlyPrice: '79', isPopular: true }),
      plan({ id: 3, name: 'Enterprise', slug: 'enterprise', price: '199', monthlyPrice: '199' }),
    ])
    expect(ordered[1]?.isPopular).toBe(true)
    expect(ordered.map((p) => p.name)).toEqual(['Starter', 'Professional', 'Enterprise'])
  })
})

describe('planDisplayPrice', () => {
  it('uses annual price and savings when yearly billing selected', () => {
    const pro = plan({
      id: 2,
      name: 'Professional',
      slug: 'pro',
      price: '79',
      monthlyPrice: '79',
      annualPrice: '853.20',
      formattedAnnualPrice: '853.20€',
      formattedMonthlyPrice: '79.00€',
      annualSavingsAmount: '94.80',
    })
    const yearly = planDisplayPrice(pro, 'yearly')
    expect(yearly.amount).toBe('853.20€')
    expect(yearly.periodLabel).toBe('year')
    expect(yearly.savings).toBe('94.80€')
  })

  it('uses monthly price when monthly billing selected', () => {
    const pro = plan({
      id: 2,
      name: 'Professional',
      slug: 'pro',
      price: '79',
      monthlyPrice: '79',
      formattedMonthlyPrice: '79.00€',
      annualPrice: '853.20',
    })
    const monthly = planDisplayPrice(pro, 'monthly')
    expect(monthly.amount).toBe('79.00€')
    expect(monthly.periodLabel).toBe('month')
  })
})

describe('annual discount math', () => {
  it('applies 10% discount to annual price', () => {
    const monthly = 79
    const annual = Math.round(monthly * 12 * 0.9 * 100) / 100
    expect(annual).toBe(853.2)
    const savings = Math.round((monthly * 12 - annual) * 100) / 100
    expect(savings).toBe(94.8)
  })
})
