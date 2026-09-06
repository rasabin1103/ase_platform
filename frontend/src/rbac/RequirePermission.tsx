import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useRbac } from './useRbac'

/**
 * Route-level authorization gate for management/admin pages. Blocks direct
 * URL navigation to a page the current role has no business reaching, even
 * though nothing in their own sidebar links there — the exact gap that let
 * an independent user open /users directly and see the full admin shell
 * (zeroed stats, disabled export, a "vista limitada" badge, a permission
 * error toast) instead of never mounting the page at all.
 *
 * `anyOf` should be the same permission codes already used for this route's
 * nav entry (see rbac/config.ts's `anyPermission`) — reusing that array
 * here means the sidebar and the actual route access can never drift apart,
 * and each one lines up with the real `require_permission(...)` dependency
 * on that page's backend endpoint (verified against the routers directly,
 * not guessed).
 *
 * A denied user is redirected to /dashboard rather than shown a degraded
 * version of the page — no page-specific "forbidden" UI to build, and no
 * component ever fires its privileged queries in the first place.
 * Superusers always pass, matching every other permission check in the app.
 */
export function RequirePermission({ anyOf }: { anyOf: string[] }) {
  const { hasPermission, isSuperuser } = useRbac()
  const location = useLocation()

  const allowed = isSuperuser || anyOf.some((code) => hasPermission(code))
  if (!allowed) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />
  }
  return <Outlet />
}
