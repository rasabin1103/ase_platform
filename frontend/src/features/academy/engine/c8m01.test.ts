// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m01Bordes as mission } from '../content/courses/sql-qa/m01-bordes'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  febrero: "SELECT COUNT(id) AS pagos FROM pagos_tarjeta WHERE pagado_en::date BETWEEN '2026-02-01' AND '2026-02-28';",
  segmento: 'SELECT ciudad, COUNT(id) AS clientes, COUNT(*) FILTER (WHERE segmento IS NULL) AS sin_segmento FROM clientes GROUP BY 1;',
  total: "SELECT SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' AND tarjeta_id IN (SELECT t.id FROM tarjetas t JOIN cuentas a ON a.id = t.cuenta_id WHERE a.cliente_id IN (SELECT cliente_id FROM incidencias));",
  altas: 'SELECT lower(trim(email)) AS email_normalizado, COUNT(*) AS altas FROM altas_web GROUP BY 1 HAVING COUNT(*) >= 2;',
  comision: "SELECT comercio_id, SUM(ROUND(0.015 * importe, 2)) AS comision FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY 1 ORDER BY 1;",
  rechazo: "SELECT t.id AS tarjeta_id, COUNT(p.id) AS pagos, ROUND(SUM(CASE WHEN p.estado = 'rechazado' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(p.id), 0), 1) AS pct_rechazo FROM tarjetas t LEFT JOIN pagos_tarjeta p ON p.tarjeta_id = t.id GROUP BY t.id;",
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_bordes')
  s = await k.query(db, s, SQL.febrero)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.segmento)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.total)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_between', 'rango')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.altas)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.comision)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.rechazo)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_join', 'cardinalidad')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 1 · Los bordes', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    expect(await sol('pagos_febrero')).toEqual([['52']])
    expect(await k.rows(db, "SELECT COUNT(*) FROM pagos_tarjeta WHERE pagado_en BETWEEN '2026-02-01' AND '2026-02-28'")).toEqual([['48']])
    const seg = await sol('sin_segmento')
    expect(seg.filter((r) => r[2] !== '0').sort()).toEqual([['Barcelona', '8', '1'], ['Madrid', '12', '1']])
    expect(await sol('total_con_incidencias')).toEqual([['24253.47']])
    expect(await k.rows(db, "SELECT SUM(p.importe) FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN cuentas a ON a.id = t.cuenta_id JOIN incidencias i ON i.cliente_id = a.cliente_id WHERE p.estado = 'aceptado'")).toEqual([['25874.11']])
    expect((await sol('altas_repetidas')).sort()).toEqual([['ana.garcia@mail.com', '3'], ['elena.vidal@mail.com', '2'], ['lucia.mora@mail.com', '2']])
    expect(await k.rows(db, "SELECT COUNT(*) FROM (SELECT comercio_id FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY 1 HAVING SUM(ROUND(importe * 0.015, 2)) <> ROUND(SUM(importe) * 0.015, 2)) x")).toEqual([['14']])
    const rech = await sol('rechazo_por_tarjeta')
    expect(rech).toContainEqual(['12', '13', '76.9'])
    expect(rech).toContainEqual(['33', '0', null])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    expect(await k.passes(db, 'pagos_febrero', "SELECT COUNT(*) AS pagos FROM pagos_tarjeta WHERE pagado_en BETWEEN '2026-02-01' AND '2026-02-28'")).toBe(false)
    expect(await k.passes(db, 'sin_segmento', 'SELECT ciudad, COUNT(*) AS clientes, COUNT(segmento) AS sin_segmento FROM clientes GROUP BY ciudad')).toBe(false)
    expect(await k.passes(db, 'total_con_incidencias', "SELECT SUM(p.importe) AS total FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN cuentas a ON a.id = t.cuenta_id JOIN incidencias i ON i.cliente_id = a.cliente_id WHERE p.estado = 'aceptado'")).toBe(false)
    expect(await k.passes(db, 'altas_repetidas', 'SELECT email AS email_normalizado, COUNT(*) AS altas FROM altas_web GROUP BY email HAVING COUNT(*) > 1')).toBe(false)
    expect(await k.passes(db, 'comision_por_comercio', "SELECT comercio_id, ROUND(SUM(importe) * 0.015, 2) AS comision FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY comercio_id")).toBe(false)
    expect(await k.passes(db, 'rechazo_por_tarjeta', "SELECT t.id AS tarjeta_id, COUNT(p.id) AS pagos, ROUND(100 * COUNT(p.id) FILTER (WHERE p.estado = 'rechazado') / NULLIF(COUNT(p.id), 0), 1) AS pct_rechazo FROM tarjetas t LEFT JOIN pagos_tarjeta p ON p.tarjeta_id = t.id GROUP BY t.id")).toBe(false)
    expect(await k.passes(db, 'rechazo_por_tarjeta', "SELECT t.id AS tarjeta_id, COUNT(p.id) AS pagos, ROUND(100.0 * COUNT(p.id) FILTER (WHERE p.estado = 'rechazado') / COUNT(p.id), 1) AS pct_rechazo FROM tarjetas t JOIN pagos_tarjeta p ON p.tarjeta_id = t.id GROUP BY t.id")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_between', 'ok')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_join', 'distinct')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'normal'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
