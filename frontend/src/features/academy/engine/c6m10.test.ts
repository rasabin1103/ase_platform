// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { M10_SQL_ANSWERS as ANSWERS, m10Examen as mission } from '../content/courses/sql-intermedio/m10-examen'
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
  s = step(mission, s, { type: 'readDoc', docId: 'prestamos' })
  for (const sql of answers) s = await query(lab, s, sql)
  s = waitUntil(s, 180)
  s = submit(s)
  await lab.db.close()
  return s
}

describe('curso 6 · examen práctico', () => {
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

  it('los datos del examen y sus trampas', async () => {
    const lab = await fresh()
    const rows = async (sql: string) => (await runSql(lab.db, sql)).rows
    const count = async (id: string) => (await rows(mission.sqlLab!.retos.find((r) => r.id === id)!.solution!)).length
    expect(await count('e1_sobre_media')).toBe(13)
    expect(await count('e2_grandes_deudores')).toBe(7)
    expect(await count('e3_solicitudes_mes')).toBe(6)
    expect(await count('e4_sin_tarjeta')).toBe(4)
    expect(await count('e5_plazos')).toBe(5)
    expect(await count('e6_mayor_por_plazo')).toBe(5)
    expect((await rows(`${mission.sqlLab!.retos[6].solution} ORDER BY mes DESC LIMIT 1`))[0]).toEqual(['2026-02-01', '8024.22', '25577.25'])
    const cuotas = await rows(`${mission.sqlLab!.retos[7].solution} ORDER BY id`)
    expect(cuotas).toHaveLength(15)
    expect(cuotas.find((r) => r[0] === '19')).toEqual(['19', '0', '0'])
    expect(await rows(mission.sqlLab!.retos[8].solution!)).toEqual([['4', '2', '2025-12-06'], ['11', '3', '2026-02-21']])
    // Trampas: la media escrita a mano, el máximo sin PARTITION BY, JOIN normal en vez de LEFT JOIN, la última cuota en vez de la primera.
    const media = (await rows('SELECT AVG(importe) FROM prestamos'))[0][0]
    expect(await passes(lab, 'e1_sobre_media', `SELECT id, importe FROM prestamos WHERE importe > ${media}`)).toBe(false)
    expect(await passes(lab, 'e6_mayor_por_plazo', 'WITH n AS (SELECT plazo_meses, id, importe, ROW_NUMBER() OVER (ORDER BY importe DESC) AS n FROM prestamos) SELECT plazo_meses, id, importe FROM n WHERE n <= 5')).toBe(false)
    expect(await passes(lab, 'e8_cuotas_por_prestamo', "SELECT p.id, COUNT(*) FILTER (WHERE c.pagada_en IS NOT NULL) AS pagadas, COUNT(*) FILTER (WHERE c.pagada_en IS NULL) AS pendientes FROM prestamos p JOIN cuotas c ON c.prestamo_id = p.id WHERE p.estado = 'aprobado' GROUP BY p.id")).toBe(false)
    expect(await passes(lab, 'e9_primera_impagada', "SELECT DISTINCT ON (prestamo_id) prestamo_id, numero, vence_en FROM cuotas WHERE pagada_en IS NULL AND vence_en < '2026-03-01' ORDER BY prestamo_id, vence_en DESC")).toBe(false)
    // Una tabla en vez de una vista no vale.
    await runSql(lab.db, 'CREATE TABLE resumen_prestamos AS SELECT estado, COUNT(*) AS prestamos, SUM(importe) AS importe_total FROM prestamos GROUP BY estado')
    expect(await passes(lab, 'e10_vista', 'CREATE VIEW otra AS SELECT 1')).toBe(false)
    // Borrar datos no hace que una consulta «coincida»: se compara con los datos de partida.
    await runSql(lab.db, 'DELETE FROM cuotas')
    expect(await passes(lab, 'e9_primera_impagada', mission.sqlLab!.retos[8].solution!)).toBe(false)
    await lab.db.close()
  }, 90_000)

  it('sin pistas ni mentora', () => {
    expect(mission.mentor).toBeUndefined()
    expect(mission.sqlLab!.retos.every((r) => r.hint === '')).toBe(true)
    expect(mission.sqlLab!.retos).toHaveLength(10)
  })
})
