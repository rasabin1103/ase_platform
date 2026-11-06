// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m00LoQueHizo as mission } from '../content/courses/sql-qa/m00-lo-que-hizo'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  transferencias: "SELECT t.id, t.concepto, t.importe, t.estado FROM transferencias t JOIN ejecuciones e ON e.referencia = t.concepto WHERE e.ejecucion = 'R-0306';",
  importes: "SELECT e.referencia, e.importe AS importe_app, t.importe AS importe_bd FROM ejecuciones e, transferencias t WHERE t.concepto = e.referencia AND e.ejecucion = 'R-0306' AND e.importe IS DISTINCT FROM t.importe;",
  apuntes: "SELECT t.id AS transferencia_id, (SELECT COUNT(*) FROM apuntes a WHERE a.transferencia_id = t.id) AS apuntes, (SELECT COALESCE(SUM(importe), 0) FROM apuntes a WHERE a.transferencia_id = t.id) AS suma FROM transferencias t WHERE t.concepto LIKE 'REF-10%' AND ((SELECT COUNT(*) FROM apuntes a WHERE a.transferencia_id = t.id) <> 2 OR (SELECT COALESCE(SUM(importe), 0) FROM apuntes a WHERE a.transferencia_id = t.id) <> 0);",
  error: "SELECT e.referencia, t.id, t.estado FROM transferencias t JOIN ejecuciones e ON e.referencia = t.concepto WHERE e.ejecucion = 'R-0306' AND e.resultado_ui <> 'ok';",
  auditoria: "SELECT t.id FROM transferencias t JOIN ejecuciones e ON e.referencia = t.concepto LEFT JOIN auditoria au ON au.tabla = 'transferencias' AND au.registro_id = t.id WHERE e.ejecucion = 'R-0306' AND au.id IS NULL;",
  saldos: "SELECT c.id AS cuenta_id, c.saldo - s.saldo AS cambio_saldo, SUM(a.importe) AS suma_apuntes FROM apuntes a JOIN cuentas c ON c.id = a.cuenta_id JOIN saldos_antes s ON s.cuenta_id = c.id WHERE a.creado_en >= s.tomado_en GROUP BY c.id, c.saldo, s.saldo HAVING c.saldo - s.saldo <> SUM(a.importe);",
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_verificar')
  s = await k.query(db, s, SQL.transferencias)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.importes)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.apuntes)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_existe', 'valores')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.error)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.auditoria)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.saldos)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_mezcla', 'aislar')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 0 · Lo que hizo la app', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    expect((await sol('transferencias_prueba')).map((r) => r[0])).toEqual(['1001', '1002', '1003', '1004', '1006', '1007'])
    expect(await sol('importes_distintos')).toEqual([['REF-1007', '30.00', '300.00']])
    expect(await sol('partida_doble')).toEqual([['1003', '1', '-75.50']])
    expect(await sol('error_pero_hecha')).toEqual([['REF-1004', '1004', 'completada']])
    expect(await sol('sin_auditoria')).toEqual([['1006']])
    expect(await sol('saldos_descuadrados')).toEqual([['9', '560.00', '310.00']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Sin filtrar por la ejecución, entran las de R-0305.
    expect(await k.passes(db, 'transferencias_prueba', "SELECT id, concepto, importe, estado FROM transferencias WHERE concepto LIKE 'REF-%'")).toBe(false)
    // Todos los apuntes de la cuenta, también los de R-0305.
    expect(await k.passes(db, 'saldos_descuadrados', 'SELECT a.cuenta_id, MAX(c.saldo - s.saldo) AS cambio_saldo, SUM(a.importe) AS suma_apuntes FROM apuntes a JOIN cuentas c ON c.id = a.cuenta_id JOIN saldos_antes s ON s.cuenta_id = c.id GROUP BY a.cuenta_id HAVING MAX(c.saldo - s.saldo) <> SUM(a.importe)')).toBe(false)
    // Las operaciones con error que no dejaron nada no cuentan.
    expect(await k.passes(db, 'error_pero_hecha', "SELECT e.referencia, t.id, t.estado FROM ejecuciones e LEFT JOIN transferencias t ON t.concepto = e.referencia WHERE e.ejecucion = 'R-0306' AND e.resultado_ui = 'error'")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_existe', 'ok')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_mezcla', 'ruben')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'ui'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
