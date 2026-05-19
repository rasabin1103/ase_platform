import { apiClient } from './client'

export async function listPermissions() {
  const { data } = await apiClient.get<string[]>('/permissions')
  return data
}

