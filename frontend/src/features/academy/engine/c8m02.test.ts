// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m02DatosPrueba as mission } from '../content/courses/sql-qa/m02-datos-prueba'
import { runSql } from '../sql/engine'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)

const SQL = {
  clientes: "INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento) SELECT n, 'Prueba', 'QA ' || n, 'qa' || (n - 9000) || '@kobalto.test', 'Madrid', DATE '2026-03-01', 'estandar' FROM generate_series(9001, 9100) AS n;",
  cuentas: "INSERT INTO cuentas (id, cliente_id, iban, tipo, saldo, abierta_en, estado) SELECT c.id, c.id, 'ES00 QA ' || c.id, CASE c.id % 2 WHEN 1 THEN 'corriente' ELSE 'ahorro' END, 1000.00, '2026-03-01', 'activa' FROM clientes c WHERE c.id > 9000;",
  frontera: "INSERT INTO transferencias (id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en) VALUES (9001, 9001, 9002, 2999.99, 'QA', 'pendiente', '2026-03-02 10:00'), (9002, 9001, 9002, 3000, 'QA', 'pendiente', '2026-03-02 10:00'), (9003, 9001, 9002, 3000.01, 'QA', 'pendiente', '2026-03-02 10:00');",
  incidencias: "INSERT INTO incidencias (id, cliente_id, canal, motivo, abierta_en) SELECT 9000 + i, 9000 + i, CASE i % 3 WHEN 0 THEN 'chat' WHEN 1 THEN 'telefono' ELSE 'email' END, 'Prueba', DATE '2026-02-01' + (i - 1) * INTERVAL '20 hours' FROM generate_series(1, 30) AS i;",
  limpieza: 'DELETE FROM transferencias WHERE id >= 9000; DELETE FROM incidencias WHERE id >= 9000; DELETE FROM cuentas WHERE id >= 9000; DELETE FROM clientes WHERE id >= 9000;',
  anonimos: "CREATE TABLE clientes_anonimos AS SELECT id, concat('Cliente ', id) AS nombre, concat('cliente', id, '@ejemplo.test') AS email, ciudad, segmento FROM clientes WHERE id < 9000;",
}

async function goodDay(db: PGlite, seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_datos')
  s = await k.query(db, s, SQL.clientes)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.cuentas)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.frontera)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_ids', 'identificables')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.incidencias)
  s = k.waitUntil(s, 210)
  expect((await runSql(db, 'DELETE FROM clientes WHERE id >= 9000')).ok).toBe(false)
  s = await k.query(db, s, SQL.limpieza)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.anonimos)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_dependencias', 'independencia')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 2 · Datos de prueba', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(await k.open(), seed))
  }, 60_000)

  it('las pistas de cada encargo también lo cumplen', async () => {
    const db = await k.open()
    await runSql(db, SQL.clientes)
    for (const id of ['cuentas_prueba', 'anonimos']) expect(await k.passes(db, id, k.reto(id).hint!.slice(1, -1)), id).toBe(true)
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    const db = await k.open()
    // Emails reales y en otro rango de ids.
    expect(await k.passes(db, 'clientes_prueba', "INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento) SELECT 9000 + n, 'Ana', 'López', 'ana' || n || '@gmail.com', 'Madrid', '2026-03-01', 'estandar' FROM generate_series(1, 100) AS n")).toBe(false)
    await runSql(db, 'DELETE FROM clientes WHERE id >= 9000')
    await runSql(db, "INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento) SELECT 9000 + n, 'Prueba', 'QA', 'qa' || n || '@kobalto.test', 'Madrid', '2026-03-01', 'estandar' FROM generate_series(1, 100) AS n")
    // Todas corrientes.
    expect(await k.passes(db, 'cuentas_prueba', "INSERT INTO cuentas (id, cliente_id, iban, tipo, saldo, abierta_en, estado) SELECT id, id, 'ES00 QA ' || id, 'corriente', 1000, '2026-03-01', 'activa' FROM clientes WHERE id > 9000")).toBe(false)
    // Sin el valor exacto de la frontera.
    expect(await k.passes(db, 'valores_frontera', "INSERT INTO transferencias (id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en) VALUES (9001, 9001, 9002, 100, 'QA', 'pendiente', '2026-03-02 10:00'), (9003, 9001, 9002, 10000, 'QA', 'pendiente', '2026-03-02 10:00')")).toBe(false)
    // Borrar también lo real.
    await runSql(db, 'BEGIN')
    expect(await runSql(db, 'DELETE FROM transferencias WHERE cuenta_origen_id IN (3, 5)').then((r) => r.ok)).toBe(true)
    await runSql(db, 'ROLLBACK')
    // La copia con los emails reales.
    expect(await k.passes(db, 'anonimos', "CREATE TABLE clientes_anonimos AS SELECT id, 'Cliente ' || id AS nombre, email, ciudad, segmento FROM clientes WHERE id < 9000")).toBe(false)
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_ids', 'real')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_dependencias', 'orden')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'prod'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
