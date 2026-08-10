import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookPurchaseLinksEditor } from './BookPurchaseLinksEditor'
import { I18nProvider } from '../../../i18n'
import type { BookPurchaseLinkInput } from '../../../types/catalog.types'

function wrap(ui: React.ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('BookPurchaseLinksEditor', () => {
  it('adds a purchase link row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    wrap(<BookPurchaseLinksEditor value={[]} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /añadir|add/i }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as BookPurchaseLinkInput[]
    expect(next).toHaveLength(1)
    expect(next[0].platform).toBe('amazon')
    expect(next[0].is_active).toBe(true)
  })

  it('shows preview label for configured platform', () => {
    wrap(
      <BookPurchaseLinksEditor
        value={[
          {
            platform: 'lulu',
            label: '',
            url: 'https://lulu.example',
            currency: 'EUR',
            price: null,
            country: null,
            is_primary: true,
            is_active: true,
            sort_order: 0,
          },
        ]}
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Lulu' })).toBeInTheDocument()
  })
})
