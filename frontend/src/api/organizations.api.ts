import { apiClient } from './client'
import type { OrganizationListResponse } from '../types/organization.types'

export async function listOrganizations() {
  const { data } = await apiClient.get<OrganizationListResponse>('/organizations')
  return data
}

