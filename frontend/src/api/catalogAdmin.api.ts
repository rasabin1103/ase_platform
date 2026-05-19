import { apiClient } from './client'
import type { CatalogItemLevel, CatalogItemStatus, CatalogItemType } from '../types/catalog.types'

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
  has_stored_image?: boolean
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
}

export type CatalogItemAdminUpdatePayload = Partial<Omit<CatalogItemAdminPayload, 'type' | 'slug'>>

export async function listAdminCatalog(params?: {
  limit?: number
  offset?: number
  type?: CatalogItemType
  search?: string
}) {
  const { data } = await apiClient.get<CatalogAdminListResponse>('/admin/catalog', { params })
  return data
}

export async function getAdminCatalogItem(itemId: number) {
  const { data } = await apiClient.get<CatalogItemAdmin>(`/admin/catalog/${itemId}`)
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
