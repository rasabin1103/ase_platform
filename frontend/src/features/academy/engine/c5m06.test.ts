// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m06Join as mission } from '../content/courses/sql-iniciacion/m06-join'
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
  s = step(mission, s, { type: 'readDoc', docId: 'mapa_tablas' })
  s = await query(s, 'SELECT cuentas.iban, cuentas.saldo, clientes.nombre, clientes.apellidos FROM cuentas INNER JOIN clientes ON clientes.id = cuentas.cliente_id;')
  s = waitUntil(s, 30)
  s = await query(s, "SELECT t.tipo, t.estado, t.limite_diario, t.caduca_en FROM clientes c JOIN cuentas a ON a.cliente_id = c.id JOIN tarjetas t ON t.cuenta_id = a.id WHERE c.email = 'pablo.gil34@mail.com';")
  s = waitUntil(s, 75)
  s = await query(s, "SELECT t.id, t.importe, a.iban FROM transferencias t JOIN cuentas a ON a.id = t.cuenta_origen_id WHERE t.estado = 'rechazada';")
  s = waitUntil(s, 120)
  s = choose(s, 'ines_producto', 'on')
  s = waitUntil(s, 150)
  s = await query(s, 'SELECT t.id, t.importe, c.nombre, c.apellidos FROM transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id JOIN clientes c ON a.cliente_id = c.id WHERE t.importe > 10000;')
  s = waitUntil(s, 210)
  s = await query(s, 'SELECT c.ciudad, SUM(a.saldo) AS saldo_total FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.ciudad ORDER BY saldo_total DESC;')
  s = waitUntil(s, 270)
  s = await query(s, "SELECT t.id, t.caduca_en, c.email FROM tarjetas t JOIN cuentas a ON t.cuenta_id = a.id JOIN clientes c ON a.cliente_id = c.id WHERE t.estado = 'activa' AND t.caduca_en < '2026-01-01';")
  s = waitUntil(s, 360)
  s = choose(s, 'ines_perdido', 'inner')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 5 · misión 6 · unir tablas', () => {
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
    expect((await rows(reto('cuentas_titular').solution!)).length).toBe(52)
    expect(await rows(reto('tarjeta_cliente').solution!)).toEqual([['debito', 'activa', '600.00', '2024-11-03']])
    expect((await rows(reto('rechazadas_iban').solution!)).length).toBe(7)
    expect((await rows(reto('grandes_ordenante').solution!)).length).toBe(4)
    expect((await rows(reto('saldo_ciudad').solution!)).length).toBe(7)
    expect((await rows(reto('caducadas_activas').solution!)).length).toBe(2)
    expect(await rows('SELECT COUNT(*) FROM cuentas, clientes')).toEqual([['2080']])
    expect(await rows('SELECT COUNT(DISTINCT clientes.id) FROM cuentas JOIN clientes ON cuentas.cliente_id = clientes.id')).toEqual([['39']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Producto cartesiano: muchas más filas.
    expect(await passes('cuentas_titular', 'SELECT a.iban, a.saldo, c.nombre, c.apellidos FROM cuentas a, clientes c')).toBe(false)
    // Unir por la clave equivocada.
    expect(await passes('cuentas_titular', 'SELECT a.iban, a.saldo, c.nombre, c.apellidos FROM cuentas a JOIN clientes c ON a.id = c.id')).toBe(false)
    // Buscar el id a mano no vale: hay que unir.
    expect(await passes('tarjeta_cliente', 'SELECT tipo, estado, limite_diario, caduca_en FROM tarjetas WHERE id = 28')).toBe(false)
    // La cuenta de destino no es la de origen.
    expect(await passes('rechazadas_iban', "SELECT t.id, t.importe, a.iban FROM transferencias t JOIN cuentas a ON t.cuenta_destino_id = a.id WHERE t.estado = 'rechazada'")).toBe(false)
    // Columna ambigua: error.
    expect((await runSql(db, "SELECT id, importe, iban FROM transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id WHERE estado = 'rechazada'")).ok).toBe(false)
    expect(await passes('caducadas_activas', "SELECT t.id, t.caduca_en, c.email FROM tarjetas t JOIN cuentas a ON t.cuenta_id = a.id JOIN clientes c ON a.cliente_id = c.id WHERE t.caduca_en < '2026-01-01'")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_producto', 'limit')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_perdido', 'deleted')
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
