export type Organization = {
  uuid: string
  name: string
  slug: string
  type: 'individual' | 'business' | 'enterprise' | 'academy' | string
  status: 'active' | 'suspended' | 'deleted' | string
  owner_user_uuid?: string
  current_user_membership_status?: 'active' | 'invited' | 'suspended' | string | null
  current_user_role_codes?: string[]
  created_at?: string
  updated_at?: string
}

export type OrganizationType = 'individual' | 'business' | 'enterprise' | 'academy'

export type OrganizationListResponse = {
  items: Organization[]
  limit: number
  offset: number
  total: number
}

