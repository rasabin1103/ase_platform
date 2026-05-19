import { Outlet } from 'react-router-dom'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

export function PublicLayout() {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-ase-bg text-ase-text">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-80 left-1/2 h-[720px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-ase-primary/20 via-ase-accent/14 to-transparent blur-3xl" />
        <div className="absolute top-40 left-[-260px] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-ase-accent/10 via-transparent to-ase-primary/12 blur-3xl" />
        <div className="absolute bottom-[-280px] right-[-280px] h-[640px] w-[760px] rounded-full bg-gradient-to-tr from-ase-accent/12 via-transparent to-ase-primary/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <PublicHeader />
      <main className="relative">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

