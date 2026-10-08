import { apiClient } from './client'

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type AccessRequestType = 'product_access' | 'demo_access' | 'creator_access'
export type AccessTargetType =
  | 'product'
  | 'course'
  | 'book'
  | 'resource'
  | 'platform_creator_permission'

export type MeAccessRequest = {
  id: number
  uuid: string
  request_type: AccessRequestType | string
  target_type: string
  target_id: string
  title: string
  message: string | null
  status: AccessRequestStatus | string
  admin_notes: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type RequesterSummary = {
  user_id: number
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  has_avatar: boolean
}

export type AdminAccessRequest = MeAccessRequest & {
  requester: RequesterSummary
  organization_name?: string | null
  /** Escalada por la organización al equipo de la plataforma. */
  escalated_at?: string | null
  escalation_note?: string | null
}

/** Solicitud vista por el owner/admin de una organización (solo las de su organización). */
export type OrgAccessRequest = {
  id: number
  uuid: string
  organization_id: number | null
  request_type: AccessRequestType | string
  target_entity_type: string
  target_entity_id: string
  title: string
  description: string | null
  status: AccessRequestStatus | string
  created_at: string
  updated_at: string
  reviewed_at: string | null
  admin_notes: string | null
  requested_by_email: string | null
  requested_by_name: string | null
  escalated_at: string | null
  escalation_note: string | null
}

export async function listOrgAccessRequests(params?: { limit?: number; offset?: number; status?: AccessRequestStatus }) {
  const { data } = await apiClient.get<AccessRequestListResponse<OrgAccessRequest>>('/access-requests', { params })
  return data
}

export async function approveOrgAccessRequest(id: number) {
  const { data } = await apiClient.post<OrgAccessRequest>(`/access-requests/${id}/approve`)
  return data
}

export async function rejectOrgAccessRequest(id: number, admin_notes?: string) {
  const { data } = await apiClient.post<OrgAccessRequest>(`/access-requests/${id}/reject`, { admin_notes })
  return data
}

export async function escalateOrgAccessRequest(id: number, note?: string) {
  const { data } = await apiClient.post<OrgAccessRequest>(`/access-requests/${id}/escalate`, { note })
  return data
}

export type AccessRequestListResponse<T> = {
  items: T[]
  limit: number
  offset: number
  total: number
}

export async function createMyAccessRequest(body: {
  request_type: AccessRequestType
  target_type: AccessTargetType
  target_id?: string | null
  title: string
  message?: string | null
}) {
  const { data } = await apiClient.post<MeAccessRequest>('/me/access-requests', body)
  return data
}

export async function listMyAccessRequests(params?: {
  limit?: number
  offset?: number
  status?: AccessRequestStatus
}) {
  const { data } = await apiClient.get<AccessRequestListResponse<MeAccessRequest>>('/me/access-requests', {
    params,
  })
  return data
}

export async function listAdminAccessRequests(params?: {
  limit?: number
  offset?: number
  status?: AccessRequestStatus
  escalated?: boolean
}) {
  const { data } = await apiClient.get<AccessRequestListResponse<AdminAccessRequest>>(
    '/admin/access-requests',
    { params },
  )
  return data
}

export async function reviewAdminAccessRequest(
  id: number,
  body: { status: 'approved' | 'rejected'; admin_notes?: string | null },
) {
  const { data } = await apiClient.patch<AdminAccessRequest>(
    `/admin/access-requests/${id}/review`,
    body,
  )
  return data
}
