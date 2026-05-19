import { apiClient } from './client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth.types'

export async function login(payload: LoginRequest) {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
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

