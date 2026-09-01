import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type Props = {
  /** null/undefined renders nothing — controlled entirely by the parent's
   * "currently zoomed image" state, so opening/closing is just setting a
   * string. */
  src: string | null | undefined
  alt?: string
  onClose: () => void
}

/** Full-screen click-to-zoom overlay for a single image — closes on
 * Escape, backdrop click, or the close button. Used for blog cover images
 * and inline article images (via event delegation on the article
 * container, since that content is rendered from sanitized HTML). */
export function ImageLightbox({ src, alt = '', onClose }: Props) {
  useEffect(() => {
    if (!src) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [src, onClose])

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
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
