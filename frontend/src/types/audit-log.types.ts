export type AuditLog = {
  id: number
  organization_id: number | null
  organization_name: string | null
  actor_user_id: number | null
  actor_display_name: string | null
  actor_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata_json: Record<string, unknown> | null
  created_at: string
}

export type AuditLogListResponse = {
  items: AuditLog[]
  limit: number
  offset: number
  total: number
}

