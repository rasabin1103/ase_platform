import { apiClient } from './client'
import type { AuditLog, AuditLogListResponse } from '../types/audit-log.types'

export async function listAuditLogs(params?: {
  limit?: number
  offset?: number
  organization_id?: number | null
  organization_uuid?: string | null
  actor_user_id?: number | null
  actor_user_uuid?: string | null
  entity_type?: string | null
  action?: string | null
  date_from?: string | null
  date_to?: string | null
}) {
  const { data } = await apiClient.get<AuditLogListResponse>('/audit-logs', { params })
  return data
}

export async function getAuditLog(audit_log_id: number) {
  const { data } = await apiClient.get<AuditLog>(`/audit-logs/${audit_log_id}`)
  return data
}

