import { Code, FileSpreadsheet, FileText } from 'lucide-react'
import type { CatalogItemType } from '../../types/catalog.types'

// Small "what kind of file is this" chip shown above the viewer body — a
// premium touch that also doubles as a quick sanity check for the admin
// (does the folder actually contain what I expect?) without opening the
// file in a new tab.
export const RESOURCE_KIND_META: Record<
  'markdown' | 'docx' | 'xlsx' | 'code' | 'pdf',
  { icon: typeof FileText; labelKey: string }
> = {
  markdown: { icon: FileText, labelKey: 'catalog.resource.kindMarkdown' },
  docx: { icon: FileText, labelKey: 'catalog.resource.kindDocx' },
  xlsx: { icon: FileSpreadsheet, labelKey: 'catalog.resource.kindXlsx' },
  code: { icon: Code, labelKey: 'catalog.resource.kindCode' },
  pdf: { icon: FileText, labelKey: 'catalog.resource.kindPdf' },
}

export const TYPE_CATALOG_PATH: Record<CatalogItemType, string> = {
  product: '/catalog/products',
  course: '/catalog/courses',
  book: '/catalog/books',
  resource: '/catalog/resources',
}

export function typeLabelKey(type: CatalogItemType): string {
  const map: Record<CatalogItemType, string> = {
    product: 'catalog.typeProduct',
    course: 'catalog.typeCourse',
    book: 'catalog.typeBook',
    resource: 'catalog.typeResource',
  }
  return map[type]
}

export function formatPrice(price: string | number, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

// Readable by default — a long Markdown description no longer dumps
// everything on-screen at once. Collapsed to a fixed height with a fade-out
// cue, expanded on click. Short descriptions (shorter than the collapsed
// height) never show the toggle at all — nothing to hide, so nothing to
// expand.
// Whether the collapsed height (max-h-64, ~256px) would plausibly need to
// clip this content — a plain length heuristic instead of a DOM
// measurement, so no ref/effect/ResizeObserver dance is needed just to
// decide whether the "show more" toggle should exist at all.
export const DESCRIPTION_COLLAPSE_THRESHOLD = 480

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${unitIndex === 0 ? value : value.toFixed(1)} ${units[unitIndex]}`
}

export function formatCatalogDate(iso: string, language: string) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'es-ES', { dateStyle: 'medium' }).format(new Date(iso))
}
