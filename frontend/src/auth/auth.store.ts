const ACCESS_TOKEN_KEY = 'ase.access_token'
const REFRESH_TOKEN_KEY = 'ase.refresh_token'
const ACTIVE_ORG_UUID_KEY = 'ase.active_organization_uuid'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearTokens() {
  clearAccessToken()
  clearRefreshToken()
}

export function getActiveOrganizationUuid(): string | null {
  return localStorage.getItem(ACTIVE_ORG_UUID_KEY)
}

export function setActiveOrganizationUuid(uuid: string) {
  localStorage.setItem(ACTIVE_ORG_UUID_KEY, uuid)
}

export function clearActiveOrganizationUuid() {
  localStorage.removeItem(ACTIVE_ORG_UUID_KEY)
}

