import { describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { AppProviders } from '../app/providers'
import { useAuth } from '../hooks/useAuth'
import { useRbac } from './useRbac'
import type { MeResponse } from '../types/auth.types'

// useRbac composes useAuth() + rbac/config.ts's pure functions (covered on
// their own in config.test.ts) into the actual UI-facing surface (can,
// hasPermission, navGroups). No access token is set in this test
// environment, so AuthProvider's initial /me fetch is a no-op (see
// AuthProvider.loadCurrentUser's early-return when there's no token) —
// applyCurrentUser injects a fake logged-in user directly instead of
// mocking the network.

function makeUser(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    uuid: 'u1',
    email: 'test@example.com',
    first_name: null,
    last_name: null,
    display_name: null,
    status: 'active',
    email_verified_at: null,
    last_login_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    role_codes: [],
    permissions: [],
    ...overrides,
  }
}

function wrapper({ children }: PropsWithChildren) {
  return <AppProviders>{children}</AppProviders>
}

describe('useRbac', () => {
  it('a super admin can do everything and sees the full admin nav, regardless of granted permissions', async () => {
    const { result } = renderHook(
      () => ({ auth: useAuth(), rbac: useRbac() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

    act(() => {
      result.current.auth.applyCurrentUser(
        makeUser({ role_codes: ['super_admin'], is_superuser: true, primary_role: 'super_admin' }),
      )
    })

    await waitFor(() => expect(result.current.rbac.isSuperuser).toBe(true))
    expect(result.current.rbac.can('manageCatalog')).toBe(true)
    expect(result.current.rbac.hasPermission('anything.at.all')).toBe(true)
    const paths = result.current.rbac.navGroups.flatMap((g) => g.items.map((i) => i.to))
    expect(paths).toContain('/admin/catalog')
    expect(paths).toContain('/admin/plans')
  })

  it('an independent user without catalog.manage cannot manage the catalog and sees only their own nav', async () => {
    const { result } = renderHook(
      () => ({ auth: useAuth(), rbac: useRbac() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

    act(() => {
      result.current.auth.applyCurrentUser(
        makeUser({
          role_codes: ['independent_user'],
          is_independent_user: true,
          primary_role: 'independent_user',
          permissions: [],
        }),
      )
    })

    await waitFor(() => expect(result.current.rbac.isConsumerMode).toBe(true))
    expect(result.current.rbac.isSuperuser).toBe(false)
    expect(result.current.rbac.can('manageCatalog')).toBe(false)
    const paths = result.current.rbac.navGroups.flatMap((g) => g.items.map((i) => i.to))
    expect(paths).toContain('/catalog/products')
    // The super-admin-only management surface must never leak into an
    // independent user's own nav.
    expect(paths).not.toContain('/admin/catalog')
  })

  it('hasPermission reflects the granted permission list for a non-superuser', async () => {
    const { result } = renderHook(
      () => ({ auth: useAuth(), rbac: useRbac() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

    act(() => {
      result.current.auth.applyCurrentUser(
        makeUser({ role_codes: ['org_admin'], primary_role: 'org_admin', permissions: ['users.read'] }),
      )
    })

    await waitFor(() => expect(result.current.rbac.primaryRole).toBe('org_admin'))
    expect(result.current.rbac.hasPermission('users.read')).toBe(true)
    expect(result.current.rbac.hasPermission('billing.manage')).toBe(false)
  })

  it('with no logged-in user, nothing is granted and there is no nav', async () => {
    const { result } = renderHook(
      () => ({ auth: useAuth(), rbac: useRbac() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

    expect(result.current.auth.currentUser).toBeNull()
    expect(result.current.rbac.isSuperuser).toBe(false)
    expect(result.current.rbac.can('manageCatalog')).toBe(false)
    expect(result.current.rbac.navGroups).toEqual([])
  })
})
