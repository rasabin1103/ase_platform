// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m05Migracion as mission } from '../content/courses/sql-qa/m05-migracion'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  claves: "(SELECT id, 'falta' AS problema FROM clientes EXCEPT SELECT id, 'falta' FROM clientes_v2) UNION ALL (SELECT id, 'sobra' FROM clientes_v2 EXCEPT SELECT id, 'sobra' FROM clientes);",
  nombres: "SELECT v.id FROM clientes_v2 v JOIN clientes c USING (id) WHERE v.nombre_completo <> concat(c.nombre, ' ', c.apellidos);",
  emails: 'SELECT c.id, c.email AS email_origen, v.email AS email_destino FROM clientes c, clientes_v2 v WHERE v.id = c.id AND NOT (v.email IS NOT DISTINCT FROM lower(trim(c.email)));',
  segmentos: "SELECT c.id, c.segmento AS segmento_origen, v.segmento AS segmento_destino FROM clientes c JOIN clientes_v2 v ON v.id = c.id WHERE v.segmento <> CASE WHEN c.segmento IS NULL THEN 'sin_segmento' ELSE c.segmento END;",
  ciudades: 'SELECT c.id, c.ciudad AS ciudad_origen, ci.nombre AS ciudad_destino FROM clientes_v2 v JOIN clientes c ON c.id = v.id LEFT JOIN ciudades ci ON ci.id = v.ciudad_id WHERE ci.nombre IS DISTINCT FROM c.ciudad;',
  saldos: 'SELECT a.id, a.saldo, v.saldo_centimos FROM cuentas a JOIN cuentas_v2 v ON v.id = a.id WHERE v.saldo_centimos::numeric / 100 <> a.saldo;',
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_migracion')
  s = await k.query(db, s, SQL.claves)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.nombres)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.emails)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'laura_recuento', 'claves')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.segmentos)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.ciudades)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.saldos)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'laura_null', 'distinct')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 8 · misión 5 · Validar una migración', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    expect(await sol('faltan_sobran')).toEqual([['17', 'falta'], ['9999', 'sobra']])
    expect(await k.rows(db, 'SELECT (SELECT COUNT(*) FROM clientes), (SELECT COUNT(*) FROM clientes_v2)')).toEqual([['40', '40']])
    expect(await sol('nombres')).toEqual([['8']])
    expect((await sol('emails')).map((r) => r[0])).toEqual(['22', '30'])
    expect(await sol('segmentos')).toEqual([['2', 'premium', 'estandar'], ['9', null, 'estandar']])
    expect(await sol('ciudades')).toEqual([['1', 'Bilbao', 'Málaga']])
    expect((await sol('saldos_centimos')).map((r) => r[0])).toEqual(['17', '21', '33'])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    expect(await k.passes(db, 'emails', 'SELECT c.id, c.email AS email_origen, v.email AS email_destino FROM clientes c JOIN clientes_v2 v ON v.id = c.id WHERE v.email <> lower(trim(c.email))')).toBe(false)
    expect(await k.passes(db, 'segmentos', 'SELECT c.id, c.segmento AS segmento_origen, v.segmento AS segmento_destino FROM clientes c JOIN clientes_v2 v ON v.id = c.id WHERE v.segmento <> c.segmento')).toBe(false)
    expect(await k.passes(db, 'faltan_sobran', "SELECT id, 'falta' AS problema FROM clientes WHERE id NOT IN (SELECT id FROM clientes_v2)")).toBe(false)
    // Con abs() se pierde el signo de la 17.
    expect(await k.passes(db, 'saldos_centimos', 'SELECT a.id, a.saldo, v.saldo_centimos FROM cuentas a JOIN cuentas_v2 v ON v.id = a.id WHERE v.saldo_centimos <> abs(a.saldo) * 100')).toBe(false)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'laura_recuento', 'ok')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'laura_null', 'ruben')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'muestra'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
