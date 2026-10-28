// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m01Cte as mission } from '../content/courses/sql-intermedio/m01-cte'
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

const SALDOS = 'WITH saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id)'

async function goodDay(seed: number) {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_with' })
  s = await query(s, `${SALDOS} SELECT c.id, c.nombre, s.saldo_total FROM clientes c JOIN saldos s ON s.cliente_id = c.id WHERE s.saldo_total > 20000;`)
  s = waitUntil(s, 30)
  s = await query(s, reto('emisores').solution!)
  s = waitUntil(s, 75)
  s = await query(s, reto('sobre_media_ciudad').solution!)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_ambito', 'scope')
  s = waitUntil(s, 150)
  s = await query(s, reto('abiertas_saldo_bajo').solution!)
  s = waitUntil(s, 210)
  s = await query(s, reto('segmentos').solution!)
  s = waitUntil(s, 270)
  s = await query(s, `${SALDOS} SELECT cliente_id, saldo_total FROM saldos WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos);`)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_granularidad', 'grain')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 1 · WITH', () => {
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
    expect(await count('saldo_alto')).toBe(7)
    expect(await count('emisores')).toBe(23)
    expect(await count('sobre_media_ciudad')).toBe(12)
    expect(await count('abiertas_saldo_bajo')).toBe(3)
    expect(await count('sobre_media')).toBe(12)
    expect(await rows(`${reto('segmentos').solution} ORDER BY 1`)).toEqual([['estandar', '23', '8837.48'], ['joven', '7', '12535.17'], ['premium', '7', '11274.43']])
    // La media por cuenta de la reunión.
    const porCuenta = await rows("SELECT ROUND(AVG(a.saldo), 2) FROM clientes c JOIN cuentas a ON a.cliente_id = c.id WHERE c.segmento = 'estandar'")
    expect(porCuenta).toEqual([['7009.03']])
    // El WITH no sobrevive a su consulta.
    await runSql(db, `${SALDOS} SELECT * FROM saldos`)
    expect((await runSql(db, 'SELECT * FROM saldos')).error!.message).toMatch(/saldos/)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Sin WITH no vale, aunque el resultado sea el mismo.
    expect(await passes('saldo_alto', 'SELECT c.id, c.nombre, SUM(a.saldo) AS saldo_total FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.nombre HAVING SUM(a.saldo) > 20000')).toBe(false)
    // Media por cuenta en vez de por cliente.
    expect(await passes('segmentos', "WITH x AS (SELECT c.segmento, a.saldo FROM clientes c JOIN cuentas a ON a.cliente_id = c.id) SELECT segmento, COUNT(*) AS clientes, ROUND(AVG(saldo), 2) AS saldo_medio FROM x WHERE segmento IS NOT NULL GROUP BY segmento")).toBe(false)
    // Media de la ciudad calculada con las cuentas sueltas.
    expect(await passes('sobre_media_ciudad', 'WITH saldos AS (SELECT c.id, c.nombre, c.ciudad, SUM(a.saldo) AS saldo_total FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.nombre, c.ciudad), medias AS (SELECT c.ciudad, AVG(a.saldo) AS media FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.ciudad) SELECT s.id, s.nombre, s.ciudad, s.saldo_total FROM saldos s JOIN medias m ON m.ciudad = s.ciudad WHERE s.saldo_total > m.media')).toBe(false)
    // Todas las transferencias, no solo las completadas.
    expect(await passes('emisores', 'WITH enviado AS (SELECT a.cliente_id, SUM(t.importe) AS total_enviado FROM transferencias t JOIN cuentas a ON a.id = t.cuenta_origen_id GROUP BY a.cliente_id) SELECT c.id, c.nombre, e.total_enviado FROM clientes c JOIN enviado e ON e.cliente_id = c.id WHERE e.total_enviado > 1000')).toBe(false)
    // Con un JOIN a incidencias sin DISTINCT funciona igual si cada cliente tiene una sola abierta.
    expect(await passes('abiertas_saldo_bajo', "WITH saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id) SELECT c.id, c.nombre, s.saldo_total FROM clientes c JOIN saldos s ON s.cliente_id = c.id WHERE s.saldo_total < 5000 AND c.id IN (SELECT cliente_id FROM incidencias WHERE cerrada_en IS NULL)")).toBe(true)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_ambito', 'table')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_granularidad', 'distinct')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'nest')
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
