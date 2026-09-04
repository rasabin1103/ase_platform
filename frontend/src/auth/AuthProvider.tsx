import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MeResponse } from '../types/auth.types'
import { me } from '../api/auth.api'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import {
  clearActiveOrganizationUuid,
  clearImpersonatorTokens,
  clearProfileLinksDraft,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStashedImpersonatorTokens,
  isImpersonating as readIsImpersonating,
  setAccessToken,
  setActiveOrganizationUuid,
  setRefreshToken,
  stashImpersonatorTokens,
} from './auth.store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => readIsImpersonating())

  const loadCurrentUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setCurrentUser(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const user = await me()
      setCurrentUser(user)
      if (user.active_workspace_uuid) {
        setActiveOrganizationUuid(user.active_workspace_uuid)
      }
    } catch {
      clearTokens()
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Deferred to a microtask so the state updates inside loadCurrentUser
    // (setIsLoading/setCurrentUser) never happen synchronously within this
    // effect's own call stack — same outcome (runs immediately after mount,
    // before paint), just structured the way React's effect rules expect.
    void Promise.resolve().then(() => loadCurrentUser())
  }, [loadCurrentUser])

  const login = useCallback(
    async (tokens: { access_token: string; refresh_token: string }) => {
      setAccessToken(tokens.access_token)
      setRefreshToken(tokens.refresh_token)
      await loadCurrentUser()
    },
    [loadCurrentUser],
  )

  const applyCurrentUser = useCallback((user: MeResponse) => {
    setCurrentUser(user)
    if (user.active_workspace_uuid) {
      setActiveOrganizationUuid(user.active_workspace_uuid)
    }
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    clearImpersonatorTokens()
    clearActiveOrganizationUuid()
    clearProfileLinksDraft()
    setCurrentUser(null)
    setIsImpersonating(false)
    setIsLoading(false)
  }, [])

  const startImpersonation = useCallback(
    async (accessToken: string) => {
      const currentAccess = getAccessToken()
      const currentRefresh = getRefreshToken()
      if (currentAccess && currentRefresh) {
        stashImpersonatorTokens({ access_token: currentAccess, refresh_token: currentRefresh })
      }
      setAccessToken(accessToken)
      setIsImpersonating(true)
      await loadCurrentUser()
    },
    [loadCurrentUser],
  )

  const stopImpersonation = useCallback(async () => {
    const stashed = getStashedImpersonatorTokens()
    if (!stashed) {
      // Nothing to restore — fall back to a full logout so the UI never
      // gets stuck mid-impersonation.
      logout()
      return
    }
    setAccessToken(stashed.access_token)
    setRefreshToken(stashed.refresh_token)
    clearImpersonatorTokens()
    setIsImpersonating(false)
    await loadCurrentUser()
  }, [loadCurrentUser, logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isLoading,
      isImpersonating,
      login,
      logout,
      loadCurrentUser,
      applyCurrentUser,
      startImpersonation,
      stopImpersonation,
    }),
    [
      currentUser,
      isLoading,
      isImpersonating,
      login,
      logout,
      loadCurrentUser,
      applyCurrentUser,
      startImpersonation,
      stopImpersonation,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

