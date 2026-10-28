// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m00Subconsultas as mission } from '../content/courses/sql-intermedio/m00-subconsultas'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_subconsultas' })
  s = await query(s, 'SELECT id, importe FROM transferencias WHERE importe > (SELECT AVG(importe) FROM transferencias);')
  s = waitUntil(s, 30)
  s = await query(s, "SELECT id, nombre, apellidos FROM clientes WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro');")
  s = waitUntil(s, 75)
  s = await query(s, 'SELECT t.id, t.estado, t.importe FROM transferencias t WHERE t.importe = (SELECT MAX(t2.importe) FROM transferencias t2 WHERE t2.estado = t.estado);')
  s = waitUntil(s, 120)
  s = choose(s, 'ines_multifila', 'multirow')
  s = waitUntil(s, 150)
  s = await query(s, 'SELECT c.id, c.nombre, c.email FROM clientes c WHERE NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id);')
  s = waitUntil(s, 210)
  s = await query(s, 'SELECT ROUND(AVG(n), 2) FROM (SELECT cuenta_origen_id, COUNT(*) AS n FROM transferencias GROUP BY cuenta_origen_id) AS envios;')
  s = waitUntil(s, 270)
  s = await query(s, 'SELECT c.id, c.nombre, (SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias FROM clientes c;')
  s = waitUntil(s, 360)
  s = choose(s, 'ines_duplicados', 'semijoin')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 0 · subconsultas', () => {
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
    expect((await rows(reto('sobre_media').solution!)).length).toBe(4)
    expect((await rows(reto('ahorradores').solution!)).length).toBe(13)
    expect((await rows(reto('max_estado').solution!)).length).toBe(3)
    expect((await rows(reto('sin_incidencias').solution!)).length).toBe(10)
    expect(await rows(reto('media_envios').solution!)).toEqual([['2.31']])
    expect((await rows(reto('incidencias_cliente').solution!)).length).toBe(40)
    const max = await rows(`${reto('max_estado').solution} ORDER BY 2`)
    expect(Number(max[1][2])).toBeLessThan(900)
    expect(Number(max[0][2])).toBeGreaterThan(15000)
    // Las cifras de la reunión de los duplicados.
    expect(await rows("SELECT COUNT(*) FROM clientes c JOIN cuentas a ON a.cliente_id = c.id WHERE a.estado = 'activa'")).toEqual([['49']])
    expect(await rows("SELECT COUNT(*) FROM clientes WHERE id IN (SELECT cliente_id FROM cuentas WHERE estado = 'activa')")).toEqual([['38']])
    const eq = await runSql(db, "SELECT * FROM clientes WHERE id = (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro')")
    expect(eq.error!.message).toMatch(/más de una fila/)
    const nested = await runSql(db, 'SELECT AVG(COUNT(*)) FROM transferencias GROUP BY cuenta_origen_id')
    expect(nested.error!.message).toMatch(/agregado dentro de otro/)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Escribir la media a mano no vale.
    const media = (await runSql(db, 'SELECT AVG(importe) FROM transferencias')).rows[0][0]
    expect(await passes('sobre_media', `SELECT id, importe FROM transferencias WHERE importe > ${media}`)).toBe(false)
    // Ningún cliente tiene dos cuentas de ahorro: aquí el JOIN no repite, y también vale.
    expect(await passes('ahorradores', "SELECT c.id, c.nombre, c.apellidos FROM clientes c JOIN cuentas a ON a.cliente_id = c.id WHERE a.tipo = 'ahorro'")).toBe(true)
    expect(await passes('ahorradores', "SELECT id, nombre, apellidos FROM clientes WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'corriente')")).toBe(false)
    expect(await passes('ahorradores', "SELECT c.id, c.nombre, c.apellidos FROM clientes c WHERE EXISTS (SELECT 1 FROM cuentas a WHERE a.cliente_id = c.id AND a.tipo = 'ahorro')")).toBe(true)
    // Máximo global en vez de por estado.
    expect(await passes('max_estado', 'SELECT id, estado, importe FROM transferencias WHERE importe = (SELECT MAX(importe) FROM transferencias)')).toBe(false)
    // NOT IN también vale (cliente_id no tiene NULL).
    expect(await passes('sin_incidencias', 'SELECT id, nombre, email FROM clientes WHERE id NOT IN (SELECT cliente_id FROM incidencias)')).toBe(true)
    // Media de todas las transferencias, no por cuenta.
    expect(await passes('media_envios', 'SELECT ROUND(AVG(importe), 2) FROM transferencias')).toBe(false)
    // INNER JOIN pierde a los clientes sin incidencias.
    expect(await passes('incidencias_cliente', 'SELECT c.id, c.nombre, COUNT(*) AS incidencias FROM clientes c JOIN incidencias i ON i.cliente_id = c.id GROUP BY c.id, c.nombre')).toBe(false)
    expect(await passes('incidencias_cliente', 'SELECT c.id, c.nombre, COUNT(i.id) AS incidencias FROM clientes c LEFT JOIN incidencias i ON i.cliente_id = c.id GROUP BY c.id, c.nombre')).toBe(true)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_multifila', 'limit')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_duplicados', 'left')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'two')
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
