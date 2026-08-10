import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error'
}

export function Badge({ className, variant = 'default', ...props }: Props) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium'

  const variants: Record<NonNullable<Props['variant']>, string> = {
    default: 'border-ase-border bg-white/5 text-ase-text2',
    info: 'border-ase-primary/30 bg-ase-primary/10 text-ase-primary',
    success: 'border-ase-success/30 bg-ase-success/10 text-ase-success',
    warning: 'border-ase-warning/30 bg-ase-warning/10 text-ase-warning',
    error: 'border-ase-error/30 bg-ase-error/10 text-ase-error',
  }

  return <span className={cn(base, variants[variant], className)} {...props} />
}

