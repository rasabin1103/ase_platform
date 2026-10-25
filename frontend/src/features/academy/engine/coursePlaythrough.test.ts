import { describe, expect, it } from 'vitest'
import { ACADEMY_COURSES, PENDING_TRANSLATION } from '../content/courseList'
import { getMission } from '../content/registry'
import { M10_SOLUTION } from '../content/courses/karate-framework/m10-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { runEvent } from '../apps/sql-console/sqlConsoleLogic'
import { pendingMeeting, replay, step, summarize, evaluate } from './engine'
import { countsAsFinished, practicalScore } from './practicalExam'
import type { Action, Mission, RunState } from './types'

/**
 * Recorrido completo de cada curso, en español y en inglés: todas las
 * misiones en orden, de «Empezar la jornada» al debrief, como lo haría un
 * alumno que contesta a cada reunión y termina el día. El examen práctico de
 * Karate se resuelve con la solución de referencia (8 retos = 80/100, aprueba).
 *
 * Garantiza que ninguna misión se queda atascada (escenas sin salida,
 * condiciones imposibles, errores del motor), que cada una cuenta como
 * terminada (lo que exige el certificado) y que la partida guardada se
 * reproduce igual (las partidas se guardan como lista de acciones).
 * El recorrido en navegador hasta el certificado está en e2e/academy.spec.ts.
 */

const SEED = 20261019
const MAX_STEPS = 400

/** Juega una misión hasta el final y devuelve las acciones usadas. */
function playMission(mission: Mission): { state: RunState; actions: Action[] } {
  const actions: Action[] = []
  let s = replay(mission, SEED, [])
  const act = (a: Action) => {
    actions.push(a)
    s = step(mission, s, a)
  }
  act({ type: 'start' })

  // Examen práctico de SQL: los diez encargos cumplidos (las respuestas de referencia se
  // ejecutan contra PostgreSQL en c5m10.test.ts; aquí basta con el evento de la consola).
  if (mission.practicalExam && mission.sqlLab) {
    const ok = { ok: true, columns: ['?column?'], rows: [['1']], rowCount: 1, command: 'SELECT', ms: 1 }
    act({ type: 'app', event: runEvent(mission, s, 'SELECT 1', ok, mission.sqlLab.retos.map((r) => ({ id: r.id, done: true }))).event })
  }

  // Examen práctico: el proyecto de referencia, ejecutado en el IDE y en el pipeline nocturno.
  if (mission.practicalExam && mission.codeLab) {
    const files = { ...Object.fromEntries(mission.codeLab.files.map((f) => [f.path, f.content])), ...M10_SOLUTION }
    for (const job of [undefined, 'nightly']) {
      const lab = runLab(mission, s, files, { job })
      for (const event of lab.events) act({ type: 'app', event })
    }
  }

  for (let i = 0; i < MAX_STEPS && !s.finished; i++) {
    const meeting = pendingMeeting(s)
    if (meeting) {
      const scene = mission.scenes.find((sc) => sc.id === meeting.sceneId)!
      const choice = scene.choices?.find((c) => evaluate(mission, s, c.requires))
      expect(choice, `${mission.id}: la reunión «${scene.id}» no tiene ninguna opción disponible`).toBeDefined()
      act({ type: 'choose', messageId: meeting.id, choiceId: choice!.id })
    } else {
      act({ type: 'endDay' })
    }
  }
  return { state: s, actions }
}

// Cursos en construcción: solo sus misiones disponibles y, hasta que se
// traduzcan, solo en español.
for (const course of ACADEMY_COURSES) {
  const langs = PENDING_TRANSLATION.has(course.key) ? (['es'] as const) : (['es', 'en'] as const)
  for (const lang of langs) {
    describe(`${course.key} (${lang}): curso completo`, () => {
      for (const ref of course.missions.filter((m) => m.available)) {
        it(`${ref.id}: se juega hasta el debrief y cuenta como terminada`, () => {
          const mission = getMission(course.key, ref.id, lang)
          expect(mission, `${ref.id}: misión no registrada`).toBeDefined()
          expect(mission!.lang ?? 'es').toBe(lang)

          const { state, actions } = playMission(mission!)
          expect(state.finished, `${ref.id}: no llega al final de la jornada`).toBe(true)
          expect(countsAsFinished(mission!, state), `${ref.id}: no cuenta como terminada`).toBe(true)

          const summary = summarize(mission!, state)
          expect(summary.verdict.title.length).toBeGreaterThan(0)
          if (mission!.practicalExam) expect(practicalScore(mission!, state)!.passed).toBe(true)

          // La partida guardada (acciones) se reproduce igual.
          const again = replay(mission!, SEED, actions)
          expect(again.finished).toBe(true)
          expect(again.clock).toBe(state.clock)
          expect(again.flags).toEqual(state.flags)
        })
      }
    })
  }
}
