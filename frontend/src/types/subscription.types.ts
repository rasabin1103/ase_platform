export type SubscriptionProvider = 'stripe' | 'manual'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

export type Subscription = {
  id: number
  organization_id: number
  plan_id: number
  provider: SubscriptionProvider
  provider_subscription_id: string | null
  status: SubscriptionStatus
  starts_at: string
  ends_at: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export type SubscriptionListResponse = {
  items: Subscription[]
  limit: number
  offset: number
  total: number
}

export type SubscriptionCreateRequest = {
  organization_id?: number | null
  organization_uuid?: string | null
  plan_id: number
  provider?: SubscriptionProvider
  provider_subscription_id?: string | null
  status?: SubscriptionStatus
  starts_at: string
  ends_at?: string | null
  trial_ends_at?: string | null
}

export type SubscriptionUpdateRequest = Partial<SubscriptionCreateRequest>

