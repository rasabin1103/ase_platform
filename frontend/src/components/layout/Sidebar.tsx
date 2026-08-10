import { BrandLogo } from '../brand/BrandLogo'
import { useRbac } from '../../rbac/useRbac'
import { SidebarNavGroups } from './SidebarNavGroups'

export function Sidebar() {
  const { navGroups } = useRbac()
  return (
    <aside className="relative flex h-full w-80 shrink-0 flex-col overflow-hidden border-r border-white/[0.08] bg-ase-bg2/95">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.035),transparent_42%)]" />
      <div className="relative shrink-0 border-b border-white/[0.06] px-5 py-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex shrink-0 items-center rounded-2xl border border-ase-brand/25 bg-ase-brand/10 px-2 py-1.5 shadow-[0_0_24px_rgba(34,211,238,0.14)]">
            <BrandLogo variant="icon" size="sm" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[14px] font-bold tracking-tight text-ase-text">Arce Sabin Engineering</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              Enterprise dashboard
            </div>
          </div>
        </div>
      </div>
      <nav className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-5">
        <SidebarNavGroups groups={navGroups} />
      </nav>
    </aside>
  )
}
