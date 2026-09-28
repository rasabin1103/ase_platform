import { apiClient } from './client'

// Mirrors backend/app/modules/catalog_showcase/schemas.py — the public,
// unauthenticated "browse before you sign up" catalog. Deliberately a much
// smaller shape than the authenticated consumer catalog item: no long
// description, no license/resource/download metadata, no per-item detail
// route. `slug` is a stable React key, not a link target.
export type CatalogItemType = 'product' | 'course' | 'book' | 'resource'

export type CatalogShowcaseSort = 'newest' | 'top_rated' | 'price_asc' | 'price_desc'

export type CatalogShowcaseItem = {
  slug: string
  title: string
  titleEn: string | null
  shortDescription: string
  shortDescriptionEn: string | null
  longDescription: string
  longDescriptionEn: string | null
  imageUrl: string
  type: CatalogItemType
  category: string
  tags: string[]
  averageRating: number | null
  reviewCount: number
}

export type CatalogShowcaseListResponse = {
  items: CatalogShowcaseItem[]
  limit: number
  offset: number
  total: number
}

export type CatalogShowcaseListParams = {
  limit?: number
  offset?: number
  type?: CatalogItemType
  category?: string
  search?: string
  tags?: string[]
  sort?: CatalogShowcaseSort
}

export async function listCatalogShowcaseItems(params?: CatalogShowcaseListParams) {
  const { data } = await apiClient.get<CatalogShowcaseListResponse>('/catalog-showcase', { params })
  return data
}

export async function listCatalogShowcaseTags() {
  const { data } = await apiClient.get<string[]>('/catalog-showcase/tags')
  return data
}

export async function listCatalogShowcaseCategories() {
  const { data } = await apiClient.get<string[]>('/catalog-showcase/categories')
  return data
}
