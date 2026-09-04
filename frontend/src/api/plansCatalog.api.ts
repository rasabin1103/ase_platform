import { apiClient } from './client'
import type { Plan } from '../types/plan.types'

/**
 * Public marketing catalog. Uses `GET /api/v1/public/catalog-pricing-plans` (no auth).
 *
 * Note: `GET /api/v1/plans` remains protected (`billing.manage`). Admin UI keeps using `listPlans`.
 */
type CatalogPricingPlanApi = {
  id: number
  name: string
  slug: string
  displayName?: string
  description?: string | null
  planType?: string
  billingInterval?: string
  price?: string | null
  currency?: string
  monthlyPrice?: string | null
  annualPrice?: string | null
  isPopular?: boolean
  orderIndex?: number | null
  features?: Array<{ text?: string; display_order?: number; is_active?: boolean } | string>
}

type CatalogPricingPlansResponse = {
  items: CatalogPricingPlanApi[]
  limit?: number
  offset?: number
  total?: number
}

export function normalizePlansListPayload(data: unknown): Plan[] {
  if (Array.isArray(data)) {
    return data as Plan[]
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const raw = o.items ?? o.data ?? o.results
    if (Array.isArray(raw)) {
      if (raw.length > 0 && raw[0] && typeof raw[0] === 'object' && 'slug' in (raw[0] as object)) {
        return (raw as CatalogPricingPlanApi[]).map(mapCatalogPricingPlan)
      }
      return raw as Plan[]
    }
  }
  return []
}

function mapCatalogPricingPlan(item: CatalogPricingPlanApi): Plan {
  const now = new Date().toISOString()
  const features = (item.features ?? [])
    .map((f, index) => {
      if (typeof f === 'string') {
        return {
          id: index,
          plan_id: item.id,
          text: f,
          display_order: index,
          is_active: true,
          created_at: now,
          updated_at: now,
        }
      }
      if (f && typeof f === 'object' && f.text) {
        return {
          id: index,
          plan_id: item.id,
          text: f.text,
          display_order: f.display_order ?? index,
          is_active: f.is_active !== false,
          created_at: now,
          updated_at: now,
        }
      }
      return null
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)

  return {
    id: item.id,
    code: item.slug,
    name: item.displayName?.trim() || item.name,
    billing_cycle: 'monthly',
    price: item.monthlyPrice ?? item.price ?? null,
    annual_price: item.annualPrice ?? null,
    currency: item.currency || 'EUR',
    is_active: true,
    status: 'active',
    created_at: now,
    updated_at: now,
    description: item.description ?? null,
    short_description: null,
    display_order: item.orderIndex ?? item.id,
    is_recommended: item.isPopular ?? false,
    cta_label: null,
    features,
  }
}

export async function listPlansCatalog(): Promise<Plan[]> {
  const { data } = await apiClient.get<CatalogPricingPlansResponse | Plan[]>('/public/catalog-pricing-plans')
  return normalizePlansListPayload(data)
}

export type PlanSavings = {
  planId: number
  code: string
  name: string
  price: number
  currency: string
  includedItemCount: number
  includedItemsValue: number
  savings: number
}

/** "Buy separately vs. subscribe" comparison for every sellable plan that
 * includes the given item — no auth required. Powers the savings prompt
 * shown next to a priced item's Buy button (see PlanSavingsModal). Returns
 * an empty list when no plan includes this item, or none would actually
 * save the buyer money. */
export async function getPlanSavings(itemSlug: string): Promise<PlanSavings[]> {
  const { data } = await apiClient.get<{ items: PlanSavings[] }>('/public/plan-savings', {
    params: { item_slug: itemSlug },
  })
  return data.items
}
