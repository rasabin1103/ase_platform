export type CatalogItemType = 'product' | 'course' | 'book' | 'resource'
export type CatalogItemStatus = 'published' | 'draft' | 'coming_soon' | 'request_only'
export type CatalogItemLevel = 'beginner' | 'intermediate' | 'advanced'

export type CatalogItemGalleryImage = {
  url: string
  isCover: boolean
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
  // English mirrors, auto-translated via DeepL on save — null on items
  // saved before this field existed and not re-saved since. Use
  // localizedCatalogText() rather than reading these directly, so the UI
  // falls back to Spanish consistently whenever one is missing.
  titleEn?: string | null
  shortDescriptionEn?: string | null
  longDescriptionEn?: string | null
  imageUrl: string
  images: CatalogItemGalleryImage[]
  price: string | number
  currency: string
  status: CatalogItemStatus
  level: CatalogItemLevel
  duration?: string | null
  author: string
  previewUrl?: string | null
  audiobookUrl?: string | null
  benefits?: string[]
  requirements?: string[]
  includedItems?: string[]
  tags?: string[]
  // Loose series grouping — items sharing the same seriesName belong to
  // one series (any type). Null/undefined means "not part of a series".
  // When set, GET /consumer-catalog/{slug}/series has the full
  // progress/recommendation view (see api/consumerCatalog.api.ts).
  seriesName?: string | null
  seriesOrder?: number | null
  isFavorite: boolean
  isPurchased: boolean
  isPlanIncluded: boolean
  upvotes: number
  downvotes: number
  netScore: number
  topTags: string[]
  myRating?: { isPositive: boolean; tags: string[] } | null
  averageRating?: number | null
  reviewCount: number
  myReview?: { rating: number; comment: string | null } | null
  // Just "does this item have a linked resource folder" — not "can I see
  // it right now". A priced item's non-owner can still get a free
  // preview*.pdf; the resource-content/resource-download calls enforce
  // real ownership themselves. See ConsumerCatalogService._to_read.
  hasResourceContent: boolean
  // --- Version & changelog — populated only for type="resource" items
  // with a current_version set; empty/null for everything else.
  currentVersion?: string | null
  versionUpdatedAt?: string | null
  changelog?: string[]
  compatibility?: string[]
  // The current user's own acquisition date for this item (earliest
  // purchase row) — null if not purchased. hasNewVersion compares this
  // against versionUpdatedAt server-side.
  purchasedAt?: string | null
  hasNewVersion?: boolean
  // --- License disclosure, shown before purchase -------------------------
  licenseScope?: string[]
  licenseRedistribution?: string | null
  licenseUpdatesIncluded?: boolean
  licenseSupportIncluded?: boolean
  // Null means "use the platform's standard digital-content refund
  // clause" — see CatalogDetailPage's license panel.
  licenseRefundPolicy?: string | null
  createdAt: string
  updatedAt: string
}

export type CatalogItemListResponse = {
  items: CatalogItem[]
  limit: number
  offset: number
  total: number
}

export type CatalogItemReview = {
  userDisplayName: string
  rating: number
  comment: string | null
  createdAt: string
}

export type CatalogItemReviewListResponse = {
  items: CatalogItemReview[]
  averageRating: number | null
  reviewCount: number
  limit: number
  offset: number
}
