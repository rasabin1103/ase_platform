// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m04Json as mission } from '../content/courses/sql-avanzado/m04-json'
import { runSql } from '../sql/engine'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  e500: "SELECT id, cliente_id, ocurrido_en, datos #>> '{detalle,servicio}' AS servicio FROM eventos_app WHERE datos @> '{\"codigo\": \"E500\"}';",
  dispositivos: "SELECT datos->>'dispositivo' AS dispositivo, COUNT(*) AS logins FROM eventos_app WHERE tipo = 'login' GROUP BY 1;",
  externas: "SELECT id, cliente_id, (datos->>'importe')::numeric AS importe FROM eventos_app WHERE datos @> '{\"destino\": \"externa\"}' AND (datos->>'importe')::numeric > 300;",
  sms: "SELECT cliente_id FROM preferencias WHERE canales @> ARRAY['sms'] AND intereses @> ARRAY['viajes'];",
  version: "SELECT id, cliente_id, datos->>'dispositivo' AS dispositivo FROM eventos_app WHERE tipo = 'login' AND datos->>'version' IS NULL;",
  intereses: 'SELECT i AS interes, COUNT(*) AS clientes FROM preferencias CROSS JOIN LATERAL unnest(intereses) AS i GROUP BY i;',
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_json')
  s = await k.query(db, s, SQL.e500)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.dispositivos)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.externas)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_texto', 'cast')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.sms)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.version)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.intereses)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_flecha', 'arrow')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 4 · JSON y arrays', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    const e500 = await sol('errores_500')
    expect(e500.length).toBe(12)
    expect(new Set(e500.map((r) => r[3]))).toEqual(new Set(['core-transferencias']))
    expect((await sol('logins_dispositivo')).sort()).toEqual([['android', '400'], ['ios', '368'], ['web', '345']])
    const ext = await sol('externas_grandes')
    expect(ext.length).toBe(12)
    expect(ext.filter((r) => r[1] === '22').length).toBe(3)
    expect((await sol('sms_viajes')).length).toBe(7)
    const sinv = await sol('sin_version')
    expect(sinv.length).toBe(10)
    expect([...new Set(sinv.map((r) => r[1]))].sort()).toEqual(['13', '26', '39'])
    expect(await sol('intereses')).toContainEqual(['inversion', '36'])
    expect(await k.rows(db, "SELECT COUNT(*) FROM eventos_app WHERE tipo = 'transferencia' AND datos->>'destino' = 'externa' AND datos->>'importe' > '300'")).toEqual([['16']])
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Con -> el dispositivo sale como JSON, con comillas.
    expect(await k.passes(db, 'logins_dispositivo', "SELECT datos->'dispositivo' AS dispositivo, COUNT(*) AS logins FROM eventos_app WHERE tipo = 'login' AND datos->>'dispositivo' IS NOT NULL GROUP BY 1")).toBe(false)
    // Comparar el importe como texto.
    expect(await k.passes(db, 'externas_grandes', "SELECT id, cliente_id, (datos->>'importe')::numeric AS importe FROM eventos_app WHERE tipo = 'transferencia' AND datos->>'destino' = 'externa' AND datos->>'importe' > '300'")).toBe(false)
    // Solo uno de los dos arrays.
    expect(await k.passes(db, 'sms_viajes', "SELECT cliente_id FROM preferencias WHERE 'sms' = ANY(canales)")).toBe(false)
    // La versión vacía no es lo mismo que sin versión… aquí no hay versiones vacías: las dos formas valen.
    expect(await k.passes(db, 'sin_version', "SELECT id, cliente_id, datos->>'dispositivo' AS dispositivo FROM eventos_app WHERE tipo = 'login' AND datos->>'version' IS NULL")).toBe(true)
    // Contar clientes con algún interés no es contar por interés.
    expect(await k.passes(db, 'intereses', "SELECT intereses[1] AS interes, COUNT(*) AS clientes FROM preferencias, unnest(ARRAY[1]) x GROUP BY 1")).toBe(false)
  })

  it('comparar -> con un texto da un error que explica la diferencia', async () => {
    const r = await runSql(db, "SELECT COUNT(*) FROM eventos_app WHERE datos->'dispositivo' = 'ios'")
    expect(r.error!.message).toMatch(/->>/)
    const ok = await runSql(db, "SELECT datos->'dispositivo', datos->>'dispositivo' FROM eventos_app WHERE tipo = 'login' LIMIT 1")
    expect(ok.rows[0][0]).toMatch(/^".*"$/)
    expect(ok.rows[0][1]).not.toMatch(/"/)
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_texto', 'arrow')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_flecha', 'like')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'text'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
