// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m03Nulos as mission } from '../content/courses/sql-iniciacion/m03-nulos'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_null' })
  s = await query(s, 'SELECT id, nombre, apellidos FROM clientes WHERE segmento IS NULL;')
  s = waitUntil(s, 30)
  s = await query(s, 'SELECT id, cliente_id, motivo, abierta_en FROM incidencias WHERE cerrada_en IS NULL;')
  s = waitUntil(s, 75)
  s = await query(s, 'SELECT id, importe, estado FROM transferencias WHERE cuenta_destino_id IS NULL;')
  s = waitUntil(s, 120)
  s = choose(s, 'ines_isnull', 'isnull')
  s = waitUntil(s, 150)
  s = await query(s, "SELECT id, nombre, segmento FROM clientes WHERE COALESCE(segmento, '') <> 'premium';")
  s = waitUntil(s, 210)
  s = await query(s, "SELECT id, CASE WHEN concepto IS NULL THEN 'Sin concepto' ELSE concepto END AS concepto FROM transferencias;")
  s = waitUntil(s, 270)
  s = await query(s, "SELECT id, saldo, CASE WHEN saldo < 0 THEN 'negativo' WHEN saldo < 1000 THEN 'bajo' WHEN saldo < 10000 THEN 'medio' ELSE 'alto' END AS nivel FROM cuentas;")
  s = waitUntil(s, 360)
  s = choose(s, 'ines_contagio', 'coalesce')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 5 · misión 3 · los huecos', () => {
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
    expect(await count(reto('sin_segmento').solution!)).toBe(2)
    expect(await count(reto('abiertas').solution!)).toBe(8)
    expect(await count(reto('externas').solution!)).toBe(24)
    expect(await count(reto('no_premium').solution!)).toBe(33)
    expect(await count("SELECT * FROM clientes WHERE segmento <> 'premium'")).toBe(31)
    const conceptos = await runSql(db, reto('sin_concepto').solution!)
    expect(conceptos.rows.filter((r) => r[1] === 'Sin concepto')).toHaveLength(9)
    const niveles = await runSql(db, `SELECT nivel, COUNT(*) FROM (${reto('nivel').solution}) x GROUP BY nivel ORDER BY nivel`)
    expect(niveles.rows).toEqual([['alto', '11'], ['bajo', '1'], ['medio', '39'], ['negativo', '1']])
    expect(await count('SELECT * FROM incidencias WHERE cerrada_en = NULL')).toBe(0)
    const etiquetas = await runSql(db, "SELECT nombre || ' (' || segmento || ')' AS etiqueta FROM clientes")
    expect(etiquetas.rows.filter((r) => r[0] === null)).toHaveLength(2)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    expect(await passes('sin_segmento', 'SELECT id, nombre, apellidos FROM clientes WHERE segmento = NULL')).toBe(false)
    expect((await runSql(db, "SELECT * FROM incidencias WHERE cerrada_en = 'NULL'")).ok).toBe(false)
    expect(await passes('no_premium', "SELECT id, nombre, segmento FROM clientes WHERE segmento <> 'premium'")).toBe(false)
    expect(await passes('no_premium', "SELECT id, nombre, segmento FROM clientes WHERE segmento IS DISTINCT FROM 'premium'")).toBe(true)
    // Sin alias la columna se llama «coalesce».
    expect(await passes('sin_concepto', "SELECT id, COALESCE(concepto, 'Sin concepto') FROM transferencias")).toBe(false)
    expect(await passes('sin_concepto', 'SELECT id, concepto FROM transferencias')).toBe(false)
    // El orden de los WHEN importa: la negativa acabaría como «bajo».
    expect(await passes('nivel', "SELECT id, saldo, CASE WHEN saldo < 1000 THEN 'bajo' WHEN saldo < 0 THEN 'negativo' WHEN saldo < 10000 THEN 'medio' ELSE 'alto' END AS nivel FROM cuentas")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_isnull', 'none')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_contagio', 'bug')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'zero')
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
