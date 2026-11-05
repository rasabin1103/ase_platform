// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m01Ventanas as mission } from '../content/courses/sql-avanzado/m01-ventanas'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const DIA = "WITH d AS (SELECT pagado_en::date AS dia, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01' GROUP BY 1)"
const MES = "WITH m AS (SELECT DATE_TRUNC('month', pagado_en)::date AS mes, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY 1)"
const SQL = {
  primero: 'SELECT id, pagado_en, importe, FIRST_VALUE(importe) OVER (ORDER BY pagado_en) AS primer_importe, FIRST_VALUE(importe) OVER (ORDER BY pagado_en DESC) AS ultimo_importe FROM pagos_tarjeta WHERE tarjeta_id = 5;',
  semana: `${DIA} SELECT dia, total, SUM(total) OVER (ORDER BY dia RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW) AS ultimos_7_dias FROM d;`,
  segundo: "WITH n AS (SELECT comercio_id, importe, ROW_NUMBER() OVER (PARTITION BY comercio_id ORDER BY importe DESC) AS n FROM pagos_tarjeta WHERE estado = 'aceptado') SELECT comercio_id, importe AS segundo_importe FROM n WHERE n = 2;",
  percentil: 'SELECT cliente_id, SUM(saldo) AS saldo_total, ROUND((100 * CUME_DIST() OVER (ORDER BY SUM(saldo)))::numeric, 1) AS percentil FROM cuentas GROUP BY cliente_id;',
  viajes: 'SELECT id, importe, ROUND(AVG(importe) OVER w, 2) AS media_comercio, MAX(importe) OVER w AS maximo_comercio FROM pagos_tarjeta WHERE comercio_id = 20 WINDOW w AS (PARTITION BY comercio_id);',
  centrada: `${MES} SELECT mes, total, ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 2) AS media_centrada FROM m;`,
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_marcos')
  s = await k.query(db, s, SQL.primero)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.semana)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.segundo)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_ultimo', 'frame')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.percentil)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.viajes)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.centrada)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_rows', 'range')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 1 · marcos de ventana', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    const t5 = await sol('primero_ultimo')
    expect(t5.length).toBe(12)
    expect(new Set(t5.map((r) => `${r[3]}|${r[4]}`))).toEqual(new Set(['27.35|29.95']))
    const semana = await sol('ultimos_7_dias')
    expect(semana.length).toBe(19)
    expect(Number(semana.find((r) => r[0] === '2026-02-15')![2])).toBeGreaterThan(3500)
    const rows = await k.rows(db, `${DIA} SELECT COUNT(*) FILTER (WHERE a <> b) FROM (SELECT SUM(total) OVER (ORDER BY dia RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW) a, SUM(total) OVER (ORDER BY dia ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) b FROM d) x`)
    expect(rows).toEqual([['14']])
    const segundo = await sol('segundo_mayor')
    expect(segundo.length).toBe(22)
    expect(segundo.find((r) => r[0] === '16')![1]).toBe('237.55')
    const pct = await sol('percentil_saldo')
    expect(pct.length).toBe(39)
    expect(pct.filter((r) => Number(r[2]) > 90).length).toBe(4)
    expect(await k.rows(db, 'SELECT COUNT(*), ROUND(AVG(importe), 2), MAX(importe) FROM pagos_tarjeta WHERE comercio_id = 20')).toEqual([['13', '636.89', '1075.49']])
    expect((await sol('media_centrada')).length).toBe(14)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // LAST_VALUE con el marco por defecto.
    expect(await k.passes(db, 'primero_ultimo', 'SELECT id, pagado_en, importe, FIRST_VALUE(importe) OVER (ORDER BY pagado_en) AS primer_importe, LAST_VALUE(importe) OVER (ORDER BY pagado_en) AS ultimo_importe FROM pagos_tarjeta WHERE tarjeta_id = 5')).toBe(false)
    // ROWS en vez de RANGE.
    expect(await k.passes(db, 'ultimos_7_dias', `${DIA} SELECT dia, total, SUM(total) OVER (ORDER BY dia ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ultimos_7_dias FROM d`)).toBe(false)
    // NTH_VALUE con el marco por defecto deja NULL en una fila de cada comercio (y DISTINCT da dos filas).
    expect(await k.passes(db, 'segundo_mayor', "SELECT DISTINCT comercio_id, NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC) AS segundo_importe FROM pagos_tarjeta WHERE estado = 'aceptado'")).toBe(false)
    // PERCENT_RANK no es lo que se pide.
    expect(await k.passes(db, 'percentil_saldo', 'SELECT cliente_id, SUM(saldo) AS saldo_total, ROUND((100 * PERCENT_RANK() OVER (ORDER BY SUM(saldo)))::numeric, 1) AS percentil FROM cuentas GROUP BY cliente_id')).toBe(false)
    // Sin WINDOW con nombre no vale para Diego.
    expect(await k.passes(db, 'pagos_viajes', 'SELECT id, importe, ROUND(AVG(importe) OVER (), 2) AS media_comercio, MAX(importe) OVER () AS maximo_comercio FROM pagos_tarjeta WHERE comercio_id = 20')).toBe(false)
    // Media móvil hacia atrás, no centrada.
    expect(await k.passes(db, 'media_centrada', `${MES} SELECT mes, total, ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_centrada FROM m`)).toBe(false)
  })

  it('ROUND con decimales sobre CUME_DIST explica que hay que convertir', async () => {
    const { runSql } = await import('../sql/engine')
    const r = await runSql(db, 'SELECT ROUND(100 * CUME_DIST() OVER (ORDER BY saldo), 1) FROM cuentas')
    expect(r.error!.message).toMatch(/numeric/)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_ultimo', 'order')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_rows', 'seven')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'maxmin'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
