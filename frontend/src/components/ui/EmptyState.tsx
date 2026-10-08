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
  /** Segunda salida opcional (p. ej. «Ver planes» junto a «Explorar catálogo»). */
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-ase-surface/80 px-8 py-10 text-center sm:text-left',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-sky-300">
          {icon ?? <PackageSearch className="h-5 w-5" strokeWidth={1.75} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-semibold text-ase-text">{title}</div>
          {description && <div className="mt-1.5 text-sm leading-relaxed text-ase-text2">{description}</div>}
          {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
              {secondaryActionLabel && onSecondaryAction ? (
                <Button variant="outline" onClick={onSecondaryAction}>
                  {secondaryActionLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

