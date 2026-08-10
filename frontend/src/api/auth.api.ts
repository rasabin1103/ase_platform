import { apiClient } from './client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
} from '../types/auth.types'
import { authDiagLog } from '../utils/authDebugLog'
type LoginPayloadRaw = LoginResponse & { token?: string; accessToken?: string }

export type LoginRequires2FA = {
  requires_2fa: true
  temporary_login_token: string
}

export type LoginResult = LoginResponse | LoginRequires2FA

export function isLoginRequires2FA(data: LoginResult): data is LoginRequires2FA {
  return 'requires_2fa' in data && data.requires_2fa === true
}

export async function login(payload: LoginRequest): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>('/auth/login', payload)
  if (isLoginRequires2FA(data)) {
    return data
  }
  const raw = data as LoginPayloadRaw
  const access_token = raw.access_token ?? raw.accessToken ?? raw.token
  const refresh_token = raw.refresh_token ?? (raw as { refreshToken?: string }).refreshToken
  if (!access_token || !refresh_token) {
    authDiagLog({ token_received: false })
    throw new Error('Login response missing access_token or refresh_token')
  }
  authDiagLog({ token_received: true })
  return { access_token, refresh_token, token_type: raw.token_type } satisfies LoginResponse
}

export type TwoFactorSetupResponse = {
  otpauth_url: string
  manual_key: string
}

export async function setupTwoFactor() {
  const { data } = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup')
  return data
}

export async function confirmTwoFactorSetup(code: string) {
  const { data } = await apiClient.post<{ recovery_codes: string[] }>('/auth/2fa/confirm', { code })
  return data
}

export async function disableTwoFactor(payload: { password: string; code: string }) {
  await apiClient.post('/auth/2fa/disable', payload)
}

export async function regenerateTwoFactorRecoveryCodes(code: string) {
  const { data } = await apiClient.post<{ recovery_codes: string[] }>(
    '/auth/2fa/recovery-codes/regenerate',
    { code },
  )
  return data
}

export async function confirmTwoFactorLogin(payload: {
  temporary_login_token: string
  code: string
}) {
  const { data: raw } = await apiClient.post<LoginPayloadRaw>('/auth/2fa/login-confirm', payload)
  const access_token = raw.access_token ?? raw.accessToken ?? raw.token
  const refresh_token = raw.refresh_token ?? (raw as { refreshToken?: string }).refreshToken
  if (!access_token || !refresh_token) {
    throw new Error('Login response missing access_token or refresh_token')
  }
  return { access_token, refresh_token, token_type: raw.token_type } satisfies LoginResponse
}

export async function register(payload: RegisterRequest) {
  const { data } = await apiClient.post<MeResponse>('/auth/register', payload)
  const role_codes = data.role_codes ?? []
  const primary_role = data.primary_role ?? null
  return { ...data, role_codes, primary_role }
}

export async function dismissSecurityWarning() {
  const { data } = await apiClient.post<MeResponse>('/auth/security-warning/dismiss')
  const role_codes = data.role_codes ?? (data as { roles?: string[] }).roles ?? []
  const primary_role =
    data.primary_role ?? (data as { primaryRole?: string | null }).primaryRole ?? null
  return { ...data, role_codes, primary_role }
}

export async function me() {
  const { data } = await apiClient.get<MeResponse>('/auth/me')
  const role_codes = data.role_codes ?? (data as { roles?: string[] }).roles ?? []
  const primary_role =
    data.primary_role ??
    (data as { primaryRole?: string | null }).primaryRole ??
    null
  return { ...data, role_codes, primary_role }
}

export type ProfileUpdateRequest = {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  avatar_url?: string | null
  email?: string | null
  phone_e164?: string | null
}

export type VerificationSendResponse = {
  message: string
  dev_code?: string | null
}

export async function sendEmailVerification() {
  const { data } = await apiClient.post<{ message: string }>('/auth/email/resend-verification')
  return data
}

export async function confirmEmailVerificationPost(token: string) {
  const { data } = await apiClient.post<{ message: string; email: string }>('/auth/email/verify', {
    token,
  })
  return data
}

export async function confirmEmailVerification(token: string) {
  const { data } = await apiClient.get<{ message: string; email: string }>('/auth/verify/email', {
    params: { token },
  })
  return data
}

export async function sendPhoneVerification() {
  const { data } = await apiClient.post<VerificationSendResponse>('/auth/me/verify/phone/send')
  return data
}

export async function confirmPhoneVerification(code: string) {
  const { data } = await apiClient.post<MeResponse>('/auth/me/verify/phone/confirm', { code })
  return data
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

export async function listWorkspaces() {
  const { data } = await apiClient.get<WorkspaceListResponse>('/auth/workspaces')
  return data
}

