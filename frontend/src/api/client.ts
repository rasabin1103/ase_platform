import axios, { AxiosHeaders, isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  assertSessionNotIdleOrThrow,
  clearActiveOrganizationUuid,
  clearTokens,
  getAccessToken,
  getActiveOrganizationUuid,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  touchApiActivity,
} from '../auth/auth.store'
import { authDiagLog } from '../utils/authDebugLog'
import {
  emitSecurityOnboardingBlocked,
  parseSecurityOnboardingError,
} from '../auth/securityOnboardingEvents'

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

type InternalConfig = InternalAxiosRequestConfig & { _aseRefreshTried?: boolean }

function parseTokenPair(raw: unknown): { access_token: string; refresh_token: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const access_token = String(r.access_token ?? r.accessToken ?? r.token ?? '').trim()
  const refresh_token = String(r.refresh_token ?? r.refreshToken ?? '').trim()
  if (!access_token || !refresh_token) return null
  return { access_token, refresh_token }
}

let refreshChain: Promise<void> | null = null

async function performTokenRefresh(): Promise<void> {
  const rt = getRefreshToken()
  if (!rt) throw new Error('missing_refresh_token')
  const { data, status } = await axios.post<unknown>(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: rt },
    { headers: { 'Content-Type': 'application/json' } },
  )
  if (status !== 200) throw new Error(`refresh_http_${status}`)
  const pair = parseTokenPair(data)
  if (!pair) throw new Error('invalid_refresh_payload')
  setAccessToken(pair.access_token)
  setRefreshToken(pair.refresh_token)
}

function refreshTokensOnce(): Promise<void> {
  if (!refreshChain) {
    refreshChain = performTokenRefresh().finally(() => {
      refreshChain = null
    })
  }
  return refreshChain
}

apiClient.interceptors.request.use((config) => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL is not set. Define it in ase_frontend/.env')
  }
  const rel = String(config.url ?? '').split('?')[0] ?? ''
  const skipIdleCheck =
    /(^|\/)auth\/email\/verify$/.test(rel) || /(^|\/)auth\/2fa\/login-confirm$/.test(rel)
  if (!skipIdleCheck) {
    try {
      assertSessionNotIdleOrThrow()
    } catch (err) {
      return Promise.reject(err)
    }
  }
  const token = getAccessToken()
  const hasAuth = Boolean(token && token.length > 0)
  const headers = AxiosHeaders.from(config.headers ?? {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const orgUuid = getActiveOrganizationUuid()
  if (orgUuid) {
    headers.set('X-Organization-UUID', orgUuid)
  }
  config.headers = headers
  const method = String(config.method ?? 'get').toLowerCase()
  if (method === 'get' && /(^|\/)auth\/me$/.test(rel)) {
    authDiagLog({ me_request_has_authorization: hasAuth })
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    touchApiActivity()
    return response
  },
  async (error) => {
    if (!isAxiosError(error) || !error.config) {
      return Promise.reject(error)
    }
    const status = error.response?.status
    const original = error.config as InternalConfig
    if (status === 403) {
      const detail = parseSecurityOnboardingError(error.response?.data?.detail)
      if (detail) {
        emitSecurityOnboardingBlocked(detail)
      }
    }
    if (status !== 401 || original._aseRefreshTried) {
      return Promise.reject(error)
    }
    const rel = String(original.url ?? '').split('?')[0] ?? ''
    if (
      /(^|\/)auth\/login$/.test(rel) ||
      /(^|\/)auth\/refresh$/.test(rel) ||
      /(^|\/)auth\/register$/.test(rel)
    ) {
      return Promise.reject(error)
    }
    original._aseRefreshTried = true
    try {
      await refreshTokensOnce()
      const headers = AxiosHeaders.from(original.headers ?? {})
      const nt = getAccessToken()
      if (nt) {
        headers.set('Authorization', `Bearer ${nt}`)
      }
      original.headers = headers
      return apiClient.request(original)
    } catch {
      clearTokens()
      clearActiveOrganizationUuid()
      return Promise.reject(error)
    }
  },
)
