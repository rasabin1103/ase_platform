import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listOrganizations } from '../api/organizations.api'
import { setActiveOrganizationUuid } from '../auth/auth.store'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'

export function SelectOrganizationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  const orgsQuery = useQuery({
    queryKey: ['organizations', 'select'],
    queryFn: listOrganizations,
  })

  const orgs = orgsQuery.data?.items ?? []

  const title = useMemo(() => {
    if (orgs.length <= 1) return 'Select organization'
    return `Select organization (${orgs.length})`
  }, [orgs.length])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ase-text">{title}</h1>
        <p className="mt-1 text-sm text-ase-text2">Choose where you want to work.</p>
      </div>

      {orgsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : orgsQuery.isError ? (
        <EmptyState title="No se pudieron cargar organizaciones" description="Revisa backend, token y CORS." />
      ) : orgs.length === 0 ? (
        <EmptyState
          title="No tienes organizaciones"
          description="Crea una organización para continuar."
          actionLabel="Go to onboarding"
          onAction={() => navigate('/onboarding')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {orgs.map((o) => (
            <Card key={o.uuid} interactive className="p-6">
              <div className="text-sm font-semibold text-ase-text">{o.name}</div>
              <div className="mt-1 text-sm text-ase-text2">{o.slug}</div>
              <div className="mt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    setActiveOrganizationUuid(o.uuid)
                    navigate(from, { replace: true })
                  }}
                >
                  Continue
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

