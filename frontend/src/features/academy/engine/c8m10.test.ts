// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { M10_SQL_ANSWERS as ANSWERS, m10Examen as mission } from '../content/courses/sql-qa/m10-examen'
import { runEvent, visibleRetos } from '../apps/sql-console/sqlConsoleLogic'
import { checkReto } from '../sql/check'
import { openDb, runSql } from '../sql/engine'
import type { SqlResult } from '../sql/types'
import { replay, step, summarize } from './engine'
import { countsAsFinished, practicalScore } from './practicalExam'
import type { RunState } from './types'

/** Como la consola: los resultados esperados se calculan sobre los datos de partida. */
async function fresh() {
  const db = await openDb(mission.sqlLab!.setup, false)
  const expected = new Map<string, SqlResult>()
  for (const r of mission.sqlLab!.retos) if (r.solution) expected.set(r.id, await runSql(db, r.solution))
  return { db, expected }
}
type Lab = Awaited<ReturnType<typeof fresh>>

async function query(lab: Lab, s: RunState, sql: string): Promise<RunState> {
  const r = await runSql(lab.db, sql)
  const vs = []
  for (const reto of visibleRetos(mission, s)) vs.push(await checkReto(lab.db, reto, r, sql, lab.expected))
  return step(mission, s, { type: 'app', event: runEvent(mission, s, sql, r, vs).event })
}
const submit = (s: RunState) => {
  const id = s.messages.find((m) => m.sceneId === 'closing')?.id
  expect(id).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId: 'submit' })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)
const passes = async (lab: Lab, id: string, sql: string) => {
  const reto = mission.sqlLab!.retos.find((r) => r.id === id)!
  return (await checkReto(lab.db, reto, await runSql(lab.db, sql), sql, lab.expected)).done
}


async function exam(seed: number, answers: string[]) {
  const lab = await fresh()
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'tablas' })
  for (const sql of answers) s = await query(lab, s, sql)
  s = waitUntil(s, 180)
  s = submit(s)
  await lab.db.close()
  return s
}

