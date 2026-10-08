import { getCourse } from './content/courseList'

/**
 * Temario de un curso de ASE Academy generado a partir de sus misiones
 * reales (content/courses/<clave>/course.ts). Es la única fuente de verdad
 * del estado de cada misión: la ficha del catálogo y el bloque que el admin
 * inserta en la descripción salen de aquí, así nunca se contradicen.
 */

// Definiciones de referencia vacías de Markdown: delimitan el bloque sin
// mostrarse al renderizar (un comentario HTML sí se vería como texto).
export const SYLLABUS_START = '[//]: # (temario-academy)'
export const SYLLABUS_END = '[//]: # (fin-temario-academy)'

export type SyllabusMission = { id: string; title: string; available: boolean; free: boolean }

export function courseSyllabus(courseKey: string): SyllabusMission[] {
  const course = getCourse(courseKey)
  if (!course) return []
  return course.missions.map((m, i) => ({ id: m.id, title: m.title, available: m.available, free: i === 0 }))
}

/** Bloque Markdown del temario, delimitado para poder sustituirlo al actualizar. */
export function syllabusMarkdown(courseKey: string, language: 'es' | 'en' = 'es'): string {
  const missions = courseSyllabus(courseKey)
  if (missions.length === 0) return ''
  const t =
    language === 'en'
      ? { title: '### Course missions', ready: 'available', soon: 'coming soon', free: 'free' }
      : { title: '### Misiones del curso', ready: 'disponible', soon: 'próximamente', free: 'gratis' }
  const lines = missions.map((m, i) => {
    const tags = [m.available ? t.ready : t.soon, m.free ? t.free : null].filter(Boolean).join(' · ')
    return `${i + 1}. **${m.title}** — ${tags}`
  })
  return [SYLLABUS_START, '', t.title, '', ...lines, '', SYLLABUS_END].join('\n')
}

/** Sustituye (o añade al final) el bloque de temario dentro de una descripción. */
export function upsertSyllabus(description: string, block: string): string {
  const start = description.indexOf(SYLLABUS_START)
  const end = description.indexOf(SYLLABUS_END)
  if (start !== -1 && end > start) {
    return description.slice(0, start) + block + description.slice(end + SYLLABUS_END.length)
  }
  return `${description.trimEnd()}\n\n${block}\n`
}
