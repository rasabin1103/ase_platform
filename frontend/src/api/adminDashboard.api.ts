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

export async function listAdminPurchases(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<AdminPurchaseListResponse>('/admin/purchases', { params })
  return data
}

export type TimeSeriesPoint = { month: string; value: number }

export type AdminAnalytics = {
  users_growth: TimeSeriesPoint[]
  catalog_growth: TimeSeriesPoint[]
  purchases_growth: TimeSeriesPoint[]
  revenue_growth: TimeSeriesPoint[]
  catalog_by_type: Record<string, number>
  revenue_total: number
  top_users: { email: string; purchase_count: number }[]
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
