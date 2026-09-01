import { apiClient } from './client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  TwoFactorChallengeResponse,
  TwoFactorSetupResponse,
  UserLink,
} from '../types/auth.types'

export async function login(payload: LoginRequest) {
  const { data } = await apiClient.post<LoginResponse | TwoFactorChallengeResponse>('/auth/login', payload)
  return data
}

export async function verifyLoginTwoFactor(challenge_token: string, code: string) {
  const { data } = await apiClient.post<LoginResponse>('/auth/2fa/verify-login', { challenge_token, code })
  return data
}

/** Trades a still-valid refresh token for a brand-new access+refresh pair,
 * without re-entering credentials — powers "stay signed in" on the
 * session-expiry warning (see SessionExpiryModal). Throws (401) once the
 * refresh token itself has expired or been revoked; the caller falls back
 * to a normal logout in that case. */
export async function refreshTokens(refresh_token: string) {
  const { data } = await apiClient.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
    refresh_token,
  })
  return data
}

export async function setupTwoFactor() {
  const { data } = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup')
  return data
}

export async function confirmTwoFactor(code: string) {
  const { data } = await apiClient.post<{ ok: boolean }>('/auth/2fa/confirm', { code })
  return data
}

export async function disableTwoFactor(password: string) {
  const { data } = await apiClient.post<{ ok: boolean }>('/auth/2fa/disable', { password })
  return data
}

export async function register(payload: RegisterRequest) {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload)
  return data
}

export async function me() {
  const { data } = await apiClient.get<MeResponse>('/auth/me')
  return data
}

export type ProfileUpdateRequest = {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  avatar_url?: string | null
  phone_e164?: string | null
  newsletter_subscribed?: boolean
}

export async function updateProfile(payload: ProfileUpdateRequest) {
  const { data } = await apiClient.patch<MeResponse>('/auth/me', payload)
  return data
}

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file, file.name)
  const { data } = await apiClient.post<MeResponse>('/auth/me/avatar', form)
  return data
}

export type Workspace = {
  uuid: string
  name: string
  slug: string
  type: string
  is_default: boolean
}

export type WorkspaceListResponse = {
  items: Workspace[]
  default_workspace_uuid: string | null
}

export type UserLinkInput = {
  label: string
  url: string
}

export async function replaceMyLinks(items: UserLinkInput[]) {
  const { data } = await apiClient.put<MeResponse>('/auth/me/links', { items })
  return data
}

export type { UserLink }

export async function listWorkspaces() {
  const { data } = await apiClient.get<WorkspaceListResponse>('/auth/workspaces')
  return data
}

export async function requestPasswordReset(email: string) {
  const { data } = await apiClient.post<{ ok: boolean }>('/auth/password-reset/request', { email })
  return data
}

export async function confirmPasswordReset(token: string, new_password: string) {
  const { data } = await apiClient.post<{ ok: boolean }>('/auth/password-reset/confirm', { token, new_password })
  return data
}

export async function resendVerificationEmail() {
  const { data } = await apiClient.post<{ ok: boolean }>('/auth/email-verification/resend')
  return data
}

export async function confirmEmailVerification(token: string) {
  const { data } = await apiClient.post<{ ok: boolean }>('/auth/email-verification/confirm', { token })
  return data
}

