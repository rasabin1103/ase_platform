export type CatalogItemType = 'product' | 'course' | 'book' | 'resource'
export type CatalogItemStatus = 'published' | 'draft' | 'coming_soon' | 'request_only'
export type CatalogItemLevel = 'beginner' | 'intermediate' | 'advanced'

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
  createdAt: string
  updatedAt: string
}

export type CatalogItemListResponse = {
  items: CatalogItem[]
  limit: number
  offset: number
  total: number
}
