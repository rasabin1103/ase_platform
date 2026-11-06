// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m04Conciliar as mission } from '../content/courses/sql-qa/m04-conciliar'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const FEB = "estado = 'aceptado' AND pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'"
const SQL = {
  faltan: `SELECT id FROM pagos_tarjeta WHERE ${FEB} EXCEPT SELECT pago_id FROM liquidaciones;`,
  sobran: 'SELECT l.pago_id, l.importe FROM liquidaciones l LEFT JOIN pagos_tarjeta p ON p.id = l.pago_id WHERE p.id IS NULL;',
  importes: 'SELECT p.id AS pago_id, p.importe AS importe_app, l.importe AS importe_liquidado FROM liquidaciones l JOIN pagos_tarjeta p ON p.id = l.pago_id WHERE l.importe - p.importe > 0.01 OR p.importe - l.importe > 0.01;',
  duplicados: 'SELECT pago_id, COUNT(id) AS veces FROM liquidaciones GROUP BY 1 HAVING COUNT(id) >= 2;',
  estados: "SELECT p.id AS pago_id, p.estado FROM pagos_tarjeta p WHERE p.estado <> 'aceptado' AND p.id IN (SELECT pago_id FROM liquidaciones);",
  dias: `SELECT fecha, SUM(app) AS total_app, SUM(liq) AS total_liquidado FROM (SELECT pagado_en::date AS fecha, importe AS app, 0 AS liq FROM pagos_tarjeta WHERE ${FEB} UNION ALL SELECT fecha_operacion, 0, importe FROM liquidaciones) x GROUP BY fecha HAVING SUM(app) <> SUM(liq);`,
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_conciliar')
  s = await k.query(db, s, SQL.faltan)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.sobran)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.importes)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_totales', 'fila')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.duplicados)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.estados)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.dias)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_join', 'lados')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 4 · Conciliar dos fuentes', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    expect(await sol('faltan')).toEqual([['406'], ['418']])
    expect(await sol('sobran')).toEqual([['999', '54.78']])
    expect(await sol('importes_distintos')).toEqual([['415', '28.95', '38.95']])
    expect(await sol('duplicados')).toEqual([['420', '2']])
    expect(await sol('no_aceptados')).toEqual([['413', 'devuelto']])
    const dias = await sol('dias_descuadrados')
    expect(dias.length).toBe(5)
    expect(dias.map((r) => r[0])).not.toContain('2026-02-06')
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Sin tolerancia sale también el céntimo del 410.
    expect(await k.passes(db, 'importes_distintos', 'SELECT p.id AS pago_id, p.importe AS importe_app, l.importe AS importe_liquidado FROM pagos_tarjeta p JOIN liquidaciones l ON l.pago_id = p.id WHERE l.importe <> p.importe')).toBe(false)
    // Todos los pagos, no solo los aceptados de febrero.
    expect(await k.passes(db, 'faltan', 'SELECT p.id FROM pagos_tarjeta p WHERE NOT EXISTS (SELECT 1 FROM liquidaciones l WHERE l.pago_id = p.id)')).toBe(false)
    // JOIN normal: se pierden los días que solo están en un lado (y sin agregar antes, se multiplican).
    expect(await k.passes(db, 'dias_descuadrados', `SELECT p.pagado_en::date AS fecha, SUM(p.importe) AS total_app, SUM(l.importe) AS total_liquidado FROM pagos_tarjeta p JOIN liquidaciones l ON l.fecha_operacion = p.pagado_en::date WHERE p.${FEB.replace(/ AND /g, ' AND p.')} GROUP BY 1 HAVING SUM(p.importe) <> SUM(l.importe)`)).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_totales', 'ok')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_join', 'left')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'totales'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
