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
        'rounded-xl border border-ase-border bg-ase-surface p-6 shadow-soft',
        'transition duration-200 ease-out',
        interactive &&
          'hover:-translate-y-0.5 hover:border-white/15 hover:bg-ase-surfaceSoft hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_18px_50px_rgba(0,0,0,0.65)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

