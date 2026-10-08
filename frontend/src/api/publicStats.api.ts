import { apiClient } from './client'

/** Mirrors backend `CatalogStatsResponse` (GET /api/v1/public/catalog-stats, sin auth, caché corta). */
export type PublicCatalogStats = {
  total_items: number
  by_type: { courses: number; templates: number; books: number; resources: number; services: number }
  plans: { total: number; names: string[] }
  platform: { status: 'operational' | 'degraded'; db_connected: boolean }
  members_count: number
  job_postings_active: number
  last_updated: string
}

export async function getPublicCatalogStats() {
  const { data } = await apiClient.get<PublicCatalogStats>('/public/catalog-stats')
  return data
}
