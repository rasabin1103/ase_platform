import type { ReactNode } from 'react'
import { PackageSearch } from 'lucide-react'
import { cn } from './cn'
import { Button } from './Button'

type Props = {
  title: string
  description?: string
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ase-border bg-ase-surface px-8 py-10 text-center sm:text-left',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-ase-text2">
          {icon ?? <PackageSearch className="h-5 w-5" strokeWidth={1.75} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ase-text">{title}</div>
          {description && <div className="mt-1.5 text-sm leading-relaxed text-ase-text2">{description}</div>}
          {actionLabel && onAction && (
            <div className="mt-4">
              <Button variant="secondary" onClick={onAction}>
                {actionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

