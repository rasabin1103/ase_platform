// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m07Cruces as mission } from '../content/courses/sql-intermedio/m07-cruces'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_cruces' })
  s = await query(s, reto('misma_ciudad').solution!)
  s = waitUntil(s, 30)
  s = await query(s, reto('grandes_con_nombres').solution!)
  s = waitUntil(s, 75)
  s = await query(s, "WITH meses AS (SELECT generate_series(DATE '2025-01-01', DATE '2026-02-01', INTERVAL '1 month')::date AS mes) SELECT m.mes, COALESCE(SUM(p.importe), 0.00) AS total FROM meses m LEFT JOIN (pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id AND c.categoria = 'servicios') ON DATE_TRUNC('month', p.pagado_en) = m.mes AND p.estado = 'aceptado' GROUP BY m.mes;")
  s = waitUntil(s, 120)
  s = choose(s, 'ines_doble_alias', 'two_aliases')
  s = waitUntil(s, 150)
  s = await query(s, reto('traspasos_internos').solution!)
  s = waitUntil(s, 210)
  s = await query(s, reto('enero_febrero').solution!)
  s = waitUntil(s, 270)
  s = await query(s, reto('matriz_cobertura').solution!)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_on_where', 'on')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 7 · cruces', () => {
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
    expect(await count('misma_ciudad')).toBe(26)
    expect(await rows(`${reto('grandes_con_nombres').solution} ORDER BY id`)).toEqual([
      ['25', '12925.00', 'Diego', null],
      ['50', '13850.00', 'Adrián', 'Laura'],
      ['75', '14775.00', 'Sergio', 'Irene'],
      ['100', '15700.00', 'Adrián', 'Raúl'],
    ])
    const cal = await rows(`${reto('calendario_servicios').solution} ORDER BY mes`)
    expect(cal).toHaveLength(14)
    expect(cal.filter((r) => r[1] === '0').map((r) => r[0])).toEqual(['2025-01-01', '2025-02-01', '2025-06-01', '2025-08-01', '2025-12-01'])
    expect(await rows(`${reto('traspasos_internos').solution} ORDER BY id`)).toEqual([['38', '6'], ['90', '6']])
    const meses = await rows(`${reto('enero_febrero').solution} ORDER BY comercio_id`)
    expect(meses).toHaveLength(20)
    expect(meses.filter((r) => r[1] === '0').map((r) => r[0])).toEqual(['11', '12', '20'])
    const matriz = await rows(reto('matriz_cobertura').solution!)
    expect(matriz).toHaveLength(16)
    expect(matriz.filter((r) => r[2] === '0')).toEqual([['credito', 'servicios', '0']])
    // Las reuniones: un alias para dos papeles da 0; el filtro en el WHERE pierde 3 meses.
    expect(await rows('SELECT COUNT(*) FROM transferencias t JOIN cuentas a ON a.id = t.cuenta_origen_id AND a.id = t.cuenta_destino_id')).toEqual([['0']])
    expect(await rows('SELECT COUNT(*) FROM transferencias WHERE cuenta_destino_id IS NOT NULL')).toEqual([['96']])
    const where = await rows("WITH meses AS (SELECT generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month') AS mes) SELECT m.mes FROM meses m LEFT JOIN pagos_tarjeta p ON DATE_TRUNC('month', p.pagado_en) = m.mes LEFT JOIN comercios c ON c.id = p.comercio_id WHERE c.categoria = 'servicios' GROUP BY m.mes")
    expect(where).toHaveLength(11)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Destino con JOIN normal: se pierde la que va a otro banco.
    expect(await passes('grandes_con_nombres', 'SELECT t.id, t.importe, co.nombre AS emisor, cd.nombre AS receptor FROM transferencias t JOIN cuentas ao ON ao.id = t.cuenta_origen_id JOIN clientes co ON co.id = ao.cliente_id JOIN cuentas ad ON ad.id = t.cuenta_destino_id JOIN clientes cd ON cd.id = ad.cliente_id WHERE t.importe > 5000')).toBe(false)
    // Sin calendario no salen los meses vacíos.
    expect(await passes('calendario_servicios', "SELECT DATE_TRUNC('month', p.pagado_en)::date AS mes, SUM(p.importe) AS total FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND c.categoria = 'servicios' GROUP BY 1")).toBe(false)
    // LEFT JOIN en vez de FULL OUTER: faltan los que solo están en febrero.
    expect(await passes('enero_febrero', "WITH e AS (SELECT comercio_id, COUNT(*) AS n FROM pagos_tarjeta WHERE pagado_en >= '2026-01-01' AND pagado_en < '2026-02-01' GROUP BY 1), f AS (SELECT comercio_id, COUNT(*) AS n FROM pagos_tarjeta WHERE pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01' GROUP BY 1) SELECT e.comercio_id, e.n AS enero, COALESCE(f.n, 0) AS febrero FROM e LEFT JOIN f ON f.comercio_id = e.comercio_id")).toBe(false)
    // COUNT(*) cuenta 1 en las combinaciones vacías.
    expect(await passes('matriz_cobertura', 'SELECT t.tipo, c.categoria, COUNT(*) AS pagos FROM (SELECT DISTINCT tipo FROM tarjetas) t CROSS JOIN (SELECT DISTINCT categoria FROM comercios WHERE categoria IS NOT NULL) c LEFT JOIN (pagos_tarjeta p JOIN tarjetas tt ON tt.id = p.tarjeta_id JOIN comercios cc ON cc.id = p.comercio_id) ON tt.tipo = t.tipo AND cc.categoria = c.categoria GROUP BY 1, 2')).toBe(false)
    // Mismo cliente comparando la cuenta consigo misma.
    expect(await passes('traspasos_internos', 'SELECT t.id, a.cliente_id FROM transferencias t JOIN cuentas a ON a.id = t.cuenta_origen_id')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_doble_alias', 'or')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_on_where', 'coalesce')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'two_queries')
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
