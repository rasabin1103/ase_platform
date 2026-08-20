import { apiClient } from './client'
import type {
  CatalogItem,
  CatalogItemListResponse,
  CatalogItemReviewListResponse,
  CatalogItemType,
} from '../types/catalog.types'

export type ListCatalogParams = {
  limit?: number
  offset?: number
  type?: CatalogItemType
  category?: string
  search?: string
  tags?: string[]
  favorites_only?: boolean
  purchased_only?: boolean
  sort?: 'top_rated'
}

export async function listConsumerCatalog(params?: ListCatalogParams) {
  const { data } = await apiClient.get<CatalogItemListResponse>('/consumer-catalog', { params })
  return data
}

export async function listConsumerCatalogTags() {
  const { data } = await apiClient.get<string[]>('/consumer-catalog/tags')
  return data
}

export async function getConsumerCatalogItem(slug: string) {
  const { data } = await apiClient.get<CatalogItem>(`/consumer-catalog/${slug}`)
  return data
}

export async function toggleCatalogFavorite(slug: string) {
  const { data } = await apiClient.post<CatalogItem>(`/consumer-catalog/${slug}/favorite`)
  return data
}

export async function purchaseCatalogItem(slug: string) {
  const { data } = await apiClient.post<CatalogItem>(`/consumer-catalog/${slug}/purchase`)
  return data
}

export async function rateCatalogItem(slug: string, payload: { isPositive: boolean; tags: string[] }) {
  const { data } = await apiClient.post<CatalogItem>(`/consumer-catalog/${slug}/rating`, payload)
  return data
}

export async function removeCatalogItemRating(slug: string) {
  const { data } = await apiClient.delete<CatalogItem>(`/consumer-catalog/${slug}/rating`)
  return data
}

export async function listCatalogItemReviews(slug: string, params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<CatalogItemReviewListResponse>(`/consumer-catalog/${slug}/reviews`, { params })
  return data
}

export async function submitCatalogItemReview(slug: string, payload: { rating: number; comment?: string | null }) {
  const { data } = await apiClient.post<CatalogItem>(`/consumer-catalog/${slug}/review`, payload)
  return data
}

export async function removeCatalogItemReview(slug: string) {
  const { data } = await apiClient.delete<CatalogItem>(`/consumer-catalog/${slug}/review`)
  return data
}

export type ResourceContent = {
  path: string
  /** "markdown" -> `content` is text (README.md). "docx"/"xlsx" -> binary,
   *  base64-encoded in `contentBase64`, rendered client-side. */
  kind: 'markdown' | 'docx' | 'xlsx'
  content: string | null
  contentBase64: string | null
  truncated: boolean
}

export async function getResourceContent(slug: string) {
  const { data } = await apiClient.get<ResourceContent>(`/consumer-catalog/${slug}/resource-content`)
  return data
}

/** Downloads the resource's file straight from the browser — fetches it as
 * a blob (auth header is attached by the request interceptor same as any
 * other call) and triggers a save, same object-URL pattern as
 * utils/csv.ts's downloadCsv. The filename comes from the server's
 * Content-Disposition header (the file's real name in the repo). */
export async function downloadResource(slug: string) {
  const response = await apiClient.get(`/consumer-catalog/${slug}/resource-download`, { responseType: 'blob' })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const match = /filename="?([^"]+)"?/.exec(disposition)
  const filename = match?.[1] ?? `${slug}.txt`
  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
