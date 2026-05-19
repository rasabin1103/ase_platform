import type { Service } from '../types/service.types'

function readStringArray(t: (key: string) => unknown, key: string): string[] {
  const v = t(key)
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x))
}

/**
 * Overlay for API-backed service copy. When `servicesPage.catalog.byCode.<code>.*`
 * exists for the active language, those strings replace the API fields.
 */
export function localizedServiceCopy(t: (key: string) => unknown, service: Service) {
  const code = service.code
  const prefix = `servicesPage.catalog.byCode.${code}`

  const pick = (field: string, fallback: string | null) => {
    const key = `${prefix}.${field}`
    const v = t(key)
    if (typeof v === 'string' && v.length > 0 && v !== key) return v
    return fallback ?? ''
  }

  const name = pick('name', service.name)
  const heroTitle = pick('heroTitle', service.hero_title || service.name)
  const heroSubtitle = pick('heroSubtitle', service.hero_subtitle || '')
  const shortDescription = pick('shortDescription', service.short_description || '')
  const description = pick('description', service.description || '')

  const locFeatTexts = readStringArray(t, `${prefix}.features`)
  const features =
    locFeatTexts.length > 0 && locFeatTexts.length === service.features.length
      ? service.features.map((f, i) => ({ ...f, text: locFeatTexts[i]! }))
      : service.features

  const rawHighlights = t(`${prefix}.highlights`)
  let highlights = service.highlights
  if (Array.isArray(rawHighlights) && rawHighlights.length === service.highlights.length) {
    highlights = service.highlights.map((h, i) => {
      const L = rawHighlights[i] as { title?: string; value?: string; description?: string | null } | undefined
      let description = h.description
      if (L && 'description' in L) {
        description = L.description === null ? null : typeof L.description === 'string' ? L.description : h.description
      }
      return {
        ...h,
        title: typeof L?.title === 'string' ? L.title : h.title,
        value: typeof L?.value === 'string' ? L.value : h.value,
        description,
      }
    })
  }

  return { name, heroTitle, heroSubtitle, shortDescription, description, features, highlights }
}
