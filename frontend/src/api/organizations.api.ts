import { apiClient } from './client'
import type { Organization, OrganizationListResponse } from '../types/organization.types'

export async function listOrganizations() {
  const { data } = await apiClient.get<OrganizationListResponse>('/organizations')
  return data
}

export async function updateOrganization(
  uuid: string,
  payload: Partial<{
    name: string
    slug: string
    type: string
    status: 'active' | 'suspended' | 'deleted'
    newsletter_subscribed: boolean
  }>,
) {
  const { data } = await apiClient.patch<Organization>(`/organizations/${uuid}`, payload)
  return data
}

export async function deleteOrganization(uuid: string) {
  const { data } = await apiClient.delete<Organization>(`/organizations/${uuid}`)
  return data
}

