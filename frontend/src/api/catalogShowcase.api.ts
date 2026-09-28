import { apiClient } from './client'

// Mirrors backend/app/modules/catalog_showcase/schemas.py — the public,
// unauthenticated "browse before you sign up" catalog. Deliberately a
// smaller shape than the authenticated consumer catalog item (no per-user
// favorite/purchase state, no license/resource-content internals), but
// includes price and — for the single-item page — level/duration/author,
// preview link and benefits/requirements/included bullets, so a visitor
// can fully evaluate an offer before creating an account.
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
  price: string
  currency: string
  previewUrl: string | null
  // Whether the repo-backed sample actually exists — see backend
  // CatalogShowcaseItemRead.hasPreview. The "Preview" button only renders
  // when this is true.
  hasPreview: boolean
  averageRating: number | null
  reviewCount: number
}

export type CatalogShowcaseItemDetail = CatalogShowcaseItem & {
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: string | null
  author: string
  audiobookUrl: string | null
  benefits: string[]
  requirements: string[]
  includedItems: string[]
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

export async function getCatalogShowcaseItem(type: CatalogItemType, slug: string) {
  const { data } = await apiClient.get<CatalogShowcaseItemDetail>(
    `/catalog-showcase/${type}/${encodeURIComponent(slug)}`,
  )
  return data
}

// Mirrors backend ResourceContentRead (consumer_catalog/schemas.py) — the
// actual repo-backed sample file (a book's "preview" subfolder, or another
// item's README.md), fetched fresh with zero auth. NOT the `previewUrl`
// field above, which is just an optional external link the admin can set.
export type CatalogShowcasePreviewContent = {
  path: string
  kind: string
  content: string | null
  contentBase64: string | null
  truncated: boolean
  isPreview: boolean
}

export async function getCatalogShowcasePreviewContent(type: CatalogItemType, slug: string) {
  const { data } = await apiClient.get<CatalogShowcasePreviewContent>(
    `/catalog-showcase/${type}/${encodeURIComponent(slug)}/preview-content`,
  )
  return data
}

/** Public item detail path — deliberately distinct from the authenticated
 * `/catalog/:type/:slug` (see router.tsx), which sits behind ProtectedRoute
 * and shows purchase-gated content. This one is reachable by anyone, no
 * login required — the whole point of a link shareable on LinkedIn, in
 * Google results, or in a campaign. */
export function catalogShowcaseItemPath(item: Pick<CatalogShowcaseItem, 'type' | 'slug'>): string {
  return `/catalog/item/${item.type}/${item.slug}`
}
