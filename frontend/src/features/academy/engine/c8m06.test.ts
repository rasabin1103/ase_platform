// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m06Informe as mission } from '../content/courses/sql-qa/m06-informe'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const ORACULO = "SELECT c.id AS comercio_id, COUNT(p.id) AS pagos, COALESCE(SUM(p.importe), 0) AS total FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id AND p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01' GROUP BY c.id"
const SQL = {
  oraculo: ORACULO + ';',
  diferencias: `WITH ok AS (${ORACULO}) SELECT ok.comercio_id, i.pagos AS pagos_informe, ok.pagos AS pagos_correcto, i.total AS total_informe, ok.total AS total_correcto FROM ok LEFT JOIN informe_comercios_febrero i ON i.comercio_id = ok.comercio_id WHERE NOT (i.pagos IS NOT DISTINCT FROM ok.pagos AND i.total IS NOT DISTINCT FROM ok.total);`,
  contados: "SELECT id, estado FROM pagos_tarjeta WHERE estado <> 'aceptado' AND estado <> 'rechazado' AND pagado_en BETWEEN '2026-02-01' AND '2026-02-28';",
  fecha: "SELECT id, pagado_en FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en::date = '2026-02-28' AND pagado_en > '2026-02-28';",
  categorias: 'SELECT comercio_id, COUNT(*) AS categorias FROM comercio_categorias GROUP BY 1 HAVING COUNT(*) >= 2;',
  ausentes: 'SELECT c.id AS comercio_id, c.nombre FROM comercios c LEFT JOIN informe_comercios_febrero i ON i.comercio_id = c.id WHERE i.comercio_id IS NULL;',
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_informe')
  s = await k.query(db, s, SQL.oraculo)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.diferencias)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.contados)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_copia', 'independiente')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.fecha)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.categorias)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.ausentes)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_casos', 'casos')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 6 · Probar un informe', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    expect((await sol('oraculo')).length).toBe(22)
    expect((await sol('diferencias')).map((r) => r[0]).sort((a, b) => Number(a) - Number(b))).toEqual(['3', '4', '11', '14', '16', '22'])
    expect((await sol('contados_de_mas')).map((r) => r[0]).sort()).toEqual(['403', '413', '423'])
    expect((await sol('fuera_por_fecha')).map((r) => r[0]).sort()).toEqual(['300', '430', '431', '432'])
    expect(await sol('categorias_repetidas')).toEqual([['14', '2']])
    expect((await sol('ausentes')).map((r) => r[0])).toEqual(['22'])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Copiar el informe como oráculo.
    expect(await k.passes(db, 'oraculo', 'SELECT comercio_id, pagos, total FROM informe_comercios_febrero')).toBe(false)
    // Filtro de estado en el WHERE: la floristería desaparece.
    expect(await k.passes(db, 'oraculo', "SELECT c.id AS comercio_id, COUNT(p.id) AS pagos, COALESCE(SUM(p.importe), 0) AS total FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id WHERE p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01' GROUP BY c.id")).toBe(false)
    // COUNT(*) cuenta 1 para el comercio sin pagos.
    expect(await k.passes(db, 'oraculo', "SELECT c.id AS comercio_id, COUNT(*) AS pagos, COALESCE(SUM(p.importe), 0) AS total FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id AND p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01' GROUP BY c.id")).toBe(false)
    // <> no ve el comercio que falta en el informe.
    expect(await k.passes(db, 'diferencias', `WITH ok AS (${ORACULO}) SELECT ok.comercio_id, i.pagos AS pagos_informe, ok.pagos AS pagos_correcto, i.total AS total_informe, ok.total AS total_correcto FROM ok LEFT JOIN informe_comercios_febrero i ON i.comercio_id = ok.comercio_id WHERE i.pagos <> ok.pagos OR i.total <> ok.total`)).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_copia', 'ok')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_casos', 'mas')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'total'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
