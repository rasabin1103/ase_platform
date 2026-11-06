// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m07Estados as mission } from '../content/courses/sql-qa/m07-estados'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  ultimo: 'WITH u AS (SELECT orden_id, estado, ROW_NUMBER() OVER (PARTITION BY orden_id ORDER BY cambiado_en DESC) AS n FROM ordenes_historial) SELECT o.id, o.estado, u.estado AS ultimo FROM ordenes o JOIN u ON u.orden_id = o.id AND u.n = 1 WHERE o.estado <> u.estado;',
  transiciones: 'SELECT orden_id, desde, hasta FROM (SELECT orden_id, LAG(estado) OVER (PARTITION BY orden_id ORDER BY cambiado_en) AS desde, estado AS hasta FROM ordenes_historial) t WHERE desde IS NOT NULL AND (desde, hasta) NOT IN (SELECT desde, hasta FROM transiciones_validas);',
  atascadas: "SELECT o.id, MAX(h.cambiado_en) AS pendiente_desde FROM ordenes o JOIN ordenes_historial h ON h.orden_id = o.id WHERE o.estado = 'pendiente' GROUP BY o.id HAVING MAX(h.cambiado_en) < '2026-02-28 12:00';",
  inicio: "SELECT orden_id, estado FROM (SELECT DISTINCT ON (orden_id) orden_id, estado FROM ordenes_historial ORDER BY orden_id, cambiado_en ASC) f WHERE estado <> 'creada';",
  historial: 'SELECT o.id, o.estado FROM ordenes o LEFT JOIN ordenes_historial h ON h.orden_id = o.id WHERE h.id IS NULL;',
  lentas: "SELECT orden_id, EXTRACT(EPOCH FROM MAX(cambiado_en) FILTER (WHERE estado IN ('completada', 'rechazada', 'cancelada')) - MIN(cambiado_en) FILTER (WHERE estado = 'creada')) / 60 AS minutos FROM ordenes_historial GROUP BY orden_id HAVING EXTRACT(EPOCH FROM MAX(cambiado_en) FILTER (WHERE estado IN ('completada', 'rechazada', 'cancelada')) - MIN(cambiado_en) FILTER (WHERE estado = 'creada')) / 60 > 60;",
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_estados')
  s = await k.query(db, s, SQL.ultimo)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.transiciones)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.atascadas)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_lag', 'particion')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.inicio)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.historial)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.lentas)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_ahora', 'referencia')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 7 · Estados y transiciones', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution! + ' ORDER BY 1')
    expect(await sol('estado_distinto')).toEqual([['4', 'completada', 'pendiente'], ['11', 'rechazada', 'completada']])
    expect(await sol('transiciones_invalidas')).toEqual([['4', 'completada', 'pendiente'], ['7', 'creada', 'completada'], ['10', 'pendiente', 'pendiente']])
    expect(await sol('atascadas')).toEqual([['16', '2026-02-25 10:02:00']])
    expect(await sol('sin_creada')).toEqual([['20', 'pendiente']])
    expect(await sol('sin_historial')).toEqual([['21', 'completada']])
    expect((await sol('lentas')).map((r) => r[0])).toEqual(['3', '4', '8', '9', '13', '14', '18'])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // LAG sin PARTITION BY.
    expect(await k.passes(db, 'transiciones_invalidas', 'SELECT orden_id, desde, hasta FROM (SELECT orden_id, LAG(estado) OVER (ORDER BY cambiado_en) AS desde, estado AS hasta FROM ordenes_historial) t WHERE desde IS NOT NULL AND NOT EXISTS (SELECT 1 FROM transiciones_validas v WHERE v.desde = t.desde AND v.hasta = t.hasta)')).toBe(false)
    // now() en vez de la fecha de referencia.
    expect(await k.passes(db, 'atascadas', "SELECT o.id, MAX(h.cambiado_en) AS pendiente_desde FROM ordenes o JOIN ordenes_historial h ON h.orden_id = o.id WHERE o.estado = 'pendiente' GROUP BY o.id HAVING MAX(h.cambiado_en) < now() - INTERVAL '48 hours'")).toBe(false)
    // El último estado ordenando por id de la orden y no por hora: sale el primero.
    expect(await k.passes(db, 'estado_distinto', 'SELECT o.id, o.estado, u.estado AS ultimo FROM ordenes o JOIN (SELECT DISTINCT ON (orden_id) orden_id, estado FROM ordenes_historial ORDER BY orden_id, cambiado_en) u ON u.orden_id = o.id WHERE u.estado <> o.estado')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_lag', 'excluir')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_ahora', 'margen')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'actual'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
