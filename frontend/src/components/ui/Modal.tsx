import { Maximize2, Minimize2, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type PropsWithChildren, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'
import { useOptionalI18n } from '../../i18n'
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
  // Hides the header's text "Close" button, leaving only whatever action(s)
  // the caller puts in `footer`. Off by default — most modals have no
  // footer dismiss button at all, so the header one is the only way to
  // close them. Exists for the rare modal (e.g. CriticalErrorModal) whose
  // footer already has its own "got it"/dismiss button, where showing both
  // would just be the same action offered twice.
  hideHeaderClose?: boolean
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  title,
  onClose,
  footer,
  children,
  className,
  closeLabel,
  allowFullscreen = true,
  hideHeaderClose = false,
}: Props) {
  const i18n = useOptionalI18n()
  const closeText = closeLabel ?? (i18n?.language === 'en' ? 'Close' : 'Cerrar')
  // Resets every time the modal closes rather than persisting across opens —
  // a maximized state carrying over to the next unrelated item feels like a
  // bug, not a preference worth remembering.
  const [fullscreen, setFullscreen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Read the latest onClose through a ref instead of putting it in the
  // effect's dependency array below. Callers routinely pass an inline
  // `() => setX(null)` closure, which is a new function on every render —
  // with onClose as a dependency, any parent re-render while the dialog is
  // open (a keystroke in a field, a query refetching) reran this whole
  // effect, which re-captured "previously focused" and jumped focus back to
  // the dialog's first control, silently kicking the user out of whatever
  // they were doing. Keeping the effect keyed only to `open` means it only
  // (re)runs on actual open/close transitions, while still calling whatever
  // onClose is current by the time Escape/backdrop-click fires.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Keyboard access: Escape closes (same as clicking the backdrop), Tab is
  // trapped inside the dialog so it never silently moves focus onto the
  // page content sitting behind the backdrop, and focus both moves into
  // the dialog on open and returns to whatever triggered it on close —
  // without this a keyboard/screen-reader user loses their place entirely
  // once the modal unmounts.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const node = dialogRef.current
    const focusable = node?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(focusable?.[0] ?? node)?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused?.focus?.()
    }
  }, [open])

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
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
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
              : // Sin tailwind-merge: si el llamador fija su propio ancho (max-w-*),
                // no se añade el max-w-lg por defecto, que si no ganaría siempre.
                cn('max-h-[90vh] w-full rounded-2xl', /(^|\s)(\w+:)?max-w-/.test(className ?? '') ? null : 'max-w-lg', className),
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
              <div id={titleId} className="min-w-0 flex-1 text-sm font-semibold text-ase-text">{title}</div>
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
                {!hideHeaderClose ? (
                  <Button
                    variant="outline"
                    className="h-9 px-3"
                    onClick={onClose}
                    leftIcon={<X className="h-4 w-4" strokeWidth={2} aria-hidden />}
                  >
                    {closeText}
                  </Button>
                ) : null}
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

