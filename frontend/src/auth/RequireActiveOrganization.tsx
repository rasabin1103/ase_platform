import type { PropsWithChildren } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { listOrganizations } from '../api/organizations.api'
import { clearActiveOrganizationUuid, getActiveOrganizationUuid, setActiveOrganizationUuid } from './auth.store'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

export function RequireActiveOrganization({ children }: PropsWithChildren) {
  const location = useLocation()

  const orgsQuery = useQuery({
    queryKey: ['organizations', 'guard'],
    queryFn: listOrganizations,
  })

  if (orgsQuery.isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-11/12" />
        </div>
      </Card>
    )
  }

  if (orgsQuery.isError) {
    return (
      <EmptyState
        title="No se pudo resolver el contexto de organización"
        description="Revisa el backend, el token y CORS."
      />
    )
  }

  const orgs = orgsQuery.data?.items ?? []
  if (orgs.length === 0) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />
  }

  const active = getActiveOrganizationUuid()
  if (active) {
    const exists = orgs.some((o) => o.uuid === active)
    if (!exists) {
      clearActiveOrganizationUuid()
      return <Navigate to="/select-organization" replace state={{ from: location }} />
    }
    return children
  }

  if (orgs.length === 1) {
    setActiveOrganizationUuid(orgs[0].uuid)
    return children
  }

  return <Navigate to="/select-organization" replace state={{ from: location }} />
}

