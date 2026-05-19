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
  features?: PlanFeature[]
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
  features?: PlanFeatureCreateRequest[] | null
}

export type PlanUpdateRequest = Partial<PlanCreateRequest>

