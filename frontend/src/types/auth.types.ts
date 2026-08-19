export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type?: 'bearer' | string
  // True when the account authenticated successfully but is still
  // suspended pending mandatory 2FA setup — the app should route straight
  // to the forced 2FA setup gate instead of the normal dashboard.
  requires_two_factor_setup?: boolean
}

export type TwoFactorChallengeResponse = {
  two_factor_required: true
  challenge_token: string
}

export type TwoFactorSetupResponse = {
  secret: string
  otpauth_uri: string
  qr_code_data_uri: string
}

export type UserLink = {
  id: number
  label: string
  url: string
  display_order: number
}

export type MeResponse = {
  uuid: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url?: string | null
  has_avatar?: boolean
  country?: string | null
  phone_e164?: string | null
  phone_verified?: boolean
  two_factor_enabled?: boolean
  can_create_content?: boolean
  creator_status?: 'none' | 'pending' | 'approved' | 'rejected' | string
  status: 'active' | 'suspended' | 'deleted' | string
  // Only meaningful when status === 'suspended'. 'two_factor_required' or
  // 'inactivity' means an automated policy did it (self-recoverable); null
  // means either never suspended or suspended manually by an admin.
  suspension_reason?: 'two_factor_required' | 'inactivity' | string | null
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
  links?: UserLink[]
  // Current plan on the user's default workspace — null for free/no-plan accounts.
  plan_code?: string | null
  plan_name?: string | null
  plan_name_en?: string | null
  subscription_status?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' | string | null
  // Loyalty reward tier from subscriber tenure — null means no tier yet.
  loyalty_tier?: 'silver' | 'gold' | 'platinum' | 'infinite' | string | null
  // Opt-in weekly digest — off by default (GDPR-safe), user activates it.
  newsletter_subscribed?: boolean
}

export type RegisterRequest = {
  email: string
  plain_password: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  /** ISO 3166-1 alpha-2 code, e.g. "ES" — required by the backend. */
  country: string
  /** 'es' | 'en' — the UI language active on the registration form, so
   * transactional emails (verification, password reset, etc.) go out in
   * the language the person actually reads. */
  preferred_language?: string
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

