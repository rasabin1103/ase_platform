import { apiClient } from './client'
import type { Service, ServiceListResponse } from '../types/service.types'

function normalizeServicesPayload(data: unknown): Service[] {
  if (Array.isArray(data)) {
    return data as Service[]
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const raw = o.items ?? o.data ?? o.results
    if (Array.isArray(raw)) {
      return raw as Service[]
    }
  }
  return []
}

/** Public catalog: active services, ordered by ``display_order`` (GET /api/v1/services). */
export async function listPublicServices(params?: { limit?: number; offset?: number }): Promise<Service[]> {
  const { data } = await apiClient.get<ServiceListResponse | Service[]>('/services', {
    params: { limit: params?.limit ?? 100, offset: params?.offset ?? 0 },
  })
  return normalizeServicesPayload(data)
}
