import type { PropsWithChildren } from 'react'
import { cn } from './cn'

const ACCENT_RADIAL: Record<'cyan' | 'gold' | 'violet', string> = {
  cyan: 'radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.14),transparent_46%)',
  gold: 'radial-gradient(circle_at_50%_0%,rgba(232,179,104,0.14),transparent_46%)',
  violet: 'radial-gradient(circle_at_50%_0%,rgba(167,139,250,0.14),transparent_46%)',
}

export type PremiumSurfaceProps = PropsWithChildren<{
  className?: string
  accent?: 'cyan' | 'gold' | 'violet'
  /** Renders the faint grid-line overlay used behind the admin application
   * map. Off by default for smaller cards where it would just look noisy. */
  grid?: boolean
}>

/** Shared "premium" backdrop — radial brand-color glow + shadow depth,
 * matching the language built for the admin application map
 * (ApplicationMapTree.tsx: glow, depth, subtle grid, staggered fade-ins).
 * Reused on public-facing pages (Home, Plans, Blog) so the first customer
 * touchpoints get the same finish instead of it staying admin-only. Pass
 * `grid` for large hero-style sections; leave it off for smaller cards. */
export function PremiumSurface({ children, className, accent = 'cyan', grid = false }: PremiumSurfaceProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-white/[0.08] shadow-[0_26px_90px_rgba(0,0,0,0.35)]',
        className,
      )}
      style={{
        backgroundImage: `${ACCENT_RADIAL[accent]}, linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
      }}
    >
      {grid ? (
        <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:34px_34px]" />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  )
}
