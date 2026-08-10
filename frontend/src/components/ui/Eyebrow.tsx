import type { HTMLAttributes } from 'react'
import { cn } from './cn'

/**
 * Editorial section marker: a short accent rule + uppercase label.
 * Used for repeating interior sections instead of the bordered pill Badge,
 * so scrolling through the page doesn't read as the same "chip" component
 * copy-pasted above every single heading.
 */
export function Eyebrow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)} {...props}>
      <span className="h-px w-8 shrink-0 bg-ase-brand/60" />
      <span className="text-label font-semibold uppercase text-ase-brand">{children}</span>
    </div>
  )
}
