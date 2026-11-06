// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ACADEMY_COURSES, ACADEMY_COURSES_EN } from '../content/courseList'
import { gradeExercise, normalizeOutput } from './python/grade'
import { nodeRunner } from './python/nodeRunner'
import { MODULES_EN, MODULES_ES } from './registry'
import { gradedBlocks, moduleProgress, type LessonModule } from './types'

/**
 * Contenido de los cursos instructivos con Python de verdad (Pyodide en Node):
 * cada ejemplo se ejecuta, cada «¿qué imprime?» imprime su respuesta correcta,
 * cada solución pasa sus tests y cada código de partida no.
 */

const py = nodeRunner()
const LESSON_COURSES = ACADEMY_COURSES.filter((c) => c.format === 'lessons')

function checkModule(m: LessonModule) {
  describe(`${m.courseKey} · ${m.id} (${m.lang})`, () => {
    it('estructura: ids únicos, opciones válidas, pistas y tests', () => {
      const ids = m.lessons.flatMap((l) => l.blocks.flatMap((b) => ('id' in b ? [b.id] : [])))
      expect(new Set(ids).size).toBe(ids.length)
      expect(new Set(m.lessons.map((l) => l.id)).size).toBe(m.lessons.length)
      for (const b of gradedBlocks(m)) {
        if (b.kind === 'predict') {
          expect(b.correct).toBeGreaterThanOrEqual(0)
          expect(b.correct).toBeLessThan(b.options.length)
          expect(new Set(b.options).size).toBe(b.options.length)
        } else {
          expect(b.tests.length).toBeGreaterThan(0)
          if (!m.exam) expect(b.hints.length).toBeGreaterThan(0)
        }
      }
      expect(gradedBlocks(m).length).toBeGreaterThan(0)
    })

    it('los ejemplos se ejecutan sin error', async () => {
      for (const l of m.lessons)
        for (const b of l.blocks) {
          if (b.kind !== 'example') continue
          const r = await py.run({ code: b.code, inputs: b.inputs })
          expect(r.error, `${b.id}: ${JSON.stringify(r.error)}`).toBeNull()
        }
    }, 120_000)

    it('cada «¿qué imprime?» imprime su respuesta correcta', async () => {
      for (const b of gradedBlocks(m)) {
        if (b.kind !== 'predict') continue
        const r = await py.run({ code: b.code, inputs: b.inputs })
        // Con input(), la salida empieza con lo que se pregunta y se escribe: basta con el final.
        if (r.ok && b.inputs) expect(normalizeOutput(r.stdout).endsWith(normalizeOutput(b.options[b.correct])), b.id).toBe(true)
        else if (r.ok) expect(normalizeOutput(r.stdout), b.id).toBe(normalizeOutput(b.options[b.correct]))
        else expect(b.options[b.correct], `${b.id} falla con ${r.error?.type}`).toContain(r.error!.type)
      }
    }, 120_000)

    it('cada solución pasa sus tests y el código de partida no', async () => {
      for (const b of gradedBlocks(m)) {
        if (b.kind !== 'exercise') continue
        const good = await gradeExercise(py, b, b.solution)
        expect(good.tests.filter((t) => !t.ok).map((t) => `${t.label} → ${t.got ?? ''} ${t.message ?? ''} ${JSON.stringify(t.error ?? '')}`), `${b.id}: solución`).toEqual([])
        const start = await gradeExercise(py, b, b.starter)
        expect(start.passed, `${b.id}: el código de partida no debería aprobar`).toBe(false)
      }
    }, 300_000)

    it('superar todo termina el módulo', () => {
      const all = new Set(gradedBlocks(m).map((b) => b.id))
      expect(moduleProgress(m, all).finished).toBe(true)
      expect(moduleProgress(m, new Set()).finished).toBe(false)
    })
  })
}

for (const m of [...MODULES_ES, ...MODULES_EN]) checkModule(m)

describe('cursos instructivos: módulos publicados y traducción', () => {
  it('un módulo disponible existe en los dos idiomas con la misma estructura', () => {
    for (const course of LESSON_COURSES) {
      const en = ACADEMY_COURSES_EN.find((c) => c.key === course.key)!
      expect(en.missions.map((x) => [x.id, x.available])).toEqual(course.missions.map((x) => [x.id, x.available]))
      for (const ref of course.missions) {
        const es = MODULES_ES.find((x) => x.courseKey === course.key && x.id === ref.id)
        const enMod = MODULES_EN.find((x) => x.courseKey === course.key && x.id === ref.id)
        expect(!!es, `${ref.id} (es)`).toBe(ref.available)
        expect(!!enMod, `${ref.id} (en)`).toBe(ref.available)
        if (!es || !enMod) continue
        expect(es.lang).toBe('es')
        expect(enMod.lang).toBe('en')
        expect(es.title).toBe(ref.title)
        expect(enMod.title).toBe(en.missions.find((x) => x.id === ref.id)!.title)
        const shape = (m: LessonModule) => ({
          number: m.number,
          exam: m.exam ?? null,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            blocks: l.blocks.map((b) =>
              b.kind === 'exercise'
                ? { kind: b.kind, id: b.id, project: !!b.project, tests: b.tests.map((t) => t.kind), hints: b.hints.length }
                : b.kind === 'predict'
                  ? { kind: b.kind, id: b.id, correct: b.correct, options: b.options.length }
                  : { kind: b.kind, id: 'id' in b ? b.id : null },
            ),
          })),
        })
        expect(shape(enMod), ref.id).toEqual(shape(es))
      }
    }
  })
})
