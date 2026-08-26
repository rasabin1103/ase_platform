import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/providers'
import { LoginPage } from './LoginPage'
import * as authApi from '../api/auth.api'

// Only auth.api's `login`/`verifyLoginTwoFactor` are mocked — everything else
// (i18n, react-query, AuthProvider) runs for real, so this exercises the
// actual 2FA challenge → verify wiring, not just a shallow render.
vi.mock('../api/auth.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/auth.api')>()
  return { ...actual, login: vi.fn(), verifyLoginTwoFactor: vi.fn() }
})

function renderLoginPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </AppProviders>,
  )
}

async function submitCredentials(container: HTMLElement) {
  const user = userEvent.setup()
  const emailInput = screen.getByPlaceholderText('name@company.com')
  const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement
  const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement

  await user.type(emailInput, 'user@example.com')
  await user.type(passwordInput, 'correct-horse')
  await user.click(submitButton)
  return user
}

describe('LoginPage two-factor flow', () => {
  it('shows the 6-digit code form and does not log in yet when the backend requires 2FA', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      two_factor_required: true,
      challenge_token: 'challenge-abc',
    })
    const { container } = renderLoginPage()

    await submitCredentials(container)

    // The OTP form appears...
    await waitFor(() => {
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument()
    })
    // ...and verifyLoginTwoFactor must not have been called just from
    // reaching the challenge screen — only on actually submitting a code.
    expect(authApi.verifyLoginTwoFactor).not.toHaveBeenCalled()
    // The original login form (email input) is gone, replaced by the challenge screen.
    expect(screen.queryByPlaceholderText('name@company.com')).not.toBeInTheDocument()
  })

  it('submits the entered code with the challenge token from the login response', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      two_factor_required: true,
      challenge_token: 'challenge-xyz',
    })
    vi.mocked(authApi.verifyLoginTwoFactor).mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    })
    const { container } = renderLoginPage()
    const user = await submitCredentials(container)

    const otpInput = await screen.findByPlaceholderText('123456')
    await user.type(otpInput, '654321')

    const confirmButton = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await user.click(confirmButton)

    await waitFor(() => {
      expect(authApi.verifyLoginTwoFactor).toHaveBeenCalledTimes(1)
    })
    expect(authApi.verifyLoginTwoFactor).toHaveBeenCalledWith('challenge-xyz', '654321')
  })
})
