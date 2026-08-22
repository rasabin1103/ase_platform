import { BrandLogo } from '../brand/BrandLogo'
import { useRbac } from '../../rbac/useRbac'
import { cn } from '../ui/cn'
import { SidebarNavGroups } from './SidebarNavGroups'

export function Sidebar({
  collapsed = false,
  onClose,
}: {
  collapsed?: boolean
  /** Called when the mobile drawer should close: backdrop tap or a nav link
   * click. Unused at lg+, where the sidebar sits in normal flow instead of
   * as an overlay. */
  onClose?: () => void
}) {
  const { navGroups } = useRbac()
  return (
    <>
      {/* Backdrop — mobile/tablet only. The sidebar becomes a fixed overlay
          below lg (see the aside below), so this dims the page and gives a
          tap target to close it without hunting for the toggle button. */}
      {!collapsed ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      {/* Below lg: fixed off-canvas drawer, shown/hidden via translate-x so
          it never reserves layout space and can't squeeze the page content
          (the bug this fixes — the old always-in-flow w-80 sidebar ate most
          of a phone screen, leaving a ~50px sliver for the actual page).
          At lg+: back to a normal in-flow column, collapsed via width
          instead of translate, matching the desktop "hide sidebar" toggle. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 h-full w-80 overflow-hidden border-r border-white/[0.08] bg-ase-bg2 shadow-2xl transition-transform duration-200 ease-in-out',
          collapsed ? '-translate-x-full' : 'translate-x-0',
          'lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:bg-ase-bg2/95 lg:shadow-none lg:transition-[width,border-width]',
          collapsed ? 'lg:w-0 lg:border-r-0' : 'lg:w-80 lg:border-r',
        )}
        aria-hidden={collapsed}
      >
        {/* Inner wrapper stays a fixed w-80 so the logo/nav never reflow or
            squish mid-transition — they just get progressively clipped by
            the shrinking outer container (desktop) or slide fully off
            (mobile). */}
        <div className="flex h-full w-80 flex-col">
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
            <SidebarNavGroups
              groups={navGroups}
              onNavigate={() => {
                // Only auto-close on the mobile/tablet overlay — at lg+ the
                // sidebar is a normal in-flow column the user toggled on
                // purpose, and it shouldn't collapse just from navigating.
                if (window.innerWidth < 1024) onClose?.()
              }}
            />
          </nav>
        </div>
      </aside>
    </>
  )
}
