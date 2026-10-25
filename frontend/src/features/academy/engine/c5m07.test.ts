// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m07LeftJoin as mission } from '../content/courses/sql-iniciacion/m07-left-join'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_left' })
  s = await query(s, 'SELECT c.id, c.nombre, a.iban FROM clientes c LEFT OUTER JOIN cuentas a ON c.id = a.cliente_id;')
  s = waitUntil(s, 30)
  s = await query(s, 'SELECT c.id, c.nombre, c.apellidos FROM clientes c WHERE NOT EXISTS (SELECT 1 FROM cuentas a WHERE a.cliente_id = c.id);')
  s = waitUntil(s, 75)
  s = await query(s, 'SELECT t.id, t.cuenta_destino_id, t.importe FROM transferencias t LEFT JOIN cuentas a ON a.id = t.cuenta_destino_id WHERE t.cuenta_destino_id IS NOT NULL AND a.id IS NULL;')
  s = waitUntil(s, 120)
  s = choose(s, 'ines_left_where', 'on')
  s = waitUntil(s, 150)
  s = await query(s, 'SELECT DISTINCT c.id, c.nombre, c.email FROM clientes c JOIN incidencias i ON i.cliente_id = c.id WHERE i.cerrada_en IS NULL;')
  s = waitUntil(s, 210)
  s = await query(s, 'SELECT a.id, a.iban FROM cuentas a LEFT JOIN transferencias t ON t.cuenta_destino_id = a.id WHERE t.id IS NULL;')
  s = waitUntil(s, 270)
  s = await query(s, 'SELECT c.id, c.nombre, COUNT(a.id) AS cuentas FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.nombre;')
  s = waitUntil(s, 360)
  s = choose(s, 'ines_notin', 'notin')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 5 · misión 7 · lo que falta', () => {
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
    expect((await rows(reto('clientes_cuentas').solution!)).length).toBe(53)
    expect((await rows(reto('sin_cuenta').solution!)).map((r) => r[0])).toEqual(['38'])
    expect(await rows(reto('destino_inexistente').solution!)).toEqual([['77', '999', expect.any(String)]])
    expect((await rows(reto('con_incidencia').solution!)).length).toBe(8)
    expect((await rows(`${reto('nunca_recibida').solution} ORDER BY a.id`)).map((r) => r[0])).toEqual(['21', '32', '47'])
    const porCliente = await rows(reto('cuentas_por_cliente').solution!)
    expect(porCliente.length).toBe(40)
    expect(porCliente.find((r) => r[0] === '38')![2]).toBe('0')
    // Las trampas de las reuniones.
    expect((await rows('SELECT id FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias)')).length).toBe(0)
    expect((await rows("SELECT c.id FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id WHERE a.estado = 'activa'")).some((r) => r[0] === '38')).toBe(false)
    expect((await rows("SELECT c.id FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id AND a.estado = 'activa'")).some((r) => r[0] === '38')).toBe(true)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    expect(await passes('clientes_cuentas', 'SELECT c.id, c.nombre, a.iban FROM clientes c JOIN cuentas a ON a.cliente_id = c.id')).toBe(false)
    expect(await passes('clientes_cuentas', 'SELECT c.id, c.nombre, a.iban FROM cuentas a RIGHT JOIN clientes c ON a.cliente_id = c.id')).toBe(true)
    // Sin excluir los destinos NULL salen también las transferencias a otros bancos.
    expect(await passes('destino_inexistente', 'SELECT t.id, t.cuenta_destino_id, t.importe FROM transferencias t LEFT JOIN cuentas a ON t.cuenta_destino_id = a.id WHERE a.id IS NULL')).toBe(false)
    expect(await passes('nunca_recibida', 'SELECT id, iban FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias)')).toBe(false)
    expect(await passes('nunca_recibida', 'SELECT id, iban FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL)')).toBe(true)
    expect(await passes('cuentas_por_cliente', 'SELECT c.id, c.nombre, COUNT(*) FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.nombre')).toBe(false)
    expect(await passes('cuentas_por_cliente', 'SELECT c.id, c.nombre, COUNT(a.id) FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.nombre')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_left_where', 'right')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_notin', 'trust')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'inner')
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
