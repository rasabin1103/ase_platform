// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m09Vistas as mission } from '../content/courses/sql-intermedio/m09-vistas'
import { runEvent, visibleRetos } from '../apps/sql-console/sqlConsoleLogic'
import { checkReto } from '../sql/check'
import { openDb, runSql } from '../sql/engine'
import { replay, step, summarize } from './engine'
import type { RunState } from './types'

/** Entorno de pruebas: base de datos modificable, nueva en cada prueba. */
const fresh = () => openDb(mission.sqlLab!.setup, false)

async function query(db: PGlite, s: RunState, sql: string): Promise<RunState> {
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
const passes = async (db: PGlite, id: string, sql: string) => (await checkReto(db, reto(id), await runSql(db, sql), sql)).done

const SALDOS = 'CREATE VIEW saldos_cliente AS SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id;'
const KPI = 'CREATE VIEW kpi_clientes AS SELECT c.id, c.nombre, c.ciudad, COALESCE(s.saldo_total, 0.00) AS saldo_total FROM clientes c LEFT JOIN saldos_cliente s ON s.cliente_id = c.id;'
const COPIAS = 'SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id) AS n FROM pagos_tarjeta) x WHERE n > 1'
const BLOQ = "SELECT p.id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado'"
const CAD = "SELECT p.id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE p.estado = 'aceptado' AND p.pagado_en::date > t.caduca_en"
const CONTROL = `CREATE VIEW control_pagos AS SELECT (SELECT COUNT(*) FROM (${COPIAS}) a) AS duplicados, (SELECT COUNT(*) FROM (${BLOQ}) b) AS tarjeta_bloqueada, (SELECT COUNT(*) FROM (${CAD}) c) AS tarjeta_caducada;`
const REVISAR = `CREATE VIEW pagos_a_revisar AS WITH copias AS (${COPIAS}) SELECT id, 'duplicado' AS motivo FROM copias UNION ALL SELECT id, 'tarjeta_bloqueada' FROM (${BLOQ}) b UNION ALL SELECT id, 'tarjeta_caducada' FROM (${CAD}) c;`

async function goodDay(seed: number) {
  const db = await fresh()
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_vistas' })
  s = await query(db, s, SALDOS)
  s = waitUntil(s, 30)
  s = await query(db, s, KPI)
  s = waitUntil(s, 75)
  s = await query(db, s, CONTROL)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_vista_tabla', 'view')
  s = waitUntil(s, 150)
  s = await query(db, s, "SELECT id, nombre, saldo_total FROM kpi_clientes WHERE ciudad = 'Madrid' AND saldo_total > 10000;")
  s = waitUntil(s, 210)
  s = await query(db, s, 'EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7;')
  s = waitUntil(s, 270)
  s = await query(db, s, REVISAR)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_explain_analyze', 'safe')
  s = waitUntil(s, 480)
  await db.close()
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 9 · vistas', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) {
      const s = await goodDay(seed)
      expect(s.finished).toBe(true)
      for (const r of mission.sqlLab!.retos) expect(s.flags[`reto.${r.id}`], r.id).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  }, 60_000)

  it('las vistas devuelven lo que cuenta la historia', async () => {
    const db = await fresh()
    const rows = async (sql: string) => (await runSql(db, sql)).rows
    for (const sql of [SALDOS, KPI, CONTROL, REVISAR]) expect((await runSql(db, sql)).ok, sql).toBe(true)
    expect(await rows('SELECT COUNT(*) FROM kpi_clientes')).toEqual([['40']])
    expect(await rows('SELECT saldo_total FROM kpi_clientes WHERE id = 38')).toEqual([['0.00']])
    expect(await rows('SELECT * FROM control_pagos')).toEqual([['3', '3', '24']])
    expect(await rows('SELECT COUNT(*) FROM pagos_a_revisar')).toEqual([['30']])
    expect((await rows(reto('usar_vista').solution!)).length).toBeGreaterThan(0)
    const plan = (await rows('EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7')).map((r) => r[0]).join('\n')
    expect(plan).toMatch(/clientes/)
    expect(plan).toMatch(/cuentas/)
    // La vista está siempre al día; una tabla copiada, no.
    await runSql(db, 'CREATE TABLE kpi_copia AS SELECT * FROM kpi_clientes')
    await runSql(db, 'UPDATE cuentas SET saldo = saldo + 1000 WHERE cliente_id = 1')
    const [vista] = await rows('SELECT saldo_total FROM kpi_clientes WHERE id = 1')
    const [copia] = await rows('SELECT saldo_total FROM kpi_copia WHERE id = 1')
    expect(Number(vista[0]) - Number(copia[0])).toBe(1000)
    // EXPLAIN ANALYZE ejecuta de verdad; dentro de una transacción se puede deshacer.
    await runSql(db, 'BEGIN; EXPLAIN ANALYZE DELETE FROM pagos_tarjeta WHERE id IN (304, 305, 306); ROLLBACK;')
    expect(await rows('SELECT COUNT(*) FROM pagos_tarjeta')).toEqual([['306']])
    await runSql(db, 'EXPLAIN ANALYZE DELETE FROM pagos_tarjeta WHERE id IN (304, 305, 306)')
    expect(await rows('SELECT COUNT(*) FROM pagos_tarjeta')).toEqual([['303']])
    // Errores traducidos.
    expect((await runSql(db, SALDOS)).error!.message).toMatch(/Ya existe una tabla o vista/)
    expect((await runSql(db, 'DROP VIEW saldos_cliente')).error!.message).toMatch(/dependen/)
    await db.close()
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    const db = await fresh()
    // Una tabla en vez de una vista.
    expect(await passes(db, 'vista_saldos', 'CREATE TABLE saldos_cliente AS SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id')).toBe(false)
    await runSql(db, 'DROP TABLE saldos_cliente')
    // Sin alias: la columna se llama «sum».
    expect(await passes(db, 'vista_saldos', 'CREATE VIEW saldos_cliente AS SELECT cliente_id, SUM(saldo) FROM cuentas GROUP BY cliente_id')).toBe(false)
    await runSql(db, 'DROP VIEW saldos_cliente')
    await runSql(db, SALDOS)
    // kpi_clientes sin usar saldos_cliente (repite el cálculo) o con JOIN normal (pierde al cliente 38).
    expect(await passes(db, 'vista_kpi', 'CREATE VIEW kpi_clientes AS SELECT c.id, c.nombre, c.ciudad, COALESCE(SUM(a.saldo), 0) AS saldo_total FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.nombre, c.ciudad')).toBe(false)
    await runSql(db, 'DROP VIEW kpi_clientes')
    expect(await passes(db, 'vista_kpi', 'CREATE VIEW kpi_clientes AS SELECT c.id, c.nombre, c.ciudad, s.saldo_total FROM clientes c JOIN saldos_cliente s ON s.cliente_id = c.id')).toBe(false)
    await runSql(db, 'DROP VIEW kpi_clientes')
    await runSql(db, KPI)
    // Nuria: sin la vista no vale; EXPLAIN ANALYZE no es lo que se pide.
    expect(await passes(db, 'usar_vista', reto('usar_vista').solution!)).toBe(false)
    expect(await passes(db, 'explain_vista', 'EXPLAIN ANALYZE SELECT * FROM kpi_clientes WHERE id = 7')).toBe(false)
    expect(await passes(db, 'explain_vista', 'EXPLAIN SELECT * FROM clientes WHERE id = 7')).toBe(false)
    // UNION en vez de UNION ALL: los pagos 301-303 cumplen dos motivos y siguen siendo filas distintas, así que también vale.
    expect(await passes(db, 'vista_revisar', REVISAR.replace(/UNION ALL/g, 'UNION'))).toBe(true)
    await db.close()
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_vista_tabla', 'table')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_explain_analyze', 'bug')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'copy')
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
