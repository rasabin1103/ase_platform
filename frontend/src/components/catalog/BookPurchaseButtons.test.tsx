import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookPurchaseButtons } from './BookPurchaseButtons'
import type { BookPurchaseLink } from '../../types/catalog.types'

function link(overrides: Partial<BookPurchaseLink>): BookPurchaseLink {
  return {
    id: 1,
    platform: 'amazon',
    label: 'Comprar en Amazon',
    url: 'https://amazon.example/book',
    currency: 'EUR',
    price: 19.99,
    country: null,
    isPrimary: false,
    isActive: true,
    sortOrder: 0,
    ...overrides,
  }
}

describe('BookPurchaseButtons', () => {
  it('renders only active links sorted by sortOrder', () => {
    render(
      <BookPurchaseButtons
        links={[
          link({ id: 2, label: 'Comprar en ASE', platform: 'ase', sortOrder: 1, isPrimary: true }),
          link({ id: 3, label: 'Hidden', isActive: false, sortOrder: 2 }),
          link({ id: 1, label: 'Comprar en Amazon', sortOrder: 0 }),
        ]}
      />,
    )

    const buttons = screen.getAllByRole('link')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveTextContent('Comprar en Amazon')
    expect(buttons[1]).toHaveTextContent('Comprar en ASE')
  })

  it('returns null when no active links', () => {
    const { container } = render(
      <BookPurchaseButtons links={[link({ isActive: false })]} />,
    )
    expect(container.firstChild).toBeNull()
  })
})
