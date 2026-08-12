import { apiClient } from './client'

export type AccountLifecycleSummary = {
  enabled: boolean
  two_factor_grace_days: number
  inactivity_suspend_days: number
  suspended_delete_days: number
  pending_two_factor_activation: number
  suspended_two_factor: number
  suspended_inactivity: number
  pending_deletion_soon: number
}

export type AccountLifecycleSweepResult = {
  suspended_two_factor: number
  suspended_inactivity: number
  deleted: number
}

export async function getAccountLifecycleSummary() {
  const { data } = await apiClient.get<AccountLifecycleSummary>('/admin/account-lifecycle/summary')
  return data
}

export async function runAccountLifecycleSweep() {
  const { data } = await apiClient.post<AccountLifecycleSweepResult>('/admin/account-lifecycle/run-sweep')
  return data
}
