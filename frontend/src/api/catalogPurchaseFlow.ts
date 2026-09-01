import { createCatalogCheckoutSession } from './billing.api'
import { purchaseCatalogItem } from './consumerCatalog.api'
import type { CatalogItem } from '../types/catalog.types'

export function isCatalogItemPriced(price: string | number | null | undefined): boolean {
  const n = Number(price)
  return Number.isFinite(n) && n > 0
}

/** Buys or unlocks a catalog item by slug. Free items go through the direct
 * grant endpoint and resolve normally. Priced items open Stripe Checkout in
 * a new tab (the current tab stays on the catalog page) — the backend only
 * grants a priced item once the checkout.session.completed webhook fires
 * after a real payment (see ConsumerCatalogService.purchase, which refuses
 * anything with price > 0), so there is no path to a paid item for free.
 * `noopener` is intentional: the checkout tab gets no `window.opener` back
 * to this one. The original tab picks up the purchase on its own once the
 * user returns to it (see the visibilitychange refetch in
 * CatalogDetailPage), not via any handle on the new tab.
 *
 * `language` should be the app's current language (useI18n) — forwarded to
 * the checkout session so Stripe shows the title/description in whatever
 * language the buyer was actually looking at, not always Spanish. */
export async function buyOrCheckoutCatalogItem(
  slug: string,
  price: string | number | null | undefined,
  language?: 'es' | 'en',
): Promise<CatalogItem | null> {
  if (isCatalogItemPriced(price)) {
    const checkoutUrl = await createCatalogCheckoutSession(slug, language)
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
    return null
  }
  return purchaseCatalogItem(slug)
}
