import { API_BASE_URL } from './client'

export type HealthResponse = {
  status?: string
}

export type HealthDbResponse = {
  status?: string
  db?: string
}

export type PlatformHealth = {
  backendOk: boolean
  dbOk: boolean
}

/**
 * `/health` and `/health/db` live at the API origin, not under `/api/v1`.
 * Derive that origin from the same `VITE_API_URL` the rest of the app uses
 * (relative `/api/v1` in dev — proxied by Vite; an absolute URL in
 * production) instead of the separate, dev-only `VITE_API_BACKEND` var,
 * which is never set on Vercel and made this check always report "down".
 */
function healthOrigin(): string {
  const base = API_BASE_URL.replace(/\/$/, '')
  return base.replace(/\/api\/v1$/, '')
}

function healthRequestUrl(path: '/health' | '/health/db'): string {
  return `${healthOrigin()}${path}`
}

async function fetchHealthJson<T>(path: '/health' | '/health/db'): Promise<T> {
  const response = await fetch(healthRequestUrl(path), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`)
  }
  return (await response.json()) as T
}

export async function fetchPlatformHealth(): Promise<PlatformHealth> {
  const [healthResult, dbResult] = await Promise.allSettled([
    fetchHealthJson<HealthResponse>('/health'),
    fetchHealthJson<HealthDbResponse>('/health/db'),
  ])

  const backendOk =
    healthResult.status === 'fulfilled' && healthResult.value.status?.toLowerCase() === 'ok'
  const dbOk =
    dbResult.status === 'fulfilled' &&
    dbResult.value.status?.toLowerCase() === 'ok' &&
    (dbResult.value.db == null || dbResult.value.db.toLowerCase() === 'ok')

  return { backendOk, dbOk }
}
