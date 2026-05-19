import { apiClient } from './client'

export async function listRoles() {
  const { data } = await apiClient.get<string[]>('/roles')
  return data
}

