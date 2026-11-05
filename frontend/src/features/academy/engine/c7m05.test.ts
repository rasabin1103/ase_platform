// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m05Modificar as mission } from '../content/courses/sql-avanzado/m05-modificar'
import { runSql } from '../sql/engine'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)

const SQL = {
  limites: 'UPDATE tarjetas AS t SET limite_diario = a.nuevo_limite FROM ajustes_limite AS a WHERE t.id = a.tarjeta_id RETURNING t.id, t.limite_diario;',
  comercios: 'INSERT INTO comercios (id, nombre, categoria, ciudad) SELECT id, nombre, categoria, ciudad FROM comercios_import ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, categoria = EXCLUDED.categoria, ciudad = EXCLUDED.ciudad;',
  copias: 'DELETE FROM pagos_tarjeta p USING pagos_tarjeta o WHERE p.tarjeta_id = o.tarjeta_id AND p.comercio_id = o.comercio_id AND p.importe = o.importe AND p.pagado_en = o.pagado_en AND p.id > o.id;',
  archivar: "WITH m AS (DELETE FROM incidencias WHERE cerrada_en < '2026-01-01' RETURNING *) INSERT INTO incidencias_archivo SELECT * FROM m;",
  preferencias: "INSERT INTO preferencias (cliente_id, canales, intereses) SELECT id, '{email}', '{}' FROM clientes c WHERE NOT EXISTS (SELECT 1 FROM preferencias p WHERE p.cliente_id = c.id);",
}

async function goodDay(db: PGlite, seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_modificar')
  s = await k.query(db, s, SQL.limites)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.comercios)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.copias)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_repetidas', 'unique')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.archivar)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.preferencias)
  s = k.waitUntil(s, 270)
  // La transacción de Laura, sentencia a sentencia, como en la consola.
  for (const q of ['BEGIN;', "UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'ahorro';", 'SAVEPOINT antes;', "UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'corriente';", 'ROLLBACK TO SAVEPOINT antes;', 'COMMIT;']) {
    s = await k.query(db, s, q)
  }
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_excluded', 'excluded')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 5 · Modificar con cabeza', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(await k.open(), seed))
  }, 60_000)

  it('la solución de cada pista también cumple su encargo', async () => {
    const db = await k.open()
    for (const r of mission.sqlLab!.retos) {
      if (r.id === 'savepoint') continue
      const sql = r.hint!.replace(/^`|`$/g, '').replace(/…/g, '')
      if (!/\.\.\.|…/.test(r.hint!.slice(1, -1))) expect(await k.passes(db, r.id, sql), r.id).toBe(true)
    }
    expect(await k.passes(db, 'savepoint', "BEGIN; UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'ahorro'; SAVEPOINT a; UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'corriente'; ROLLBACK TO SAVEPOINT a; COMMIT;")).toBe(true)
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    const db = await k.open()
    // Sin RETURNING no se ve qué cambió.
    expect(await k.passes(db, 'ajustar_limites', 'UPDATE tarjetas t SET limite_diario = a.nuevo_limite FROM ajustes_limite a WHERE a.tarjeta_id = t.id')).toBe(false)
    // Solo insertar los nuevos deja los nombres mal.
    expect(await k.passes(db, 'sincronizar_comercios', 'INSERT INTO comercios SELECT * FROM comercios_import ON CONFLICT (id) DO NOTHING')).toBe(false)
    // EXCLUDED olvidado: «actualiza» con el valor viejo.
    expect(await k.passes(db, 'sincronizar_comercios', 'INSERT INTO comercios SELECT * FROM comercios_import ON CONFLICT (id) DO UPDATE SET nombre = comercios.nombre')).toBe(false)
    // p.id <> o.id borra también los originales.
    expect(await k.passes(db, 'quitar_copias', 'DELETE FROM pagos_tarjeta p USING pagos_tarjeta o WHERE p.tarjeta_id = o.tarjeta_id AND p.comercio_id = o.comercio_id AND p.importe = o.importe AND p.pagado_en = o.pagado_en AND p.id <> o.id')).toBe(false)
    expect(await k.rows(db, 'SELECT COUNT(*) FROM pagos_tarjeta')).toEqual([['300']])
    // Copiar sin borrar no es mover.
    expect(await k.passes(db, 'archivar', "INSERT INTO incidencias_archivo SELECT * FROM incidencias WHERE cerrada_en < '2026-01-01' RETURNING id")).toBe(false)
    // DO UPDATE pisa las preferencias de quien ya tenía.
    expect(await k.passes(db, 'preferencias_todos', "INSERT INTO preferencias (cliente_id, canales, intereses) SELECT id, '{email}', '{}' FROM clientes ON CONFLICT (cliente_id) DO UPDATE SET canales = EXCLUDED.canales")).toBe(false)
    // Sin volver al savepoint, las corrientes también cambian.
    expect(await k.passes(db, 'savepoint', "BEGIN; UPDATE cuentas SET saldo = saldo + 10; COMMIT;")).toBe(false)
  }, 60_000)

  it('una transacción abierta no cuenta hasta el COMMIT', async () => {
    const db = await k.open()
    await runSql(db, "BEGIN; UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'ahorro'; SAVEPOINT a;")
    const v = await k.passes(db, 'savepoint', 'ROLLBACK TO SAVEPOINT a; SAVEPOINT a;')
    expect(v).toBe(false)
    expect(await k.passes(db, 'savepoint', 'COMMIT;')).toBe(true)
  }, 60_000)

  it('las trampas de las reuniones pasan como cuenta la historia', async () => {
    const db = await k.open()
    await runSql(db, 'BEGIN')
    await runSql(db, 'CREATE TEMP TABLE otra_tanda AS SELECT * FROM ajustes_limite')
    await runSql(db, 'INSERT INTO otra_tanda VALUES (7, 2500.00)')
    // UPDATE … FROM no avisa de la clave repetida…
    expect((await runSql(db, 'UPDATE tarjetas t SET limite_diario = o.nuevo_limite FROM otra_tanda o WHERE o.tarjeta_id = t.id')).ok).toBe(true)
    // …y MERGE sí.
    await runSql(db, 'SAVEPOINT m')
    const merge = await runSql(db, 'MERGE INTO tarjetas t USING otra_tanda o ON o.tarjeta_id = t.id WHEN MATCHED THEN UPDATE SET limite_diario = o.nuevo_limite')
    expect(merge.ok).toBe(false)
    await runSql(db, 'ROLLBACK TO SAVEPOINT m')
    // SET nombre = comercios.nombre deja el nombre viejo.
    await runSql(db, 'INSERT INTO comercios SELECT * FROM comercios_import ON CONFLICT (id) DO UPDATE SET nombre = comercios.nombre, categoria = comercios.categoria, ciudad = comercios.ciudad')
    expect(await k.rows(db, 'SELECT nombre FROM comercios WHERE id = 5')).toEqual([[' Café Central']])
    await runSql(db, 'ROLLBACK')
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_repetidas', 'last')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_excluded', 'nothing')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'restore'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
