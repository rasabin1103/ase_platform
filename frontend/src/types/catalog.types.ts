export type BookPurchasePlatform =
  | 'amazon'
  | 'ase'
  | 'lulu'
  | 'gumroad'
  | 'shopify'
  | 'hotmart'
  | 'other'

export type CatalogItemImage = {
  id: number
  imageUrl: string
  altText?: string | null
  title?: string | null
  sortOrder: number
  isPrimary: boolean
}

export type CatalogItemImageInput = {
  id?: number
  image_url: string
  alt_text?: string | null
  title?: string | null
  sort_order: number
  is_primary: boolean
}

export type BookPurchaseLink = {
  id: number
  platform: BookPurchasePlatform
  label: string
  url: string
  currency?: string | null
  price?: string | number | null
  country?: string | null
  isPrimary: boolean
  isActive: boolean
  sortOrder: number
}

export type BookPurchaseLinkInput = {
  id?: number
  platform: BookPurchasePlatform
  label?: string | null
  url: string
  currency?: string | null
  price?: number | null
  country?: string | null
  is_primary: boolean
  is_active: boolean
  sort_order: number
}

export type CatalogItemType = 'product' | 'course' | 'book' | 'resource'
export type CatalogItemStatus = 'published' | 'draft' | 'coming_soon' | 'request_only'
export type CatalogItemLevel = 'beginner' | 'intermediate' | 'advanced'
export type CatalogPurchaseProvider = 'internal' | 'amazon' | 'external' | 'request_only'

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
  displayName?: string
  description?: string | null
  planType: PricingPlanType
  billingInterval: PricingBillingInterval
  price: string | number
  currency: string
  monthlyPrice?: string | number | null
  annualPrice?: string | number | null
  annualDiscountPercentage?: number
  annualSavingsAmount?: string | number | null
  formattedMonthlyPrice?: string
  formattedAnnualPrice?: string
  isPopular?: boolean
  orderIndex?: number | null
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

export type PublicCatalogPricingPlanListResponse = {
  items: PublicCatalogPricingPlan[]
  limit: number
  offset: number
  total: number
}

export type CatalogItemSummary = {
  id: string
  title: string
  slug: string
  type: CatalogItemType
  shortDescription: string
  imageUrl: string
  author: string
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
  coverImageUrl?: string | null
  thumbnailUrl?: string | null
  amazonUrl?: string | null
  externalPurchaseUrl?: string | null
  purchaseProvider?: CatalogPurchaseProvider
  pdfUrl?: string | null
  previewPdfUrl?: string | null
  previewPages?: number | null
  sampleDownloadUrl?: string | null
  richContentMarkdown?: string | null
  bookFormat?: string | null
  audience?: string[]
  relatedItems?: CatalogItemSummary[]
  images?: CatalogItemImage[]
  purchaseLinks?: BookPurchaseLink[]
  imageCount?: number
  createdAt: string
  updatedAt: string
}

export type CatalogItemListResponse = {
  items: CatalogItem[]
  limit: number
  offset: number
  total: number
}
