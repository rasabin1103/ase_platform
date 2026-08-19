import { createCatalogCheckoutSession } from './billing.api'
import { purchaseCatalogItem } from './consumerCatalog.api'
import type { CatalogItem } from '../types/catalog.types'

export function isCatalogItemPriced(price: string | number | null | undefined): boolean {
  const n = Number(price)
  return Number.isFinite(n) && n > 0
}

/** Buys or unlocks a catalog item by slug. Free items go through the direct
 * grant endpoint and resolve normally. Priced items redirect the browser to
 * Stripe Checkout (one-time payment) and never resolve — the backend only
 * grants a priced item once the checkout.session.completed webhook fires
 * after a real payment (see ConsumerCatalogService.purchase, which refuses
 * anything with price > 0), so there is no path to a paid item for free. */
export async function buyOrCheckoutCatalogItem(
  slug: string,
  price: string | number | null | undefined,
): Promise<CatalogItem | null> {
  if (isCatalogItemPriced(price)) {
    const checkoutUrl = await createCatalogCheckoutSession(slug)
    window.location.href = checkoutUrl
    return null
  }
  return purchaseCatalogItem(slug)
}
