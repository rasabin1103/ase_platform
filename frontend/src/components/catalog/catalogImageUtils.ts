import type { CatalogItemType } from '../../types/catalog.types'

export function getImageFitByCatalogType(type: CatalogItemType): 'contain' | 'cover' {
  return type === 'book' ? 'contain' : 'cover'
}

export function getCatalogImageAspectClass(type: CatalogItemType, variant: 'card' | 'detail' | 'hero'): string {
  if (type === 'book') {
    if (variant === 'hero') return 'aspect-[2/3] max-h-[min(640px,80vh)]'
    if (variant === 'detail') return 'aspect-[2/3]'
    return 'aspect-[2/3]'
  }
  if (variant === 'hero') return 'aspect-[4/3]'
  if (variant === 'detail') return 'aspect-[4/3]'
  return 'aspect-[16/10]'
}

export function catalogPlaceholderLabel(type: CatalogItemType): string {
  switch (type) {
    case 'book':
      return 'ASE Technical Series'
    case 'course':
      return 'ASE Academy'
    case 'product':
      return 'ASE Platform'
    case 'resource':
      return 'ASE Resources'
    default:
      return 'ASE'
  }
}

export function catalogPlaceholderIcon(type: CatalogItemType): string {
  switch (type) {
    case 'book':
      return '📖'
    case 'course':
      return '✦'
    case 'product':
      return '◇'
    case 'resource':
      return '📄'
    default:
      return '◇'
  }
}
