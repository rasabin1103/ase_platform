// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m09Rendimiento as mission } from '../content/courses/sql-qa/m09-rendimiento'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  regresiones: "WITH m AS (SELECT version, consulta_id, tiempo_total_ms / llamadas AS media FROM log_consultas) SELECT a.consulta_id, ROUND(a.media, 2) AS media_18, ROUND(b.media, 2) AS media_19 FROM m a JOIN m b USING (consulta_id) WHERE a.version = '1.8' AND b.version = '1.9' AND b.media > a.media * 1.5;",
  n1: "SELECT consulta_id, ROUND(1.0 * llamadas / peticiones, 1) AS llamadas_por_peticion FROM log_consultas WHERE version = '1.9' AND 1.0 * llamadas / peticiones > 10;",
  nuevas: "SELECT consulta_id, texto FROM log_consultas WHERE version = '1.9' AND consulta_id NOT IN (SELECT consulta_id FROM log_consultas WHERE version = '1.8');",
  peso: "SELECT consulta_id, tiempo_total_ms AS total_ms, ROUND(tiempo_total_ms * 100 / (SELECT SUM(tiempo_total_ms) FROM log_consultas WHERE version = '1.9'), 1) AS porcentaje FROM log_consultas WHERE version = '1.9' ORDER BY 2 DESC LIMIT 3;",
  indices: "SELECT tabla, indice FROM indices_esperados EXCEPT SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';",
  estimaciones: "SELECT consulta_id, filas_estimadas, filas_reales FROM planes_capturados WHERE version = '1.9' AND (filas_reales >= 10 * filas_estimadas OR filas_estimadas >= 10 * filas_reales);",
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_rendimiento')
  s = await k.query(db, s, SQL.regresiones)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.n1)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.nuevas)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_total', 'media')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.peso)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.indices)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.estimaciones)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_volumen', 'volumen')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 9 · Regresiones de rendimiento', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    expect(await sol('regresiones')).toEqual([['Q2', '2.00', '24.00'], ['Q5', '20.00', '32.00']])
    expect(await sol('n_mas_1')).toEqual([['Q3', '60.0'], ['Q8', '20.5']])
    expect((await sol('nuevas')).map((r) => r[0])).toEqual(['Q7', 'Q8'])
    expect(await sol('peso')).toEqual([['Q2', '196800.0', '86.5'], ['Q3', '9000.0', '4.0'], ['Q4', '8160.0', '3.6']])
    expect(await sol('indices')).toEqual([['cuentas', 'cuentas_cliente_idx'], ['transferencias', 'transferencias_origen_idx']])
    expect((await sol('estimaciones')).map((r) => r[0])).toEqual(['Q2', 'Q4', 'Q7'])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Comparar tiempo total: Q3 sale como regresión.
    expect(await k.passes(db, 'regresiones', "SELECT a.consulta_id, ROUND(a.tiempo_total_ms / a.llamadas, 2) AS media_18, ROUND(b.tiempo_total_ms / b.llamadas, 2) AS media_19 FROM log_consultas a JOIN log_consultas b ON b.consulta_id = a.consulta_id AND b.version = '1.9' WHERE a.version = '1.8' AND b.tiempo_total_ms > 1.5 * a.tiempo_total_ms")).toBe(false)
    // División entera.
    expect(await k.passes(db, 'n_mas_1', "SELECT consulta_id, ROUND(llamadas / peticiones, 1) AS llamadas_por_peticion FROM log_consultas WHERE version = '1.9' AND llamadas / peticiones > 10")).toBe(false)
    // Porcentaje calculado después del LIMIT (solo sobre las 3).
    expect(await k.passes(db, 'peso', "SELECT consulta_id, total_ms, ROUND(100 * total_ms / SUM(total_ms) OVER (), 1) AS porcentaje FROM (SELECT consulta_id, tiempo_total_ms AS total_ms FROM log_consultas WHERE version = '1.9' ORDER BY tiempo_total_ms DESC LIMIT 3) t ORDER BY total_ms DESC")).toBe(false)
    // Solo en un sentido.
    expect(await k.passes(db, 'estimaciones', "SELECT consulta_id, filas_estimadas, filas_reales FROM planes_capturados WHERE version = '1.9' AND filas_reales >= 10 * filas_estimadas")).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_total', 'indice')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_volumen', 'local')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'total'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
