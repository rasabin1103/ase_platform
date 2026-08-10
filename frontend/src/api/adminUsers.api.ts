import { apiClient } from './client'

export type AdminUserStatus = 'active' | 'inactive' | 'suspended' | 'deleted' | 'invited' | string

export type AdminUser = {
  id: number
  uuid: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  phone_e164?: string | null
  status: AdminUserStatus
  primary_role: string | null
  roles: string[]
  avatar_url?: string | null
  can_create_content: boolean
  creator_status: 'none' | 'pending' | 'approved' | 'rejected' | string
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export type AdminUserListResponse = {
  items: AdminUser[]
  limit: number
  offset: number
  total: number
}

export type AdminUserCreatePayload = {
  email: string
  password: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  status?: AdminUserStatus
  role: string
  can_create_content?: boolean
  creator_status?: string
}

export type AdminUserUpdatePayload = {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  phone_e164?: string | null
  avatar_url?: string | null
  role?: string | null
  status?: AdminUserStatus | null
  can_create_content?: boolean | null
  creator_status?: string | null
}

export async function listAdminUsers(params?: {
  limit?: number
  offset?: number
  status?: string
  role?: string
  search?: string
}) {
  const { data } = await apiClient.get<AdminUserListResponse>('/admin/users', { params })
  return data
}

export async function createAdminUser(payload: AdminUserCreatePayload) {
  const { data } = await apiClient.post<AdminUser>('/admin/users', payload)
  return data
}

export async function updateAdminUser(userId: string, payload: AdminUserUpdatePayload) {
  const { data } = await apiClient.put<AdminUser>(`/admin/users/${userId}`, payload)
  return data
}

export async function patchAdminUserStatus(userId: string, status: AdminUserStatus) {
  const { data } = await apiClient.patch<AdminUser>(`/admin/users/${userId}/status`, { status })
  return data
}

export async function deleteAdminUser(userId: string) {
  await apiClient.delete(`/admin/users/${userId}`)
}
