import { apiClient } from './client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth.types'
import { authDiagLog } from '../utils/authDebugLog'
type LoginPayloadRaw = LoginResponse & { token?: string; accessToken?: string }

export async function login(payload: LoginRequest) {
  const { data: raw } = await apiClient.post<LoginPayloadRaw>('/auth/login', payload)
  const access_token = raw.access_token ?? raw.accessToken ?? raw.token
  const refresh_token = raw.refresh_token ?? (raw as { refreshToken?: string }).refreshToken
  if (!access_token || !refresh_token) {
    authDiagLog({ token_received: false })
    throw new Error('Login response missing access_token or refresh_token')
  }
  authDiagLog({ token_received: true })
  return { access_token, refresh_token, token_type: raw.token_type } satisfies LoginResponse
}

export async function register(payload: RegisterRequest) {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload)
  return data
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
  phone_e164?: string | null
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

