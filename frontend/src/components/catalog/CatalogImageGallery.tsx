import { useState } from 'react'
import { cn } from '../ui/cn'
import { CatalogImage } from './CatalogImage'
import type { CatalogItemImage } from '../../types/catalog.types'

type Props = {
  images: CatalogItemImage[]
  fallbackSrc: string
  alt: string
  cacheKey?: string
  type?: 'book' | 'product' | 'course' | 'resource'
}

export function CatalogImageGallery({ images, fallbackSrc, alt, cacheKey, type = 'book' }: Props) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  const primary = sorted.find((i) => i.isPrimary) ?? sorted[0]
  const [activeUrl, setActiveUrl] = useState(primary?.imageUrl ?? fallbackSrc)

  if (!sorted.length) {
    return <CatalogImage src={fallbackSrc} type={type} variant="hero" alt={alt} cacheKey={cacheKey} />
  }

  return (
    <div className="space-y-4">
      <CatalogImage src={activeUrl} type={type} variant="hero" alt={alt} cacheKey={cacheKey} />
      {sorted.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {sorted.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveUrl(img.imageUrl)}
              className={cn(
                'h-16 w-16 overflow-hidden rounded-lg border transition',
                activeUrl === img.imageUrl
                  ? 'border-cyan-400/60 ring-2 ring-cyan-400/30'
                  : 'border-white/10 opacity-75 hover:opacity-100',
              )}
            >
              <img src={img.imageUrl} alt={img.altText ?? alt} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
