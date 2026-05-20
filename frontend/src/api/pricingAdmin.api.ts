import { apiClient } from './client'

export type PricingPlanType =
  | 'free'
  | 'one_time'
  | 'subscription'
  | 'lifetime'
  | 'request_quote'

export type PricingBillingInterval = 'none' | 'monthly' | 'quarterly' | 'yearly'

export type PricingSupportLevel = 'none' | 'basic' | 'priority' | 'enterprise'

export type PricingPlan = {
  id: number
  catalog_item_id: number
  name: string
  slug: string
  description: string | null
  plan_type: PricingPlanType
  billing_interval: PricingBillingInterval
  price: string | number
  currency: string
  trial_days: number | null
  setup_fee: string | number | null
  discount_percentage: string | number | null
  is_active: boolean
  is_default: boolean
  max_users: number | null
  max_downloads: number | null
  access_duration_days: number | null
  includes_updates: boolean
  includes_support: boolean
  support_level: PricingSupportLevel
  features: string[]
  limitations: string[]
  stripe_price_id: string | null
  stripe_product_id: string | null
  created_at: string
  updated_at: string
}

export type PricingPlanListResponse = {
  items: PricingPlan[]
  catalog_item_id: number
}

export type PricingPlanWithCatalog = PricingPlan & {
  catalog_item_title: string
  catalog_item_slug: string
  catalog_item_type: 'product' | 'course' | 'book' | 'resource'
}

export type AdminPricingPlanListResponse = {
  items: PricingPlanWithCatalog[]
  limit: number
  offset: number
  total: number
}

export type PricingPlanPayload = {
  name: string
  slug?: string | null
  description?: string | null
  plan_type: PricingPlanType
  billing_interval?: PricingBillingInterval
  price?: number
  currency?: string
  trial_days?: number | null
  setup_fee?: number | null
  discount_percentage?: number | null
  is_active?: boolean
  is_default?: boolean
  max_users?: number | null
  max_downloads?: number | null
  access_duration_days?: number | null
  includes_updates?: boolean
  includes_support?: boolean
  support_level?: PricingSupportLevel
  features?: string[]
  limitations?: string[]
}

export type PricingPlanUpdatePayload = Partial<PricingPlanPayload>

export async function listAllPricingPlans(params?: {
  limit?: number
  offset?: number
  catalog_item_id?: number
  plan_type?: PricingPlanType
  is_active?: boolean
  search?: string
}) {
  const { data } = await apiClient.get<AdminPricingPlanListResponse>('/admin/pricing-plans', { params })
  return data
}

export async function listCatalogPricingPlans(catalogItemId: number) {
  const { data } = await apiClient.get<PricingPlanListResponse>(
    `/admin/catalog/${catalogItemId}/pricing-plans`,
  )
  return data
}

export async function createCatalogPricingPlan(catalogItemId: number, payload: PricingPlanPayload) {
  const { data } = await apiClient.post<PricingPlan>(
    `/admin/catalog/${catalogItemId}/pricing-plans`,
    payload,
  )
  return data
}

export async function getPricingPlan(planId: number) {
  const { data } = await apiClient.get<PricingPlan>(`/admin/pricing-plans/${planId}`)
  return data
}

export async function updatePricingPlan(planId: number, payload: PricingPlanUpdatePayload) {
  const { data } = await apiClient.put<PricingPlan>(`/admin/pricing-plans/${planId}`, payload)
  return data
}

export async function patchPricingPlanStatus(planId: number, is_active: boolean) {
  const { data } = await apiClient.patch<PricingPlan>(`/admin/pricing-plans/${planId}/status`, {
    is_active,
  })
  return data
}

export async function deletePricingPlan(planId: number) {
  await apiClient.delete(`/admin/pricing-plans/${planId}`)
}
