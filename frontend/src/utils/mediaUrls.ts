import { API_BASE_URL } from '../api/client'

/** Paths for apiClient (baseURL already includes /api/v1). */
export function toApiClientPath(path: string): string {
  if (path.startsWith('/api/v1/')) return path.slice('/api/v1'.length)
  if (path.startsWith('/api/v1')) return path.slice('/api/v1'.length) || '/'
  return path.startsWith('/') ? path : `/${path}`
}

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
  const base = API_BASE_URL.replace(/\/$/, '')
  if (path.startsWith('/api/v1/')) return `${base}${path.slice('/api/v1'.length)}`
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function isApiMediaPath(path: string | null | undefined): boolean {
  if (!path) return false
  return path.startsWith('/api/v1/') || path.startsWith('/auth/') || path.startsWith('/media/')
}

export function avatarDisplayPath(hasAvatar: boolean | undefined, avatarUrl: string | null | undefined): string | null {
  if (hasAvatar) return avatarUrl ?? '/auth/me/avatar'
  if (avatarUrl && !isApiMediaPath(avatarUrl)) return avatarUrl
  return null
}
