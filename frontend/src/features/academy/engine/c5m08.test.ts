// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m08Modificar as mission } from '../content/courses/sql-iniciacion/m08-modificar'
import { consoleState, restoreEvent, runEvent, visibleRetos } from '../apps/sql-console/sqlConsoleLogic'
import { checkReto } from '../sql/check'
import { openDb, pendingTransaction, runSql } from '../sql/engine'
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
const verdict = async (db: PGlite, id: string, sql: string) => checkReto(db, reto(id), await runSql(db, sql), sql)

const ENSAYO = "BEGIN; UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito'; SELECT id, limite_diario FROM tarjetas WHERE tipo = 'debito'; ROLLBACK;"
const ALTA_CLIENTE = "INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento) VALUES (41, 'Prueba', 'QA Kobalto', 'qa.prueba@kobalto.test', 'Madrid', '2026-01-15', 'estandar');"
const ALTA_CUENTA = "INSERT INTO cuentas (id, cliente_id, iban, tipo, saldo, abierta_en, estado) VALUES (53, 41, 'ES76 2100 9999 0000 0053', 'corriente', 100, '2026-01-15', 'activa');"
const BLOQUEAR = "UPDATE tarjetas SET estado = 'bloqueada' WHERE estado = 'activa' AND caduca_en < '2026-01-01';"

async function goodDay(seed: number) {
  const db = await fresh()
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_cambios' })
  s = await query(db, s, ENSAYO)
  s = waitUntil(s, 30)
  s = await query(db, s, ALTA_CLIENTE)
  s = await query(db, s, ALTA_CUENTA)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_sin_where', 'habits')
  s = waitUntil(s, 150)
  s = await query(db, s, "SELECT id, estado, caduca_en FROM tarjetas WHERE estado = 'activa' AND caduca_en < '2026-01-01';")
  // El ritual: BEGIN, cambio, comprobación… y la transacción abierta no cuenta todavía.
  s = await query(db, s, `BEGIN; ${BLOQUEAR}`)
  expect(s.flags['reto.bloquear_caducadas']).toBeFalsy()
  s = await query(db, s, 'COMMIT;')
  s = waitUntil(s, 210)
  s = await query(db, s, "UPDATE clientes SET segmento = 'estandar' WHERE segmento IS NULL;")
  s = waitUntil(s, 270)
  s = await query(db, s, 'DELETE FROM cuentas WHERE id = 53; DELETE FROM clientes WHERE id = 41;')
  s = waitUntil(s, 360)
  s = choose(s, 'ines_borrado', 'soft')
  s = waitUntil(s, 480)
  s = choose(s, 'closing', 'lesson')
  await db.close()
  return s
}

describe('curso 5 · misión 8 · cambiar datos con cuidado', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) {
      const s = await goodDay(seed)
      expect(s.finished).toBe(true)
      for (const r of mission.sqlLab!.retos) expect(s.flags[`reto.${r.id}`], r.id).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  }, 60_000)

  it('el entorno de pruebas sí admite cambios y avisa de las transacciones abiertas', async () => {
    const db = await fresh()
    expect(await pendingTransaction(db)).toBe(false)
    expect((await runSql(db, BLOQUEAR)).rowCount).toBe(2)
    expect(await pendingTransaction(db)).toBe(false)
    const open = await runSql(db, "BEGIN; UPDATE clientes SET ciudad = 'Madrid' WHERE id = 1;")
    expect([open.command, open.rowCount]).toEqual(['UPDATE', 1])
    expect(await pendingTransaction(db)).toBe(true)
    const v = await verdict(db, 'bloquear_caducadas', 'SELECT 1')
    expect(v.done).toBe(false)
    expect(v.reason).toMatch(/transacción abierta/)
    await runSql(db, 'ROLLBACK')
    expect(await pendingTransaction(db)).toBe(false)
    expect((await verdict(db, 'bloquear_caducadas', 'SELECT 1')).done).toBe(true)
    // Una transacción abortada solo admite ROLLBACK, con el error traducido.
    await runSql(db, 'BEGIN; SELECT 1/0;')
    const aborted = await runSql(db, 'SELECT 1')
    expect(aborted.error!.message).toMatch(/ROLLBACK/)
    await runSql(db, 'ROLLBACK')
    await db.close()
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    let db = await fresh()
    // UPDATE sin WHERE: bloquea las 32 tarjetas.
    expect((await runSql(db, "UPDATE tarjetas SET estado = 'bloqueada'")).rowCount).toBe(32)
    expect((await verdict(db, 'bloquear_caducadas', 'SELECT 1')).done).toBe(false)
    await db.close()

    db = await fresh()
    // El ensayo sin ROLLBACK cambia los límites.
    expect((await verdict(db, 'ensayo', "BEGIN; UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito'; COMMIT;")).done).toBe(false)
    await db.close()

    db = await fresh()
    expect((await verdict(db, 'ensayo', ENSAYO)).done).toBe(true)
    // La cuenta antes que el cliente: la clave foránea lo impide.
    const fk = await runSql(db, ALTA_CUENTA)
    expect(fk.ok).toBe(false)
    expect(fk.error!.message).toMatch(/clave foránea/)
    // = NULL no cambia nada.
    expect((await runSql(db, "UPDATE clientes SET segmento = 'estandar' WHERE segmento = NULL")).rowCount).toBe(0)
    expect((await verdict(db, 'segmento', 'SELECT 1')).done).toBe(false)
    // A todos: los premium dejan de serlo.
    await runSql(db, "UPDATE clientes SET segmento = 'estandar'")
    expect((await verdict(db, 'segmento', 'SELECT 1')).done).toBe(false)
    await db.close()

    db = await fresh()
    await runSql(db, ALTA_CLIENTE)
    await runSql(db, ALTA_CUENTA)
    // El cliente antes que la cuenta: la clave foránea lo impide.
    expect((await runSql(db, 'DELETE FROM clientes WHERE id = 41')).ok).toBe(false)
    // Borrar de más tampoco vale.
    await runSql(db, 'DELETE FROM cuentas WHERE id = 53; DELETE FROM clientes WHERE id = 41;')
    expect((await verdict(db, 'borrar_prueba', 'SELECT COUNT(*) FROM clientes')).done).toBe(false)
    expect((await verdict(db, 'borrar_prueba', 'DELETE FROM cuentas WHERE id = 53')).done).toBe(true)
    await db.close()
  }, 60_000)

  it('restaurar la base de datos cuesta minutos y conserva lo ya cumplido', async () => {
    const db = await fresh()
    let s = replay(mission, 1, [{ type: 'start' }])
    s = await query(db, s, ENSAYO)
    const before = s.clock
    s = step(mission, s, { type: 'app', event: restoreEvent(mission, s).event })
    expect(s.clock).toBe(before + mission.sqlLab!.restoreCost!)
    expect(s.flags['sql.restored']).toBe(true)
    expect(s.flags['reto.ensayo']).toBe(true)
    expect(consoleState(mission, s).last).toBeUndefined()
    await db.close()
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_sin_where', 'backup')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_borrado', 'cascade')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'restore')
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
