/**
 * Convierte la descripción libre de una oferta (texto pegado del anuncio
 * original, con emojis como separadores, mayúsculas y «Etiqueta: valor»
 * encadenados en una sola línea) en una estructura legible: etiquetas
 * destacadas, datos clave, secciones con párrafos y viñetas.
 *
 * Es tolerante: si el texto no sigue ningún patrón, devuelve párrafos tal cual.
 */

export type JobFact = { label: string; value: string; missing: boolean }
export type JobSection = { heading: string | null; paragraphs: string[]; bullets: string[] }
export type ParsedJobDescription = {
  highlights: string[]
  facts: JobFact[]
  sections: JobSection[]
  /** Primer párrafo con contenido, para el resumen de la tarjeta. */
  summary: string | null
}

// Emojis (pictográficos, con o sin selector de variación) y banderas
// (pares de indicadores regionales, que en Windows se ven como «us»).
const EMOJI = /(?:[\u{1F1E6}-\u{1F1FF}]{2}|\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)/gu
const BULLET_EMOJI = /^(✅|✔️?|☑️?|•|-|–|\*|▪️?|🔹|🔸|👉|➡️?)\s*/u
const MISSING = /^(no especificad[oa]s?|not specified|n\/a|-|—)\.?$/i

/** Siglas que se mantienen en mayúsculas al suavizar textos en mayúsculas. */
const ACRONYMS = new Set(['QA', 'QE', 'AI', 'IA', 'USA', 'EEUU', 'UE', 'EU', 'UK', 'API', 'CV', 'SQL', 'UX', 'UI', 'CI', 'CD', 'ISTQB', 'SDET', 'B2B', 'ETL', 'BI'])

function cleanSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim()
}

/** «QUÉ HARÁS» → «Qué harás»; deja intactas siglas cortas (QA, AI, USA). */
export function softenCaps(text: string): string {
  const letters = text.replace(/[^\p{L}]/gu, '')
  if (letters.length < 4 || letters !== letters.toUpperCase()) return text
  let first = true
  return text
    .split(/(\s+)/)
    .map((w) => {
      if (/^\s+$/.test(w)) return w
      const core = w.replace(/[^\p{L}]/gu, '')
      if (ACRONYMS.has(core) && !first) return w
      const lower = w.toLocaleLowerCase('es')
      if (first && core.length > 0) {
        first = false
        return lower.replace(/\p{L}/u, (c) => c.toLocaleUpperCase('es'))
      }
      return lower
    })
    .join('')
}

/** Títulos de ofertas en mayúsculas → «Senior Data Analyst – AI Evaluation». */
export function formatJobTitle(title: string): string {
  const letters = title.replace(/[^\p{L}]/gu, '')
  if (letters.length < 4 || letters !== letters.toUpperCase()) return title
  return title
    .split(/(\s+)/)
    .map((w) => {
      const core = w.replace(/[^\p{L}]/gu, '')
      if (!core || core.length <= 3) return w
      const lower = w.toLocaleLowerCase('es')
      return lower.replace(/\p{L}/u, (c) => c.toLocaleUpperCase('es'))
    })
    .join('')
}

function isHeading(seg: string): boolean {
  const s = seg.trim()
  if (s.length > 60) return false
  if (/^¿.+\?$/.test(s)) return true
  const letters = s.replace(/[^\p{L}]/gu, '')
  return letters.length >= 4 && letters === letters.toUpperCase() && !s.includes('|') && !/:/.test(s)
}

export function parseJobDescription(raw: string | null | undefined): ParsedJobDescription {
  const text = (raw ?? '').replace(/\r\n?/g, '\n').trim()
  const result: ParsedJobDescription = { highlights: [], facts: [], sections: [], summary: null }
  if (!text) return result

  // 1) Trocear por emojis y saltos de línea, recordando si el trozo empezaba
  //    con un emoji de viñeta (✅, •…) para convertirlo en lista.
  const pieces: { text: string; bullet: boolean }[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const bulletLine = BULLET_EMOJI.test(trimmed)
    const parts = trimmed.split(/(?=✅|✔)/u)
    for (const part of parts) {
      const isBullet = bulletLine || /^(✅|✔)/u.test(part)
      for (const chunk of part.split(EMOJI)) {
        const c = cleanSpaces(chunk.replace(BULLET_EMOJI, ''))
        if (c && !/^[|·•\-–]+$/.test(c)) pieces.push({ text: c, bullet: isBullet })
      }
    }
  }

  let current: JobSection = { heading: null, paragraphs: [], bullets: [] }
  const push = () => {
    if (current.heading || current.paragraphs.length || current.bullets.length) result.sections.push(current)
  }

  for (const { text: p, bullet } of pieces) {
    // «100 % REMOTO | SOLO USA» → etiquetas destacadas.
    if (p.includes('|') && p.length <= 80 && result.facts.length === 0 && result.sections.length === 0) {
      result.highlights.push(...p.split('|').map((x) => softenCaps(cleanSpaces(x))).filter(Boolean))
      continue
    }
    // «Contrato: Contractor» → dato clave (etiqueta corta, valor corto).
    const kv = /^([^:]{2,32}):\s*(.{1,90})$/u.exec(p)
    if (kv && !bullet && !/[.!?]$/.test(kv[1]) && kv[2].split(' ').length <= 10) {
      const value = cleanSpaces(kv[2])
      result.facts.push({ label: softenCaps(cleanSpaces(kv[1])), value, missing: MISSING.test(value) })
      continue
    }
    // «¿EN QUÉ CONSISTE? Buscan…» → título + párrafo.
    const lead = /^(¿[^?]{2,50}\?)\s+(.+)$/su.exec(p)
    if (lead && isHeading(lead[1])) {
      push()
      current = { heading: softenCaps(lead[1]), paragraphs: [], bullets: [] }
      if (bullet) current.bullets.push(lead[2])
      else current.paragraphs.push(lead[2])
      continue
    }
    if (isHeading(p)) {
      push()
      current = { heading: softenCaps(p.replace(/:$/, '')), paragraphs: [], bullets: [] }
      continue
    }
    if (bullet) current.bullets.push(p)
    else current.paragraphs.push(p)
  }
  push()

  result.summary =
    result.sections.flatMap((s) => s.paragraphs).find((p) => p.length > 40) ??
    result.sections.flatMap((s) => s.bullets)[0] ??
    null
  return result
}
