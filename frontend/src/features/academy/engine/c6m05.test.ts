// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m05Ranking as mission } from '../content/courses/sql-intermedio/m05-ranking'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_ventanas' })
  s = await query(s, reto('ranking_comercios').solution!)
  s = waitUntil(s, 30)
  s = await query(s, "WITH t AS (SELECT c.ciudad, c.nombre, SUM(p.importe) AS total FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND c.ciudad IS NOT NULL GROUP BY c.ciudad, c.nombre), r AS (SELECT *, RANK() OVER (PARTITION BY ciudad ORDER BY total DESC) AS n FROM t) SELECT ciudad, nombre, total FROM r WHERE n <= 3;")
  s = waitUntil(s, 75)
  s = await query(s, reto('ultimo_pago').solution!)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_where', 'cte')
  s = waitUntil(s, 150)
  s = await query(s, reto('top_cliente_ciudad').solution!)
  s = waitUntil(s, 210)
  s = await query(s, reto('ranking_pagos').solution!)
  s = waitUntil(s, 270)
  s = await query(s, reto('cuartiles').solution!)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_empates', 'ties')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 5 · ranking', () => {
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
    const count = async (id: string) => (await rows(reto(id).solution!)).length
    expect(await count('ranking_comercios')).toBe(22)
    expect((await rows(`${reto('ranking_comercios').solution} ORDER BY puesto LIMIT 1`))[0]).toEqual(['20', '7721.88', '1'])
    expect(await count('top3_ciudad')).toBe(17)
    expect(await count('ultimo_pago')).toBe(32)
    expect(await count('top_cliente_ciudad')).toBe(7)
    const ranking = await rows(`${reto('ranking_pagos').solution} ORDER BY puesto, cliente_id`)
    expect(ranking.filter((r) => r[2] === '1')).toHaveLength(6)
    expect(ranking[6]).toEqual(['5', '12', '2'])
    const cuartiles = await rows(`SELECT cuartil, COUNT(*) FROM (${reto('cuartiles').solution}) q GROUP BY 1 ORDER BY 1`)
    expect(cuartiles).toEqual([['1', '10'], ['2', '10'], ['3', '10'], ['4', '9']])
    // Las reuniones: la ventana en el WHERE y seis empatados con 13 pagos.
    const where = await runSql(db, 'SELECT id FROM pagos_tarjeta WHERE ROW_NUMBER() OVER (ORDER BY id) = 1')
    expect(where.error!.message).toMatch(/WITH/)
    // Ninguna tarjeta tiene dos pagos en el mismo último instante: el último pago no depende del azar.
    expect(await rows('SELECT COUNT(*) FROM (SELECT tarjeta_id FROM pagos_tarjeta p WHERE pagado_en = (SELECT MAX(pagado_en) FROM pagos_tarjeta q WHERE q.tarjeta_id = p.tarjeta_id) GROUP BY tarjeta_id HAVING COUNT(*) > 1) x')).toEqual([['0']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Sin ventana no vale.
    expect(await passes('cuartiles', 'SELECT cliente_id, SUM(saldo) AS saldo_total, 1 AS cuartil FROM cuentas GROUP BY cliente_id')).toBe(false)
    // RANK deja huecos: no es lo que pide Diego.
    expect(await passes('ranking_pagos', 'SELECT a.cliente_id, COUNT(*) AS pagos, RANK() OVER (ORDER BY COUNT(*) DESC) AS puesto FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN cuentas a ON a.id = t.cuenta_id GROUP BY a.cliente_id')).toBe(false)
    // Sin PARTITION BY: los tres primeros de todo, no de cada ciudad.
    expect(await passes('top3_ciudad', "WITH t AS (SELECT c.ciudad, c.nombre, SUM(p.importe) AS total, ROW_NUMBER() OVER (ORDER BY SUM(p.importe) DESC) AS n FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND c.ciudad IS NOT NULL GROUP BY c.ciudad, c.nombre) SELECT ciudad, nombre, total FROM t WHERE n <= 3")).toBe(false)
    // El primer pago en vez del último.
    expect(await passes('ultimo_pago', 'WITH n AS (SELECT tarjeta_id, id, importe, pagado_en, ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) AS n FROM pagos_tarjeta) SELECT tarjeta_id, id, importe, pagado_en FROM n WHERE n = 1')).toBe(false)
    // DISTINCT ON también da el último pago, pero sin ventana no es el encargo de hoy.
    expect(await passes('ultimo_pago', 'SELECT DISTINCT ON (tarjeta_id) tarjeta_id, id, importe, pagado_en FROM pagos_tarjeta ORDER BY tarjeta_id, pagado_en DESC')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_where', 'having')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_empates', 'limit')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'sort')
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
