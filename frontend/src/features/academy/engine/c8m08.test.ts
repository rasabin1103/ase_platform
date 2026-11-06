// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m08Reglas as mission } from '../content/courses/sql-qa/m08-reglas'
import { runSql } from '../sql/engine'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const INS = 'INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES'
const SQL = {
  importes: `SELECT 999.99 AS importe, probar('${INS} (2, 999.99, 24, ''abierta'')') AS resultado UNION ALL SELECT 1000, probar('${INS} (2, 1000, 24, ''abierta'')') UNION ALL SELECT 60000, probar('${INS} (2, 60000, 24, ''abierta'')') UNION ALL SELECT 60000.01, probar('${INS} (2, 60000.01, 24, ''abierta'')');`,
  plazos: `SELECT v.plazo, probar(format('${INS} (2, 5000, %L, %L)', v.plazo, 'abierta')) AS resultado FROM (VALUES (18), (24), (NULL)) AS v(plazo);`,
  clientes: `SELECT v.cliente_id, probar(format('${INS} (%L, 5000, 24, ''abierta'')', v.cliente_id)) AS resultado FROM (VALUES (999), (NULL), (3)) AS v(cliente_id);`,
  abiertas: `SELECT v.cliente_id, v.estado, probar(format('${INS} (%s, 5000, 24, %L)', v.cliente_id, v.estado)) AS resultado FROM (VALUES (1, 'abierta'), (1, 'cancelada'), (2, 'abierta')) AS v(cliente_id, estado);`,
  revision: `SELECT efecto(ARRAY['${INS} (6, 5000, 24, ''abierta'')'], 'SELECT (revisada_en IS NOT NULL)::text FROM solicitudes WHERE cliente_id = 6') AS al_insertar, efecto(ARRAY['UPDATE solicitudes SET importe = 6000 WHERE id = 1'], 'SELECT (revisada_en <> ''2026-02-21 10:00'')::text FROM solicitudes WHERE id = 1') AS al_actualizar;`,
  estados: `SELECT v.estado, probar(format('${INS} (2, 5000, 24, %L)', v.estado)) AS resultado FROM (VALUES ('abierta'), ('en_estudio'), ('APROBADA'), (NULL)) AS v(estado);`,
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_reglas')
  s = await k.query(db, s, SQL.importes)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.plazos)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.clientes)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_feliz', 'dos_lados')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.abiertas)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.revision)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.estados)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_restos', 'deshacer')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 8 · Probar las reglas de la base de datos', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    expect((await sol('importes')).map((r) => r[1])).toEqual(['23514', '23514', '23514', '23514'])
    expect(await sol('plazos')).toEqual([['18', '23514'], ['24', 'ok'], [null, 'ok']])
    expect(await sol('clientes')).toEqual([['999', '23503'], [null, 'ok'], ['3', 'ok']])
    expect((await sol('abiertas')).map((r) => r[2])).toEqual(['ok', 'ok', 'ok'])
    expect(await sol('revision')).toEqual([['true', 'false']])
    expect(await sol('estados')).toEqual([['abierta', 'ok'], ['en_estudio', '23514'], ['APROBADA', '23514'], [null, '23502']])
    expect(await k.rows(db, 'SELECT COUNT(*) FROM solicitudes')).toEqual([['5']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Escribir los resultados a mano, sin probar nada.
    expect(await k.passes(db, 'plazos', "SELECT 18 AS plazo, '23514' AS resultado UNION ALL SELECT 24, 'ok' UNION ALL SELECT NULL, 'ok'")).toBe(false)
    // Solo el camino feliz.
    expect(await k.passes(db, 'importes', `SELECT 5000 AS importe, probar('${INS} (2, 5000, 24, ''abierta'')') AS resultado`)).toBe(false)
  })

  it('una prueba que deja datos no cumple el encargo', async () => {
    const fresh = await k.open()
    await runSql(fresh, `${INS} (2, 5000, 24, 'abierta')`)
    expect(await k.passes(fresh, 'importes', SQL.importes)).toBe(false)
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_feliz', 'suficiente')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_restos', 'truncate')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'confiar'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
