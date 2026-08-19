import axios from 'axios'
import { getAccessToken, getActiveOrganizationUuid } from '../auth/auth.store'

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

