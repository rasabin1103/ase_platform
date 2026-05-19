export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type?: 'bearer' | string
}

export type MeResponse = {
  uuid: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url?: string | null
  has_avatar?: boolean
  phone_e164?: string | null
  phone_verified?: boolean
  two_factor_enabled?: boolean
  can_create_content?: boolean
  creator_status?: 'none' | 'pending' | 'approved' | 'rejected' | string
  status: 'active' | 'suspended' | 'deleted' | string
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
  organization_uuid?: string | null
  is_superuser?: boolean
  role_codes?: string[]
  permissions?: string[]
  primary_role?: string | null
  is_independent_user?: boolean
  consumer_mode?: boolean
  active_workspace_uuid?: string | null
}

export type RegisterRequest = {
  email: string
  plain_password: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
}

export type RegisterResponse = {
  uuid: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  status: 'active' | 'suspended' | 'deleted' | string
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

