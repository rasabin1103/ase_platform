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
