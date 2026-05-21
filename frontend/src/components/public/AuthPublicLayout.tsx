import { Outlet } from 'react-router-dom'
import { PublicAmbientBackground } from './PublicAmbientBackground'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

export function AuthPublicLayout() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-ase-bg text-ase-text">
      <PublicAmbientBackground />

      <PublicHeader />
      <main className="relative min-h-0 w-full flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
