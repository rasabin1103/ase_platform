// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m02FechasTextos as mission } from '../content/courses/sql-intermedio/m02-fechas-textos'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_fechas' })
  s = await query(s, reto('pagos_mes').solution!)
  s = waitUntil(s, 30)
  s = await query(s, "SELECT id, nombre, fecha_alta FROM clientes WHERE AGE(DATE '2026-03-01', fecha_alta) >= INTERVAL '1 year';")
  s = waitUntil(s, 75)
  s = await query(s, "SELECT id, importe, pagado_en FROM pagos_tarjeta WHERE estado = 'aceptado' AND EXTRACT(DOW FROM pagado_en) IN (0, 6) AND importe > 200;")
  s = waitUntil(s, 120)
  s = choose(s, 'ines_febrero', 'range')
  s = waitUntil(s, 150)
  s = await query(s, reto('dominios').solution!)
  s = waitUntil(s, 210)
  s = await query(s, "SELECT id, tarjeta_id, importe, pagado_en FROM pagos_tarjeta WHERE pagado_en::time < '06:00';")
  s = waitUntil(s, 270)
  s = await query(s, reto('espacios').solution!)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_orden_texto', 'format_last')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 2 · fechas y textos', () => {
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
    expect(await count('pagos_mes')).toBe(14)
    expect(await count('antiguedad')).toBe(24)
    expect(await count('finde')).toBe(11)
    expect(await count('madrugada')).toBe(13)
    expect(await rows(`${reto('dominios').solution} ORDER BY 2 DESC`)).toEqual([['mail.com', '29'], ['correo.es', '11']])
    expect(await rows(`${reto('espacios').solution} ORDER BY id`)).toEqual([['5', ' Café Central', 'Café Central'], ['6', 'Bar Esquina  ', 'Bar Esquina']])
    // Las cifras de las reuniones.
    expect(await rows('SELECT COUNT(*) FROM pagos_tarjeta WHERE EXTRACT(MONTH FROM pagado_en) = 2')).toEqual([['41']])
    expect(await rows("SELECT COUNT(*) FROM pagos_tarjeta WHERE pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'")).toEqual([['20']])
    const texto = await rows("SELECT TO_CHAR(pagado_en, 'MM/YYYY') FROM pagos_tarjeta GROUP BY 1 ORDER BY 1 LIMIT 2")
    expect(texto).toEqual([['01/2025'], ['01/2026']])
    // Anomalías sembradas para misiones posteriores.
    expect(await rows('SELECT COUNT(*) FROM (SELECT tarjeta_id, comercio_id, importe, pagado_en FROM pagos_tarjeta GROUP BY 1, 2, 3, 4 HAVING COUNT(*) > 1) d')).toEqual([['3']])
    expect(await rows("SELECT COUNT(*) FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado'")).toEqual([['3']])
    expect(await rows('SELECT COUNT(*) FROM comercios WHERE categoria IS NULL')).toEqual([['1']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Agrupar por número de mes mezcla años.
    expect(await passes('pagos_mes', "SELECT EXTRACT(MONTH FROM pagado_en) AS mes, COUNT(*) AS pagos, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY 1")).toBe(false)
    // CURRENT_DATE no vale aunque hoy diese lo mismo.
    expect(await passes('antiguedad', "SELECT id, nombre, fecha_alta FROM clientes WHERE fecha_alta <= CURRENT_DATE - INTERVAL '1 year'")).toBe(false)
    // DAY es el día del mes, no de la semana.
    expect(await passes('finde', "SELECT id, importe, pagado_en FROM pagos_tarjeta WHERE estado = 'aceptado' AND EXTRACT(DAY FROM pagado_en) IN (6, 7) AND importe > 200")).toBe(false)
    // Hasta las 06:00 incluidas.
    expect(await passes('madrugada', 'SELECT id, tarjeta_id, importe, pagado_en FROM pagos_tarjeta WHERE EXTRACT(HOUR FROM pagado_en) <= 6')).toBe(false)
    // Agrupar por el email entero.
    expect(await passes('dominios', 'SELECT email AS dominio, COUNT(*) AS clientes FROM clientes GROUP BY email')).toBe(false)
    expect(await passes('espacios', 'SELECT id, nombre, nombre AS limpio FROM comercios WHERE nombre <> TRIM(nombre)')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_febrero', 'spike')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_orden_texto', 'desc')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'text')
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
