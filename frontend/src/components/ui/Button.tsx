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
    'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold outline-none transition duration-200 ease-out will-change-transform disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ase-primary/55 focus-visible:ring-offset-0'

  const sizes: Record<NonNullable<Props['size']>, string> = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-[15px] leading-tight',
  }

  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary: cn(
      'border border-white/[0.08] text-ase-text',
      'bg-gradient-to-b from-ase-primary via-ase-primaryStrong to-ase-primaryStrong',
      'shadow-ase hover:brightness-[1.06] hover:shadow-ase-lg',
      'active:translate-y-px active:brightness-[1.02]',
    ),
    secondary: cn(
      'border border-white/[0.08] bg-ase-surface/80 text-ase-text backdrop-blur-sm',
      'shadow-soft hover:border-white/[0.12] hover:bg-ase-surfaceSoft/85',
      'active:translate-y-px',
    ),
    ghost: cn(
      'border border-transparent bg-transparent text-ase-text2',
      'hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-ase-text',
      'active:translate-y-px',
    ),
    outline: cn(
      'border border-white/[0.12] bg-transparent text-ase-text',
      'hover:border-white/[0.18] hover:bg-white/[0.03]',
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
      'active:translate-y-px',
    ),
    danger: cn(
      'border border-white/[0.08] text-ase-text',
      'bg-gradient-to-b from-ase-error/95 to-ase-error',
      'shadow-soft hover:brightness-110',
      'active:translate-y-px',
    ),
  }

  return (
    <button
      type={type}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {leftIcon ? <span className="inline-flex h-5 w-5 items-center justify-center">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="inline-flex h-5 w-5 items-center justify-center">{rightIcon}</span> : null}
    </button>
  )
}
