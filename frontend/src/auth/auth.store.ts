const ACCESS_TOKEN_KEY = 'ase.access_token'
const REFRESH_TOKEN_KEY = 'ase.refresh_token'
const ACTIVE_ORG_UUID_KEY = 'ase.active_organization_uuid'
// Stashed admin tokens while an impersonation session ("login as user") is
// active, so "return to admin" can restore the original session without a
// re-login. Cleared as soon as the admin returns.
const IMPERSONATOR_ACCESS_TOKEN_KEY = 'ase.impersonator_access_token'
const IMPERSONATOR_REFRESH_TOKEN_KEY = 'ase.impersonator_refresh_token'
// Unsaved draft of the profile page's "links" (social/contact) list — kept
// in localStorage (not just component state) so it survives a remount of
// ProfilePage, e.g. the user switching browser tabs and coming back, or
// navigating to another page and returning before hitting "Guardar".
const PROFILE_LINKS_DRAFT_KEY = 'ase.profile_links_draft'

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

export function stashImpersonatorTokens(tokens: { access_token: string; refresh_token: string }) {
  localStorage.setItem(IMPERSONATOR_ACCESS_TOKEN_KEY, tokens.access_token)
  localStorage.setItem(IMPERSONATOR_REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function getStashedImpersonatorTokens(): { access_token: string; refresh_token: string } | null {
  const access_token = localStorage.getItem(IMPERSONATOR_ACCESS_TOKEN_KEY)
  const refresh_token = localStorage.getItem(IMPERSONATOR_REFRESH_TOKEN_KEY)
  if (!access_token || !refresh_token) return null
  return { access_token, refresh_token }
}

export function clearImpersonatorTokens() {
  localStorage.removeItem(IMPERSONATOR_ACCESS_TOKEN_KEY)
  localStorage.removeItem(IMPERSONATOR_REFRESH_TOKEN_KEY)
}

export function isImpersonating(): boolean {
  return getStashedImpersonatorTokens() !== null
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

export type ProfileLinkDraft = { label: string; url: string }

export function getProfileLinksDraft(): ProfileLinkDraft[] | null {
  try {
    const raw = localStorage.getItem(PROFILE_LINKS_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed as ProfileLinkDraft[]
  } catch {
    return null
  }
}

export function setProfileLinksDraft(links: ProfileLinkDraft[]) {
  try {
    localStorage.setItem(PROFILE_LINKS_DRAFT_KEY, JSON.stringify(links))
  } catch {
    // best-effort — private browsing / quota exceeded shouldn't break editing
  }
}

export function clearProfileLinksDraft() {
  localStorage.removeItem(PROFILE_LINKS_DRAFT_KEY)
}

