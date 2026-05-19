export type UserStatus = 'active' | 'suspended' | 'deleted' | string

export type User = {
  uuid: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  status: UserStatus
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type UserListResponse = {
  items: User[]
  limit: number
  offset: number
  total: number
}

export type UserCreateRequest = {
  email: string
  plain_password: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  status?: UserStatus
}

export type UserUpdateRequest = {
  email?: string | null
  plain_password?: string | null
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  status?: UserStatus | null
}

