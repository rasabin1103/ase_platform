import { describe, expect, it } from 'vitest'
import { calculateRecommendedPrice, matchDimensionLevelForQuantity } from './pricingEngine'
import type { PricingDimensionLevel } from '../api/pricingAdmin.api'

let nextId = 1
function level(overrides: Partial<PricingDimensionLevel> = {}): PricingDimensionLevel {
  const id = nextId++
  return {
    id,
    uuid: `uuid-${id}`,
    dimension_type_id: 1,
    label: `Level ${id}`,
    multiplier: 1,
    min_value: null,
    max_value: null,
    display_order: 0,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('calculateRecommendedPrice', () => {
  it('returns the base price when there are no dimension multipliers', () => {
    expect(calculateRecommendedPrice(100, [])).toBe(100)
  })

  it('applies a single multiplier', () => {
    expect(calculateRecommendedPrice(100, [1.3])).toBeCloseTo(130, 5)
  })

  it('compounds multiple multipliers, mirroring the backend formula', () => {
    // product = base × subtipo × complejidad × funcionalidad × mantenimiento
    const result = calculateRecommendedPrice(200, [1.1, 1.2, 1.05, 0.95])
    expect(result).toBeCloseTo(263.34, 2)
  })

  it('rounds to the nearest cent', () => {
    expect(calculateRecommendedPrice(10.005, [])).toBe(10.01)
  })

  it('zero base price stays zero regardless of multipliers', () => {
    expect(calculateRecommendedPrice(0, [5, 2])).toBe(0)
  })

  it('a multiplier below 1 discounts the price', () => {
    expect(calculateRecommendedPrice(100, [0.5])).toBe(50)
  })

  it('models the service formula: hours × hourly rate × complexity × specialization', () => {
    const result = calculateRecommendedPrice(40, [8, 1.25, 1.1])
    expect(result).toBeCloseTo(440, 2)
  })
})

describe('matchDimensionLevelForQuantity', () => {
  it('matches a bounded range', () => {
    const levels = [level({ label: '1-100', min_value: 1, max_value: 100 }), level({ label: '101-300', min_value: 101, max_value: 300 })]
    expect(matchDimensionLevelForQuantity(levels, 50)?.label).toBe('1-100')
  })

  it('matches an unbounded upper range (max_value = null)', () => {
    const levels = [level({ label: '1-100', min_value: 1, max_value: 100 }), level({ label: '301+', min_value: 301, max_value: null })]
    expect(matchDimensionLevelForQuantity(levels, 5000)?.label).toBe('301+')
  })

  it('treats a null min_value as zero', () => {
    const levels = [level({ label: '0-50', min_value: null, max_value: 50 })]
    expect(matchDimensionLevelForQuantity(levels, 0)?.label).toBe('0-50')
  })

  it('returns null when nothing matches', () => {
    const levels = [level({ min_value: 1, max_value: 10 })]
    expect(matchDimensionLevelForQuantity(levels, 999)).toBeNull()
  })

  it('returns null for an empty level list', () => {
    expect(matchDimensionLevelForQuantity([], 10)).toBeNull()
  })

  it('skips inactive levels', () => {
    const levels = [
      level({ label: 'inactive-match', min_value: 1, max_value: 100, is_active: false }),
      level({ label: 'active-match', min_value: 1, max_value: 100, is_active: true }),
    ]
    expect(matchDimensionLevelForQuantity(levels, 10)?.label).toBe('active-match')
  })

  it('the first matching level wins on overlapping ranges', () => {
    const levels = [level({ label: 'first', min_value: 1, max_value: 100 }), level({ label: 'second', min_value: 50, max_value: 150 })]
    expect(matchDimensionLevelForQuantity(levels, 75)?.label).toBe('first')
  })

  it('range bounds are inclusive on both ends', () => {
    const levels = [level({ min_value: 1, max_value: 300 })]
    expect(matchDimensionLevelForQuantity(levels, 1)).not.toBeNull()
    expect(matchDimensionLevelForQuantity(levels, 300)).not.toBeNull()
    expect(matchDimensionLevelForQuantity(levels, 301)).toBeNull()
  })
})
