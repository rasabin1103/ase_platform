import { apiClient } from './client'
import type { CatalogItem, CatalogItemListResponse } from '../types/catalog.types'

export type GrantTarget = {
  uuid: string
  email: string
  displayName?: string | null
}

export type GrantTargetListResponse = {
  items: GrantTarget[]
}

export type GrantProductResponse = {
  granted: boolean
  alreadyOwned: boolean
  item: CatalogItem
  targetEmail: string
}

export type MemberCatalogStatItem = {
  slug: string
  title: string
  type: string
  imageUrl: string
}

export type MemberCatalogStat = {
  uuid: string
  email: string
  displayName?: string | null
  sentCount: number
  consumedCount: number
  sentItems: MemberCatalogStatItem[]
  consumedItems: MemberCatalogStatItem[]
}

export type MemberCatalogStatsListResponse = {
  items: MemberCatalogStat[]
}

export async function listOrgCatalogItems(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<CatalogItemListResponse>('/organizations/me/catalog-items', { params })
  return data
}

export async function associateOrgCatalogItem(slug: string) {
  const { data } = await apiClient.post(`/organizations/me/catalog-items/${slug}`)
  return data
}

export async function removeOrgCatalogItem(slug: string) {
  const { data } = await apiClient.delete(`/organizations/me/catalog-items/${slug}`)
  return data
}

export async function searchGrantTargets(search?: string) {
  const { data } = await apiClient.get<GrantTargetListResponse>('/organizations/me/grant-targets', {
    params: search ? { search } : undefined,
  })
  return data
}

export async function grantOrgProduct(payload: { catalogItemSlug: string; userUuid: string }) {
  const { data } = await apiClient.post<GrantProductResponse>('/organizations/me/grant', payload)
  return data
}

export async function getMemberCatalogStats() {
  const { data } = await apiClient.get<MemberCatalogStatsListResponse>('/organizations/me/member-catalog-stats')
  return data
}

export type OrganizationAnalytics = {
  currency: string
  totalSpend: string | number
  spendByType: Array<{ type: string; totalSpend: string | number; count: number }>
  catalogByType: Array<{ type: string; count: number }>
  membersByRole: Array<{ roleCode: string; count: number }>
  courseRecipients: Array<{ slug: string; title: string; recipientCount: number }>
}

export async function getOrganizationAnalytics() {
  const { data } = await apiClient.get<OrganizationAnalytics>('/organizations/me/analytics')
  return data
}
