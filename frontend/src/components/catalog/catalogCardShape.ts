import type { CatalogItemType } from '../../types/catalog.types'

/**
 * Each catalog item type gets its own deliberate card silhouette so a grid of
 * mixed types (favorites, purchases) reads as intentional grouping rather
 * than randomly inconsistent cards. Within a single type the shape is always
 * the same, so any single-type catalog page (products, courses, books,
 * resources) is internally homogeneous.
 */
export function catalogImageAspectClass(type: CatalogItemType): string {
  switch (type) {
    case 'book':
      // Portrait, paperback-cover proportions.
      return 'aspect-[2/3]'
    case 'resource':
      // Square, file/template-tile proportions.
      return 'aspect-square'
    case 'course':
      // Widescreen, video-thumbnail proportions.
      return 'aspect-[16/9]'
    case 'product':
    default:
      // Landscape, product-screenshot proportions.
      return 'aspect-[16/10]'
  }
}
