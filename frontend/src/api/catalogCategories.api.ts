import { apiClient } from './client'

export type CategoryFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'url' | 'select'

export type CategoryFieldDef = {
  key: string
  label: string
  type: CategoryFieldType
  required: boolean
  options?: string[] | null
}

export type CatalogCategory = {
  id: number
  uuid: string
  name: string
  slug: string
  description: string | null
  fields: CategoryFieldDef[]
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CatalogCategoryPayload = {
  name: string
  slug: string
  description?: string | null
  fields?: CategoryFieldDef[]
  display_order?: number
  is_active?: boolean
}

export type CatalogCategoryUpdatePayload = Partial<CatalogCategoryPayload>

export async function listCatalogCategories(params?: { active_only?: boolean }) {
  const { data } = await apiClient.get<{ items: CatalogCategory[] }>('/admin/catalog-categories', { params })
  return data.items
}

export async function createCatalogCategory(payload: CatalogCategoryPayload) {
  const { data } = await apiClient.post<CatalogCategory>('/admin/catalog-categories', payload)
  return data
}

export async function updateCatalogCategory(categoryId: number, payload: CatalogCategoryUpdatePayload) {
  const { data } = await apiClient.patch<CatalogCategory>(`/admin/catalog-categories/${categoryId}`, payload)
  return data
}

export async function deleteCatalogCategory(categoryId: number) {
  await apiClient.delete(`/admin/catalog-categories/${categoryId}`)
}
