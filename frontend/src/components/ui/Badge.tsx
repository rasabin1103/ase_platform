import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error'
}

export function Badge({ className, variant = 'default', ...props }: Props) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ring-1 ring-white/[0.04]'

  const variants: Record<NonNullable<Props['variant']>, string> = {
    default: 'border-white/[0.08] bg-white/[0.04] text-ase-text2',
    info: 'border-ase-primary/25 bg-ase-primary/[0.08] text-ase-primary',
    success: 'border-ase-success/25 bg-ase-success/10 text-ase-success',
    warning: 'border-ase-warning/25 bg-ase-warning/10 text-ase-warning',
    error: 'border-ase-error/25 bg-ase-error/10 text-ase-error',
  }

  return <span className={cn(base, variants[variant], className)} {...props} />
}
