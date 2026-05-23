import { apiClient } from './client'
import type { PublicCatalogPricingPlan, PublicCatalogPricingPlanListResponse } from '../types/catalog.types'

export type { PublicCatalogPricingPlan, PublicCatalogPricingPlanListResponse }

export async function listPublicCatalogPricingPlans(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<PublicCatalogPricingPlanListResponse>(
    '/public/catalog-pricing-plans',
    { params },
  )
  return data
}
