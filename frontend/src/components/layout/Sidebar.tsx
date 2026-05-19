import { BrandLogo } from '../brand/BrandLogo'
import { useRbac } from '../../rbac/useRbac'
import { SidebarNavGroups } from './SidebarNavGroups'

export function Sidebar() {
  const { navGroups } = useRbac()
  return (
    <aside className="relative h-full w-72 shrink-0 overflow-hidden border-r border-white/[0.08] bg-ase-bg2/95">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_42%)]" />
      <div className="relative px-5 py-5">
        <BrandLogo variant="icon" size="sm" showText className="justify-start" />
      </div>
      <nav className="relative h-[calc(100%-84px)] overflow-y-auto px-3 pb-5">
        <SidebarNavGroups groups={navGroups} />
      </nav>
    </aside>
  )
}
