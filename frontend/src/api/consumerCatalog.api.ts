import { apiClient } from './client'
import type { CatalogItem, CatalogItemListResponse, CatalogItemType } from '../types/catalog.types'

export type ListCatalogParams = {
  limit?: number
  offset?: number
  type?: CatalogItemType
  category?: string
  search?: string
  favorites_only?: boolean
  purchased_only?: boolean
}

export async function listConsumerCatalog(params?: ListCatalogParams) {
  const { data } = await apiClient.get<CatalogItemListResponse>('/consumer-catalog', { params })
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
