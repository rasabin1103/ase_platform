export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type?: 'bearer' | string
}

export type SecurityOnboardingStatus =
  | 'completed'
  | 'pending_email_verification'
  | 'pending_mfa_setup'
  | 'pending_both'

export type MeResponse = {
  id?: number
  uuid: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url?: string | null
  has_avatar?: boolean
  phone_e164?: string | null
  phone_verified?: boolean
  email_verified?: boolean
  two_factor_enabled?: boolean
  two_factor_confirmed_at?: string | null
  mfa_enabled?: boolean
  mfa_verified_at?: string | null
  security_onboarding_completed_at?: string | null
  security_warning_dismissed_at?: string | null
  security_warning_count?: number
  security_onboarding_status?: SecurityOnboardingStatus
  requires_security_onboarding?: boolean
  can_dismiss_security_warning?: boolean
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
  dashboard_mode?: 'independent' | 'organization' | 'platform_admin'
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

