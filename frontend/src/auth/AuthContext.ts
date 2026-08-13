import { createContext } from 'react'
import type { MeResponse } from '../types/auth.types'

export type AuthContextValue = {
  currentUser: MeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  isImpersonating: boolean
  login: (tokens: { access_token: string; refresh_token: string }) => Promise<void>
  logout: () => void
  loadCurrentUser: () => Promise<void>
  applyCurrentUser: (user: MeResponse) => void
  startImpersonation: (accessToken: string) => Promise<void>
  stopImpersonation: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
