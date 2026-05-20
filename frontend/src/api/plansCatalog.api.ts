import { listPublicCatalogPricingPlans } from './publicCatalogPricing.api'
import type { Plan } from '../types/plan.types'

/**
 * @deprecated Use `listPublicCatalogPricingPlans` — public pages now use catalog pricing plans.
 * Kept for legacy imports; returns empty (old `/plans/catalog` is not in MVP).
 */
export function normalizePlansListPayload(data: unknown): Plan[] {
  if (Array.isArray(data)) {
    return data as Plan[]
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const raw = o.items ?? o.data ?? o.results
    if (Array.isArray(raw)) {
      return raw as Plan[]
    }
  }
  return []
}

export async function listPlansCatalog(): Promise<Plan[]> {
  await listPublicCatalogPricingPlans()
  return []
}
