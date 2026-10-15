import { describe, expect, it } from 'vitest'
import { ACADEMY_COURSES, ACADEMY_COURSES_EN } from './courseList'
import { MISSIONS_EN, MISSIONS_ES } from './registry'

/**
 * Paridad español ↔ inglés: la traducción solo puede cambiar textos. Ids,
 * flags, condiciones, efectos, números, respuestas correctas y orden de los
 * elementos tienen que coincidir, porque las partidas guardadas se reproducen
 * con cualquiera de los dos idiomas.
 */

// Claves cuyo valor (o elementos, si es una lista) es texto para el jugador.
const TEXT_KEYS = new Set([
  'title', 'subtitle', 'body', 'text', 'reply', 'subject', 'summary', 'explanation', 'question', 'options',
  'paragraphs', 'goals', 'label', 'name', 'role', 'company', 'sector', 'tagline', 'description', 'track',
  'playerRole', 'dayLabel', 'appLabel', 'updatedLabel', 'technique', 'intro', 'preventedLabel', 'appearedLabel',
  'seniorTips', 'note', 'hint', 'clarification', 'expectedQuestion', 'fineReply', 'disputeReply', 'lockedMessage',
  'inputLabel', 'inputPlaceholder', 'submitLabel', 'acceptanceCriteria', 'expected', 'actual', 'steps', 'feedback',
  'priorityWhy', 'area', 'author', 'technical', 'input', 'tags', 'heading', 'caption', 'prompt', 'placeholder',
  'detail', 'details', 'why', 'value', 'notes', 'checklist', 'criteria', 'items', 'labels', 'columns', 'rows', 'lines',
  // Estado de un ticket ('En QA'): solo se muestra, no se compara con nada.
  'status',
  // Etiquetas de las respuestas esperadas del diseño («Se permite» / «409»).
  'expectedLabels',
  // Términos de reproducción (lo que escribe el jugador) y la pregunta del dev.
  'repro',
])

function diff(es: unknown, en: unknown, path: string, textual: boolean, out: string[]) {
  if (out.length > 20) return
  if (typeof es === 'string' || typeof en === 'string') {
    if (typeof es !== typeof en) out.push(`${path}: tipo distinto`)
    else if (!textual && es !== en) out.push(`${path}: «${es}» ≠ «${en}» (no es texto: no se traduce)`)
    return
  }
  if (Array.isArray(es) || Array.isArray(en)) {
    if (!Array.isArray(es) || !Array.isArray(en)) return void out.push(`${path}: lista en un idioma y no en el otro`)
    if (es.length !== en.length) return void out.push(`${path}: ${es.length} elementos ≠ ${en.length}`)
    es.forEach((v, i) => diff(v, en[i], `${path}[${i}]`, textual, out))
    return
  }
  if (es && en && typeof es === 'object' && typeof en === 'object') {
    const ka = Object.keys(es as object).filter((k) => (es as Record<string, unknown>)[k] !== undefined).sort()
    const kb = Object.keys(en as object).filter((k) => (en as Record<string, unknown>)[k] !== undefined).sort()
    const keysA = ka.filter((k) => k !== 'lang')
    const keysB = kb.filter((k) => k !== 'lang')
    if (keysA.join() !== keysB.join()) return void out.push(`${path}: claves {${keysA}} ≠ {${keysB}}`)
    for (const k of keysA) diff((es as Record<string, unknown>)[k], (en as Record<string, unknown>)[k], `${path}.${k}`, textual || TEXT_KEYS.has(k), out)
    return
  }
  if (es !== en) out.push(`${path}: ${String(es)} ≠ ${String(en)}`)
}

describe('ASE Academy: paridad de la versión en inglés', () => {
  it('los cursos en inglés tienen las mismas misiones', () => {
    for (const course of ACADEMY_COURSES) {
      const en = ACADEMY_COURSES_EN.find((c) => c.key === course.key)
      expect(en, course.key).toBeDefined()
      const out: string[] = []
      diff(course, en, course.key, false, out)
      expect(out, out.join('\n')).toEqual([])
    }
  })

  for (const es of MISSIONS_ES) {
    it(`${es.courseKey}/${es.id}`, () => {
      const en = MISSIONS_EN.find((m) => m.courseKey === es.courseKey && m.id === es.id)
      expect(en, 'falta la traducción al inglés').toBeDefined()
      expect(en!.lang).toBe('en')
      const out: string[] = []
      diff(es, en, es.id, false, out)
      expect(out, out.join('\n')).toEqual([])
    })
  }
})
