// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m03Subtotales as mission } from '../content/courses/sql-avanzado/m03-subtotales'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  rollup: "SELECT c.categoria, c.ciudad, SUM(p.importe) AS total FROM comercios c JOIN pagos_tarjeta p ON p.comercio_id = c.id WHERE p.estado = 'aceptado' GROUP BY ROLLUP (c.categoria, c.ciudad);",
  cubo: 'SELECT p.estado, t.tipo, COUNT(p.id) AS pagos FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id GROUP BY CUBE (p.estado, t.tipo);',
  sets: "SELECT c.categoria, DATE_TRUNC('month', p.pagado_en)::date AS mes, SUM(p.importe) AS total FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND p.pagado_en >= DATE '2026-01-01' GROUP BY GROUPING SETS (c.categoria, DATE_TRUNC('month', p.pagado_en)::date, ());",
  etiquetas: "SELECT CASE GROUPING(c.categoria) WHEN 1 THEN 'Total' ELSE COALESCE(c.categoria, 'sin categoría') END AS categoria, COUNT(*) AS pagos FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id GROUP BY ROLLUP (c.categoria);",
  top2: 'SELECT c.id AS cliente_id, t.id AS transferencia_id, t.importe FROM clientes c, LATERAL (SELECT tr.id, tr.importe FROM transferencias tr JOIN cuentas a ON a.id = tr.cuenta_origen_id WHERE a.cliente_id = c.id ORDER BY tr.importe DESC, tr.id LIMIT 2) t;',
  ultimo: 'SELECT c.id, c.nombre, u.ocurrido_en AS ultimo_evento, u.tipo FROM clientes c LEFT JOIN LATERAL (SELECT ocurrido_en, tipo FROM eventos_app e WHERE e.cliente_id = c.id ORDER BY ocurrido_en DESC, e.id DESC LIMIT 1) u ON true;',
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_subtotales')
  s = await k.query(db, s, SQL.rollup)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.cubo)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.sets)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_coalesce', 'grouping')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.etiquetas)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.top2)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.ultimo)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_doble', 'double')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 3 · subtotales y LATERAL', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    const r = await sol('rollup_categoria')
    expect(r.length).toBe(32)
    expect(r).toContainEqual([null, null, '33021.22'])
    expect(r.filter((x) => x[0] === 'compras' && x[1] === null).map((x) => x[2]).sort()).toEqual(['10583.73', '4681.28'])
    const cubo = await sol('cubo_estado_tipo')
    expect(cubo.length).toBe(10)
    expect(cubo).toContainEqual([null, null, '306'])
    expect(cubo).toContainEqual(['aceptado', 'credito', '11'])
    expect(cubo).toContainEqual([null, 'credito', '11'])
    const sets = await sol('sets_2026')
    expect(sets.length).toBe(12)
    expect(sets).toContainEqual([null, null, '6593.70'])
    const et = await sol('etiquetas')
    expect(et.length).toBe(10)
    expect(et).toContainEqual(['Total', '306'])
    expect(et).toContainEqual(['sin categoría', '12'])
    const top2 = await sol('top2_transferencias')
    expect(top2.length).toBe(78)
    expect(top2).toContainEqual(['19', expect.any(String), '15700.00'])
    const ult = await sol('ultimo_evento')
    expect(ult.length).toBe(40)
    expect(ult.find((x) => x[0] === '38')!.slice(2)).toEqual([null, null])
    expect(await k.rows(db, "SELECT SUM(total) FROM (SELECT SUM(p.importe) AS total FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' GROUP BY ROLLUP (c.categoria)) x")).toEqual([['66042.44']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Sin ROLLUP no hay subtotales.
    expect(await k.passes(db, 'rollup_categoria', "SELECT c.categoria, c.ciudad, SUM(p.importe) AS total FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' GROUP BY c.categoria, c.ciudad")).toBe(false)
    // ROLLUP no da los totales por tipo.
    expect(await k.passes(db, 'cubo_estado_tipo', 'SELECT p.estado, t.tipo, COUNT(*) AS pagos FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id GROUP BY ROLLUP (p.estado, t.tipo)')).toBe(false)
    // CUBE añade el cruce que Carmen no quiere.
    expect(await k.passes(db, 'sets_2026', "SELECT c.categoria, DATE_TRUNC('month', p.pagado_en)::date AS mes, SUM(p.importe) AS total FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND p.pagado_en >= '2026-01-01' GROUP BY CUBE (c.categoria, DATE_TRUNC('month', p.pagado_en)::date)")).toBe(false)
    // COALESCE en vez de GROUPING: dos filas «Total».
    expect(await k.passes(db, 'etiquetas', "SELECT COALESCE(c.categoria, 'Total') AS categoria, COUNT(*) AS pagos FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id GROUP BY ROLLUP (c.categoria) HAVING GROUPING(c.categoria) >= 0")).toBe(false)
    // MAX solo da una por cliente.
    expect(await k.passes(db, 'top2_transferencias', 'SELECT c.id AS cliente_id, t.id AS transferencia_id, t.importe FROM clientes c CROSS JOIN LATERAL (SELECT tr.id, tr.importe FROM transferencias tr JOIN cuentas a ON a.id = tr.cuenta_origen_id WHERE a.cliente_id = c.id ORDER BY tr.importe DESC LIMIT 1) t')).toBe(false)
    // CROSS JOIN LATERAL pierde al cliente 38.
    expect(await k.passes(db, 'ultimo_evento', 'SELECT c.id, c.nombre, u.ocurrido_en AS ultimo_evento, u.tipo FROM clientes c CROSS JOIN LATERAL (SELECT e.ocurrido_en, e.tipo FROM eventos_app e WHERE e.cliente_id = c.id ORDER BY e.ocurrido_en DESC, e.id DESC LIMIT 1) u')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_coalesce', 'where')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_doble', 'half')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'union'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
