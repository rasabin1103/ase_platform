import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '../../app/providers'
import { CatalogDetailPage } from './CatalogDetailPage'
import * as consumerCatalogApi from '../../api/consumerCatalog.api'
import type { CatalogItem } from '../../types/catalog.types'

// Only the consumer-catalog API surface is mocked. getConsumerCatalogItem
// varies per test (free / priced-unpurchased / priced-purchased); the other
// two are fired unconditionally on mount by RatingWidget/ReviewWidget
// siblings and must resolve so the page settles instead of erroring out.
vi.mock('../../api/consumerCatalog.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/consumerCatalog.api')>()
  return {
    ...actual,
    getConsumerCatalogItem: vi.fn(),
    listCatalogItemReviews: vi.fn(),
  }
})

function baseItem(overrides: Partial<CatalogItem>): CatalogItem {
  return {
    id: '1',
    uuid: 'uuid-1',
    title: 'Test Resource',
    slug: overrides.slug ?? 'test-resource',
    type: 'resource',
    category: 'Testing',
    shortDescription: 'short',
    longDescription: 'long',
    imageUrl: '',
    images: [],
    price: 0,
    currency: 'EUR',
    status: 'published',
    level: 'beginner',
    author: 'ASE',
    isFavorite: false,
    isPurchased: false,
    upvotes: 0,
    downvotes: 0,
    netScore: 0,
    topTags: [],
    reviewCount: 0,
    hasResourceContent: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as CatalogItem
}

function renderDetailPage(slug: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[`/catalog/resource/${slug}`]}>
        <Routes>
          <Route path="/catalog/:type/:slug" element={<CatalogDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('CatalogDetailPage access gating', () => {
  beforeEach(() => {
    vi.mocked(consumerCatalogApi.listCatalogItemReviews).mockResolvedValue({
      items: [],
      averageRating: null,
      reviewCount: 0,
      limit: 20,
      offset: 0,
    })
  })

  it('shows "View content" (full access) with no Buy button for a free item', async () => {
    vi.mocked(consumerCatalogApi.getConsumerCatalogItem).mockResolvedValue(
      baseItem({ slug: 'free-resource', price: 0, isPurchased: false, hasResourceContent: true }),
    )
    renderDetailPage('free-resource')

    await waitFor(() => {
      expect(screen.getByText('Ver contenido')).toBeInTheDocument()
    })
    expect(screen.queryByText('Comprar')).not.toBeInTheDocument()
    expect(screen.queryByText('Comprado')).not.toBeInTheDocument()
  })

  it('shows Buy and only a preview (no full "View content") for a priced item not yet purchased', async () => {
    vi.mocked(consumerCatalogApi.getConsumerCatalogItem).mockResolvedValue(
      baseItem({ slug: 'priced-resource', price: 29.99, isPurchased: false, hasResourceContent: true }),
    )
    renderDetailPage('priced-resource')

    await waitFor(() => {
      expect(screen.getByText('Comprar')).toBeInTheDocument()
    })
    // Not purchased yet -> only the sample viewer, not the full "view content" one.
    expect(screen.getByText('Ver muestra')).toBeInTheDocument()
    expect(screen.queryByText('Ver contenido')).not.toBeInTheDocument()
    expect(screen.queryByText('Comprado')).not.toBeInTheDocument()
  })

  it('shows "Purchased" badge, disabled buy state, and full "View content" for an already-purchased item', async () => {
    vi.mocked(consumerCatalogApi.getConsumerCatalogItem).mockResolvedValue(
      baseItem({ slug: 'owned-resource', price: 29.99, isPurchased: true, hasResourceContent: true }),
    )
    renderDetailPage('owned-resource')

    await waitFor(() => {
      // "Purchased" appears twice: once as the price-card badge, once as the disabled buy button label.
      expect(screen.getAllByText('Comprado').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('Ver contenido')).toBeInTheDocument()
    expect(screen.queryByText('Ver muestra')).not.toBeInTheDocument()
  })
})
