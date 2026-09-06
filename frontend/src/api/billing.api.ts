import { apiClient } from './client'

type CheckoutSessionResponse = {
  checkout_url: string
}

/** Creates a Stripe Checkout session for the given plan and returns the URL
 * to redirect the browser to. Requires auth — the backend resolves the
 * caller's own workspace/organization from the access token. */
export async function createCheckoutSession(planId: number): Promise<string> {
  const { data } = await apiClient.post<CheckoutSessionResponse>('/billing/checkout-session', { plan_id: planId })
  return data.checkout_url
}

/** Creates a one-time-payment Stripe Checkout session for a single priced
 * catalog item. Only valid for items with price > 0 — free items should
 * keep using the direct purchaseCatalogItem() call. `language` should be
 * whatever the app's language toggle is currently set to (see useI18n) —
 * the backend uses it to pick title_en/short_description_en vs the base
 * Spanish fields for what Stripe shows on the Checkout page; omit it and
 * the backend just falls back to Spanish. */
export async function createCatalogCheckoutSession(itemSlug: string, language?: 'es' | 'en'): Promise<string> {
  const { data } = await apiClient.post<CheckoutSessionResponse>('/billing/catalog-checkout-session', {
    item_slug: itemSlug,
    language,
  })
  return data.checkout_url
}

export type Invoice = {
  id: string
  number: string | null
  status: string
  amount_paid: number
  currency: string
  created_at: string
  period_start: string | null
  period_end: string | null
  hosted_invoice_url: string | null
  invoice_pdf: string | null
  plan_name: string | null
}

/** Invoice history for the signed-in user's organization, reshaped for
 * in-app display — the receipts themselves (PDF / hosted view) still live
 * on Stripe, but the browsing experience is ASE's own branded list instead
 * of always redirecting to the external portal. Returns an empty list
 * (never an error) if the org has no Stripe customer yet. */
export async function listInvoices(): Promise<Invoice[]> {
  const { data } = await apiClient.get<{ items: Invoice[] }>('/billing/invoices')
  return data.items
}

type BillingPortalResponse = {
  portal_url: string
}

/** Creates a Stripe Customer Portal session — lets the signed-in user manage
 * their payment method, download invoices, and cancel/change their plan.
 * Requires an existing Stripe customer (i.e. they've been through checkout
 * at least once); the backend returns a 400 otherwise. */
export async function createBillingPortalSession(): Promise<string> {
  const { data } = await apiClient.post<BillingPortalResponse>('/billing/portal-session')
  return data.portal_url
}

export type SubscriptionAction = {
  status: string
  starts_at: string
  ends_at: string | null
  current_period_end: string | null
}

/** Schedules cancellation at the end of the current billing period — access
 * (and further charges) continue until `ends_at`, never an immediate cutoff. */
export async function cancelSubscription(): Promise<SubscriptionAction> {
  const { data } = await apiClient.post<SubscriptionAction>('/billing/cancel-subscription')
  return data
}

/** Undoes a scheduled cancellation while the subscription is still within
 * its paid period — the plan goes back to auto-renewing normally. */
export async function resumeSubscription(): Promise<SubscriptionAction> {
  const { data } = await apiClient.post<SubscriptionAction>('/billing/resume-subscription')
  return data
}
