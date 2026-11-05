// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m02Rachas as mission } from '../content/courses/sql-avanzado/m02-rachas'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const DIAS = "WITH d AS (SELECT DISTINCT cliente_id, DATE_TRUNC('day', ocurrido_en)::date AS dia FROM eventos_app WHERE tipo = 'login'), g AS (SELECT cliente_id, dia, dia - (ROW_NUMBER() OVER (PARTITION BY cliente_id ORDER BY dia))::int AS grupo FROM d)"
const SQL = {
  cliente7: `${DIAS} SELECT MIN(dia) AS inicio, MAX(dia) AS fin, COUNT(*) AS dias FROM g WHERE cliente_id = 7 GROUP BY grupo ORDER BY inicio;`,
  largas: `${DIAS}, r AS (SELECT cliente_id, COUNT(*) AS n FROM g GROUP BY cliente_id, grupo) SELECT cliente_id, MAX(n) AS racha_maxima FROM r GROUP BY cliente_id HAVING MAX(n) >= 10 ORDER BY 2 DESC;`,
  mediana: 'SELECT estado, ROUND(AVG(importe), 2) AS media, ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe))::numeric, 2) AS mediana, ROUND((PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY importe))::numeric, 2) AS p90 FROM pagos_tarjeta GROUP BY estado;',
  hora: 'SELECT c.categoria, MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM p.pagado_en)) AS hora_tipica FROM comercios c JOIN pagos_tarjeta p ON p.comercio_id = c.id WHERE c.categoria IS NOT NULL GROUP BY c.categoria;',
  huecos: 'SELECT * FROM (SELECT tarjeta_id, LAG(pagado_en::date) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) AS desde, pagado_en::date AS hasta, pagado_en::date - LAG(pagado_en::date) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) AS dias FROM pagos_tarjeta) x WHERE dias > 120;',
  rechazos: "WITH p AS (SELECT tarjeta_id, pagado_en, estado, ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en, id) - ROW_NUMBER() OVER (PARTITION BY tarjeta_id, estado ORDER BY pagado_en, id) AS g FROM pagos_tarjeta) SELECT tarjeta_id, MIN(pagado_en) AS inicio, MAX(pagado_en) AS fin, COUNT(*) AS rechazos FROM p WHERE estado = 'rechazado' GROUP BY tarjeta_id, g HAVING COUNT(*) >= 3;",
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_islas')
  s = await k.query(db, s, SQL.cliente7)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.largas)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.mediana)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_repetidos', 'distinct')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.hora)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.huecos)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.rechazos)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_media', 'median')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 2 · huecos, islas y percentiles', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    const c7 = await sol('rachas_cliente7')
    expect(c7.length).toBe(10)
    expect(c7).toContainEqual(['2026-02-01', '2026-02-21', '21'])
    const largas = await sol('rachas_largas')
    expect(largas.length).toBe(7)
    expect(largas).toContainEqual(['29', '23'])
    expect(await sol('mediana_estado')).toContainEqual(['aceptado', '121.85', '37.85', '294.40'])
    const horas = await sol('hora_tipica')
    expect(horas).toContainEqual(['restauracion', '6'])
    expect(horas).toContainEqual(['compras', '18'])
    expect(horas).toContainEqual(['viajes', '18'])
    const huecos = await sol('periodos_inactivos')
    expect(huecos.length).toBe(10)
    expect(huecos).toContainEqual(['1', '2025-06-16', '2026-02-05', '234'])
    const rech = await sol('rachas_rechazo')
    expect(rech.map((r) => [r[0], r[3]]).sort()).toEqual([['12', '3'], ['12', '5']])
    expect(await k.rows(db, "SELECT COUNT(*) FILTER (WHERE importe > 121.85), COUNT(*) FROM pagos_tarjeta WHERE estado = 'aceptado'")).toEqual([['54', '271']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Numerar eventos en vez de días distintos parte la racha de 21.
    expect(await k.passes(db, 'rachas_cliente7', 'WITH g AS (SELECT ocurrido_en::date AS dia, ocurrido_en::date - (ROW_NUMBER() OVER (ORDER BY ocurrido_en))::int AS grupo FROM eventos_app WHERE cliente_id = 7) SELECT MIN(dia) AS inicio, MAX(dia) AS fin, COUNT(*) AS dias FROM g GROUP BY grupo')).toBe(false)
    // Número de logins en vez de rachas.
    expect(await k.passes(db, 'rachas_largas', "SELECT cliente_id, COUNT(*) AS racha_maxima FROM eventos_app WHERE tipo = 'login' GROUP BY cliente_id HAVING COUNT(*) >= 10")).toBe(false)
    // PERCENTILE_DISC no interpola: en algún estado la mediana cambia.
    expect(await k.passes(db, 'mediana_estado', 'SELECT estado, ROUND(AVG(importe), 2) AS media, PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY importe) AS mediana, PERCENTILE_DISC(0.9) WITHIN GROUP (ORDER BY importe) AS p90 FROM pagos_tarjeta GROUP BY estado')).toBe(false)
    // La hora media no es la más frecuente.
    expect(await k.passes(db, 'hora_tipica', 'SELECT c.categoria, ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM p.pagado_en))) AS hora_tipica FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE c.categoria IS NOT NULL GROUP BY c.categoria')).toBe(false)
    // Contar todos los rechazos de la tarjeta no es contar rechazos seguidos.
    expect(await k.passes(db, 'rachas_rechazo', "WITH p AS (SELECT tarjeta_id, pagado_en, ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) AS n FROM pagos_tarjeta WHERE estado = 'rechazado') SELECT tarjeta_id, MIN(pagado_en) AS inicio, MAX(pagado_en) AS fin, COUNT(*) AS rechazos FROM p GROUP BY tarjeta_id HAVING COUNT(*) >= 3")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_repetidos', 'dense')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_media', 'remove')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'loop'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
