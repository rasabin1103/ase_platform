export type CatalogItemType = 'product' | 'course' | 'book' | 'resource'
export type CatalogItemStatus = 'published' | 'draft' | 'coming_soon' | 'request_only'
export type CatalogItemLevel = 'beginner' | 'intermediate' | 'advanced'

export type PricingPlanType =
  | 'free'
  | 'one_time'
  | 'subscription'
  | 'lifetime'
  | 'request_quote'

export type PricingBillingInterval = 'none' | 'monthly' | 'quarterly' | 'yearly'

export type PricingSupportLevel = 'none' | 'basic' | 'priority' | 'enterprise'

export type PublicPricingPlan = {
  id: number
  name: string
  slug: string
  description?: string | null
  planType: PricingPlanType
  billingInterval: PricingBillingInterval
  price: string | number
  currency: string
  trialDays?: number | null
  setupFee?: string | number | null
  discountPercentage?: string | number | null
  isDefault: boolean
  maxUsers?: number | null
  maxDownloads?: number | null
  accessDurationDays?: number | null
  includesUpdates: boolean
  includesSupport: boolean
  supportLevel: PricingSupportLevel
  features: string[]
  limitations: string[]
}

export type PublicCatalogPricingPlan = PublicPricingPlan & {
  catalogItemId: number
  catalogItemTitle: string
  catalogItemSlug: string
  catalogItemType: CatalogItemType
  catalogItemCategory: string
}

export type CatalogItem = {
  id: string
  uuid: string
  title: string
  slug: string
  type: CatalogItemType
  category: string
  shortDescription: string
  longDescription: string
  imageUrl: string
  price: string | number
  currency: string
  status: CatalogItemStatus
  level: CatalogItemLevel
  duration?: string | null
  author: string
  previewUrl?: string | null
  benefits?: string[]
  requirements?: string[]
  includedItems?: string[]
  isFavorite: boolean
  isPurchased: boolean
  pricingPlans?: PublicPricingPlan[]
  createdAt: string
  updatedAt: string
}

export type CatalogItemListResponse = {
  items: CatalogItem[]
  limit: number
  offset: number
  total: number
}
