import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function PostLoginGate() {
  const { currentUser, isLoading } = useAuth()

  if (isLoading) return null
  if (!currentUser) return <Navigate to="/login" replace />
  return <Navigate to="/dashboard" replace />
}
