import axios from 'axios'
import { clearTokens, flagSessionExpired, getAccessToken, getActiveOrganizationUuid } from '../auth/auth.store'
import { getJwtExpiryMs } from '../utils/jwt'

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Without this, axios has no timeout at all — if the backend is slow to
  // wake up (e.g. a cold-started Railway service) or the network stalls,
  // requests hang indefinitely and the UI (spinners, pending states) never
  // resolves into a visible error. 20s is generous enough for a cold start
  // but still turns an indefinite hang into a bounded, user-visible failure.
  timeout: 20000,
  // Serialize array query params (e.g. `tags: string[]`) as repeated
  // `key=a&key=b` pairs instead of axios's default `key[]=a&key[]=b` —
  // FastAPI's `Query(default=None)` on a `list[str]` param only recognizes
  // the repeated-key form.
  paramsSerializer: { indexes: null },
})

apiClient.interceptors.request.use((config) => {
  if (!API_BASE_URL && import.meta.env.PROD) {
    throw new Error('VITE_API_URL is not set. Define it in frontend/.env.local')
  }
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  const orgUuid = getActiveOrganizationUuid()
  if (orgUuid) {
    config.headers = config.headers ?? {}
    config.headers['X-Organization-UUID'] = orgUuid
  }
  return config
})


// Si una petición autenticada devuelve 401 y el token ya caducó (pestaña
// olvidada abierta), la sesión se cierra por inactividad: se limpia y se lleva
// a /login con un aviso claro. Un 401 con token vigente (p. ej. un código 2FA
// erróneo) NO cierra la sesión.
let redirectingToLogin = false
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && !redirectingToLogin) {
      const token = getAccessToken()
      const expiry = token ? getJwtExpiryMs(token) : null
      if (token && expiry !== null && expiry <= Date.now() && window.location.pathname !== '/login') {
        redirectingToLogin = true
        flagSessionExpired()
        clearTokens()
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)
