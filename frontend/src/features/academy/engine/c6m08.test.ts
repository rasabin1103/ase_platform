// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m08Calidad as mission } from '../content/courses/sql-intermedio/m08-calidad'
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
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_calidad' })
  s = await query(s, reto('duplicados').solution!)
  s = waitUntil(s, 30)
  s = await query(s, reto('tarjeta_bloqueada').solution!)
  s = waitUntil(s, 75)
  s = await query(s, reto('tarjeta_caducada').solution!)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_borrar', 'keep_one')
  s = waitUntil(s, 150)
  s = await query(s, "SELECT c.id, c.nombre, c.email FROM clientes c WHERE EXISTS (SELECT 1 FROM clientes o WHERE LOWER(o.email) = LOWER(c.email) AND o.id <> c.id);")
  s = waitUntil(s, 210)
  s = await query(s, "WITH r AS (SELECT comercio_id, id, importe, ROW_NUMBER() OVER (PARTITION BY comercio_id ORDER BY importe DESC) AS n FROM pagos_tarjeta) SELECT comercio_id, id, importe FROM r WHERE n = 1;")
  s = waitUntil(s, 270)
  s = await query(s, reto('panel_reglas').solution!)
  s = waitUntil(s, 360)
  s = choose(s, 'ines_distinct', 'source')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 6 · misión 8 · calidad de datos', () => {
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
    expect(await rows(`${reto('duplicados').solution} ORDER BY id`)).toEqual([['304'], ['305'], ['306']])
    expect(await rows(`${reto('tarjeta_bloqueada').solution} ORDER BY id`)).toEqual([['301', '12', expect.any(String)], ['302', '12', expect.any(String)], ['303', '12', expect.any(String)]])
    expect((await rows(reto('tarjeta_caducada').solution!)).length).toBe(24)
    expect(await rows("SELECT id, estado FROM tarjetas WHERE caduca_en < '2026-03-01' ORDER BY id")).toEqual([['12', 'bloqueada'], ['18', 'activa'], ['28', 'activa']])
    expect(await rows(`${reto('emails_repetidos').solution} ORDER BY id`)).toEqual([['12', 'Marta', 'marta.rubio12@correo.es'], ['27', 'Laura', 'marta.rubio12@correo.es']])
    const maximos = await rows(reto('maximo_comercio').solution!)
    expect(maximos).toHaveLength(22)
    // Ningún comercio empata en su máximo: el resultado no depende del orden de las filas.
    expect(await rows('SELECT COUNT(*) FROM (SELECT comercio_id FROM pagos_tarjeta p WHERE importe = (SELECT MAX(importe) FROM pagos_tarjeta q WHERE q.comercio_id = p.comercio_id) GROUP BY comercio_id HAVING COUNT(*) > 1) x')).toEqual([['0']])
    expect(maximos.filter((r) => Number(r[2]) > 3000).map((r) => r[0]).sort()).toEqual(['16', '21'])
    expect(await rows(reto('panel_reglas').solution!)).toEqual([['3', '3', '24', '1', '2']])
    // Las reuniones: el DELETE de Diego se llevaría 6 filas; el DISTINCT de Marta da 303.
    expect(await rows('SELECT COUNT(*) FROM pagos_tarjeta p JOIN (SELECT tarjeta_id, comercio_id, importe, pagado_en FROM pagos_tarjeta GROUP BY 1, 2, 3, 4 HAVING COUNT(*) > 1) d USING (tarjeta_id, comercio_id, importe, pagado_en)')).toEqual([['6']])
    expect(await rows('SELECT COUNT(*) FROM (SELECT DISTINCT tarjeta_id, comercio_id, importe, pagado_en FROM pagos_tarjeta) x')).toEqual([['303']])
    expect(await rows('SELECT COUNT(*) FROM (SELECT DISTINCT * FROM pagos_tarjeta) x')).toEqual([['306']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Todos los duplicados (también los originales).
    expect(await passes('duplicados', 'SELECT p.id FROM pagos_tarjeta p JOIN (SELECT tarjeta_id, comercio_id, importe, pagado_en FROM pagos_tarjeta GROUP BY 1, 2, 3, 4 HAVING COUNT(*) > 1) d USING (tarjeta_id, comercio_id, importe, pagado_en)')).toBe(false)
    // Todos los pagos de la tarjeta bloqueada, no solo los aceptados.
    expect(await passes('tarjeta_bloqueada', "SELECT p.id, p.tarjeta_id, p.importe FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE t.estado = 'bloqueada'")).toBe(false)
    // Solo las tarjetas «activas»: se escapan los de la bloqueada.
    expect(await passes('tarjeta_caducada', "SELECT p.id, p.tarjeta_id, p.pagado_en, t.caduca_en FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE p.estado = 'aceptado' AND t.estado = 'activa' AND p.pagado_en::date > t.caduca_en")).toBe(false)
    // DISTINCT ON sin ordenar por importe: un pago cualquiera.
    expect(await passes('maximo_comercio', 'SELECT DISTINCT ON (comercio_id) comercio_id, id, importe FROM pagos_tarjeta ORDER BY comercio_id, id')).toBe(false)
    // Duplicados contados como grupos (3 grupos) o como filas (6): las copias son 3.
    expect(await passes('panel_reglas', "SELECT 6 AS duplicados, 3 AS tarjeta_bloqueada, 24 AS tarjeta_caducada, 1 AS sin_categoria, 2 AS nombres_con_espacios")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_borrar', 'approve')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_distinct', 'everywhere')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'hide')
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
