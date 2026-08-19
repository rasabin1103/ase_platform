import { apiClient } from './client'

export type PricingPillarCode = 'product' | 'course' | 'book' | 'resource' | 'service'

export type PricingDimensionLevel = {
  id: number
  uuid: string
  dimension_type_id: number
  label: string
  multiplier: number
  min_value: number | null
  max_value: number | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PricingDimensionType = {
  id: number
  uuid: string
  pillar_code: PricingPillarCode
  code: string
  label: string
  is_range_based: boolean
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PricingDimensionTypeConfig = {
  id: number
  uuid: string
  code: string
  label: string
  is_range_based: boolean
  display_order: number
  is_active: boolean
  levels: PricingDimensionLevel[]
}

export type PricingPillarConfig = {
  code: PricingPillarCode
  base_price: number
  dimension_types: PricingDimensionTypeConfig[]
}

export type PricingConfigResponse = {
  pillars: PricingPillarConfig[]
}

export async function getPricingConfig() {
  const { data } = await apiClient.get<PricingConfigResponse>('/admin/pricing/config')
  return data
}

export async function updatePillarBasePrice(code: PricingPillarCode, base_price: number) {
  const { data } = await apiClient.patch<PricingConfigResponse>(`/admin/pricing/pillars/${code}`, { base_price })
  return data
}

export type PricingDimensionTypePayload = {
  pillar_code: PricingPillarCode
  code: string
  label: string
  is_range_based?: boolean
  display_order?: number
  is_active?: boolean
}

export async function createPricingDimensionType(payload: PricingDimensionTypePayload) {
  const { data } = await apiClient.post<PricingDimensionType>('/admin/pricing/dimension-types', payload)
  return data
}

export async function updatePricingDimensionType(
  id: number,
  payload: Partial<Omit<PricingDimensionTypePayload, 'pillar_code' | 'code'>>,
) {
  const { data } = await apiClient.patch<PricingDimensionType>(`/admin/pricing/dimension-types/${id}`, payload)
  return data
}

export async function deletePricingDimensionType(id: number) {
  await apiClient.delete(`/admin/pricing/dimension-types/${id}`)
}

export type PricingDimensionLevelPayload = {
  dimension_type_id: number
  label: string
  multiplier: number
  min_value?: number | null
  max_value?: number | null
  display_order?: number
  is_active?: boolean
}

export async function createPricingDimensionLevel(payload: PricingDimensionLevelPayload) {
  const { data } = await apiClient.post<PricingDimensionLevel>('/admin/pricing/dimension-levels', payload)
  return data
}

export async function updatePricingDimensionLevel(id: number, payload: Partial<PricingDimensionLevelPayload>) {
  const { data } = await apiClient.patch<PricingDimensionLevel>(`/admin/pricing/dimension-levels/${id}`, payload)
  return data
}

export async function deletePricingDimensionLevel(id: number) {
  await apiClient.delete(`/admin/pricing/dimension-levels/${id}`)
}
