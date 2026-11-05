// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m06Reglas as mission } from '../content/courses/sql-avanzado/m06-reglas'
import { runSql } from '../sql/engine'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)

const SQL = {
  plazoFalla: 'ALTER TABLE prestamos ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60));',
  plazoDato: 'UPDATE prestamos SET plazo_meses = 24 WHERE id = 23;',
  repetidas: 'SELECT prestamo_id, numero, array_agg(id ORDER BY id) FROM cuotas GROUP BY prestamo_id, numero HAVING COUNT(*) > 1;',
  cuota: 'DELETE FROM cuotas WHERE id = 900; ALTER TABLE cuotas ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero);',
  activa: "CREATE UNIQUE INDEX ON tarjetas (cuenta_id) WHERE estado = 'activa';",
  cierre: 'ALTER TABLE incidencias ADD CONSTRAINT cierre_posterior CHECK (cerrada_en >= abierta_en);',
  cascade: 'ALTER TABLE cuotas DROP CONSTRAINT cuotas_prestamo_id_fkey, ADD FOREIGN KEY (prestamo_id) REFERENCES prestamos (id) ON DELETE CASCADE;',
  total: 'ALTER TABLE prestamos ADD COLUMN total_a_devolver numeric(12,2) GENERATED ALWAYS AS (round(importe * (1 + tipo_interes / 100.0), 2)) STORED;',
}

async function goodDay(db: PGlite, seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_reglas')
  expect((await runSql(db, SQL.plazoFalla)).ok).toBe(false)
  s = await k.query(db, s, SQL.plazoDato)
  s = await k.query(db, s, SQL.plazoFalla)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.repetidas)
  s = await k.query(db, s, SQL.cuota)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.activa)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_not_valid', 'fix')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.cierre)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.cascade)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.total)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_cascade', 'care')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 6 · Reglas en la base de datos', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(await k.open(), seed))
  }, 60_000)

  it('los datos y las reglas son los que cuenta la historia', async () => {
    const db = await k.open()
    expect(await k.rows(db, 'SELECT id, plazo_meses FROM prestamos WHERE plazo_meses NOT IN (12, 24, 36, 48, 60)')).toEqual([['23', '18']])
    expect(await k.rows(db, SQL.repetidas)).toEqual([['2', '3', '{9,900}']])
    expect(await k.rows(db, 'SELECT COUNT(*) FROM incidencias WHERE cerrada_en < abierta_en')).toEqual([['0']])
    expect(await k.rows(db, "SELECT COUNT(*), COUNT(DISTINCT cuenta_id) FROM tarjetas WHERE estado = 'activa'")).toEqual([['31', '31']])
    // Sin la regla, todas las sondas dejan pasar los datos malos.
    expect(await k.rows(db, "SELECT qa.probar('DELETE FROM prestamos WHERE id = 1')")).toEqual([['23503']])
    expect(await k.rows(db, "SELECT qa.probar('INSERT INTO tarjetas VALUES (99, 1, ''debito'', 600, ''activa'', ''2028-01-31'')')")).toEqual([['ok']])
    // Las sondas no cambian nada.
    expect(await k.rows(db, 'SELECT COUNT(*) FROM tarjetas')).toEqual([['32']])
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    const db = await k.open()
    // NOT VALID deja dentro el préstamo de 18 meses.
    expect(await k.passes(db, 'plazo_valido', 'ALTER TABLE prestamos ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60)) NOT VALID')).toBe(false)
    await runSql(db, 'ALTER TABLE prestamos DROP CONSTRAINT plazo_valido')
    // Borrar el préstamo en vez de corregirlo.
    await runSql(db, 'BEGIN')
    expect((await runSql(db, 'DELETE FROM cuotas WHERE prestamo_id = 23; DELETE FROM prestamos WHERE id = 23;')).ok).toBe(true)
    expect((await runSql(db, SQL.plazoFalla)).ok).toBe(true)
    await runSql(db, 'COMMIT')
    expect(await k.passes(db, 'plazo_valido', "SELECT 'check'")).toBe(false)
    // Borrar la original en vez de la copia.
    expect(await k.passes(db, 'cuota_unica', 'DELETE FROM cuotas WHERE id = 9; ALTER TABLE cuotas ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero)')).toBe(false)
    // UNIQUE (cuenta_id) a secas impide también las bloqueadas.
    expect(await k.passes(db, 'una_activa', 'ALTER TABLE tarjetas ADD CONSTRAINT una_por_cuenta UNIQUE (cuenta_id)')).toBe(false)
    // Quitar la clave foránea también deja borrar el préstamo… y entrar cuotas huérfanas.
    expect(await k.passes(db, 'cuotas_cascade', "ALTER TABLE cuotas DROP CONSTRAINT cuotas_prestamo_id_fkey; SELECT 'on delete cascade'")).toBe(false)
    // Una columna normal, calculada una vez, no se mantiene sola.
    expect(await k.passes(db, 'total_generado', "ALTER TABLE prestamos ADD COLUMN total_a_devolver numeric(12,2); UPDATE prestamos SET total_a_devolver = ROUND(importe * (1 + tipo_interes / 100), 2); SELECT 'generated always'")).toBe(false)
  }, 60_000)

  it('los errores de las reglas se explican en la consola', async () => {
    const db = await k.open()
    expect((await runSql(db, SQL.plazoFalla)).error!.message).toMatch(/incumplen/)
    expect((await runSql(db, 'ALTER TABLE cuotas ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero)')).error!.message).toMatch(/repetidos/)
    expect((await runSql(db, 'DELETE FROM prestamos WHERE id = 1')).ok).toBe(false)
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_not_valid', 'fine')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_cascade', 'yes')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'app'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
