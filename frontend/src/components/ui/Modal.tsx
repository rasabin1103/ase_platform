import type { PropsWithChildren, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'
import { Button } from './Button'

type Props = PropsWithChildren & {
  open: boolean
  title?: ReactNode
  onClose: () => void
  footer?: ReactNode
  className?: string
  closeLabel?: ReactNode
}

export function Modal({ open, title, onClose, footer, children, className, closeLabel = 'Close' }: Props) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'w-full max-w-lg overflow-hidden rounded-2xl border border-ase-border bg-ase-surface shadow-soft',
            className,
          )}
        >
          {(title ?? null) && (
            <div className="flex items-center justify-between border-b border-ase-border px-6 py-4">
              <div className="text-sm font-semibold text-ase-text">{title}</div>
              <Button variant="ghost" className="h-9 px-3" onClick={onClose}>
                {closeLabel}
              </Button>
            </div>
          )}

          <div className="px-6 py-5">{children}</div>

          {footer && <div className="border-t border-ase-border px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

