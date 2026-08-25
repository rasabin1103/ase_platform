import { apiClient } from './client'

export async function leaveOrganization(organizationUuid: string) {
  await apiClient.post(`/organization-members/${organizationUuid}/leave`)
}
