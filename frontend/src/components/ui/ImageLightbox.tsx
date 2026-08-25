import { useEffect } from 'react'
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

  return (
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
    </div>
  )
}
