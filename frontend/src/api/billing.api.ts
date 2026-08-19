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
 * keep using the direct purchaseCatalogItem() call. */
export async function createCatalogCheckoutSession(itemSlug: string): Promise<string> {
  const { data } = await apiClient.post<CheckoutSessionResponse>('/billing/catalog-checkout-session', {
    item_slug: itemSlug,
  })
  return data.checkout_url
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
