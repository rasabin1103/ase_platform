// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m05Agrupar as mission } from '../content/courses/sql-iniciacion/m05-agrupar'
import { runEvent, visibleRetos } from '../apps/sql-console/sqlConsoleLogic'
import { checkReto } from '../sql/check'
import { openDb, runSql } from '../sql/engine'
import { replay, step, summarize } from './engine'
import type { RunState } from './types'

let db: PGlite
beforeAll(async () => {
  db = await openDb(mission.sqlLab!.setup, true)
}, 60_000)

async function query(s: RunState, sql: string): Promise<RunState> {
  const r = await runSql(db, sql)
  const vs = []
  for (const reto of visibleRetos(mission, s)) vs.push(await checkReto(db, reto, r, sql))
  return step(mission, s, { type: 'app', event: runEvent(mission, s, sql, r, vs).event })
}
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)
const reto = (id: string) => mission.sqlLab!.retos.find((r) => r.id === id)!
const passes = async (id: string, sql: string) => (await checkReto(db, reto(id), await runSql(db, sql), sql)).done

async function goodDay(seed: number) {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_grupos' })
  s = await query(s, 'SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad ORDER BY clientes DESC;')
  s = waitUntil(s, 30)
  s = await query(s, 'SELECT estado, COUNT(*) AS n, SUM(importe) AS total FROM transferencias GROUP BY estado;')
  s = waitUntil(s, 75)
  s = await query(s, 'SELECT tipo, COUNT(*) AS cuentas, ROUND(AVG(saldo), 2) AS saldo_medio FROM cuentas GROUP BY tipo;')
  s = waitUntil(s, 120)
  s = choose(s, 'ines_having', 'having')
  s = waitUntil(s, 150)
  s = await query(s, 'SELECT motivo, COUNT(*) AS abiertas FROM incidencias WHERE cerrada_en IS NULL GROUP BY motivo;')
  s = waitUntil(s, 210)
  s = await query(s, 'SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad HAVING COUNT(*) > 4;')
  s = waitUntil(s, 270)
  s = await query(s, 'SELECT cliente_id, COUNT(*) AS cuentas FROM cuentas GROUP BY cliente_id HAVING COUNT(*) >= 2;')
  s = waitUntil(s, 360)
  s = choose(s, 'ines_nullgroup', 'nullgroup')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 5 · misión 5 · agrupar', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) {
      const s = await goodDay(seed)
      expect(s.finished).toBe(true)
      for (const r of mission.sqlLab!.retos) expect(s.flags[`reto.${r.id}`], r.id).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const rows = async (sql: string) => (await runSql(db, sql)).rows
    expect(await rows(`${reto('por_estado').solution} ORDER BY estado`)).toEqual([['completada', '103', '98569.57'], ['pendiente', '10', '4875.09'], ['rechazada', '7', '3702.74']])
    expect(await rows(`${reto('por_tipo').solution} ORDER BY tipo`)).toEqual([['ahorro', '13', '18604.07'], ['corriente', '39', '4474.88']])
    expect((await rows(`${reto('abiertas_motivo').solution} ORDER BY 2 DESC, 1`))[0]).toEqual(['Cambio de datos', '3'])
    expect(await rows(`${reto('ciudades_grandes').solution} ORDER BY 2 DESC`)).toEqual([['Madrid', '12'], ['Barcelona', '8']])
    expect((await rows(reto('multicuenta').solution!)).length).toBe(13)
    const segmentos = await rows("SELECT COALESCE(segmento, 'sin segmento') AS segmento, COUNT(*) FROM clientes GROUP BY segmento ORDER BY 1")
    expect(segmentos).toContainEqual(['sin segmento', '2'])
    const where = await runSql(db, 'SELECT ciudad, COUNT(*) FROM clientes WHERE COUNT(*) > 4 GROUP BY ciudad')
    expect(where.error!.message).toMatch(/HAVING/)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Contar todas y no solo las abiertas.
    expect(await passes('abiertas_motivo', 'SELECT motivo, COUNT(*) FROM incidencias GROUP BY motivo')).toBe(false)
    expect(await passes('abiertas_motivo', 'SELECT motivo, COUNT(*) - COUNT(cerrada_en) FROM incidencias GROUP BY motivo')).toBe(true)
    expect(await passes('ciudades_grandes', 'SELECT ciudad, COUNT(*) FROM clientes GROUP BY ciudad HAVING COUNT(*) >= 4')).toBe(false)
    expect(await passes('por_tipo', 'SELECT tipo, COUNT(*), AVG(saldo) FROM cuentas GROUP BY tipo')).toBe(false)
    expect(await passes('por_ciudad', 'SELECT ciudad, COUNT(*) FROM clientes GROUP BY ciudad')).toBe(false)
    expect(await passes('multicuenta', 'SELECT cliente_id, COUNT(*) FROM cuentas GROUP BY cliente_id')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_having', 'two')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_nullgroup', 'hide')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'many')
    expect(s.activeBugs).toEqual(expect.arrayContaining(mission.bugs.map((b) => b.id)))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
