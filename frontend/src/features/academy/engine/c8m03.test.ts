// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m03CeroFilas as mission } from '../content/courses/sql-qa/m03-cero-filas'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  huerfanos: 'SELECT t.id, t.cuenta_destino_id FROM transferencias t LEFT JOIN cuentas c ON c.id = t.cuenta_destino_id WHERE c.id IS NULL AND t.cuenta_destino_id IS NOT NULL;',
  duplicados: 'SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id) AS n FROM pagos_tarjeta) x WHERE n > 1;',
  bloqueada: "SELECT id, tarjeta_id FROM pagos_tarjeta WHERE estado = 'aceptado' AND tarjeta_id IN (SELECT id FROM tarjetas WHERE estado = 'bloqueada');",
  fechas: 'SELECT id, abierta_en, cerrada_en FROM incidencias WHERE abierta_en > cerrada_en;',
  ahorro: "SELECT id, saldo FROM cuentas WHERE saldo < 0 AND tipo = 'ahorro';",
  cuotas: "SELECT p.id, p.cliente_id FROM prestamos p LEFT JOIN cuotas c ON c.prestamo_id = p.id WHERE p.estado = 'aprobado' AND c.id IS NULL;",
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_aserciones')
  s = await k.query(db, s, SQL.huerfanos)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.duplicados)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.bloqueada)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_ruido', 'ruido')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.fechas)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.ahorro)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.cuotas)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_count', 'filas')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 3 · Consultas que deben dar cero', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    expect((await sol('destinos_inexistentes')).sort()).toEqual([['2001', '99'], ['2002', '77'], ['77', '999']])
    expect(await k.rows(db, 'SELECT COUNT(*) FROM transferencias t LEFT JOIN cuentas c ON c.id = t.cuenta_destino_id WHERE c.id IS NULL')).toEqual([['27']])
    expect(await sol('pagos_duplicados')).toEqual([['304'], ['305'], ['306']])
    expect(await sol('aceptados_bloqueada')).toEqual([['301', '12'], ['302', '12'], ['303', '12']])
    expect((await sol('cierre_antes')).map((r) => r[0])).toEqual(['5'])
    expect(await sol('ahorro_negativo')).toEqual([['28', '-12.40']])
    expect((await sol('aprobados_sin_cuotas')).map((r) => r[0])).toEqual(['19'])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    expect(await k.passes(db, 'destinos_inexistentes', 'SELECT t.id, t.cuenta_destino_id FROM transferencias t LEFT JOIN cuentas c ON c.id = t.cuenta_destino_id WHERE c.id IS NULL')).toBe(false)
    expect(await k.passes(db, 'pagos_duplicados', 'SELECT p.id FROM pagos_tarjeta p WHERE EXISTS (SELECT 1 FROM pagos_tarjeta o WHERE o.tarjeta_id = p.tarjeta_id AND o.comercio_id = p.comercio_id AND o.importe = p.importe AND o.pagado_en = p.pagado_en AND o.id <> p.id)')).toBe(false)
    expect(await k.passes(db, 'ahorro_negativo', 'SELECT id, saldo FROM cuentas WHERE saldo < 0')).toBe(false)
    expect(await k.passes(db, 'ahorro_negativo', "SELECT COUNT(*) AS id, MIN(saldo) AS saldo FROM cuentas WHERE tipo = 'ahorro' AND saldo < 0")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_ruido', 'umbral')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_count', 'having')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'manual'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
