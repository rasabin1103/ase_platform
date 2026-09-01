import { Outlet } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { getActiveOrganizationUuid, setActiveOrganizationUuid } from '../../auth/auth.store'
import { useAuth } from '../../hooks/useAuth'
import { useSidebarCollapsed } from '../../hooks/useSidebarCollapsed'
import { ScrollToTop } from './ScrollToTop'
import { SkipLink } from './SkipLink'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ImpersonationBanner } from './ImpersonationBanner'
import { UnverifiedEmailBanner } from './UnverifiedEmailBanner'
import { TwoFactorGraceModal } from './TwoFactorGraceModal'
import { SessionExpiryModal } from './SessionExpiryModal'
import { SuspendedAccountGate } from './SuspendedAccountGate'
import { RouteLoadingFallback } from './RouteLoadingFallback'

export function AppLayout() {
  const { currentUser } = useAuth()
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar, close: closeSidebar } = useSidebarCollapsed()

  useEffect(() => {
    if (currentUser?.active_workspace_uuid && !getActiveOrganizationUuid()) {
      setActiveOrganizationUuid(currentUser.active_workspace_uuid)
    }
  }, [currentUser?.active_workspace_uuid])

  // A suspended account is already rejected by nearly every API endpoint
  // server-side — show the dedicated recovery/explanation screen instead of
  // the normal shell full of broken widgets.
  if (currentUser?.status === 'suspended') {
    return <SuspendedAccountGate />
  }

  return (
    <div className="relative flex h-full overflow-x-hidden bg-ase-bg">
      <SkipLink />
      <ScrollToTop />
      <Sidebar collapsed={sidebarCollapsed} onClose={closeSidebar} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
        <ImpersonationBanner />
        <UnverifiedEmailBanner />
        <TwoFactorGraceModal />
        <SessionExpiryModal />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-7">
          <div className="w-full min-w-0">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

