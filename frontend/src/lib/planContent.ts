export type PlanFeatureSection = {
  title?: string
  items: string[]
}

const EMOJI_SPLIT = /\s*✅\s*|\s*✓\s*|\s*✔\s*|\s*☑\s*/g
const BULLET_SPLIT = /(?:^|\n)\s*[-•*]\s+/g
const SECTION_HEADER =
  /^(Pensado para|Incluye|Limitaciones|Ideal para|Perfecto para|Includes|Limitations|Best for|Features)\s*:?\s*$/i

function cleanItem(text: string): string {
  return text
    .replace(/^[✅✓✔☑•\-*]\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function expandInlineHeaders(text: string): string {
  return text.replace(
    /\s*(Pensado para|Incluye|Limitaciones|Ideal para|Perfecto para|Includes|Limitations|Best for)\s*:\s*/gi,
    '\n$1: ',
  )
}

function splitBlob(text: string): string[] {
  const normalized = expandInlineHeaders(text.replace(/\r\n/g, '\n')).trim()
  if (!normalized) return []

  if (/✅|✓|✔|☑/u.test(normalized)) {
    return normalized
      .split(EMOJI_SPLIT)
      .map(cleanItem)
      .filter((item) => item.length > 1)
  }

  if (BULLET_SPLIT.test(normalized)) {
    return normalized
      .split(BULLET_SPLIT)
      .map(cleanItem)
      .filter((item) => item.length > 1)
  }

  if (normalized.includes('\n')) {
    return normalized
      .split('\n')
      .map(cleanItem)
      .filter((item) => item.length > 1)
  }

  return [cleanItem(normalized)]
}

function parseStructuredLines(lines: string[]): PlanFeatureSection[] {
  const sections: PlanFeatureSection[] = []
  let current: PlanFeatureSection = { items: [] }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const headerMatch = line.match(/^(Pensado para|Incluye|Limitaciones|Ideal para|Includes|Limitations|Best for)\s*:\s*(.*)$/i)
    if (headerMatch) {
      if (current.items.length > 0 || current.title) sections.push(current)
      const [, title, rest] = headerMatch
      current = { title: title.trim(), items: [] }
      if (rest?.trim()) current.items.push(cleanItem(rest))
      continue
    }

    if (SECTION_HEADER.test(line.replace(/:$/, ''))) {
      if (current.items.length > 0 || current.title) sections.push(current)
      current = { title: line.replace(/:$/, '').trim(), items: [] }
      continue
    }

    current.items.push(cleanItem(line))
  }

  if (current.items.length > 0 || current.title) sections.push(current)
  return sections.filter((s) => s.items.length > 0 || s.title)
}

/** Flatten API features + description into premium display sections. */
export function parsePlanFeatureSections(
  features: string[] | undefined,
  description?: string | null,
): { tagline?: string; sections: PlanFeatureSection[] } {
  const rawLines: string[] = []

  for (const feature of features ?? []) {
    rawLines.push(...splitBlob(feature))
  }

  if (description?.trim()) {
    const descLines = splitBlob(description)
    if (descLines.length === 1 && descLines[0].length < 140 && !descLines[0].includes('✅')) {
      return { tagline: descLines[0], sections: parseStructuredLines(rawLines) }
    }
    rawLines.unshift(...descLines)
  }

  const sections = parseStructuredLines(rawLines)
  if (sections.length === 0) return { sections: [] }

  if (sections.length === 1 && !sections[0].title && sections[0].items.length === 1 && sections[0].items[0].length < 140) {
    return { tagline: sections[0].items[0], sections: [] }
  }

  return { sections }
}

/** Dedupe catalog label when it repeats the plan name. */
export function shouldShowCatalogLabel(catalogTitle: string | undefined, planName: string): boolean {
  if (!catalogTitle?.trim()) return false
  const a = catalogTitle.trim().toLowerCase()
  const b = planName.trim().toLowerCase()
  return a !== b && !b.includes(a) && !a.includes(b)
}
