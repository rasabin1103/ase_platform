import { apiClient } from './client'
import type { Plan, PlanListResponse } from '../types/plan.types'

/**
 * Public marketing catalog. Uses `GET /api/v1/plans/catalog` (no auth; active plans only).
 *
 * Note: `GET /api/v1/plans` remains protected (`billing.manage`). Admin UI keeps using `listPlans`.
 *
 * Related (authenticated admin): `GET /api/v1/products`, `GET /api/v1/plan-products` exist in the backend.
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
  const { data } = await apiClient.get<PlanListResponse | Plan[]>('/plans/catalog')
  return normalizePlansListPayload(data)
}
