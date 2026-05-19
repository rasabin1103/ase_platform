import type { ReactNode } from 'react'
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
        'rounded-2xl border border-ase-border bg-gradient-to-b from-white/[0.04] to-transparent p-8',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-ase-border bg-ase-surfaceSoft text-ase-text2">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ase-text">{title}</div>
          {description && <div className="mt-1 text-sm text-ase-text2">{description}</div>}
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

