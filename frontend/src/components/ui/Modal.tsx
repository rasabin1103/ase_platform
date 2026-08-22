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
            // flex-col + max-h caps the whole dialog to the viewport (minus
            // the surrounding p-4) at any zoom level or screen size; header
            // and footer are shrink-0 so they stay pinned, and only the body
            // (flex-1 + min-h-0, the classic flexbox-overflow requirement)
            // scrolls — so action buttons in `footer` are never pushed
            // off-screen by a long form.
            'flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ase-border bg-ase-surface shadow-soft',
            className,
          )}
        >
          {(title ?? null) && (
            // min-w-0 flex-1 on the title slot: a long title (e.g. a
            // resource's full repo path) needs to be allowed to actually
            // shrink/wrap instead of pushing the Close button around — a
            // flex item's default min-width is `auto` (content-based), so
            // without min-w-0 here nothing below it, however it
            // truncates/wraps internally, ever gets the chance to.
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ase-border px-6 py-4">
              <div className="min-w-0 flex-1 text-sm font-semibold text-ase-text">{title}</div>
              <Button variant="ghost" className="h-9 shrink-0 px-3" onClick={onClose}>
                {closeLabel}
              </Button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer && <div className="shrink-0 border-t border-ase-border px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

