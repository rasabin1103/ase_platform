import { apiClient } from './client'

import type {
  Subscription,
  SubscriptionCreateRequest,
  SubscriptionListResponse,
  SubscriptionStatus,
  SubscriptionUpdateRequest,
} from '../types/subscription.types'

export async function listSubscriptions(params?: {
  limit?: number
  offset?: number
  organization_id?: number | null
  organization_uuid?: string | null
  plan_id?: number | null
  status?: SubscriptionStatus | null
}) {
  const { data } = await apiClient.get<SubscriptionListResponse>('/subscriptions', { params })
  return data
}

export async function createSubscription(payload: SubscriptionCreateRequest) {
  const { data } = await apiClient.post<Subscription>('/subscriptions', payload)
  return data
}

export async function updateSubscription(subscription_id: number, payload: SubscriptionUpdateRequest) {
  const { data } = await apiClient.patch<Subscription>(`/subscriptions/${subscription_id}`, payload)
  return data
}

export async function deleteSubscription(subscription_id: number) {
  const { data } = await apiClient.delete<Subscription>(`/subscriptions/${subscription_id}`)
  return data
}

