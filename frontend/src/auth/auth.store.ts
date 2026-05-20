import { authDiagLog } from '../utils/authDebugLog'

/** Canonical storage keys (namespaced). Also mirrored to plain keys for tooling / legacy snippets. */
const PRIMARY_ACCESS_KEY = 'ase.access_token'
const MIRROR_ACCESS_KEYS = ['access_token'] as const

const PRIMARY_REFRESH_KEY = 'ase.refresh_token'
const MIRROR_REFRESH_KEYS = ['refresh_token'] as const

const ACTIVE_ORG_UUID_KEY = 'ase.active_organization_uuid'
const LAST_API_ACTIVITY_AT = 'ase.last_api_activity_at'

function readIdleTimeoutMs(): number {
  const v = import.meta.env.VITE_SESSION_IDLE_MINUTES
  const raw = typeof v === 'string' ? v.trim() : String(v ?? '')
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 0
  return n * 60_000
}

export function touchApiActivity(): void {
  try {
    localStorage.setItem(LAST_API_ACTIVITY_AT, String(Date.now()))
  } catch {
    /* ignore */
  }
}

function clearApiActivity(): void {
  try {
    localStorage.removeItem(LAST_API_ACTIVITY_AT)
  } catch {
    /* ignore */
  }
}

/** If VITE_SESSION_IDLE_MINUTES is set, logout when no successful API response for that long. */
export function assertSessionNotIdleOrThrow(): void {
  const maxMs = readIdleTimeoutMs()
  if (!maxMs) return
  const raw = localStorage.getItem(LAST_API_ACTIVITY_AT)
  if (!raw) return
  const last = Number(raw)
  if (!Number.isFinite(last)) return
  if (Date.now() - last > maxMs) {
    clearTokens()
    clearActiveOrganizationUuid()
    throw new Error('SESSION_IDLE_TIMEOUT')
  }
}
  if (raw == null) return null
  let t = String(raw).trim()
  if (!t || t === 'undefined' || t === 'null') return null
  if (/^bearer\s+/i.test(t)) {
    t = t.replace(/^bearer\s+/i, '').trim()
  }
  return t || null
}

export function getAccessToken(): string | null {
  for (const key of [PRIMARY_ACCESS_KEY, ...MIRROR_ACCESS_KEYS]) {
    const raw = localStorage.getItem(key)
    const t = normalizeStoredToken(raw)
    if (t) {
      if (key !== PRIMARY_ACCESS_KEY) {
        try {
          localStorage.setItem(PRIMARY_ACCESS_KEY, t)
        } catch {
          /* ignore quota */
        }
      }
      return t
    }
  }
  return null
}

export function setAccessToken(token: string) {
  const t = normalizeStoredToken(token)
  if (!t) {
    authDiagLog({ token_saved: false })
    clearAccessToken()
    return
  }
  localStorage.setItem(PRIMARY_ACCESS_KEY, t)
  for (const k of MIRROR_ACCESS_KEYS) {
    localStorage.setItem(k, t)
  }
  authDiagLog({ token_saved: true })
}

export function getRefreshToken(): string | null {
  for (const key of [PRIMARY_REFRESH_KEY, ...MIRROR_REFRESH_KEYS]) {
    const raw = localStorage.getItem(key)
    const t = normalizeStoredToken(raw)
    if (t) {
      if (key !== PRIMARY_REFRESH_KEY) {
        try {
          localStorage.setItem(PRIMARY_REFRESH_KEY, t)
        } catch {
          /* ignore */
        }
      }
      return t
    }
  }
  return null
}

export function setRefreshToken(token: string) {
  const t = normalizeStoredToken(token)
  if (!t) {
    clearRefreshToken()
    return
  }
  localStorage.setItem(PRIMARY_REFRESH_KEY, t)
  for (const k of MIRROR_REFRESH_KEYS) {
    localStorage.setItem(k, t)
  }
}

export function clearAccessToken() {
  localStorage.removeItem(PRIMARY_ACCESS_KEY)
  for (const k of MIRROR_ACCESS_KEYS) {
    localStorage.removeItem(k)
  }
}

export function clearRefreshToken() {
  localStorage.removeItem(PRIMARY_REFRESH_KEY)
  for (const k of MIRROR_REFRESH_KEYS) {
    localStorage.removeItem(k)
  }
}

export function clearTokens() {
  clearAccessToken()
  clearRefreshToken()
  clearApiActivity()
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
