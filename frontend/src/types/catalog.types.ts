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
  imageUrl: string
  images: CatalogItemGalleryImage[]
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
  tags?: string[]
  isFavorite: boolean
  isPurchased: boolean
  upvotes: number
  downvotes: number
  netScore: number
  topTags: string[]
  myRating?: { isPositive: boolean; tags: string[] } | null
  createdAt: string
  updatedAt: string
}

export type CatalogItemListResponse = {
  items: CatalogItem[]
  limit: number
  offset: number
  total: number
}
