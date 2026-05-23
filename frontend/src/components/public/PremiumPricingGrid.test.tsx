import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PremiumPricingGrid } from './PremiumPricingGrid'
import type { PublicCatalogPricingPlan } from '../../types/catalog.types'
import { I18nProvider } from '../../i18n'

function wrap(ui: React.ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>)
}

function samplePlan(overrides: Partial<PublicCatalogPricingPlan>): PublicCatalogPricingPlan {
  return {
    id: 1,
    name: 'Professional',
    slug: 'professional',
    displayName: 'Professional',
    planType: 'subscription',
    billingInterval: 'monthly',
    price: '79',
    currency: 'EUR',
    monthlyPrice: '79',
    annualPrice: '853.20',
    formattedMonthlyPrice: '79.00€',
    formattedAnnualPrice: '853.20€',
    annualSavingsAmount: '94.80',
    isPopular: true,
    isDefault: false,
    includesUpdates: true,
    includesSupport: true,
    supportLevel: 'priority',
    features: ['Up to 10 users', 'Advanced QA tools'],
    limitations: [],
    catalogItemId: 1,
    catalogItemTitle: 'Platform',
    catalogItemSlug: 'platform',
    catalogItemType: 'product',
    catalogItemCategory: 'saas',
    ...overrides,
  }
}

describe('PremiumPricingGrid', () => {
  it('renders features from API data', () => {
    wrap(<PremiumPricingGrid plans={[samplePlan({})]} billing="monthly" />)
    expect(screen.getByText('Up to 10 users')).toBeInTheDocument()
    expect(screen.getByText('Advanced QA tools')).toBeInTheDocument()
  })

  it('shows popular badge for recommended plan', () => {
    wrap(<PremiumPricingGrid plans={[samplePlan({ isPopular: true })]} billing="monthly" />)
    expect(screen.getByText(/Most Popular/i)).toBeInTheDocument()
  })

  it('shows annual savings when yearly billing is selected', () => {
    wrap(<PremiumPricingGrid plans={[samplePlan({})]} billing="yearly" />)
    expect(screen.getByText('853.20€')).toBeInTheDocument()
    expect(screen.getByText(/Save 10%/i)).toBeInTheDocument()
  })

  it('displays monthly period when monthly billing is selected', () => {
    wrap(<PremiumPricingGrid plans={[samplePlan({})]} billing="monthly" />)
    expect(screen.getByText('79.00€')).toBeInTheDocument()
    expect(document.body.textContent).toContain('/month')
  })

  it('displays yearly period when annual billing is selected', () => {
    wrap(<PremiumPricingGrid plans={[samplePlan({})]} billing="yearly" />)
    expect(screen.getByText('853.20€')).toBeInTheDocument()
    expect(document.body.textContent).toContain('/year')
  })
})
