import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useRbac } from '../rbac/useRbac'

const ADMIN_ONLY = new Set(['/admin/catalog', '/admin/pricing-plans', '/admin/purchases', '/users'])

/** Super admin manages catalog via /admin/catalog; detail URLs stay available for public preview. */
const CATALOG_LIST_PATHS = new Set([
  '/catalog/products',
  '/catalog/courses',
  '/catalog/books',
  '/catalog/resources',
])

export function ConsumerRouteGuard() {
  const { isConsumerMode, primaryRole, isSuperuser } = useRbac()
  const { pathname } = useLocation()

  if ((isConsumerMode || primaryRole === 'independent_user') && ADMIN_ONLY.has(pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  if ((isSuperuser || primaryRole === 'super_admin') && CATALOG_LIST_PATHS.has(pathname)) {
    return <Navigate to="/admin/catalog" replace />
  }

  return <Outlet />
}
