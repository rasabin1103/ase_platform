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

export type CatalogItemAdmin = {
  id: number
  uuid: string
  title: string
  slug: string
  type: CatalogItemType
  category: string
  short_description: string
  long_description: string
  image_url: string
  images: CatalogItemImage[]
  preview_url: string | null
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
  custom_fields: Record<string, unknown>
  has_stored_image?: boolean
  dimension_selections?: DimensionSelection[]
  page_count?: number | null
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
  image_url: string
  preview_url?: string | null
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
  custom_fields?: Record<string, unknown>
  dimension_selections?: DimensionSelection[]
  page_count?: number | null
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
