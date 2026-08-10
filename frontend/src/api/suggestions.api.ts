import { apiClient } from './client'

export type SuggestionStatus = 'pending' | 'reviewed' | 'resolved'
export type SuggestionTarget = 'platform' | 'organization'

export type Suggestion = {
  id: number
  user_id: number
  user_email: string | null
  organization_id: number | null
  organization_name: string | null
  message: string
  target: SuggestionTarget
  status: SuggestionStatus
  admin_note: string | null
  reviewed_by_user_id: number | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type SuggestionListResponse = {
  items: Suggestion[]
  limit: number
  offset: number
  total: number
}

export async function createSuggestion(message: string, target: SuggestionTarget = 'platform') {
  const { data } = await apiClient.post<Suggestion>('/suggestions', { message, target })
  return data
}

export async function listMySuggestions(params?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<SuggestionListResponse>('/suggestions/me', { params })
  return data
}

export async function listAllSuggestions(params?: { limit?: number; offset?: number; status?: SuggestionStatus }) {
  const { data } = await apiClient.get<SuggestionListResponse>('/suggestions', { params })
  return data
}

export async function updateSuggestion(id: number, payload: { status?: SuggestionStatus; admin_note?: string }) {
  const { data } = await apiClient.patch<Suggestion>(`/suggestions/${id}`, payload)
  return data
}
