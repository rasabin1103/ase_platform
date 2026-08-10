import { describe, expect, it } from 'vitest'
import { parsePlanFeatureSections, shouldShowCatalogLabel } from './planContent'

describe('parsePlanFeatureSections', () => {
  it('splits emoji-separated feature blobs into list items', () => {
    const { sections } = parsePlanFeatureSections([
      'Pensado para: freelancers ✅ Incluye: QA tools ✅ CI/CD integrations ✅ Priority support',
    ])
    const allItems = sections.flatMap((s) => s.items)
    expect(allItems).toContain('QA tools')
    expect(allItems).toContain('CI/CD integrations')
    expect(allItems).toContain('Priority support')
  })

  it('creates section headers from structured text', () => {
    const { sections } = parsePlanFeatureSections(
      [],
      'Pensado para: equipos pequeños\nIncluye: dashboards\nLimitaciones: sin SLA',
    )
    expect(sections.some((s) => s.title?.toLowerCase().includes('incluye'))).toBe(true)
  })

  it('uses short description as tagline', () => {
    const { tagline, sections } = parsePlanFeatureSections(['Feature A'], 'Ideal for growing teams.')
    expect(tagline).toBe('Ideal for growing teams.')
    expect(sections[0]?.items).toContain('Feature A')
  })
})

describe('shouldShowCatalogLabel', () => {
  it('hides duplicate catalog title', () => {
    expect(shouldShowCatalogLabel('Starter', 'Starter')).toBe(false)
    expect(shouldShowCatalogLabel('Platform', 'Professional')).toBe(true)
  })
})
