import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useRbac } from '../rbac/useRbac'

const ADMIN_ONLY = new Set(['/admin/catalog', '/admin/purchases', '/users'])

export function ConsumerRouteGuard() {
  const { isConsumerMode, primaryRole, isSuperuser } = useRbac()
  const { pathname } = useLocation()

  if ((isConsumerMode || primaryRole === 'independent_user') && ADMIN_ONLY.has(pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  if ((isSuperuser || primaryRole === 'super_admin') && pathname.startsWith('/catalog')) {
    return <Navigate to="/admin/catalog" replace />
  }

  return <Outlet />
}
