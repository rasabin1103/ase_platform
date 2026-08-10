import type { CatalogItemType } from '../../types/catalog.types'

/** Shared per-type accent colors used across catalog charts (progress donut,
 *  category bar charts) so a given type always reads the same color. */
export const CATALOG_TYPE_COLORS: Record<CatalogItemType, string> = {
  product: 'rgba(56,189,248,0.85)',
  course: 'rgba(34,211,238,0.75)',
  book: 'rgba(232,179,104,0.85)',
  resource: 'rgba(167,139,250,0.8)',
}

export const CATALOG_TYPE_ORDER: CatalogItemType[] = ['product', 'course', 'book', 'resource']