describe('curso 8 · examen práctico', () => {
  it('diez encargos: 100 puntos, aprobado y cuenta como terminado', async () => {
    for (const seed of [1, 2]) {
      const s = await exam(seed, ANSWERS)
      const score = practicalScore(mission, s)!
      expect(score.retos.filter((r) => !r.ok).map((r) => r.id)).toEqual([])
      expect([score.score, score.max, score.passed]).toEqual([100, 100, true])
      expect(countsAsFinished(mission, s)).toBe(true)
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  }, 90_000)

  it('con seis encargos no aprueba ni cuenta como terminado', async () => {
    const s = await exam(1, ANSWERS.slice(0, 6))
    const score = practicalScore(mission, s)!
    expect([score.score, score.passed]).toEqual([60, false])
    expect(countsAsFinished(mission, s)).toBe(false)
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  }, 90_000)

  it('crear los datos de prueba primero no estropea las consultas', async () => {
    const s = await exam(1, [ANSWERS[2], ANSWERS[8], ...ANSWERS.filter((_, i) => i !== 2 && i !== 8)])
    expect(practicalScore(mission, s)!.score).toBe(100)
  }, 90_000)

  it('los datos del examen y sus trampas', async () => {
    const lab = await fresh()
    const rows = async (sql: string) => (await runSql(lab.db, sql)).rows
    const sol = (id: string) => rows(mission.sqlLab!.retos.find((r) => r.id === id)!.solution!)
    expect(await sol('e1_ejecucion')).toContainEqual(['REF-1005', '500.00', null])
    expect((await sol('e2_estados_febrero')).length).toBe(3)
    expect((await sol('e4_cuentas_inexistentes')).map((r) => r[0])).toEqual(['77', '2001', '2002'])
    expect((await sol('e5_liquidado')).length).toBe(5)
    expect((await sol('e6_migracion')).map((r) => Number(r[0])).sort((a, b) => a - b)).toEqual([1, 2, 8, 9, 17, 22, 30])
    expect((await sol('e7_devueltos')).length).toBe(22)
    expect((await sol('e8_estados_repetidos')).length).toBe(2)
    expect(await sol('e9_plazos')).toEqual([['12', 'ok'], ['36', 'ok'], ['60', 'ok'], ['72', '23514'], [null, 'ok']])
    expect((await sol('e10_por_peticion')).map((r) => r[0])).toEqual(['Q2', 'Q3'])
    // Trampas: JOIN que pierde la 1005, BETWEEN con fechas, solo el destino, tolerancia de un céntimo,
    // <> que no ve el email vacío, el filtro en el WHERE, tiempo total sin normalizar.
    expect(await passes(lab, 'e1_ejecucion', "SELECT e.referencia, e.importe AS importe_app, t.importe AS importe_bd FROM ejecuciones e JOIN transferencias t ON t.concepto = e.referencia WHERE e.ejecucion = 'R-0306'")).toBe(false)
    expect(await passes(lab, 'e2_estados_febrero', "SELECT estado, COUNT(*) AS pagos FROM pagos_tarjeta WHERE pagado_en BETWEEN '2026-02-01' AND '2026-02-28' GROUP BY estado")).toBe(false)
    expect(await passes(lab, 'e5_liquidado', "SELECT p.id AS pago_id, p.importe AS importe_app, COALESCE(SUM(l.importe), 0) AS liquidado FROM pagos_tarjeta p LEFT JOIN liquidaciones l ON l.pago_id = p.id WHERE p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01' GROUP BY p.id, p.importe HAVING abs(COALESCE(SUM(l.importe), 0) - p.importe) > 0.01")).toBe(false)
    expect(await passes(lab, 'e6_migracion', "SELECT c.id FROM clientes c LEFT JOIN ciudades ci ON ci.nombre = c.ciudad LEFT JOIN clientes_v2 v ON v.id = c.id WHERE v.id IS NULL OR v.nombre_completo <> c.nombre || ' ' || c.apellidos OR v.email <> lower(trim(c.email)) OR v.ciudad_id <> ci.id OR v.segmento <> COALESCE(c.segmento, 'sin_segmento') OR v.alta <> c.fecha_alta")).toBe(false)
    expect(await passes(lab, 'e7_devueltos', "SELECT c.id AS comercio_id, COUNT(p.id) AS devueltos FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id WHERE p.estado = 'devuelto' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01' GROUP BY c.id")).toBe(false)
    expect(await passes(lab, 'e10_por_peticion', "SELECT a.consulta_id, ROUND(a.tiempo_total_ms / a.peticiones, 2) AS ms_peticion_18, ROUND(b.tiempo_total_ms / b.peticiones, 2) AS ms_peticion_19 FROM log_consultas a JOIN log_consultas b ON b.consulta_id = a.consulta_id AND b.version = '1.9' WHERE a.version = '1.8' AND b.tiempo_total_ms > 1.5 * a.tiempo_total_ms")).toBe(false)
    // Datos de prueba sin la hora correcta; el plazo cambiado de verdad.
    expect(await passes(lab, 'e3_incidencias_prueba', "INSERT INTO incidencias (id, cliente_id, canal, motivo, abierta_en) SELECT n, 3, CASE WHEN n % 2 = 1 THEN 'chat' ELSE 'email' END, 'Prueba QA', TIMESTAMP '2026-03-01' + (n - 9300) * INTERVAL '1 hour' FROM generate_series(9301, 9330) AS n")).toBe(false)
    await runSql(lab.db, 'DELETE FROM incidencias WHERE id > 9300')
    await runSql(lab.db, 'UPDATE solicitudes SET plazo_meses = 12 WHERE id = 2')
    expect(await passes(lab, 'e9_plazos', mission.sqlLab!.retos[8].solution!)).toBe(false)
    await lab.db.close()
  }, 90_000)

  it('sin pistas ni mentora', () => {
    expect(mission.mentor).toBeUndefined()
    expect(mission.sqlLab!.retos.every((r) => r.hint === '')).toBe(true)
    expect(mission.sqlLab!.retos).toHaveLength(10)
  })
})
