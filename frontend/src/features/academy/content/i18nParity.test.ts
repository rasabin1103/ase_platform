import { describe, expect, it } from 'vitest'
import { ACADEMY_COURSES, ACADEMY_COURSES_EN, PENDING_TRANSLATION } from './courseList'
import { MISSIONS_EN, MISSIONS_ES } from './registry'
import { diff } from './i18nDiff'

/**
 * Paridad español ↔ inglés: la traducción solo puede cambiar textos. Ids,
 * flags, condiciones, efectos, números, respuestas correctas y orden de los
 * elementos tienen que coincidir, porque las partidas guardadas se reproducen
 * con cualquiera de los dos idiomas.
 */

describe('ASE Academy: paridad de la versión en inglés', () => {
  it('los cursos en inglés tienen las mismas misiones', () => {
    for (const course of ACADEMY_COURSES.filter((c) => !PENDING_TRANSLATION.has(c.key))) {
      const en = ACADEMY_COURSES_EN.find((c) => c.key === course.key)
      expect(en, course.key).toBeDefined()
      const out: string[] = []
      diff(course, en, course.key, false, out)
      expect(out, out.join('\n')).toEqual([])
    }
  })

  for (const es of MISSIONS_ES.filter((m) => !PENDING_TRANSLATION.has(m.courseKey))) {
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
