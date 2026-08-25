import { Maximize2, Minimize2 } from 'lucide-react'
import { useState, type PropsWithChildren, type ReactNode } from 'react'
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
  // Shows a maximize/restore toggle next to Close — on by default so every
  // modal in the app offers it, not just the ones that obviously need the
  // extra room. Only rendered alongside a `title`, since that's the only
  // place there's a header row to put the toggle button in. Set explicitly
  // to `false` for the rare modal where maximizing genuinely makes no
  // sense (e.g. a single yes/no confirmation with no scrollable content).
  allowFullscreen?: boolean
}

export function Modal({
  open,
  title,
  onClose,
  footer,
  children,
  className,
  closeLabel = 'Close',
  allowFullscreen = true,
}: Props) {
  // Resets every time the modal closes rather than persisting across opens —
  // a maximized state carrying over to the next unrelated item feels like a
  // bug, not a preference worth remembering.
  const [fullscreen, setFullscreen] = useState(false)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={cn('absolute inset-0 flex items-center justify-center', fullscreen ? 'p-0' : 'p-4')}>
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
            'flex flex-col overflow-hidden border border-ase-border bg-ase-surface shadow-soft',
            fullscreen
              ? 'h-full w-full max-h-none max-w-none rounded-none'
              // className is only applied in the non-fullscreen branch —
              // deliberately, since a caller-provided width override (e.g.
              // "max-w-2xl") and the fullscreen "max-w-none" above would
              // otherwise both end up in the class list with no reliable
              // winner (this file's `cn` is a plain string join, not
              // tailwind-merge, so there's no de-duplication to lean on).
              : cn('max-h-[90vh] w-full max-w-lg rounded-2xl', className),
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
              <div className="flex shrink-0 items-center gap-2">
                {allowFullscreen ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3"
                    onClick={() => setFullscreen((v) => !v)}
                    aria-label={fullscreen ? 'Restore' : 'Fullscreen'}
                  >
                    {fullscreen ? (
                      <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
                    ) : (
                      <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </Button>
                ) : null}
                <Button variant="ghost" className="h-9 px-3" onClick={onClose}>
                  {closeLabel}
                </Button>
              </div>
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

