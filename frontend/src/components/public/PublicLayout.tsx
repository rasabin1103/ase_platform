import { Outlet } from 'react-router-dom'
import { PublicAmbientBackground } from './PublicAmbientBackground'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

export function PublicLayout() {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-ase-bg text-ase-text">
      <PublicAmbientBackground />

      <PublicHeader />
      <main className="relative">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
