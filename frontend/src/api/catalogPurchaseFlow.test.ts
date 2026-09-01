import { describe, expect, it, vi, afterEach } from 'vitest'
import { buyOrCheckoutCatalogItem } from './catalogPurchaseFlow'
import * as billingApi from './billing.api'
import * as consumerCatalogApi from './consumerCatalog.api'
import type { CatalogItem } from '../types/catalog.types'

// Only the two network-hitting functions are mocked — buyOrCheckoutCatalogItem
// itself is real, so this exercises the actual free/priced branching logic
// (ConsumerCatalogService.purchase mirrors this on the backend: it refuses
// anything with price > 0, so a priced item must never reach purchaseCatalogItem).
vi.mock('./billing.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./billing.api')>()
  return { ...actual, createCatalogCheckoutSession: vi.fn() }
})
vi.mock('./consumerCatalog.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./consumerCatalog.api')>()
  return { ...actual, purchaseCatalogItem: vi.fn() }
})

describe('buyOrCheckoutCatalogItem', () => {
  // jsdom doesn't implement window.open — stub it so the priced-item branch
  // (which opens Stripe Checkout in a new tab, see catalogPurchaseFlow.ts)
  // can run and be asserted against without touching real navigation.
  const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

  afterEach(() => {
    openSpy.mockClear()
    vi.clearAllMocks()
  })

  it('calls the direct purchase endpoint (not Stripe) for a free item', async () => {
    const fakeItem = { slug: 'free-item' } as CatalogItem
    vi.mocked(consumerCatalogApi.purchaseCatalogItem).mockResolvedValue(fakeItem)

    const result = await buyOrCheckoutCatalogItem('free-item', 0)

    expect(consumerCatalogApi.purchaseCatalogItem).toHaveBeenCalledWith('free-item')
    expect(billingApi.createCatalogCheckoutSession).not.toHaveBeenCalled()
    expect(result).toBe(fakeItem)
  })

  it('also treats a null/undefined price as free', async () => {
    const fakeItem = { slug: 'no-price-item' } as CatalogItem
    vi.mocked(consumerCatalogApi.purchaseCatalogItem).mockResolvedValue(fakeItem)

    await buyOrCheckoutCatalogItem('no-price-item', null)

    expect(consumerCatalogApi.purchaseCatalogItem).toHaveBeenCalledWith('no-price-item')
    expect(billingApi.createCatalogCheckoutSession).not.toHaveBeenCalled()
  })

  it('creates a Stripe checkout session and opens it in a new tab, without granting the item directly', async () => {
    vi.mocked(billingApi.createCatalogCheckoutSession).mockResolvedValue('https://checkout.stripe.com/session-123')

    const result = await buyOrCheckoutCatalogItem('priced-item', '29.99')

    expect(billingApi.createCatalogCheckoutSession).toHaveBeenCalledWith('priced-item', undefined)
    expect(consumerCatalogApi.purchaseCatalogItem).not.toHaveBeenCalled()
    expect(openSpy).toHaveBeenCalledWith('https://checkout.stripe.com/session-123', '_blank', 'noopener,noreferrer')
    // Priced items never resolve to a CatalogItem here — the backend only
    // grants access once the checkout.session.completed webhook fires.
    expect(result).toBeNull()
  })

  it('forwards the app language through to the checkout session request', async () => {
    vi.mocked(billingApi.createCatalogCheckoutSession).mockResolvedValue('https://checkout.stripe.com/session-123')

    await buyOrCheckoutCatalogItem('priced-item', '29.99', 'en')

    expect(billingApi.createCatalogCheckoutSession).toHaveBeenCalledWith('priced-item', 'en')
  })
})
