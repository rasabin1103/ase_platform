// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m00PrimeraConsulta as mission } from '../content/courses/sql-iniciacion/m00-primera-consulta'
import { runEvent, visibleRetos } from '../apps/sql-console/sqlConsoleLogic'
import { checkReto } from '../sql/check'
import { openDb, runSql } from '../sql/engine'
import { replay, step, summarize } from './engine'
import type { RunState } from './types'

let db: PGlite
beforeAll(async () => {
  db = await openDb(mission.sqlLab!.setup, true)
}, 60_000)

/** Lo que hace la consola: ejecutar, comprobar los encargos visibles y despachar el evento. */
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

async function goodDay(seed: number) {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'db_kobalto' })
  s = await query(s, 'SELECT * FROM clientes;')
  s = await query(s, 'SELECT nombre, apellidos, email FROM clientes;')
  s = waitUntil(s, 30)
  s = await query(s, 'SELECT iban, tipo, saldo FROM cuentas;')
  s = waitUntil(s, 120)
  s = choose(s, 'ines_limit', 'limit')
  s = waitUntil(s, 150)
  s = await query(s, 'SELECT nombre AS cliente, ciudad, fecha_alta AS alta FROM clientes;')
  s = waitUntil(s, 240)
  s = await query(s, 'SELECT * FROM transferencias LIMIT 5;')
  s = waitUntil(s, 360)
  s = choose(s, 'ines_coma', 'comma')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 5 · misión 0 · tu primera consulta', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) {
      const s = await goodDay(seed)
      expect(s.finished).toBe(true)
      for (const id of ['clientes', 'contacto', 'cuentas', 'alias', 'vistazo']) expect(s.flags[`reto.${id}`], id).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('los encargos aparecen cuando llega quien los pide', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    expect(visibleRetos(mission, s).map((r) => r.id)).toEqual(['clientes', 'contacto'])
    // Una consulta correcta antes de que llegue el encargo no lo cumple.
    s = await query(s, 'SELECT iban, tipo, saldo FROM cuentas;')
    expect(s.flags['reto.cuentas']).toBeFalsy()
    s = waitUntil(s, 240)
    expect(visibleRetos(mission, s).map((r) => r.id)).toEqual(['clientes', 'contacto', 'cuentas', 'alias', 'vistazo'])
  })

  it('cada ejecución cuesta minutos y guarda el resultado recortado; un error no cumple nada', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    const before = s.clock
    s = await query(s, 'SELECT * FROM transferencias;')
    expect(s.clock).toBe(before + mission.sqlLab!.runCost)
    const app = s.appState['sql-console'] as { runs: number; last: { result: { rowCount: number; rows: unknown[] } } }
    expect(app.runs).toBe(1)
    expect(app.last.result.rowCount).toBe(120)
    expect(app.last.result.rows.length).toBe(50)
    s = await query(s, 'SELEC * FROM clientes')
    expect(s.flags['sql.error']).toBe(true)
    expect(s.flags['reto.clientes']).toBeFalsy()
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_limit', 'all')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_coma', 'bug')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'excel')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-MARTA', 'C-NURIA', 'C-DIEGO', 'C-REPLICA', 'C-COMA']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
