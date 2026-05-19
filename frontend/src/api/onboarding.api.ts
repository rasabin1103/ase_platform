import { apiClient } from './client'
import type { OrganizationType } from '../types/organization.types'

export type CreateOrganizationRequest = {
  organization_name: string
  organization_slug: string
  organization_type: OrganizationType
}

export type CreateOrganizationResponse = {
  organization_uuid: string
  organization_slug: string
  organization_name: string
  member_id: number
  created_at: string
}

export async function createOrganization(payload: CreateOrganizationRequest) {
  const { data } = await apiClient.post<CreateOrganizationResponse>(
    '/onboarding/create-organization',
    payload,
  )
  return data
}

