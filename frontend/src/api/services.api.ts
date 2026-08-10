import { apiClient } from './client'
import type {
  Service,
  ServiceCreateRequest,
  ServiceListResponse,
  ServiceUpdateRequest,
} from '../types/service.types'

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

/** Admin management listing (GET /api/v1/services/manage) — requires products.manage. */
export async function listServicesManage(params?: {
  limit?: number
  offset?: number
  is_active?: boolean | null
  category?: string | null
}) {
  const { data } = await apiClient.get<ServiceListResponse>('/services/manage', {
    params: {
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0,
      is_active: params?.is_active ?? undefined,
      category: params?.category ?? undefined,
    },
  })
  return data
}

export async function createService(payload: ServiceCreateRequest) {
  const { data } = await apiClient.post<Service>('/services', payload)
  return data
}

export async function updateService(serviceUuid: string, payload: ServiceUpdateRequest) {
  const { data } = await apiClient.patch<Service>(`/services/${serviceUuid}`, payload)
  return data
}

/** Soft-delete (deactivates) a service. */
export async function deleteService(serviceUuid: string) {
  const { data } = await apiClient.delete<Service>(`/services/${serviceUuid}`)
  return data
}
