import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
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
  const originalLocation = window.location

  beforeEach(() => {
    // window.location.href is not assignable in jsdom by default — replace
    // the whole object with a writable stand-in so we can assert the
    // Stripe redirect without actually navigating.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
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

  it('creates a Stripe checkout session and redirects for a priced item, without granting it directly', async () => {
    vi.mocked(billingApi.createCatalogCheckoutSession).mockResolvedValue('https://checkout.stripe.com/session-123')

    const result = await buyOrCheckoutCatalogItem('priced-item', '29.99')

    expect(billingApi.createCatalogCheckoutSession).toHaveBeenCalledWith('priced-item')
    expect(consumerCatalogApi.purchaseCatalogItem).not.toHaveBeenCalled()
    expect(window.location.href).toBe('https://checkout.stripe.com/session-123')
    // Priced items never resolve to a CatalogItem here — the backend only
    // grants access once the checkout.session.completed webhook fires.
    expect(result).toBeNull()
  })
})
