import type { CatalogItemType } from '../../types/catalog.types'
import { AuthenticatedImage } from '../ui/AuthenticatedImage'
import { cn } from '../ui/cn'
import {
  catalogPlaceholderIcon,
  catalogPlaceholderLabel,
  getCatalogImageAspectClass,
  getImageFitByCatalogType,
} from './catalogImageUtils'

type Props = {
  src: string | null | undefined
  type: CatalogItemType
  alt?: string
  variant?: 'card' | 'detail' | 'hero'
  className?: string
  cacheKey?: string | number
}

export function CatalogImage({ src, type, alt = '', variant = 'card', className, cacheKey }: Props) {
  const fit = getImageFitByCatalogType(type)
  const aspect = getCatalogImageAspectClass(type, variant)

  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-ase-bg2 via-ase-surface/80 to-ase-bg2',
        'ring-1 ring-inset ring-white/[0.06]',
        aspect,
        className,
      )}
    >
      <AuthenticatedImage
        src={src}
        alt={alt}
        cacheKey={cacheKey}
        className={cn('h-full w-full', fit === 'contain' ? 'object-contain p-3' : 'object-cover')}
        fallback={
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <span className="text-3xl opacity-80" aria-hidden>
              {catalogPlaceholderIcon(type)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ase-muted/90">
              {catalogPlaceholderLabel(type)}
            </span>
          </div>
        }
      />
    </div>
  )
}
