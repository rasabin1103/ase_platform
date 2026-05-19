import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { getActiveOrganizationUuid, setActiveOrganizationUuid } from '../../auth/auth.store'
import { useAuth } from '../../hooks/useAuth'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const { currentUser } = useAuth()

  useEffect(() => {
    if (currentUser?.active_workspace_uuid && !getActiveOrganizationUuid()) {
      setActiveOrganizationUuid(currentUser.active_workspace_uuid)
    }
  }, [currentUser?.active_workspace_uuid])

  return (
    <div className="relative flex h-full overflow-x-hidden bg-ase-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-ase-primary/15 via-ase-accent/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-200px] h-[420px] w-[520px] rounded-full bg-gradient-to-tr from-ase-accent/12 via-transparent to-ase-primary/10 blur-3xl" />
      </div>
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

