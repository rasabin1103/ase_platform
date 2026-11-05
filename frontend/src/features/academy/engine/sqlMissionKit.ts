import { expect } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { runEvent, visibleRetos } from '../apps/sql-console/sqlConsoleLogic'
import { checkReto } from '../sql/check'
import { openDb, runSql } from '../sql/engine'
import { replay, step, summarize } from './engine'
import type { Mission, RunState } from './types'

/**
 * Utilidades de los tests de misiones de la consola SQL (curso «SQL avanzado»):
 * abrir la base de datos de la misión, ejecutar consultas como el alumno,
 * contestar reuniones y comprobar encargos.
 */
export function sqlMissionKit(mission: Mission) {
  const lab = mission.sqlLab!
  const open = () => openDb(lab.setup, lab.readOnly)
  const reto = (id: string) => {
    const r = lab.retos.find((x) => x.id === id)
    expect(r, `no existe el encargo ${id}`).toBeDefined()
    return r!
  }
  return {
    open,
    reto,
    start: (seed: number) => replay(mission, seed, [{ type: 'start' }]),
    readDoc: (s: RunState, docId: string) => step(mission, s, { type: 'readDoc', docId }),
    async query(db: PGlite, s: RunState, sql: string): Promise<RunState> {
      const r = await runSql(db, sql)
      expect(r.ok, `${sql}\n→ ${r.error?.original}`).toBe(true)
      const vs = []
      for (const x of visibleRetos(mission, s)) vs.push(await checkReto(db, x, r, sql))
      return step(mission, s, { type: 'app', event: runEvent(mission, s, sql, r, vs).event })
    },
    choose(s: RunState, sceneId: string, choiceId: string) {
      const id = s.messages.find((m) => m.sceneId === sceneId)?.id
      expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
      return step(mission, s, { type: 'choose', messageId: id!, choiceId })
    },
    waitUntil: (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s),
    async passes(db: PGlite, id: string, sql: string) {
      return (await checkReto(db, reto(id), await runSql(db, sql), sql)).done
    },
    rows: async (db: PGlite, sql: string) => {
      const r = await runSql(db, sql)
      expect(r.ok, `${sql}\n→ ${r.error?.original}`).toBe(true)
      return r.rows
    },
    /** El día perfecto acaba bien: todos los encargos, ninguna consecuencia, veredicto bueno. */
    expectGoodDay(s: RunState) {
      expect(s.finished).toBe(true)
      for (const r of lab.retos) expect(s.flags[`reto.${r.id}`], r.id).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    },
    /** Sin encargos y con las respuestas malas llegan todas las consecuencias. */
    expectBadDay(s: RunState) {
      expect(s.activeBugs).toEqual(expect.arrayContaining(mission.bugs.map((b) => b.id)))
      expect(summarize(mission, s).verdict.tone).toBe('bad')
    },
    expectConceptsExist() {
      const ids = new Set(mission.concepts.map((c) => c.id))
      for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
      for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
      for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
    },
  }
}
