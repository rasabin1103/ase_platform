import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AuthenticatedImage } from '../ui/AuthenticatedImage'
import { cn } from '../ui/cn'
import type { CatalogItemGalleryImage } from '../../types/catalog.types'

type Props = {
  images: CatalogItemGalleryImage[]
  /** Used when `images` is empty — e.g. items created before the gallery existed. */
  fallbackUrl?: string | null
  alt?: string
  /** Tailwind aspect-ratio class for the main image area. */
  aspectClassName?: string
  className?: string
  /** Decorative content (badges, etc.) absolutely positioned over the main image frame. */
  overlay?: ReactNode
}

export function ImageCarousel({ images, fallbackUrl, alt = '', aspectClassName, className, overlay }: Props) {
  const gallery = useMemo(() => {
    if (images.length > 0) return images
    if (fallbackUrl) return [{ url: fallbackUrl, isCover: true }]
    return []
  }, [images, fallbackUrl])

  const [index, setIndex] = useState(0)
  const safeIndex = Math.min(index, Math.max(gallery.length - 1, 0))
  const current = gallery[safeIndex]

  if (gallery.length === 0) {
    return (
      <div className={cn('flex items-center justify-center bg-white/[0.04] text-ase-muted', aspectClassName, className)}>
        ◇
      </div>
    )
  }

  function go(delta: number) {
    setIndex((i) => (i + delta + gallery.length) % gallery.length)
  }

  return (
    <div className={className}>
      <div className={cn('group relative overflow-hidden rounded-2xl bg-ase-bg2', aspectClassName)}>
        <AuthenticatedImage src={current?.url} alt={alt} className="h-full w-full" />
        {overlay}
        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-ase-text opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-ase-text opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {gallery.map((img, i) => (
                <button
                  key={img.url + i}
                  type="button"
                  aria-label={`Go to image ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === safeIndex ? 'w-5 bg-ase-primary' : 'w-1.5 bg-white/40 hover:bg-white/60',
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      {gallery.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {gallery.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition',
                i === safeIndex ? 'border-ase-primary' : 'border-white/10 hover:border-white/25',
              )}
            >
              <AuthenticatedImage src={img.url} alt="" className="h-full w-full" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
