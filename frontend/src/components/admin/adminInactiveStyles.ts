import { cn } from '../ui/cn'

/** Muted admin styling for inactive / non-published records */
export function adminInactiveSurfaceClass(isInactive: boolean, className?: string) {
  return cn(
    isInactive &&
      'border-white/[0.06] bg-ase-bg2/55 opacity-[0.88] saturate-[0.92] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
    isInactive && 'ring-1 ring-inset ring-amber-400/10',
    className,
  )
}

export function adminInactiveRowClass(isInactive: boolean) {
  return cn(
    isInactive && 'bg-amber-950/15 text-ase-muted/95',
    isInactive && 'border-l-2 border-l-amber-400/35',
  )
}

export function isCatalogItemInactive(status: string) {
  return status !== 'published'
}

export function isPricingPlanInactive(isActive: boolean) {
  return !isActive
}

export function isUserInactive(status: string) {
  return status !== 'active'
}
