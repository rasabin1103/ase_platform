import { apiClient } from './client'
import type {
  CatalogItem,
  CatalogItemListResponse,
  CatalogItemReviewListResponse,
  CatalogItemType,
} from '../types/catalog.types'

/** One row of "Mis compras" — the transaction record (when, how, what it
 * cost), deliberately separate from CatalogItem.isPurchased (which just
 * answers "can I open this"). See backend MyPurchaseRead. */
export type MyPurchase = {
  item: CatalogItem
  purchased_at: string
  source: 'free' | 'stripe_checkout' | 'plan_entitlement' | 'admin_grant' | string
  organization_name: string | null
  has_payment_detail: boolean
}

export type MyPurchaseListResponse = {
  items: MyPurchase[]
}

/** Lazily-fetched "más información" for one purchase — only populated with
 * live Stripe figures when has_payment_detail is true; otherwise the
 * defaults below describe a free/plan/admin-granted acquisition. */
export type MyPurchaseDetail = {
  amount_paid: number | null
  currency: string | null
  discount_amount: number | null
  payment_status: string | null
  receipt_url: string | null
  acquired_version: string
}

export async function listMyPurchases() {
  const { data } = await apiClient.get<MyPurchaseListResponse>('/consumer-catalog/me/purchases')
  return data
}

export async function getMyPurchaseDetail(slug: string) {
  const { data } = await apiClient.get<MyPurchaseDetail>(`/consumer-catalog/me/purchases/${slug}/detail`)
  return data
}

/** One entry in a series' ordered item list — a compact rail, not a full
 * catalog card (see backend SeriesItemRead). */
export type SeriesItem = {
  slug: string
  type: CatalogItemType
  title: string
  titleEn: string | null
  imageUrl: string
  seriesOrder: number | null
  isPurchased: boolean
}

/** "You're N/M through this series" + "up next" — only fetch this when
 * CatalogItem.seriesName is set; the endpoint 404s otherwise. */
export type SeriesProgress = {
  seriesName: string
  items: SeriesItem[]
  ownedCount: number
  totalCount: number
  nextItem: SeriesItem | null
}

export async function getCatalogItemSeries(slug: string) {
  const { data } = await apiClient.get<SeriesProgress>(`/consumer-catalog/${slug}/series`)
  return data
}

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

/** Items this user has actually opened (in-platform viewer, download, or an
 * audiobook chapter), most-recent-first — powers the "continue where you
 * left off" strip on the independent dashboard. */
export async function listMyRecentlyOpened(limit = 6) {
  const { data } = await apiClient.get<CatalogItemListResponse>('/consumer-catalog/me/recent', { params: { limit } })
  return data
}

/** Server-side "recommended for you" — ranks unpurchased items by shared
 * type with something already owned, plus (when answered) the user's
 * preferences survey answers (level/technologies/goals/role). See backend
 * ConsumerCatalogService.get_recommendations. */
export async function listMyRecommendations(limit = 8) {
  const { data } = await apiClient.get<CatalogItemListResponse>('/consumer-catalog/me/recommended', {
    params: { limit },
  })
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
  /** "markdown" (README.md) and "code" (any other recognized script/config
   *  file) -> `content` is text. "docx"/"xlsx"/"pdf" -> binary, base64-encoded
   *  in `contentBase64`, rendered client-side. */
  kind: 'markdown' | 'docx' | 'xlsx' | 'code' | 'pdf'
  content: string | null
  contentBase64: string | null
  truncated: boolean
  /** True when this is a free sample (a book's preview*.pdf) shown to
   * someone who doesn't own the item yet, not the real file. */
  isPreview: boolean
}

export async function getResourceContent(slug: string) {
  const { data } = await apiClient.get<ResourceContent>(`/consumer-catalog/${slug}/resource-content`)
  return data
}

/** A book's resource folder can hold more than one downloadable edition —
 * pass the one the user picked; omit it to get the old "whatever's there"
 * behavior every other resource type still relies on (see
 * ConsumerCatalogService.get_resource_download). */
export type ResourceDownloadFormat = 'pdf' | 'epub' | 'kindle' | 'zip'

/** Which of a book's format buttons actually have a file behind them —
 * checked without requiring ownership, so a button can be disabled for the
 * honest reason "nothing uploaded yet" rather than only failing after the
 * click. "zip" ("All formats") is true either for a real pre-made zip, or
 * implicitly whenever at least one of pdf/epub/kindle exists (the download
 * endpoint bundles those on the fly in that case). */
export type BookDownloadFormats = Record<ResourceDownloadFormat, boolean>

export async function getBookDownloadFormats(slug: string) {
  const { data } = await apiClient.get<BookDownloadFormats>(`/consumer-catalog/${slug}/download-formats`)
  return data
}

/** Downloads the resource's file straight from the browser — fetches it as
 * a blob (auth header is attached by the request interceptor same as any
 * other call) and triggers a save, same object-URL pattern as
 * utils/csv.ts's downloadCsv. The filename comes from the server's
 * Content-Disposition header (the file's real name in the repo). */
export async function downloadResource(slug: string, format?: ResourceDownloadFormat) {
  const response = await apiClient.get(`/consumer-catalog/${slug}/resource-download`, {
    responseType: 'blob',
    params: format ? { format } : undefined,
  })
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

export type AudiobookChapter = {
  name: string
  index: number
}

/** Platform-hosted audiobook chapters — separate from `audiobookUrl` (a
 * single external link handed straight to the browser). Lives in this
 * item's repo_path "audiolibro" subfolder; requires full ownership, same
 * as download. Returns an empty list rather than 404 for a book that
 * simply doesn't have this folder (it may only offer `audiobookUrl`, or
 * no audio edition at all). */
export async function listAudiobookChapters(slug: string) {
  const { data } = await apiClient.get<{ chapters: AudiobookChapter[] }>(
    `/consumer-catalog/${slug}/audiobook/chapters`,
  )
  return data.chapters
}

export async function getAudiobookChapterContent(slug: string, name: string) {
  const { data } = await apiClient.get<{ name: string; contentBase64: string; mimeType: string }>(
    `/consumer-catalog/${slug}/audiobook/chapter`,
    { params: { name } },
  )
  return data
}
