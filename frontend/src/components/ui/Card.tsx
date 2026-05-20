import type { PropsWithChildren } from 'react'
import { cn } from './cn'

type Props = PropsWithChildren & {
  className?: string
  interactive?: boolean
}

export function Card({ children, className, interactive }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ase-border/80 bg-ase-surface/90 p-6 shadow-soft backdrop-blur-sm',
        'transition duration-200 ease-out',
        interactive &&
          'hover:-translate-y-0.5 hover:border-ase-border hover:bg-ase-surfaceSoft/90 hover:shadow-ase-lg',
        className,
      )}
    >
      {children}
    </div>
  )
}
