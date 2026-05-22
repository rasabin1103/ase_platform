import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { getActiveOrganizationUuid, setActiveOrganizationUuid } from '../../auth/auth.store'
import { useAuth } from '../../hooks/useAuth'
import { PublicFooter } from '../public/PublicFooter'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { SecurityOnboardingModal } from '../security/SecurityOnboardingModal'
import { SecurityOnboardingProvider } from '../security/SecurityOnboardingProvider'

export function AppLayout() {
  const { currentUser } = useAuth()

  useEffect(() => {
    if (currentUser?.dashboard_mode === 'independent' && !currentUser.active_workspace_uuid) {
      return
    }
    if (currentUser?.active_workspace_uuid && !getActiveOrganizationUuid()) {
      setActiveOrganizationUuid(currentUser.active_workspace_uuid)
    }
  }, [currentUser?.active_workspace_uuid, currentUser?.dashboard_mode])

  return (
    <SecurityOnboardingProvider>
    <SecurityOnboardingModal />
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-ase-bg">
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-14 bg-gradient-to-b from-transparent to-ase-bg2/55 lg:left-72"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-ase-primary/15 via-ase-accent/10 to-transparent blur-3xl" />
          <div className="absolute right-0 top-1/3 h-[320px] w-[420px] rounded-full bg-gradient-to-tr from-ase-accent/12 via-transparent to-ase-primary/10 blur-3xl" />
        </div>

        <Sidebar />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-white/[0.05] to-transparent"
            aria-hidden
          />
          <Header />
          <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="w-full min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <PublicFooter variant="app" />
    </div>
    </SecurityOnboardingProvider>
  )
}
