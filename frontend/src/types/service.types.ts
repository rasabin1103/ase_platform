export type ServiceCategory =
  | 'platform_engineering'
  | 'qa_automation'
  | 'training'
  | 'digital_products'
  | 'consulting'
  | 'ai_automation'
  | 'frameworks'

export type ServiceKind = 'service' | 'product' | 'framework' | 'course' | 'book'

export type ServicePriceType = 'free' | 'fixed' | 'subscription' | 'custom'

export type ServiceFeature = {
  id: number
  service_id: number
  text: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DimensionSelection = {
  dimension_type_id: number
  dimension_level_id: number
}

export type ServiceHighlight = {
  id: number
  service_id: number
  title: string
  value: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export type Service = {
  id: number
  uuid: string
  code: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  category: ServiceCategory
  service_type: ServiceKind
  price_type: ServicePriceType
  // Optional — historically null meant "custom quote". Set when the admin
  // picks a concrete price, typically from the pricing engine.
  price?: number | string | null
  is_featured: boolean
  is_active: boolean
  display_order: number
  icon: string | null
  hero_title: string | null
  hero_subtitle: string | null
  created_at: string
  updated_at: string
  features: ServiceFeature[]
  highlights: ServiceHighlight[]
  dimension_selections?: DimensionSelection[]
  estimated_hours?: number | null
  recommended_price?: number | string | null
}

export type ServiceListResponse = {
  items: Service[]
  limit: number
  offset: number
  total: number
}

export type ServiceFeatureCreateRequest = {
  text: string
  display_order?: number
  is_active?: boolean
}

export type ServiceHighlightCreateRequest = {
  title: string
  value: string
  description?: string | null
  display_order?: number
}

export type ServiceCreateRequest = {
  code: string
  name: string
  slug: string
  short_description?: string | null
  description?: string | null
  category: ServiceCategory
  service_type: ServiceKind
  price_type?: ServicePriceType
  price?: number | null
  is_featured?: boolean
  is_active?: boolean
  display_order?: number
  icon?: string | null
  hero_title?: string | null
  hero_subtitle?: string | null
  features?: ServiceFeatureCreateRequest[]
  highlights?: ServiceHighlightCreateRequest[]
  dimension_selections?: DimensionSelection[]
  estimated_hours?: number | null
}

export type ServiceUpdateRequest = Partial<ServiceCreateRequest>
