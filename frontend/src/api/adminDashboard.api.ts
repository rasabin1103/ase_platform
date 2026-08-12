import { apiClient } from './client'

export type AdminStats = {
  catalog_total: number
  catalog_by_type: Record<string, number>
  users_total: number
  users_active: number
  purchases_total: number
  requests_pending: number
}

export type AdminPurchase = {
  id: number
  user_id: number
  catalog_item_id: number
  user_email: string
  item_title: string
  item_type: string
  created_at: string
}

export type AdminPurchaseListResponse = {
  items: AdminPurchase[]
  limit: number
  offset: number
  total: number
}

export async function getAdminStats() {
  const { data } = await apiClient.get<AdminStats>('/admin/stats')
  return data
}

export async function listAdminPurchases(params?: {
  limit?: number
  offset?: number
  search?: string
  date_from?: string
  date_to?: string
}) {
  const { data } = await apiClient.get<AdminPurchaseListResponse>('/admin/purchases', { params })
  return data
}

export type TimeSeriesPoint = { month: string; value: number }

export type RatingTagCount = { tag: string; count: number }

export type AdminAnalytics = {
  users_growth: TimeSeriesPoint[]
  catalog_growth: TimeSeriesPoint[]
  purchases_growth: TimeSeriesPoint[]
  revenue_growth: TimeSeriesPoint[]
  catalog_by_type: Record<string, number>
  revenue_total: number
  top_users: { email: string; purchase_count: number }[]
  organizations_total: number
  organizations_by_type: Record<string, number>
  requests_by_status: Record<string, number>
  ratings_total: number
  ratings_upvotes: number
  ratings_downvotes: number
  ratings_top_tags: RatingTagCount[]
  users_by_role: Record<string, number>
}

export type AdminPurchasesSummary = {
  purchases_total: number
  revenue_total: number
  top_users: { email: string; purchase_count: number }[]
}

export async function getAdminAnalytics() {
  const { data } = await apiClient.get<AdminAnalytics>('/admin/analytics')
  return data
}

export async function getAdminPurchasesSummary() {
  const { data } = await apiClient.get<AdminPurchasesSummary>('/admin/purchases/summary')
  return data
}

export type AdminBookRedemption = {
  id: number
  user_id: number | null
  user_email: string | null
  catalog_item_id: number
  book_title: string
  github_username: string | null
  created_at: string
}

export type AdminBookRedemptionListResponse = {
  items: AdminBookRedemption[]
  limit: number
  offset: number
  total: number
}

export async function listAdminBookRedemptions(params?: {
  limit?: number
  offset?: number
  search?: string
  date_from?: string
  date_to?: string
}) {
  const { data } = await apiClient.get<AdminBookRedemptionListResponse>('/admin/book-redemptions', { params })
  return data
}

export type AdminSearchUserHit = {
  uuid: string
  email: string
  display_name: string | null
  status: string
}

export type AdminSearchCatalogHit = {
  id: number
  slug: string
  title: string
  type: string
}

export type AdminSearchResponse = {
  users: AdminSearchUserHit[]
  catalog_items: AdminSearchCatalogHit[]
}

export async function searchAdmin(q: string) {
  const { data } = await apiClient.get<AdminSearchResponse>('/admin/search', { params: { q } })
  return data
}

export type AdminBroadcastRequest = {
  title: string
  body?: string | null
  link?: string | null
}

export type AdminBroadcastResponse = {
  recipients: number
}

export async function broadcastAnnouncement(payload: AdminBroadcastRequest) {
  const { data } = await apiClient.post<AdminBroadcastResponse>('/admin/announcements/broadcast', payload)
  return data
}

export type SystemStatus = {
  api_status: string
  uptime_seconds: number
  environment: string
  mvp_mode: boolean
  database: { status: string; latency_ms: number | null; message: string | null }
  github_integration_configured: boolean
  rate_limiting_enabled: boolean
  smtp_configured: boolean
  sentry_configured: boolean
  redis_configured: boolean
  email_verified_pct: number
  two_factor_adoption_pct: number
  counts: { users_total: number; catalog_total: number; requests_pending: number }
  checked_at: string
}

export async function getSystemStatus() {
  const { data } = await apiClient.get<SystemStatus>('/admin/system-status')
  return data
}
