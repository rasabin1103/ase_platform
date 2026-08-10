import { cn } from './cn'

type Props = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeClass = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-11 w-11 border-[3px]',
} as const

/** Brand ring spinner — see DESIGN.md § Estados de carga */
export function LoadingIndicator({ className, size = 'md', label = 'Loading' }: Props) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <span
        className={cn(
          'animate-spin rounded-full border-ase-brand/25 border-t-ase-brand',
          sizeClass[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
