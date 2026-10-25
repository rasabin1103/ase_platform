// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { M10_SQL_ANSWERS as ANSWERS, m10Examen as mission } from '../content/courses/sql-iniciacion/m10-examen'
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

describe('curso 5 · examen práctico', () => {
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
    expect((await rows(mission.sqlLab!.retos[7].solution!)).map((r) => r[0])).toEqual(['19'])
    expect(await rows(mission.sqlLab!.retos[4].solution!)).toEqual([['4', '1518.90']])
    expect((await rows(mission.sqlLab!.retos[5].solution!)).length).toBe(2)
    // BETWEEN sin el estado, ORDER BY sin DESC, escribir la cifra a mano, UPDATE sin el estado.
    expect(await passes(lab, 'e2_aprobados', 'SELECT id, cliente_id, importe FROM prestamos WHERE importe BETWEEN 5000 AND 15000')).toBe(false)
    expect(await passes(lab, 'e3_top', 'SELECT id, importe FROM prestamos ORDER BY importe LIMIT 5')).toBe(false)
    expect(await passes(lab, 'e5_impagadas', "SELECT 4 AS impagadas, 1518.90 AS importe_impagado")).toBe(false)
    expect(await passes(lab, 'e8_sin_cuotas', 'SELECT p.id FROM prestamos p LEFT JOIN cuotas c ON c.prestamo_id = p.id WHERE c.id IS NULL')).toBe(false)
    await runSql(lab.db, 'UPDATE prestamos SET tipo_interes = 7.50 WHERE importe > 20000')
    expect(await passes(lab, 'e9_interes', 'SELECT 1')).toBe(false)
    // Borrar datos no hace que una consulta «coincida» con un resultado vacío: se compara con los datos de partida.
    await runSql(lab.db, 'DELETE FROM cuotas')
    expect(await passes(lab, 'e5_impagadas', "SELECT COUNT(*) AS impagadas, SUM(importe) AS importe_impagado FROM cuotas WHERE vence_en < '2026-03-01' AND pagada_en IS NULL")).toBe(false)
    await lab.db.close()
  }, 90_000)

  it('sin pistas ni mentora', () => {
    expect(mission.mentor).toBeUndefined()
    expect(mission.sqlLab!.retos.every((r) => r.hint === '')).toBe(true)
    expect(mission.sqlLab!.retos).toHaveLength(10)
  })
})
