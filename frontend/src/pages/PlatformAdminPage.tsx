import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { listUsers } from '../api/users.api'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'

export function PlatformAdminPage() {
  // We infer access by calling a super-admin protected endpoint.
  const probe = useQuery({
    queryKey: ['platform-admin', 'probe-users'],
    queryFn: () => listUsers({ limit: 1, offset: 0 }),
    retry: false,
  })

  if (probe.isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    )
  }

  if (probe.isError) {
    return (
      <EmptyState
        title="No autorizado"
        description={
          axios.isAxiosError(probe.error) && probe.error.response?.status
            ? `Esta área requiere rol de plataforma (super_admin). (HTTP ${probe.error.response.status})`
            : 'Esta área requiere rol de plataforma (super_admin).'
        }
        actionLabel="Volver al dashboard"
        onAction={() => window.location.assign('/dashboard')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ase-text">Platform Admin</h1>
        <p className="mt-1 text-sm text-ase-text2">Herramientas globales (solo super_admin).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-6" interactive>
          <div className="text-sm font-semibold text-ase-text">Users</div>
          <div className="mt-1 text-sm text-ase-text2">Gestión global de usuarios.</div>
          <div className="mt-4">
            <Link to="/users">
              <Button variant="secondary">Open users</Button>
            </Link>
          </div>
        </Card>
        <Card className="p-6" interactive>
          <div className="text-sm font-semibold text-ase-text">Audit Logs</div>
          <div className="mt-1 text-sm text-ase-text2">Eventos globales y seguridad.</div>
          <div className="mt-4">
            <Link to="/audit-logs">
              <Button variant="secondary">Open audit logs</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

