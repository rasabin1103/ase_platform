import { apiClient } from './client'
import type { CatalogItemType, PublicPricingPlan } from '../types/catalog.types'

export type PublicCatalogPricingPlan = PublicPricingPlan & {
  catalogItemId: number
  catalogItemTitle: string
  catalogItemSlug: string
  catalogItemType: CatalogItemType
  catalogItemCategory: string
}

export type PublicCatalogPricingPlanListResponse = {
  items: PublicCatalogPricingPlan[]
  limit: number
  offset: number
  total: number
}

export async function listPublicCatalogPricingPlans(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<PublicCatalogPricingPlanListResponse>(
    '/public/catalog-pricing-plans',
    { params },
  )
  return data
}
