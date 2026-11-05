// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m08Indices as mission } from '../content/courses/sql-avanzado/m08-indices'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)

const SQL = {
  cuenta: 'CREATE INDEX ON movimientos (cuenta_id);',
  compuesto: 'CREATE INDEX mov_cuenta_fecha ON movimientos (cuenta_id, fecha);',
  parcial: "CREATE INDEX mov_pendientes ON movimientos (fecha) WHERE estado = 'pendiente';",
  expresion: 'CREATE INDEX mov_concepto_lower ON movimientos (lower(concepto));',
  febrero: "SELECT COUNT(*) AS movimientos FROM movimientos WHERE fecha BETWEEN '2026-02-01' AND '2026-02-28';",
  duplicado: 'DROP INDEX idx_mov_fecha;',
}

async function goodDay(db: PGlite, seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_indices')
  s = await k.query(db, s, 'EXPLAIN ANALYZE SELECT * FROM movimientos WHERE cuenta_id = 5;')
  s = await k.query(db, s, SQL.cuenta)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.compuesto)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.parcial)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_like', 'prefix')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.expresion)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.febrero)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.duplicado)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_sobre', 'real')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

const plan = (db: PGlite, sql: string) => k.rows(db, `SELECT qa.plan('${sql.replace(/'/g, "''")}')`).then((r) => String(r[0][0]))

describe('curso 7 · misión 8 · Índices y planes', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(await k.open(), seed))
  }, 60_000)

  it('sin índices, cada consulta del día lee la tabla entera (y la de Diego, aunque haya índice)', async () => {
    const db = await k.open()
    expect(await plan(db, 'SELECT * FROM movimientos WHERE cuenta_id = 5')).toMatch(/^Seq Scan/)
    expect(await plan(db, "SELECT * FROM movimientos WHERE LOWER(concepto) = 'recibo agua'")).toMatch(/^Seq Scan/)
    expect(await plan(db, "SELECT * FROM movimientos WHERE estado = 'pendiente'")).toMatch(/^Seq Scan/)
    expect(await plan(db, 'SELECT COUNT(*) FROM movimientos WHERE EXTRACT(YEAR FROM fecha) = 2026 AND EXTRACT(MONTH FROM fecha) = 2')).toMatch(/Seq Scan/)
    expect(await k.rows(db, k.reto('fecha_sargable').solution!)).toEqual([['3961']])
    expect(await k.rows(db, "SELECT COUNT(*) FROM movimientos WHERE estado = 'pendiente'")).toEqual([['300']])
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    const db = await k.open()
    // Un índice sobre fecha no sirve para filtrar por cuenta.
    expect(await k.passes(db, 'indice_cuenta', 'CREATE INDEX ON movimientos (fecha, cuenta_id)')).toBe(false)
    // Al revés: la fecha primero no resuelve la cuenta en el índice.
    expect(await k.passes(db, 'indice_compuesto', 'CREATE INDEX ON movimientos (fecha, cuenta_id, importe)')).toBe(false)
    // Un índice completo sobre estado no es parcial.
    expect(await k.passes(db, 'indice_parcial', 'CREATE INDEX ON movimientos (estado)')).toBe(false)
    // Un índice sobre concepto no sirve para LOWER(concepto).
    expect(await k.passes(db, 'indice_expresion', 'CREATE INDEX ON movimientos (concepto)')).toBe(false)
    // date_trunc sigue aplicando una función a la columna.
    expect(await k.passes(db, 'fecha_sargable', "SELECT COUNT(*) AS movimientos FROM movimientos WHERE date_trunc('month', fecha) = '2026-02-01'")).toBe(false)
    // Un día de menos: el 1 de febrero se queda fuera.
    expect(await k.passes(db, 'fecha_sargable', "SELECT COUNT(*) AS movimientos FROM movimientos WHERE fecha > '2026-02-01' AND fecha < '2026-03-01'")).toBe(false)
    // Quitar los dos índices de fecha deja el informe de Diego sin índice.
    expect(await k.passes(db, 'indice_duplicado', 'DROP INDEX idx_mov_fecha; DROP INDEX movimientos_fecha_idx;')).toBe(false)
  }, 60_000)

  it('un LIKE con % al principio no usa el índice; por el principio, con text_pattern_ops, sí', async () => {
    const db = await k.open()
    await k.rows(db, 'CREATE INDEX mov_concepto ON movimientos (concepto text_pattern_ops)')
    expect(await plan(db, "SELECT * FROM movimientos WHERE concepto LIKE '%agua%'")).toMatch(/^Seq Scan/)
    expect(await plan(db, "SELECT * FROM movimientos WHERE concepto LIKE 'Recibo%'")).toMatch(/Index/)
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_like', 'analyze')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_sobre', 'yes')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'more'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
