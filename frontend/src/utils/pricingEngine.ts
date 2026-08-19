import type { PricingDimensionLevel } from '../api/pricingAdmin.api'

/**
 * Mirrors app/core/pricing_engine.py:calculate_recommended_price exactly —
 * multiplicative formula (base price × the product of every selected
 * dimension's multiplier), rounded to cents. Every "subelemento" a pillar
 * has (subtipo, complejidad, funcionalidad, páginas, horas...) is just a
 * dimension type — pass one multiplier per type the item has a level
 * selected for; missing ones simply don't participate (≡ ×1). Used for
 * live client-side recalculation as the admin picks dropdowns, so there's
 * no round-trip lag; the backend recomputes and persists the same value
 * server-side on save as the source of truth.
 */
export function calculateRecommendedPrice(basePrice: number, dimensionMultipliers: number[]): number {
  const raw = dimensionMultipliers.reduce((acc, m) => acc * m, basePrice)
  return Math.round(raw * 100) / 100
}

/**
 * Mirrors app/core/pricing_engine.py:match_dimension_level_for_quantity —
 * range-based dimension types only (book "Páginas", service "Horas").
 * Returns the first active level whose [min_value, max_value] range (both
 * inclusive; max_value=null means unbounded) contains `quantity`.
 */
export function matchDimensionLevelForQuantity(
  levels: PricingDimensionLevel[],
  quantity: number,
): PricingDimensionLevel | null {
  for (const level of levels) {
    if (!level.is_active) continue
    const lo = level.min_value ?? 0
    const hi = level.max_value
    if (quantity >= lo && (hi === null || quantity <= hi)) {
      return level
    }
  }
  return null
}
