// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m04Informes as mission } from '../content/courses/sql-intermedio/m04-informes'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_informes' })
  s = await query(s, reto('estados_pct').solution!)
  s = waitUntil(s, 30)
  s = await query(s, "SELECT COALESCE(c.categoria, 'sin categoría') AS categoria, SUM(CASE WHEN p.estado = 'aceptado' THEN 1 ELSE 0 END) AS aceptados, COUNT(CASE WHEN p.estado = 'rechazado' THEN 1 END) AS rechazados, COUNT(*) FILTER (WHERE p.estado = 'devuelto') AS devueltos FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id GROUP BY 1;")
  s = waitUntil(s, 75)
  s = await query(s, reto('rechazo_tipo').solution!)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_division', 'decimal')
  s = waitUntil(s, 150)
  s = await query(s, reto('canales').solution!)
  s = waitUntil(s, 210)
  s = await query(s, reto('anios_categoria').solution!)
  s = waitUntil(s, 270)
  s = await query(s, reto('kpis').solution!)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_count_case', 'count_case')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 4 · informes', () => {
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
    expect(await rows(`${reto('estados_pct').solution} ORDER BY 1`)).toEqual([['aceptado', '271', '88.6'], ['devuelto', '6', '2.0'], ['rechazado', '29', '9.5']])
    expect((await rows(reto('pivot_categoria').solution!)).length).toBe(9)
    expect(await rows(`${reto('rechazo_tipo').solution} ORDER BY 1`)).toEqual([['credito', '11', '0', '0.0'], ['debito', '295', '29', '9.8']])
    expect(await rows(`${reto('canales').solution} ORDER BY 1`)).toEqual([['chat', '10', '2', '8'], ['email', '10', '3', '7'], ['telefono', '10', '3', '7']])
    expect((await rows(reto('anios_categoria').solution!)).length).toBe(8)
    expect(await rows(reto('kpis').solution!)).toEqual([['40', '38', '2', '7']])
    // Las reuniones: división entera y COUNT(CASE … ELSE 0).
    expect(await rows("SELECT 100 * COUNT(*) FILTER (WHERE estado = 'rechazado') / COUNT(*) FROM pagos_tarjeta")).toEqual([['9']])
    const mal = await rows("SELECT COUNT(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END), COUNT(*) FROM pagos_tarjeta")
    expect(mal[0][0]).toBe(mal[0][1])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    expect(await passes('estados_pct', 'SELECT estado, COUNT(*) AS pagos, ROUND(100 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS porcentaje FROM pagos_tarjeta GROUP BY estado')).toBe(false)
    expect(await passes('pivot_categoria', "SELECT COALESCE(c.categoria, 'sin categoría') AS categoria, COUNT(CASE WHEN p.estado = 'aceptado' THEN 1 ELSE 0 END) AS aceptados, COUNT(CASE WHEN p.estado = 'rechazado' THEN 1 ELSE 0 END) AS rechazados, COUNT(CASE WHEN p.estado = 'devuelto' THEN 1 ELSE 0 END) AS devueltos FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id GROUP BY 1")).toBe(false)
    // Porcentaje sobre el total de pagos y no sobre los del tipo.
    expect(await passes('rechazo_tipo', "SELECT t.tipo, COUNT(*) AS pagos, COUNT(*) FILTER (WHERE p.estado = 'rechazado') AS rechazados, ROUND(100.0 * COUNT(*) FILTER (WHERE p.estado = 'rechazado') / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS pct_rechazo FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id GROUP BY t.tipo")).toBe(false)
    // Sin filtrar aceptados.
    expect(await passes('anios_categoria', "SELECT c.categoria, SUM(p.importe) FILTER (WHERE p.pagado_en < '2026-01-01') AS total_2025, SUM(p.importe) FILTER (WHERE p.pagado_en >= '2026-01-01') AS total_2026 FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE c.categoria IS NOT NULL GROUP BY c.categoria")).toBe(false)
    // COUNT(segmento) no cuenta a los que no tienen: no vale como sin_segmento.
    expect(await passes('kpis', "SELECT COUNT(*) AS total, COUNT(segmento) AS con_segmento, COUNT(segmento) FILTER (WHERE segmento IS NULL) AS sin_segmento, COUNT(*) FILTER (WHERE segmento = 'premium') AS premium FROM clientes")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_division', 'round')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_count_case', 'distinct')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'several')
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
