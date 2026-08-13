import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../app/providers'
import { LoginPage } from './LoginPage'
import * as authApi from '../api/auth.api'

// Only auth.api's `login` is mocked — everything else (i18n, react-query,
// AuthProvider) runs for real, so this exercises the actual form validation
// and submit wiring, not just a shallow render.
vi.mock('../api/auth.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/auth.api')>()
  return { ...actual, login: vi.fn() }
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

describe('LoginPage', () => {
  it('does not call the login API when the password is too short', async () => {
    const { container } = renderLoginPage()
    const user = userEvent.setup()

    const emailInput = screen.getByPlaceholderText('name@company.com')
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, '123')
    await user.click(submitButton)

    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('submits valid credentials and calls the login API exactly once', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: 'access-token', refresh_token: 'refresh-token' })
    const { container } = renderLoginPage()
    const user = userEvent.setup()

    const emailInput = screen.getByPlaceholderText('name@company.com')
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'correct-horse')
    await user.click(submitButton)

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledTimes(1)
    })
    // React Query's mutationFn receives the variables as the first argument
    // plus an internal context object as a second — only the first matters here.
    expect(vi.mocked(authApi.login).mock.calls[0][0]).toEqual({
      email: 'user@example.com',
      password: 'correct-horse',
    })
  })
})
