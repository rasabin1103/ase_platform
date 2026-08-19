import { apiClient } from './client'
import type { Plan, PlanCreateRequest, PlanListResponse, PlanUpdateRequest } from '../types/plan.types'

export async function listPlans(params?: {
  limit?: number
  offset?: number
  is_active?: boolean | null
  billing_cycle?: string | null
}) {
  const { data } = await apiClient.get<PlanListResponse>('/plans', { params })
  return data
}

export async function createPlan(payload: PlanCreateRequest) {
  const { data } = await apiClient.post<Plan>('/plans', payload)
  return data
}

export async function updatePlan(plan_id: number, payload: PlanUpdateRequest) {
  const { data } = await apiClient.patch<Plan>(`/plans/${plan_id}`, payload)
  return data
}

export async function deletePlan(plan_id: number) {
  const { data } = await apiClient.delete<Plan>(`/plans/${plan_id}`)
  return data
}

/** Whether DEEPL_API_KEY is configured on the backend — when it isn't,
 * saving a plan silently mirrors the Spanish text into the English fields
 * instead of translating, which the admin UI should surface rather than
 * let look like a bug. */
export async function getTranslationStatus() {
  const { data } = await apiClient.get<{ enabled: boolean }>('/plans/meta/translation-status')
  return data
}
