import { apiClient } from './client'
import type { User, UserCreateRequest, UserListResponse, UserUpdateRequest } from '../types/user.types'

export async function listUsers(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<UserListResponse>('/users', { params })
  return data
}

export async function createUser(payload: UserCreateRequest) {
  const { data } = await apiClient.post<User>('/users', payload)
  return data
}

export async function updateUser(user_uuid: string, payload: UserUpdateRequest) {
  const { data } = await apiClient.patch<User>(`/users/${user_uuid}`, payload)
  return data
}

export async function deleteUser(user_uuid: string) {
  const { data } = await apiClient.delete<User>(`/users/${user_uuid}`)
  return data
}

export type ImpersonationToken = {
  access_token: string
  token_type: string
  expires_in_minutes: number
  target_email: string
}

export async function impersonateUser(user_uuid: string) {
  const { data } = await apiClient.post<ImpersonationToken>(`/users/${user_uuid}/impersonate`)
  return data
}

export type UserOrganizationMembership = {
  organization_uuid: string
  organization_name: string
  organization_type: string
  membership_status: string
  role_codes: string[]
}

export type UserPlan = {
  plan_code: string | null
  plan_name: string | null
  plan_name_en: string | null
  subscription_status: string | null
}

export type UserPurchaseRecent = {
  catalog_item_title: string
  catalog_item_type: string
  source: string
  purchased_at: string
}

export type UserTestRunStatusCounts = {
  pending: number
  queued: number
  in_progress: number
  completed: number
  failed_to_dispatch: number
}

export type UserTestRunConclusionCounts = {
  success: number
  failure: number
  cancelled: number
  timed_out: number
  action_required: number
  unknown: number
}

export type UserTestRunRecent = {
  uuid: string
  catalog_item_title: string
  status: string
  conclusion: string | null
  created_at: string
}

export type UserStats = {
  user: User
  loyalty_tier: string | null
  country: string | null
  plan: UserPlan
  organizations: UserOrganizationMembership[]
  purchases_total: number
  purchases_recent: UserPurchaseRecent[]
  test_runs_total: number
  test_runs_by_status: UserTestRunStatusCounts
  test_runs_by_conclusion: UserTestRunConclusionCounts
  test_runs_recent: UserTestRunRecent[]
}

export async function getUserStats(user_uuid: string) {
  const { data } = await apiClient.get<UserStats>(`/users/${user_uuid}/stats`)
  return data
}

