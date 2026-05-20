import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { MeResponse } from '../types/auth.types'
import { me } from '../api/auth.api'
import { API_BASE_URL } from '../api/client'
import { authDebugLog, tokenMeta } from '../utils/authDebugLog'
import {
  clearActiveOrganizationUuid,
  clearTokens,
  getAccessToken,
  setAccessToken,
  setActiveOrganizationUuid,
  setRefreshToken,
  touchApiActivity,
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
    const tokenAtStart = getAccessToken()
    if (!tokenAtStart) {
      setCurrentUser(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      authDebugLog('fetching_current_user', { apiBase: API_BASE_URL || '(empty)', bootstrap: true })
      const user = await me()
      setCurrentUser(user)
      authDebugLog('current_user_loaded', {
        email: user.email,
        primary_role: user.primary_role,
        role_codes: user.role_codes,
      })
      if (user.active_workspace_uuid) {
        setActiveOrganizationUuid(user.active_workspace_uuid)
      }
      touchApiActivity()
    } catch {
      const tokenNow = getAccessToken()
      if (tokenNow && tokenNow === tokenAtStart) {
        clearTokens()
        setCurrentUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCurrentUser()
  }, [loadCurrentUser])

  const login = useCallback(async (tokens: { access_token: string; refresh_token: string }) => {
    setAccessToken(tokens.access_token)
    setRefreshToken(tokens.refresh_token)
    authDebugLog('token_saved', tokenMeta(tokens.access_token))
    setIsLoading(true)
    try {
      authDebugLog('fetching_current_user', { apiBase: API_BASE_URL || '(empty)', bootstrap: false })
      const user = await me()
      setCurrentUser(user)
      authDebugLog('current_user_loaded', {
        email: user.email,
        primary_role: user.primary_role,
        role_codes: user.role_codes,
      })
      if (user.active_workspace_uuid) {
        setActiveOrganizationUuid(user.active_workspace_uuid)
      }
      touchApiActivity()
    } catch (err) {
      clearTokens()
      setCurrentUser(null)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

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

