export type BillingCycle = 'monthly' | 'yearly' | 'one_time'

export type PlanFeature = {
  id: number
  plan_id: number
  text: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PlanCatalogItem = {
  id: number
  catalog_item_id: number
  display_order: number
  title: string
  slug: string
  type: string
  short_description: string
}

export type Plan = {
  id: number
  code: string
  name: string
  billing_cycle: BillingCycle
  price: string | null
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
  description?: string | null
  short_description?: string | null
  display_order?: number
  is_recommended?: boolean
  cta_label?: string | null
  /** Annual price when catalog API exposes monthly + annual on one row (Railway public catalog). */
  annual_price?: string | null
  /** Deprecated free-text bullets — only populated for plans created before the catalog picker existed. */
  features?: PlanFeature[]
  included_catalog_items?: PlanCatalogItem[]
}

export type PlanListResponse = {
  items: Plan[]
  limit: number
  offset: number
  total: number
}

export type PlanFeatureCreateRequest = {
  text: string
  display_order?: number
  is_active?: boolean
}

export type PlanCreateRequest = {
  code: string
  name: string
  billing_cycle?: BillingCycle
  price?: number | string | null
  currency?: string
  is_active?: boolean
  description?: string | null
  short_description?: string | null
  display_order?: number
  is_recommended?: boolean
  cta_label?: string | null
  catalog_item_ids?: number[] | null
}

export type PlanUpdateRequest = Partial<PlanCreateRequest>

