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

function healthRequestUrl(path: '/health' | '/health/db'): string {
  const backend = import.meta.env.VITE_API_BACKEND?.replace(/\/$/, '')
  if (import.meta.env.DEV || !backend) {
    return path
  }
  return `${backend}${path}`
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
