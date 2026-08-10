import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from './ContactForm'
import { I18nProvider } from '../../i18n'

vi.mock('../../api/publicContact.api', () => ({
  submitContactForm: vi.fn(),
}))

import { submitContactForm } from '../../api/publicContact.api'

function wrap(ui: React.ReactNode) {
  return render(<I18nProvider>{ui}</I18nProvider>)
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.mocked(submitContactForm).mockReset()
  })

  it('renders all fields and a single submit button', () => {
    const { container } = wrap(<ContactForm />)

    expect(container.querySelector('input[name="name"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="company"]')).toBeInTheDocument()
    expect(container.querySelector('select[name="inquiry_type"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="subject"]')).toBeInTheDocument()
    expect(container.querySelector('textarea[name="message"]')).toBeInTheDocument()

    const submitButtons = screen.getAllByRole('button', { name: /send message|enviar mensaje/i })
    expect(submitButtons).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /book a call|whatsapp|schedule/i })).not.toBeInTheDocument()
  })

  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup()
    wrap(<ContactForm />)

    await user.click(screen.getByRole('button', { name: /send message|enviar mensaje/i }))

    expect(await screen.findByText(/name is required|nombre es obligatorio/i)).toBeInTheDocument()
    expect(submitContactForm).not.toHaveBeenCalled()
  })

  it('submits payload and shows success', async () => {
    vi.mocked(submitContactForm).mockResolvedValue({ message: 'ok' })
    const user = userEvent.setup()
    const { container } = wrap(<ContactForm />)

    await user.type(container.querySelector('input[name="name"]')!, 'Jane Doe')
    await user.type(container.querySelector('input[name="email"]')!, 'jane@example.com')
    await user.type(container.querySelector('input[name="subject"]')!, 'Automation project')
    await user.type(
      container.querySelector('textarea[name="message"]')!,
      'We need help automating our regression suite for enterprise SaaS.',
    )
    await user.click(screen.getByRole('button', { name: /send message|enviar mensaje/i }))

    await waitFor(() => {
      expect(submitContactForm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Doe',
          email: 'jane@example.com',
          subject: 'Automation project',
          message: 'We need help automating our regression suite for enterprise SaaS.',
        }),
      )
    })

    expect(
      await screen.findByText(/message sent successfully|mensaje enviado correctamente/i),
    ).toBeInTheDocument()
  })
})
