import { BrandLogo } from '../brand/BrandLogo'
import { useRbac } from '../../rbac/useRbac'
import { SidebarNavGroups } from './SidebarNavGroups'

export function Sidebar() {
  const { navGroups } = useRbac()
  return (
    <aside className="relative z-10 flex w-72 shrink-0 flex-col self-stretch overflow-hidden bg-ase-bg2/95">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_42%)]" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-b from-transparent via-ase-bg2/50 to-ase-bg2/[0.98]"
        aria-hidden
      />
      <div className="relative shrink-0 border-b border-white/[0.06] px-4 py-5">
        <BrandLogo placement="app-sidebar" className="w-full justify-start" />
      </div>
      <nav className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-5">
        <SidebarNavGroups groups={navGroups} />
      </nav>
    </aside>
  )
}
