// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m01Filtrar as mission } from '../content/courses/sql-iniciacion/m01-filtrar'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_where' })
  s = await query(s, "SELECT * FROM clientes WHERE ciudad = 'Madrid';")
  s = waitUntil(s, 30)
  s = await query(s, 'SELECT iban, tipo, saldo FROM cuentas WHERE saldo > 10000;')
  s = waitUntil(s, 75)
  s = await query(s, "SELECT id, iban, estado FROM cuentas WHERE estado <> 'activa';")
  s = waitUntil(s, 120)
  s = choose(s, 'ines_comillas', 'quotes')
  s = waitUntil(s, 150)
  s = await query(s, "SELECT nombre, apellidos, ciudad FROM clientes WHERE ciudad = 'Sevilla' OR ciudad = 'Málaga';")
  s = waitUntil(s, 210)
  s = await query(s, "SELECT nombre, email FROM clientes WHERE segmento = 'joven' AND ciudad = 'Madrid';")
  s = waitUntil(s, 270)
  s = await query(s, "SELECT id, importe, estado, creada_en FROM transferencias WHERE creada_en BETWEEN '2026-01-19' AND '2026-01-25 23:59:59';")
  s = waitUntil(s, 360)
  s = choose(s, 'ines_parentesis', 'parens')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 5 · misión 1 · solo lo que importa', () => {
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
    const count = async (sql: string) => (await runSql(db, sql)).rowCount
    expect(await count(reto('madrid').solution!)).toBe(12)
    expect(await count(reto('saldo_alto').solution!)).toBe(11)
    expect(await count(reto('no_activas').solution!)).toBe(3)
    expect(await count(reto('sur').solution!)).toBe(8)
    expect(await count(reto('jovenes_madrid').solution!)).toBe(3)
    expect(await count(reto('semana').solution!)).toBe(6)
    // La trampa de las reuniones: 14 filas sin paréntesis, 5 con ellos.
    expect(await count("SELECT * FROM clientes WHERE ciudad = 'Madrid' OR ciudad = 'Barcelona' AND segmento = 'joven'")).toBe(14)
    expect(await count("SELECT * FROM clientes WHERE (ciudad = 'Madrid' OR ciudad = 'Barcelona') AND segmento = 'joven'")).toBe(5)
    expect(await count("SELECT * FROM clientes WHERE ciudad = 'madrid'")).toBe(0)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // BETWEEN hasta el domingo a las 00:00 pierde la transferencia del domingo.
    expect(await passes('semana', "SELECT id, importe, estado, creada_en FROM transferencias WHERE creada_en BETWEEN '2026-01-19' AND '2026-01-25'")).toBe(false)
    expect(await passes('semana', "SELECT id, importe, estado, creada_en FROM transferencias WHERE creada_en::date BETWEEN '2026-01-19' AND '2026-01-25'")).toBe(true)
    // Solo «bloqueada» deja fuera la cerrada.
    expect(await passes('no_activas', "SELECT id, iban, estado FROM cuentas WHERE estado = 'bloqueada'")).toBe(false)
    expect(await passes('no_activas', "SELECT id, iban, estado FROM cuentas WHERE estado IN ('bloqueada', 'cerrada')")).toBe(true)
    // OR sin condición completa: PostgreSQL da error.
    expect((await runSql(db, "SELECT * FROM clientes WHERE ciudad = 'Sevilla' OR 'Málaga'")).ok).toBe(false)
    expect(await passes('jovenes_madrid', "SELECT nombre, email FROM clientes WHERE ciudad = 'Madrid' OR segmento = 'joven'")).toBe(false)
    expect(await passes('saldo_alto', 'SELECT iban, tipo, saldo FROM cuentas WHERE saldo >= 10000')).toBe(true)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_comillas', 'none')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_parentesis', 'data')
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
