import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
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
    'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold outline-none transition will-change-transform disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ase-primary/60'

  const sizes: Record<NonNullable<Props['size']>, string> = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary:
      cn(
        'border border-white/10 text-ase-text',
        'bg-gradient-to-b from-ase-primary via-ase-primaryStrong to-ase-primaryStrong',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.52),0_0_44px_rgba(34,211,238,0.16)]',
        'hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_22px_58px_rgba(0,0,0,0.62),0_0_56px_rgba(34,211,238,0.22)]',
        'active:translate-y-px active:brightness-105',
      ),
    secondary:
      cn(
        'bg-ase-surface/70 text-ase-text border border-white/10 backdrop-blur',
        'hover:bg-ase-surfaceSoft/70 hover:border-white/15',
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
      'bg-gradient-to-b from-ase-error/95 to-ase-error',
      'hover:brightness-110',
      'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_12px_32px_rgba(0,0,0,0.45),0_0_18px_rgba(239,68,68,0.10)]',
      'active:translate-y-px',
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
      {leftIcon ? <span className="inline-flex h-5 w-5 items-center justify-center">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="inline-flex h-5 w-5 items-center justify-center">{rightIcon}</span> : null}
    </button>
  )
}

