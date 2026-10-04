import { cn } from './cn'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'favoriteActive' | 'success'
export type Size = 'sm' | 'md' | 'lg'

// No blanket `will-change-transform` here: every idle Button/ButtonLink/
// ButtonAnchor on the page would reserve compositor layers it never uses
// (this component has no transform-based hover/active effect of its own —
// those live per-variant, e.g. primary's active:translate-y-px). Add a
// targeted will-change only on a specific variant if profiling shows it
// helps that one transform.
const BASE =
  'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold outline-none transition disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ase-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ase-bg'

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

/** Shared class builder so Button and ButtonLink below render the exact
 * same visual states from one source — a link styled to look like a
 * button must never actually BE a button wrapped in a link (nested
 * interactive content; see PublicHeader/ContactPage fix notes).
 *
 * Lives in its own module (not Button.tsx) because a .tsx file that
 * exports a plain function alongside components breaks Vite's Fast
 * Refresh for that file (react-refresh/only-export-components) — e.g. for
 * OrganizationDashboardPage's visual-only (non-focusable) CTA span, which
 * needs the exact same classes as a real Button without being one, since
 * its enclosing card is already the whole clickable Link. */
export function buttonClassName(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  const variants: Record<Variant, string> = {
    primary:
      cn(
        'ase-gradient-brand border border-white/20 text-white',
        'shadow-brand hover:brightness-110 hover:shadow-[0_0_28px_rgba(47,92,224,0.45)]',
        'active:translate-y-px active:brightness-95',
      ),
    secondary:
      cn(
        'bg-ase-surface text-ase-text border border-white/10',
        'hover:bg-ase-surfaceSoft hover:border-white/15',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_14px_34px_rgba(0,0,0,0.42)]',
        'active:translate-y-px active:brightness-105',
      ),
    ghost: cn(
      'bg-transparent text-ase-text2 border border-transparent',
      'hover:bg-white/[0.05] hover:text-ase-text',
      'active:translate-y-px active:bg-white/[0.06]',
    ),
    outline: cn(
      'bg-transparent text-ase-text border border-white/15',
      'hover:bg-white/[0.04] hover:border-white/25',
      'shadow-[0_0_0_1px_rgba(255,255,255,0.03)]',
      'active:translate-y-px',
    ),
    // bg-[#B91C1C] rather than bg-ase-error (#EF4444): ase-text (#F3F6FC)
    // on the raw error red measures 3.48:1, below the 4.5:1 WCAG 1.4.3
    // normal-text threshold — the button's own dedicated background, not
    // the shared ase-error token (left alone since it's also used for
    // error banners/borders elsewhere, which weren't flagged). This
    // darker red holds ~5.99:1 at rest and ~5.16:1 under hover:brightness-110;
    // active:translate-y-px has no brightness filter so it only stays darker.
    danger: cn(
      'border border-white/10 text-ase-text',
      'bg-[#B91C1C]',
      'hover:brightness-110',
      'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_12px_32px_rgba(0,0,0,0.45),0_0_18px_rgba(185,28,28,0.14)]',
      'active:translate-y-px',
    ),
    favoriteActive: cn(
      'border border-rose-400/40 text-rose-200',
      'bg-rose-500/15',
      'hover:bg-rose-500/25 hover:border-rose-400/60',
      'shadow-[0_0_0_1px_rgba(244,63,94,0.08),0_0_18px_rgba(244,63,94,0.18)]',
      'active:translate-y-px',
    ),
    success: cn(
      'border border-emerald-400/40 text-emerald-200',
      'bg-emerald-500/15',
      'hover:bg-emerald-500/20',
      'shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_0_18px_rgba(16,185,129,0.14)]',
    ),
  }

  return cn(BASE, SIZES[size], variants[variant], 'duration-200 ease-out', className)
}
