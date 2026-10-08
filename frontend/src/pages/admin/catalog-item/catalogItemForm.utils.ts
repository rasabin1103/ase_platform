import type { CatalogItemAdmin, CatalogItemAdminPayload, TestInputVariableDef } from '../../../api/catalogAdmin.api'
import type { CatalogItemLevel, CatalogItemStatus, CatalogItemType } from '../../../types/catalog.types'

export type FormValues = CatalogItemAdminPayload

export const TYPES: CatalogItemType[] = ['product', 'course', 'book', 'resource']
export const STATUSES: CatalogItemStatus[] = ['published', 'draft', 'coming_soon', 'request_only']
export const LEVELS: CatalogItemLevel[] = ['beginner', 'intermediate', 'advanced']
export const LICENSE_SCOPES = ['individual', 'company'] as const
export const LICENSE_REDISTRIBUTION_OPTIONS = ['prohibited', 'allowed', 'allowed_with_attribution'] as const

/** Campos de texto opcionales: vacío se guarda como null. */
export const emptyToNull = (v: unknown) => (v === '' ? null : v)
/** Campos numéricos opcionales: vacío se guarda como null. */
export const emptyToNullNumber = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v))

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
}

export function variableKeySlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100)
}

export const emptyVariable: TestInputVariableDef = {
  key: '',
  label: '',
  type: 'text',
  required: false,
  description: '',
  options: [],
  default: '',
}

/** `options` se guarda como `string[]` pero se edita como una línea separada
 * por comas, igual que el editor de opciones de las categorías. */
export function optionsToText(options: string[] | null | undefined): string {
  return (options ?? []).join(', ')
}

export function textToOptions(text: string): string[] {
  return text
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
}

export const defaultValues = (type: CatalogItemType): FormValues => ({
  title: '',
  slug: '',
  type,
  category: 'General',
  short_description: '',
  long_description: '',
  title_en: '',
  short_description_en: '',
  long_description_en: '',
  image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
  preview_url: null,
  audiobook_url: null,
  price: 0,
  currency: 'EUR',
  status: 'draft',
  level: 'intermediate',
  duration: null,
  author: 'ASE',
  benefits: [],
  requirements: [],
  included_items: [],
  tags: [],
  series_name: null,
  series_order: null,
  repo_url: null,
  repo_redeem_code: null,
  repo_path: null,
  dimension_selections: [],
  page_count: null,
  test_repo_url: null,
  test_workflow_file: null,
  test_included_runs: null,
  current_version: null,
  changelog: [],
  compatibility: [],
  // Valores por defecto alineados con las condiciones estándar de la
  // plataforma; el admin puede cambiarlos por ítem antes de guardar.
  license_scope: ['individual'],
  license_redistribution: 'prohibited',
  license_updates_included: true,
  license_support_included: true,
  license_refund_policy: null,
  getting_started: null,
  academy_course_key: null,
})

export function valuesFromItem(initial: CatalogItemAdmin): FormValues {
  return {
    title: initial.title,
    slug: initial.slug,
    type: initial.type,
    category: initial.category,
    short_description: initial.short_description,
    long_description: initial.long_description,
    title_en: initial.title_en ?? '',
    short_description_en: initial.short_description_en ?? '',
    long_description_en: initial.long_description_en ?? '',
    image_url: initial.image_url,
    preview_url: initial.preview_url,
    audiobook_url: initial.audiobook_url,
    price: Number(initial.price),
    currency: initial.currency,
    status: initial.status,
    level: initial.level,
    duration: initial.duration,
    author: initial.author,
    benefits: initial.benefits ?? [],
    requirements: initial.requirements ?? [],
    included_items: initial.included_items ?? [],
    tags: initial.tags ?? [],
    series_name: initial.series_name ?? null,
    series_order: initial.series_order ?? null,
    repo_url: initial.repo_url,
    repo_redeem_code: initial.repo_redeem_code,
    repo_path: initial.repo_path,
    dimension_selections: initial.dimension_selections ?? [],
    page_count: initial.page_count ?? null,
    test_repo_url: initial.test_repo_url ?? null,
    test_workflow_file: initial.test_workflow_file ?? null,
    test_included_runs: initial.test_included_runs ?? null,
    current_version: initial.current_version ?? null,
    changelog: initial.changelog ?? [],
    compatibility: initial.compatibility ?? [],
    license_scope: initial.license_scope ?? [],
    license_redistribution: initial.license_redistribution ?? null,
    license_updates_included: initial.license_updates_included ?? false,
    license_support_included: initial.license_support_included ?? false,
    license_refund_policy: initial.license_refund_policy ?? null,
    getting_started: initial.getting_started ?? null,
    academy_course_key: initial.academy_course_key ?? null,
  }
}

