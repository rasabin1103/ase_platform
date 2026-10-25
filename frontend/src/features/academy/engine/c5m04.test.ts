// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m04Contar as mission } from '../content/courses/sql-iniciacion/m04-contar'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_agregados' })
  s = await query(s, 'SELECT COUNT(*) AS clientes FROM clientes;')
  s = waitUntil(s, 30)
  s = await query(s, "SELECT SUM(saldo) AS total FROM cuentas WHERE estado = 'activa';")
  s = waitUntil(s, 75)
  s = await query(s, "SELECT ROUND(AVG(importe), 2) AS media FROM transferencias WHERE estado = 'completada';")
  s = waitUntil(s, 120)
  s = choose(s, 'ines_mezcla', 'aggmix')
  s = waitUntil(s, 150)
  s = await query(s, 'SELECT MIN(importe) AS minimo, MAX(importe) AS maximo FROM transferencias;')
  s = waitUntil(s, 210)
  s = await query(s, 'SELECT COUNT(*) AS total, COUNT(concepto) AS con_concepto FROM transferencias;')
  s = waitUntil(s, 270)
  s = await query(s, 'SELECT COUNT(DISTINCT ciudad) AS ciudades FROM clientes;')
  s = waitUntil(s, 360)
  s = choose(s, 'ines_media', 'outliers')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 5 · misión 4 · contar', () => {
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
    const one = async (sql: string) => (await runSql(db, sql)).rows[0]
    expect(await one(reto('total_clientes').solution!)).toEqual(['40'])
    expect(await one(reto('saldo_activas').solution!)).toEqual(['396358.49'])
    expect(await one(reto('media_completadas').solution!)).toEqual(['956.99'])
    expect(await one(reto('extremos').solution!)).toEqual(['6.90', '15700.00'])
    expect(await one(reto('conceptos').solution!)).toEqual(['120', '111'])
    expect(await one(reto('ciudades_distintas').solution!)).toEqual(['7'])
    // La reunión de la media: 893 € con todas, unos 430 € sin las cuatro enormes.
    expect(await one('SELECT ROUND(AVG(importe), 2) FROM transferencias')).toEqual(['892.90'])
    expect(await one('SELECT ROUND(AVG(importe), 2) FROM transferencias WHERE importe < 10000')).toEqual(['430.15'])
    const mezcla = await runSql(db, 'SELECT nombre, COUNT(*) FROM clientes')
    expect(mezcla.error!.message).toMatch(/GROUP BY/)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Escribir la cifra a mano no vale.
    expect(await passes('total_clientes', 'SELECT 40')).toBe(false)
    expect(await passes('total_clientes', 'SELECT 40 FROM clientes LIMIT 1')).toBe(false)
    expect(await passes('total_clientes', '-- count(\nSELECT 40 FROM clientes LIMIT 1')).toBe(false)
    expect(await passes('saldo_activas', 'SELECT SUM(saldo) FROM cuentas')).toBe(false)
    expect(await passes('media_completadas', "SELECT AVG(importe) FROM transferencias WHERE estado = 'completada'")).toBe(false)
    expect(await passes('extremos', 'SELECT MIN(importe), MAX(importe) FROM transferencias')).toBe(false)
    expect(await passes('conceptos', 'SELECT COUNT(*) AS total, COUNT(*) AS con_concepto FROM transferencias')).toBe(false)
    expect(await passes('ciudades_distintas', 'SELECT COUNT(ciudad) FROM clientes')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_mezcla', 'twice')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_media', 'ok')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'calc')
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
