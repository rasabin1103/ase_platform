// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m03Conjuntos as mission } from '../content/courses/sql-intermedio/m03-conjuntos'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_conjuntos' })
  s = await query(s, reto('cuentas_movidas').solution!)
  s = waitUntil(s, 30)
  s = await query(s, reto('movimientos_enero').solution!)
  s = waitUntil(s, 75)
  s = await query(s, reto('rechazo_e_incidencia').solution!)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_union_all', 'union_all')
  s = waitUntil(s, 150)
  s = await query(s, reto('sin_pagos').solution!)
  s = waitUntil(s, 210)
  s = await query(s, reto('destinos_inexistentes').solution!)
  s = waitUntil(s, 270)
  s = await query(s, reto('comercios_dos_anios').solution!)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_columnas', 'columns')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 3 · juntar resultados', () => {
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
    expect(await count('cuentas_movidas')).toBe(53)
    expect(await count('movimientos_enero')).toBe(37)
    expect(await rows(`${reto('rechazo_e_incidencia').solution} ORDER BY 1`)).toEqual([['28'], ['36']])
    expect(await count('sin_pagos')).toBe(8)
    expect(await rows(reto('destinos_inexistentes').solution!)).toEqual([['999']])
    expect(await count('comercios_dos_anios')).toBe(20)
    // La reunión de UNION frente a UNION ALL.
    const enero = (op: string) => `SELECT COUNT(*), SUM(importe) FROM (SELECT importe FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en >= '2026-01-01' AND pagado_en < '2026-02-01' ${op} SELECT importe FROM transferencias WHERE estado = 'completada' AND creada_en >= '2026-01-01' AND creada_en < '2026-02-01') m`
    expect(await rows(enero('UNION'))).toEqual([['36', '24098.08']])
    expect(await rows(enero('UNION ALL'))).toEqual([['37', '24115.63']])
    // Columnas cambiadas de orden: no hay error, y salen 426 filas.
    expect((await rows('SELECT id, importe FROM transferencias UNION SELECT importe, id FROM pagos_tarjeta')).length).toBe(426)
    expect((await runSql(db, 'SELECT id, importe FROM transferencias UNION SELECT id FROM pagos_tarjeta')).error!.message).toMatch(/mismo número de columnas/)
    expect((await runSql(db, 'SELECT id, concepto FROM transferencias UNION SELECT id, importe FROM pagos_tarjeta')).error!.message).toMatch(/por posición/)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Sin el operador pedido no vale, aunque el resultado sea el mismo.
    expect(await passes('destinos_inexistentes', 'SELECT DISTINCT cuenta_destino_id FROM transferencias t WHERE cuenta_destino_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cuentas a WHERE a.id = t.cuenta_destino_id)')).toBe(false)
    // Solo los orígenes.
    expect(await passes('cuentas_movidas', 'SELECT cuenta_origen_id AS cuenta_id FROM transferencias UNION SELECT cuenta_origen_id FROM transferencias')).toBe(false)
    // EXCEPT al revés.
    expect(await passes('destinos_inexistentes', 'SELECT id FROM cuentas EXCEPT SELECT cuenta_destino_id FROM transferencias')).toBe(false)
    // UNION en vez de INTERSECT.
    expect(await passes('comercios_dos_anios', "SELECT comercio_id FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en < '2026-01-01' UNION SELECT comercio_id FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en >= '2026-01-01'")).toBe(false)
    // UNION en vez de UNION ALL también da las 37 filas (cada una lleva su id): vale.
    expect(await passes('movimientos_enero', reto('movimientos_enero').solution!.replace('UNION ALL', 'UNION'))).toBe(true)
    // Todos los motivos de incidencia.
    expect(await passes('rechazo_e_incidencia', "SELECT a.cliente_id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN cuentas a ON a.id = t.cuenta_id WHERE p.estado = 'rechazado' INTERSECT SELECT cliente_id FROM incidencias")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_union_all', 'rounding')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_columnas', 'names')
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
