import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { listWorkspaces } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { getActiveOrganizationUuid, setActiveOrganizationUuid, clearActiveOrganizationUuid } from './auth.store'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

function isOrgFreeIndependentUser(
  user: NonNullable<ReturnType<typeof useAuth>['currentUser']>,
): boolean {
  return (
    user.dashboard_mode === 'independent' ||
    (Boolean(user.is_independent_user) &&
      user.primary_role === 'independent_user' &&
      !user.organization_uuid &&
      !user.active_workspace_uuid)
  )
}

/** Ensures workspace context when required; independent users skip mandatory org onboarding. */
export function WorkspaceContextGate() {
  const location = useLocation()
  const { currentUser, isLoading: authLoading } = useAuth()

  const independentMode = currentUser ? isOrgFreeIndependentUser(currentUser) : false

  const workspacesQuery = useQuery({
    queryKey: ['auth', 'workspaces'],
    queryFn: listWorkspaces,
    enabled: Boolean(currentUser) && !independentMode,
  })

  if (authLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (independentMode) {
    clearActiveOrganizationUuid()
    return <Outlet />
  }

  const defaultUuid =
    currentUser.active_workspace_uuid ?? workspacesQuery.data?.default_workspace_uuid ?? null

  if (workspacesQuery.isSuccess || defaultUuid) {
    const items = workspacesQuery.data?.items ?? []
    if (items.length === 0 && !defaultUuid) {
      return <Navigate to="/onboarding" replace state={{ from: location }} />
    }
    const active = getActiveOrganizationUuid()
    if (!active) {
      const pick =
        defaultUuid ?? items.find((w) => w.is_default)?.uuid ?? items[0]?.uuid ?? null
      if (pick) setActiveOrganizationUuid(pick)
    }
    return <Outlet />
  }

  if (workspacesQuery.isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  return (
    <EmptyState
      title="No se pudo cargar tu espacio de trabajo"
      description="Comprueba que el backend esté en marcha e inténtalo de nuevo."
    />
  )
}
