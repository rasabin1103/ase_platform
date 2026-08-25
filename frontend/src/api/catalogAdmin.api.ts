import { apiClient } from './client'
import type { CatalogItemLevel, CatalogItemStatus, CatalogItemType } from '../types/catalog.types'

export type CatalogItemImage = {
  id: number
  url: string
  is_cover: boolean
  display_order: number
}

export type DimensionSelection = {
  dimension_type_id: number
  dimension_level_id: number
}

// One workflow_dispatch input a framework product's workflow expects (e.g.
// BASE_URL) — admin-defined, mirrors CategoryFieldDef's questionnaire
// pattern. `key` must match an input name declared under
// `on.workflow_dispatch.inputs` in the workflow YAML, or GitHub silently
// ignores it. Buyers fill in their own values per framework (see
// testExecution.api.ts's TestExecutionConfig types).
export type TestInputVariableDef = {
  key: string
  label: string
  type: 'text' | 'secret'
  required: boolean
  description?: string | null
}

export type CatalogItemAdmin = {
  id: number
  uuid: string
  title: string
  slug: string
  type: CatalogItemType
  category: string
  short_description: string
  long_description: string
  title_en: string | null
  short_description_en: string | null
  long_description_en: string | null
  image_url: string
  images: CatalogItemImage[]
  preview_url: string | null
  audiobook_url: string | null
  price: string | number
  currency: string
  status: CatalogItemStatus
  level: CatalogItemLevel
  duration: string | null
  author: string
  benefits: string[]
  requirements: string[]
  included_items: string[]
  tags: string[]
  repo_url: string | null
  repo_redeem_code: string | null
  repo_path: string | null
  custom_fields: Record<string, unknown>
  has_stored_image?: boolean
  dimension_selections?: DimensionSelection[]
  page_count?: number | null
  // Test-execution SaaS (product pillar only) — the GitHub repo/workflow to
  // dispatch and the run quota granted per purchase/plan-inclusion. Null on
  // every non-runnable item.
  test_repo_url?: string | null
  test_workflow_file?: string | null
  test_included_runs?: number | null
  test_input_schema?: TestInputVariableDef[]
  recommended_price?: string | number | null
  created_at: string
  updated_at: string
}

export type CatalogAdminListResponse = {
  items: CatalogItemAdmin[]
  limit: number
  offset: number
  total: number
}

export type CatalogItemAdminPayload = {
  title: string
  slug: string
  type: CatalogItemType
  category: string
  short_description: string
  long_description: string
  title_en?: string | null
  short_description_en?: string | null
  long_description_en?: string | null
  image_url: string
  preview_url?: string | null
  audiobook_url?: string | null
  price: number
  currency: string
  status: CatalogItemStatus
  level: CatalogItemLevel
  duration?: string | null
  author: string
  benefits?: string[]
  requirements?: string[]
  included_items?: string[]
  tags?: string[]
  repo_url?: string | null
  repo_redeem_code?: string | null
  repo_path?: string | null
  custom_fields?: Record<string, unknown>
  dimension_selections?: DimensionSelection[]
  page_count?: number | null
  test_repo_url?: string | null
  test_workflow_file?: string | null
  test_included_runs?: number | null
  test_input_schema?: TestInputVariableDef[]
}

export type CatalogItemAdminUpdatePayload = Partial<Omit<CatalogItemAdminPayload, 'type' | 'slug'>>

export async function listAdminCatalog(params?: {
  limit?: number
  offset?: number
  type?: CatalogItemType
  search?: string
  tags?: string[]
}) {
  const { data } = await apiClient.get<CatalogAdminListResponse>('/admin/catalog', { params })
  return data
}

export async function listAdminCatalogTags() {
  const { data } = await apiClient.get<string[]>('/admin/catalog/tags')
  return data
}

export async function getCatalogTranslationStatus() {
  const { data } = await apiClient.get<{ enabled: boolean }>('/admin/catalog/meta/translation-status')
  return data
}

// --- Test-execution usage stats (admin) -------------------------------------

export type CatalogTestRunStatusCounts = {
  pending: number
  queued: number
  in_progress: number
  completed: number
  failed_to_dispatch: number
}

export type CatalogTestRunConclusionCounts = {
  success: number
  failure: number
  cancelled: number
  timed_out: number
  action_required: number
  unknown: number
}

export type CatalogTestRunRecent = {
  uuid: string
  user_email: string
  status: string
  conclusion: string | null
  created_at: string
}

export type CatalogItemTestStats = {
  item_id: number
  item_title: string
  item_slug: string
  included_runs: number | null
  total_runs: number
  unique_users: number
  by_status: CatalogTestRunStatusCounts
  by_conclusion: CatalogTestRunConclusionCounts
  last_run_at: string | null
  recent_runs: CatalogTestRunRecent[]
}

export type CatalogTestStatsSummaryItem = {
  item_id: number
  item_title: string
  item_slug: string
  included_runs: number | null
  total_runs: number
  last_run_at: string | null
}

export async function getCatalogItemTestStats(itemId: number) {
  const { data } = await apiClient.get<CatalogItemTestStats>(`/admin/catalog/${itemId}/test-stats`)
  return data
}

export async function getCatalogTestStatsSummary() {
  const { data } = await apiClient.get<{ items: CatalogTestStatsSummaryItem[] }>('/admin/catalog/test-stats/summary')
  return data
}

export async function createAdminCatalogItem(payload: CatalogItemAdminPayload) {
  const { data } = await apiClient.post<CatalogItemAdmin>('/admin/catalog', payload)
  return data
}

export async function updateAdminCatalogItem(itemId: number, payload: CatalogItemAdminUpdatePayload) {
  const { data } = await apiClient.patch<CatalogItemAdmin>(`/admin/catalog/${itemId}`, payload)
  return data
}

export async function deleteAdminCatalogItem(itemId: number) {
  await apiClient.delete(`/admin/catalog/${itemId}`)
}

export async function uploadCatalogItemImage(itemId: number, file: File) {
  const form = new FormData()
  form.append('file', file)
  await apiClient.post(`/admin/catalog/${itemId}/image`, form)
}

export async function listCatalogItemImages(itemId: number) {
  const { data } = await apiClient.get<{ items: CatalogItemImage[] }>(`/admin/catalog/${itemId}/images`)
  return data.items
}

export async function addCatalogItemImage(itemId: number, file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<CatalogItemImage>(`/admin/catalog/${itemId}/images`, form)
  return data
}

export async function addCatalogItemImageUrl(itemId: number, url: string) {
  const { data } = await apiClient.post<CatalogItemImage>(`/admin/catalog/${itemId}/images/url`, { url })
  return data
}

export async function setCatalogItemCoverImage(itemId: number, imageId: number) {
  const { data } = await apiClient.patch<CatalogItemImage>(`/admin/catalog/${itemId}/images/${imageId}/cover`)
  return data
}

export async function deleteCatalogItemImage(itemId: number, imageId: number) {
  await apiClient.delete(`/admin/catalog/${itemId}/images/${imageId}`)
}
