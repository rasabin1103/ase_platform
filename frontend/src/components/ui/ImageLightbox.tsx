import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useI18n } from '../../i18n'

type Props = {
  /** null/undefined renders nothing — controlled entirely by the parent's
   * "currently zoomed image" state, so opening/closing is just setting a
   * string. */
  src: string | null | undefined
  alt?: string
  onClose: () => void
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Full-screen click-to-zoom overlay for a single image — closes on
 * Escape, backdrop click, or the close button. Used for blog cover images
 * and inline article images (via event delegation on the article
 * container, since that content is rendered from sanitized HTML).
 *
 * Same focus-trap/restore contract as Modal.tsx (this doesn't reuse Modal
 * directly — Modal's boxed, padded chrome would replace the full-bleed
 * black overlay this is meant to look like): on open, focus moves into the
 * dialog; Tab is trapped inside it; Escape closes; on close, focus returns
 * to whatever triggered it. Previously this only listened for Escape and
 * locked body scroll, leaving keyboard users able to Tab "through" the
 * backdrop into the page behind it, and screen readers announcing an
 * unnamed dialog (WCAG 2.4.3 / 4.1.2).
 */
export function ImageLightbox({ src, alt = '', onClose }: Props) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Same fix as Modal.tsx: read the latest onClose via a ref rather than
  // depending on it directly, so a caller's inline closure changing
  // identity on every render doesn't rerun this focus-trap/restore effect
  // while the lightbox is still open for the same image.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!src) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const node = dialogRef.current
    const focusable = node?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(focusable?.[0] ?? node)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
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
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [src])

  if (!src) return null

  // Rendered into document.body via a portal rather than inline where the
  // component is used — inline would put `fixed inset-0` inside whatever
  // ancestor happens to be there, and any ancestor with a CSS transform
  // (e.g. a card's `hover:-translate-y-1` or `group-hover:scale-...`)
  // turns into a new containing block for fixed-position descendants,
  // silently breaking full-viewport centering. A portal sidesteps that
  // regardless of where the trigger image lives in the tree.
  return createPortal(
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={(alt || (t('a11y.imageViewer') as string)) ?? undefined}
      tabIndex={-1}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/40 text-white transition hover:bg-black/60"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>
      {/* Click on the image itself only stops propagation, so it doesn't
          also trigger the backdrop's onClose. */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] cursor-zoom-out rounded-lg object-contain shadow-2xl"
      />
    </div>,
    document.body,
  )
}
