import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { MeResponse } from '../types/auth.types'
import { me } from '../api/auth.api'
import {
  clearActiveOrganizationUuid,
  clearTokens,
  getAccessToken,
  setAccessToken,
  setActiveOrganizationUuid,
  setRefreshToken,
} from './auth.store'

export type AuthContextValue = {
  currentUser: MeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (tokens: { access_token: string; refresh_token: string }) => Promise<void>
  logout: () => void
  loadCurrentUser: () => Promise<void>
  applyCurrentUser: (user: MeResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
    void loadCurrentUser()
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
    clearActiveOrganizationUuid()
    setCurrentUser(null)
    setIsLoading(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isLoading,
      login,
      logout,
      loadCurrentUser,
      applyCurrentUser,
    }),
    [currentUser, isLoading, login, logout, loadCurrentUser, applyCurrentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

