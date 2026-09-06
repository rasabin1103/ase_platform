import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useRbac } from '../rbac/useRbac'
import { useAuth } from '../hooks/useAuth'

const ADMIN_ONLY = new Set(['/admin/catalog', '/admin/purchases', '/users'])
// Route that hosts the skippable post-registration preferences survey —
// excluded from the redirect below so visiting it doesn't loop back to
// itself, and reachable directly (e.g. "edit my preferences" later).
const PREFERENCES_SURVEY_PATH = '/preferencias'

export function ConsumerRouteGuard() {
  const { isConsumerMode, primaryRole, isSuperuser } = useRbac()
  const { currentUser } = useAuth()
  const { pathname } = useLocation()

  if ((isConsumerMode || primaryRole === 'independent_user') && ADMIN_ONLY.has(pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  if ((isSuperuser || primaryRole === 'super_admin') && pathname.startsWith('/catalog')) {
    return <Navigate to="/admin/catalog" replace />
  }

  if (
    (isConsumerMode || primaryRole === 'independent_user') &&
    currentUser?.needs_preferences_survey &&
    pathname !== PREFERENCES_SURVEY_PATH
  ) {
    return <Navigate to={PREFERENCES_SURVEY_PATH} replace />
  }

  return <Outlet />
}
