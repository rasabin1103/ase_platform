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
