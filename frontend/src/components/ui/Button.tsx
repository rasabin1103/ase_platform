import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'favoriteActive' | 'success'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  type = 'button',
  children,
  ...props
}: Props) {
  const base =
    'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold outline-none transition will-change-transform disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ase-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ase-bg'

  const sizes: Record<NonNullable<Props['size']>, string> = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary:
      cn(
        'border border-white/10 text-ase-text',
        'bg-ase-brand text-ase-ink',
        'shadow-brand hover:brightness-110 hover:shadow-[0_0_24px_rgba(56,189,248,0.32)]',
        'active:translate-y-px active:brightness-105',
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
    danger: cn(
      'border border-white/10 text-ase-text',
      'bg-ase-error',
      'hover:brightness-110',
      'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_12px_32px_rgba(0,0,0,0.45),0_0_18px_rgba(239,68,68,0.10)]',
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

  return (
    <button
      type={type}
      className={cn(
        base,
        sizes[size],
        variants[variant],
        'duration-200 ease-out',
        className,
      )}
      {...props}
    >
      {leftIcon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{leftIcon}</span> : null}
      <span className="min-w-0 truncate">{children}</span>
      {rightIcon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{rightIcon}</span> : null}
    </button>
  )
}

