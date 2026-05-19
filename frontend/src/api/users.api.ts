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

