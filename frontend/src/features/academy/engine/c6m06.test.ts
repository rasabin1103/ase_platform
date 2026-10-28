// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m06Tendencias as mission } from '../content/courses/sql-intermedio/m06-tendencias'
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

const MENSUAL = "WITH mensual AS (SELECT DATE_TRUNC('month', pagado_en) AS mes, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY 1)"

async function goodDay(seed: number) {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_tendencias' })
  s = await query(s, reto('acumulado').solution!)
  s = waitUntil(s, 30)
  s = await query(s, reto('variacion').solution!)
  s = waitUntil(s, 75)
  s = await query(s, reto('media_movil').solution!)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_over_vacio', 'order')
  s = waitUntil(s, 150)
  s = await query(s, reto('acumulado_anio').solution!)
  s = waitUntil(s, 210)
  s = await query(s, reto('dias_entre_pagos').solution!)
  s = waitUntil(s, 270)
  s = await query(s, reto('peso_categoria').solution!)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_huecos', 'gaps')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 6 · tendencias', () => {
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
    const last = async (id: string) => (await rows(`${reto(id).solution} ORDER BY 1 DESC LIMIT 1`))[0]
    expect((await rows(reto('acumulado').solution!)).length).toBe(14)
    expect((await last('acumulado'))[2]).toBe('33021.22')
    expect((await last('variacion')).slice(1)).toEqual(['5209.29', '1384.41', '3824.88'])
    expect((await rows(`${reto('variacion').solution} ORDER BY mes LIMIT 1`))[0][2]).toBeNull()
    expect((await last('media_movil'))[2]).toBe('2998.44')
    expect((await last('acumulado_anio'))[2]).toBe('6593.70')
    expect((await rows(`${reto('acumulado_anio').solution} ORDER BY mes`))[12][2]).toBe('1384.41')
    const dias = await rows(`${reto('dias_entre_pagos').solution} ORDER BY pagado_en`)
    expect(dias).toHaveLength(12)
    expect(Math.max(...dias.slice(1).map((d) => Number(d[2])))).toBe(130)
    const peso = await rows(`${reto('peso_categoria').solution} ORDER BY total DESC`)
    expect(peso).toHaveLength(9)
    expect(peso.slice(0, 2).map((r) => r[2])).toEqual(['34.9', '32.1'])
    // Las reuniones: OVER () repite el total y a servicios le falta junio de 2025.
    expect(new Set((await rows(`${MENSUAL} SELECT SUM(total) OVER () FROM mensual`)).map((r) => r[0]))).toEqual(new Set(['33021.22']))
    const servicios = await rows("WITH s AS (SELECT DATE_TRUNC('month', p.pagado_en)::date AS mes, SUM(p.importe) AS total FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND c.categoria = 'servicios' GROUP BY 1) SELECT mes, LAG(mes) OVER (ORDER BY mes) FROM s")
    expect(servicios).toContainEqual(['2025-07-01', '2025-05-01'])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // OVER () sin ORDER BY: el total en todas las filas.
    expect(await passes('acumulado', `${MENSUAL} SELECT mes, total, SUM(total) OVER () AS acumulado FROM mensual`)).toBe(false)
    // Acumulado sin reiniciar cada año.
    expect(await passes('acumulado_anio', `${MENSUAL} SELECT mes, total, SUM(total) OVER (ORDER BY mes) AS acumulado_anio FROM mensual`)).toBe(false)
    // LEAD en vez de LAG.
    expect(await passes('variacion', `${MENSUAL} SELECT mes, total, LEAD(total) OVER (ORDER BY mes) AS anterior, total - LEAD(total) OVER (ORDER BY mes) AS variacion FROM mensual`)).toBe(false)
    // Media acumulada en vez de móvil.
    expect(await passes('media_movil', `${MENSUAL} SELECT mes, total, ROUND(AVG(total) OVER (ORDER BY mes), 2) AS media_3m FROM mensual`)).toBe(false)
    // Diferencia con el primer pago, no con el anterior.
    expect(await passes('dias_entre_pagos', 'SELECT id, pagado_en, pagado_en::date - FIRST_VALUE(pagado_en::date) OVER (ORDER BY pagado_en) AS dias FROM pagos_tarjeta WHERE tarjeta_id = 5')).toBe(false)
    // importe es numeric, así que aquí 100 sin decimales también vale (no hay división entera).
    expect(await passes('peso_categoria', "SELECT COALESCE(c.categoria, 'sin categoría') AS categoria, SUM(p.importe) AS total, ROUND(100 * SUM(p.importe) / SUM(SUM(p.importe)) OVER (), 1) AS porcentaje FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' GROUP BY 1")).toBe(true)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_over_vacio', 'order_end')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_huecos', 'lag2')
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
