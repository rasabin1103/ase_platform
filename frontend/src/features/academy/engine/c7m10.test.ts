// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { M10_SQL_ANSWERS as ANSWERS, m10Examen as mission } from '../content/courses/sql-avanzado/m10-examen'
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

describe('curso 7 · examen práctico', () => {
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

  it('los cambios de los encargos 6 a 10 no estropean las consultas 1 a 5', async () => {
    const s = await exam(1, [...ANSWERS.slice(5), ...ANSWERS.slice(0, 5)])
    expect(practicalScore(mission, s)!.score).toBe(100)
  }, 90_000)

  it('los datos del examen y sus trampas', async () => {
    const lab = await fresh()
    const rows = async (sql: string) => (await runSql(lab.db, sql)).rows
    const sol = (id: string) => rows(mission.sqlLab!.retos.find((r) => r.id === id)!.solution!)
    expect((await sol('e1_equipo_jorge')).length).toBe(12)
    expect((await sol('e2_diferencia')).length).toBe(43)
    expect(await sol('e3_mediana')).toContainEqual(['restauracion', '18.62'])
    expect((await sol('e4_subtotales')).length).toBe(18)
    expect((await sol('e5_errores_pantalla')).length).toBe(3)
    // Trampas de consulta: solo los directos, LAG después de filtrar 2026, la media en vez de la mediana,
    // GROUP BY sin subtotales, ->  en vez de ->>.
    expect(await passes(lab, 'e1_equipo_jorge', 'WITH RECURSIVE x AS (SELECT 1) SELECT id, nombre, 1 AS nivel FROM empleados WHERE jefe_id = 2')).toBe(false)
    expect(await passes(lab, 'e2_diferencia', "SELECT id, tarjeta_id, importe, importe - LAG(importe) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en, id) AS diferencia FROM pagos_tarjeta WHERE pagado_en >= '2026-01-01'")).toBe(false)
    expect(await passes(lab, 'e3_mediana', "SELECT c.categoria, ROUND(AVG(p.importe), 2) AS mediana FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' GROUP BY 1")).toBe(false)
    expect(await passes(lab, 'e4_subtotales', 'SELECT estado, plazo_meses, COUNT(*) AS prestamos, SUM(importe) AS importe_total FROM prestamos GROUP BY estado, plazo_meses')).toBe(false)
    expect(await passes(lab, 'e5_errores_pantalla', "SELECT datos->'pantalla' AS pantalla, COUNT(*) AS errores, ROUND(AVG((datos->>'reintentos')::numeric), 2) AS media_reintentos FROM eventos_app WHERE tipo = 'error' GROUP BY 1")).toBe(false)
    // Trampas de cambios: copiar sin borrar, borrar la original, sin COALESCE, el índice al revés, una vista normal.
    expect(await passes(lab, 'e6_archivar', "SELECT 'delete'; INSERT INTO incidencias_archivo SELECT * FROM incidencias WHERE cerrada_en < '2026-01-01' RETURNING id")).toBe(false)
    await runSql(lab.db, 'DELETE FROM incidencias_archivo')
    expect(await passes(lab, 'e7_cuota_unica', 'DELETE FROM cuotas WHERE id = 9; ALTER TABLE cuotas ADD UNIQUE (prestamo_id, numero)')).toBe(false)
    expect(await passes(lab, 'e8_total_pagado', "CREATE FUNCTION total_pagado(p_tarjeta integer) RETURNS numeric LANGUAGE sql AS $$ SELECT SUM(importe) FROM pagos_tarjeta WHERE tarjeta_id = p_tarjeta AND estado = 'aceptado' $$")).toBe(false)
    expect(await passes(lab, 'e9_indice', 'CREATE INDEX ON movimientos (fecha, cuenta_id)')).toBe(false)
    expect(await passes(lab, 'e10_matview', "CREATE VIEW pagos_por_comercio AS SELECT comercio_id, COUNT(*) AS pagos, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY 1; SELECT 'create materialized view'")).toBe(false)
    // Borrar datos no hace que una consulta «coincida»: se compara con los datos de partida.
    await runSql(lab.db, 'DELETE FROM pagos_tarjeta')
    expect(await passes(lab, 'e2_diferencia', mission.sqlLab!.retos[1].solution!)).toBe(false)
    await lab.db.close()
  }, 90_000)

  it('sin pistas ni mentora', () => {
    expect(mission.mentor).toBeUndefined()
    expect(mission.sqlLab!.retos.every((r) => r.hint === '')).toBe(true)
    expect(mission.sqlLab!.retos).toHaveLength(10)
  })
})
