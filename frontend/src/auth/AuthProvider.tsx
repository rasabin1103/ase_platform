import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()

  // Guards against a stale /me response clobbering fresher state — e.g. a
  // request fired for the previous session that's still in flight when a
  // login/impersonation switch kicks off a new one. Whichever call started
  // LAST wins, regardless of which one's network response lands first; any
  // response that isn't from the most recently started call is discarded.
  // This is what used to let a just-logged-out admin's account data briefly
  // (or, on an unlucky race, indefinitely until F5) survive into a freshly
  // logged-in user's session, showing the wrong role's menu.
  const requestSeq = useRef(0)

  const loadCurrentUser = useCallback(async () => {
    const seq = ++requestSeq.current
    const token = getAccessToken()
    if (!token) {
      if (seq === requestSeq.current) {
        setCurrentUser(null)
        setIsLoading(false)
      }
      return
    }
    setIsLoading(true)
    try {
      const user = await me()
      if (seq !== requestSeq.current) return // superseded by a newer call
      setCurrentUser(user)
      if (user.active_workspace_uuid) {
        setActiveOrganizationUuid(user.active_workspace_uuid)
      }
    } catch {
      if (seq !== requestSeq.current) return
      clearTokens()
      setCurrentUser(null)
    } finally {
      if (seq === requestSeq.current) setIsLoading(false)
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
      // Drop anything cached under the previous session (if any — e.g. an
      // admin logging out and straight into a different account without a
      // full page reload) before the new user's data starts loading, so no
      // component can render role-scoped query data left over from someone
      // else's session while the switch is in flight.
      queryClient.clear()
      clearActiveOrganizationUuid()
      setAccessToken(tokens.access_token)
      setRefreshToken(tokens.refresh_token)
      await loadCurrentUser()
    },
    [loadCurrentUser, queryClient],
  )

  const applyCurrentUser = useCallback((user: MeResponse) => {
    setCurrentUser(user)
    if (user.active_workspace_uuid) {
      setActiveOrganizationUuid(user.active_workspace_uuid)
    }
  }, [])

  const logout = useCallback(() => {
    // Bump the request sequence first so any /me call still in flight from
    // the session that's ending is discarded the moment it resolves,
    // instead of racing the next login's own loadCurrentUser() call.
    requestSeq.current += 1
    clearTokens()
    clearImpersonatorTokens()
    clearActiveOrganizationUuid()
    clearProfileLinksDraft()
    queryClient.clear()
    setCurrentUser(null)
    setIsImpersonating(false)
    setIsLoading(false)
  }, [queryClient])

  const startImpersonation = useCallback(
    async (accessToken: string) => {
      const currentAccess = getAccessToken()
      const currentRefresh = getRefreshToken()
      if (currentAccess && currentRefresh) {
        stashImpersonatorTokens({ access_token: currentAccess, refresh_token: currentRefresh })
      }
      queryClient.clear()
      clearActiveOrganizationUuid()
      setAccessToken(accessToken)
      setIsImpersonating(true)
      await loadCurrentUser()
    },
    [loadCurrentUser, queryClient],
  )

  const stopImpersonation = useCallback(async () => {
    const stashed = getStashedImpersonatorTokens()
    if (!stashed) {
      // Nothing to restore — fall back to a full logout so the UI never
      // gets stuck mid-impersonation.
      logout()
      return
    }
    queryClient.clear()
    clearActiveOrganizationUuid()
    setAccessToken(stashed.access_token)
    setRefreshToken(stashed.refresh_token)
    clearImpersonatorTokens()
    setIsImpersonating(false)
    await loadCurrentUser()
  }, [loadCurrentUser, logout, queryClient])

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

