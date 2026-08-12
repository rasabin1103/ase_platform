import { apiClient } from './client'

export type ErrorLog = {
  id: number
  occurred_at: string
  method: string
  path: string
  status_code: number
  error_type: string
  message: string
  traceback: string
  user_id: number | null
  user_email: string | null
  ip_address: string | null
}

export type ErrorLogListResponse = {
  items: ErrorLog[]
  limit: number
  offset: number
  total: number
}

export type ErrorLogFilters = {
  limit?: number
  offset?: number
  error_type?: string
  path?: string
  method?: string
  date_from?: string
  date_to?: string
}

export async function listErrorLogs(params?: ErrorLogFilters) {
  const { data } = await apiClient.get<ErrorLogListResponse>('/admin/error-logs', { params })
  return data
}

export type ErrorLogSummary = {
  last_24h: number
  last_7d: number
}

export async function getErrorLogsSummary() {
  const { data } = await apiClient.get<ErrorLogSummary>('/admin/error-logs/summary')
  return data
}
