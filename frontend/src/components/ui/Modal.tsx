import type { PropsWithChildren, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'
import { Button } from './Button'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'wide'

const MODAL_SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  wide: 'max-w-6xl',
}

type Props = PropsWithChildren & {
  open: boolean
  title?: ReactNode
  onClose: () => void
  footer?: ReactNode
  className?: string
  closeLabel?: ReactNode
  /** Dialog max width; default `md`. Use `wide` or `2xl` for large forms. */
  size?: ModalSize
}

export function Modal({
  open,
  title,
  onClose,
  footer,
  children,
  className,
  closeLabel = 'Close',
  size = 'md',
}: Props) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'flex max-h-[min(92vh,960px)] w-full flex-col overflow-hidden rounded-2xl border border-ase-border bg-ase-surface shadow-soft',
            MODAL_SIZE_CLASS[size],
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

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">{children}</div>

          {footer && <div className="border-t border-ase-border px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

