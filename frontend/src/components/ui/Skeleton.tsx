import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type Props = HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean
}

/** Brand-aligned placeholder — see DESIGN.md § Estados de carga */
export function Skeleton({ className, shimmer = true, ...props }: Props) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-ase-md border border-ase-brand/10 bg-ase-surfaceSoft/50',
        shimmer && 'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.4s_infinite]',
        shimmer && 'after:bg-gradient-to-r after:from-transparent after:via-ase-brand/25 after:to-transparent',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  )
}