/** Deduplica sin distinguir mayúsculas y conserva la primera grafía, igual
 * que ConsumerCatalogRepository.distinct_tags() en el backend («QA» y «qa»
 * quedan en una sola etiqueta sin estropear siglas). */
export function parseTags(input: string): string[] {
  const seen = new Map<string, string>()
  for (const raw of input.split(',')) {
    const tag = raw.trim()
    if (!tag) continue
    const key = tag.toLowerCase()
    if (!seen.has(key)) seen.set(key, tag)
  }
  return Array.from(seen.values())
}

export function parseChangelog(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function parseCompatibility(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  )
}

/** Secciones del formulario, en orden. */
export const SECTION_IDS = ['basics', 'description', 'media', 'pricing', 'organize', 'content', 'license'] as const

export type SectionId = (typeof SECTION_IDS)[number]

/** En qué sección vive cada campo, para saltar a la primera con errores. */
export const FIELD_SECTION: Partial<Record<keyof FormValues, SectionId>> = {
  title: 'basics',
  title_en: 'basics',
  slug: 'basics',
  category: 'basics',
  author: 'basics',
  short_description: 'description',
  long_description: 'description',
  image_url: 'media',
  preview_url: 'media',
  price: 'pricing',
  currency: 'pricing',
  repo_url: 'content',
  repo_redeem_code: 'content',
  repo_path: 'content',
  audiobook_url: 'content',
  test_repo_url: 'content',
  test_workflow_file: 'content',
  test_included_runs: 'content',
}

export const sectionDomId = (id: SectionId) => `catalog-item-section-${id}`

export const SECTION_COPY = {
  es: {
    basics: { title: 'Identidad', hint: 'Cómo se llama, dónde vive y quién lo firma.' },
    description: { title: 'Descripción', hint: 'Lo que lee el cliente en la ficha. El inglés se traduce solo si lo dejas vacío.' },
    media: { title: 'Imágenes y vista previa', hint: 'Portada, galería y enlace de vista previa.' },
    pricing: { title: 'Precio y publicación', hint: 'Precio, estado de publicación y motor de precios.' },
    organize: { title: 'Organización', hint: 'Etiquetas, serie y campos propios de la categoría.' },
    content: { title: 'Contenido y entrega', hint: 'Cómo recibe el cliente lo que compra.' },
    license: { title: 'Licencia', hint: 'Condiciones de uso que verá el comprador.' },
    jump: 'Ir a',
    errors: (n: number) => (n === 1 ? 'Revisa 1 campo marcado en rojo.' : `Revisa ${n} campos marcados en rojo.`),
  },
  en: {
    basics: { title: 'Identity', hint: 'Its name, where it lives and who signs it.' },
    description: { title: 'Description', hint: 'What customers read on the page. English is translated automatically if left empty.' },
    media: { title: 'Images and preview', hint: 'Cover, gallery and preview link.' },
    pricing: { title: 'Price and publishing', hint: 'Price, publishing status and pricing engine.' },
    organize: { title: 'Organization', hint: 'Tags, series and category-specific fields.' },
    content: { title: 'Content and delivery', hint: 'How the customer receives what they buy.' },
    license: { title: 'License', hint: 'Usage terms the buyer will see.' },
    jump: 'Go to',
    errors: (n: number) => (n === 1 ? 'Check 1 field marked in red.' : `Check ${n} fields marked in red.`),
  },
} as const

export const textareaClass =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text'

export const inputErrClass = (hasError: boolean) =>
  hasError ? 'border-ase-error focus-visible:border-ase-error focus-visible:ring-ase-error/30' : ''
