// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m02Ordenar as mission } from '../content/courses/sql-iniciacion/m02-ordenar'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_orden' })
  s = await query(s, 'SELECT iban, saldo FROM cuentas ORDER BY saldo ASC;')
  s = waitUntil(s, 30)
  s = await query(s, 'SELECT id, importe, estado, creada_en FROM transferencias ORDER BY importe DESC LIMIT 10;')
  s = waitUntil(s, 75)
  s = await query(s, "SELECT id, nombre, apellidos, email FROM clientes WHERE apellidos LIKE '%Serrano%';")
  s = waitUntil(s, 120)
  s = choose(s, 'ines_like', 'like')
  s = waitUntil(s, 150)
  s = await query(s, 'SELECT DISTINCT ciudad FROM clientes ORDER BY ciudad;')
  s = waitUntil(s, 210)
  s = await query(s, "SELECT id, email FROM clientes WHERE email LIKE '%@correo.es';")
  s = waitUntil(s, 270)
  s = await query(s, 'SELECT nombre, apellidos, ciudad, fecha_alta FROM clientes ORDER BY ciudad ASC, fecha_alta DESC;')
  s = waitUntil(s, 360)
  s = choose(s, 'ines_distinct', 'distinct')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 5 · misión 2 · ordenar y buscar', () => {
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
    const first = await runSql(db, reto('saldos').solution!)
    expect(first.rows[0][1]).toBe('-245.30')
    const top = await runSql(db, reto('top10').solution!)
    expect(top.rows.filter((r) => Number(r[1]) > 12000)).toHaveLength(4)
    expect((await runSql(db, reto('serrano').solution!)).rowCount).toBe(4)
    expect((await runSql(db, reto('ciudades').solution!)).rowCount).toBe(7)
    const dom = await runSql(db, reto('dominio').solution!)
    expect(dom.rowCount).toBe(11)
    expect(new Set(dom.rows.map((r) => r[1])).size).toBe(10)
    expect((await runSql(db, 'SELECT DISTINCT ciudad, nombre FROM clientes')).rowCount).toBe(40)
    expect((await runSql(db, "SELECT * FROM clientes WHERE apellidos LIKE 'serrano'")).rowCount).toBe(0)
    // Los encargos ordenados no tienen empates: el orden esperado es único.
    expect((await runSql(db, 'SELECT count(DISTINCT saldo) = count(*) FROM cuentas')).rows[0][0]).toBe('true')
    expect((await runSql(db, 'SELECT count(DISTINCT (ciudad, fecha_alta)) = count(*) FROM clientes')).rows[0][0]).toBe('true')
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    expect(await passes('top10', 'SELECT id, importe, estado, creada_en FROM transferencias ORDER BY importe LIMIT 10')).toBe(false)
    expect(await passes('saldos', 'SELECT iban, saldo FROM cuentas')).toBe(false)
    expect(await passes('saldos', 'SELECT iban, saldo FROM cuentas ORDER BY saldo DESC')).toBe(false)
    expect(await passes('serrano', "SELECT id, nombre, apellidos, email FROM clientes WHERE apellidos LIKE 'Serrano%'")).toBe(false)
    expect(await passes('serrano', "SELECT id, nombre, apellidos, email FROM clientes WHERE apellidos LIKE '%serrano%'")).toBe(false)
    expect(await passes('ciudades', 'SELECT DISTINCT ciudad FROM clientes')).toBe(false)
    expect(await passes('ciudades', 'SELECT ciudad FROM clientes GROUP BY ciudad ORDER BY ciudad')).toBe(true)
    expect(await passes('por_ciudad', 'SELECT nombre, apellidos, ciudad, fecha_alta FROM clientes ORDER BY ciudad, fecha_alta')).toBe(false)
    expect(await passes('por_ciudad', 'SELECT nombre, apellidos, ciudad, fecha_alta FROM clientes ORDER BY fecha_alta DESC, ciudad')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_like', 'missing')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_distinct', 'bug')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'excel')
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
