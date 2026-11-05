// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m09Rendimiento as mission } from '../content/courses/sql-avanzado/m09-rendimiento'
import { runSql } from '../sql/engine'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)

const SQL = {
  keyset: 'SELECT id, fecha, importe, concepto FROM movimientos WHERE cuenta_id = 5 AND id > 30000 ORDER BY id LIMIT 20;',
  pendientes: "SELECT id, cliente_id FROM cuentas c WHERE EXISTS (SELECT FROM movimientos WHERE cuenta_id = c.id AND estado = 'pendiente');",
  resumen: "CREATE MATERIALIZED VIEW resumen_mensual AS SELECT date_trunc('month', fecha)::date AS mes, count(*) AS movimientos, sum(importe) AS total FROM movimientos GROUP BY date_trunc('month', fecha);",
  sinTransferencias: 'SELECT id, cliente_id FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL);',
  marzo: 'INSERT INTO movimientos SELECT * FROM movimientos_nuevos; REFRESH MATERIALIZED VIEW resumen_mensual;',
  ultimo: 'SELECT cuenta_id, id, fecha, importe FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY cuenta_id ORDER BY id DESC) AS n FROM movimientos) x WHERE n = 1;',
}

async function goodDay(db: PGlite, seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_rendimiento')
  s = await k.query(db, s, SQL.keyset)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.pendientes)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.resumen)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_offset', 'keyset')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.sinTransferencias)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.marzo)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.ultimo)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_notin', 'null')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 9 · Rendimiento', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(await k.open(), seed))
  }, 60_000)

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const db = await k.open()
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    const pagina = await sol('keyset')
    expect(pagina.length).toBe(20)
    expect(pagina[0][0]).toBe('30032')
    expect((await sol('con_pendientes')).length).toBe(13)
    expect((await sol('sin_transferencias')).map((r) => r[0])).toEqual(['21', '32', '47'])
    expect(await k.rows(db, 'SELECT COUNT(*) FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias)')).toEqual([['0']])
    expect((await sol('ultimo_movimiento')).length).toBe(52)
    expect(await k.rows(db, `SELECT COUNT(*) FROM (${k.reto('resumen_mensual').hint!.slice(1, -2).replace(/^CREATE MATERIALIZED VIEW resumen_mensual AS /, '')}) x`)).toEqual([['14']])
    const offset = await runSql(db, 'EXPLAIN ANALYZE SELECT id FROM movimientos ORDER BY id LIMIT 20 OFFSET 50000')
    expect(offset.rows.map((r) => r[0]).join('\n')).toMatch(/rows=50020/)
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    const db = await k.open()
    expect(await k.passes(db, 'keyset', 'SELECT id, fecha, importe, concepto FROM movimientos WHERE cuenta_id = 5 ORDER BY id LIMIT 20 OFFSET 580')).toBe(false)
    // Un JOIN repite la cuenta por cada pendiente.
    expect(await k.passes(db, 'con_pendientes', "SELECT a.id, a.cliente_id FROM cuentas a JOIN movimientos m ON m.cuenta_id = a.id WHERE m.estado = 'pendiente' AND EXISTS (SELECT 1)")).toBe(false)
    // NOT IN con el NULL dentro no devuelve nada.
    expect(await k.passes(db, 'sin_transferencias', 'SELECT id, cliente_id FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias)')).toBe(false)
    // Una vista normal no es materializada.
    expect(await k.passes(db, 'resumen_mensual', "CREATE VIEW resumen_mensual AS SELECT date_trunc('month', fecha)::date AS mes, count(*) AS movimientos, sum(importe) AS total FROM movimientos GROUP BY 1; SELECT 'create materialized view'")).toBe(false)
    await runSql(db, 'DROP VIEW resumen_mensual')
    await runSql(db, "CREATE MATERIALIZED VIEW resumen_mensual AS SELECT date_trunc('month', fecha)::date AS mes, count(*) AS movimientos, sum(importe) AS total FROM movimientos GROUP BY 1")
    // Cargar sin refrescar: marzo no sale.
    expect(await k.passes(db, 'refresh', "INSERT INTO movimientos SELECT * FROM movimientos_nuevos; SELECT 'refresh materialized view'")).toBe(false)
    // Agrupar por cuenta con MAX(id) y MAX(fecha) mezcla filas distintas.
    expect(await k.passes(db, 'ultimo_movimiento', 'SELECT cuenta_id, MAX(id) AS id, MAX(fecha) AS fecha, MAX(importe) AS importe FROM movimientos GROUP BY cuenta_id')).toBe(false)
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_offset', 'index')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_notin', 'distinct')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'hardware'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
