// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m00Jerarquias as mission } from '../content/courses/sql-avanzado/m00-jerarquias'
import { runSql } from '../sql/engine'
import { sqlMissionKit } from './sqlMissionKit'

const k = sqlMissionKit(mission)
let db: PGlite
beforeAll(async () => {
  db = await k.open()
}, 60_000)

const SQL = {
  organigrama: 'WITH RECURSIVE equipo AS (SELECT id, nombre, 1 AS nivel FROM empleados WHERE jefe_id = 6 UNION ALL SELECT e.id, e.nombre, q.nivel + 1 FROM empleados e JOIN equipo q ON e.jefe_id = q.id) SELECT * FROM equipo;',
  arbol: 'WITH RECURSIVE a AS (SELECT cliente_id, 1 AS generacion FROM invitaciones WHERE invitado_por = 1 UNION ALL SELECT i.cliente_id, a.generacion + 1 FROM invitaciones i JOIN a ON i.invitado_por = a.cliente_id) SELECT * FROM a;',
  cadena: 'WITH RECURSIVE c AS (SELECT id, nombre, puesto, jefe_id, 0 AS nivel FROM empleados WHERE id = 28 UNION ALL SELECT e.id, e.nombre, e.puesto, e.jefe_id, c.nivel + 1 FROM empleados e JOIN c ON e.id = c.jefe_id) SELECT nivel, id, nombre, puesto FROM c ORDER BY nivel;',
  rutas: "WITH RECURSIVE r AS (SELECT id, nombre::text AS ruta FROM empleados WHERE jefe_id IS NULL UNION ALL SELECT e.id, r.ruta || ' > ' || e.nombre FROM empleados e JOIN r ON e.jefe_id = r.id) SELECT id, ruta FROM r;",
  equipos: 'WITH RECURSIVE b AS (SELECT jefe_id AS jefe, id AS persona FROM empleados WHERE jefe_id IS NOT NULL UNION ALL SELECT b.jefe, e.id FROM empleados e JOIN b ON e.jefe_id = b.persona) SELECT e.id, e.nombre, COUNT(*) AS equipo_total FROM b JOIN empleados e ON e.id = b.jefe GROUP BY e.id, e.nombre;',
  ciclos: 'WITH RECURSIVE r AS (SELECT cliente_id, invitado_por FROM invitaciones UNION ALL SELECT r.cliente_id, i.invitado_por FROM r JOIN invitaciones i ON i.cliente_id = r.invitado_por) CYCLE invitado_por SET es_ciclo USING ruta SELECT DISTINCT cliente_id FROM r WHERE es_ciclo;',
}

async function goodDay(seed: number) {
  let s = k.start(seed)
  s = k.readDoc(s, 'chuleta_recursivas')
  s = await k.query(db, s, SQL.organigrama)
  s = k.waitUntil(s, 30)
  s = await k.query(db, s, SQL.arbol)
  s = k.waitUntil(s, 75)
  s = await k.query(db, s, SQL.cadena)
  s = k.waitUntil(s, 120)
  s = k.choose(s, 'ines_ciclo', 'guard')
  s = k.waitUntil(s, 150)
  s = await k.query(db, s, SQL.rutas)
  s = k.waitUntil(s, 210)
  s = await k.query(db, s, SQL.equipos)
  s = k.waitUntil(s, 270)
  s = await k.query(db, s, SQL.ciclos)
  s = k.waitUntil(s, 360)
  s = k.choose(s, 'ines_direccion', 'direction')
  s = k.waitUntil(s, 480)
  return k.choose(s, 'closing', 'lesson')
}

describe('curso 7 · misión 0 · consultas recursivas', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) k.expectGoodDay(await goodDay(seed))
  })

  it('los datos de cada encargo son los que cuenta la historia', async () => {
    const sol = (id: string) => k.rows(db, k.reto(id).solution!)
    const equipo = await sol('organigrama')
    expect(equipo.length).toBe(8)
    expect(equipo.filter((r) => r[2] === '1').length).toBe(4)
    expect(equipo.find((r) => r[0] === '28')![2]).toBe('3')
    const arbol = await sol('arbol_invitaciones')
    expect(arbol.length).toBe(15)
    expect(arbol.filter((r) => r[1] === '1').length).toBe(3)
    expect(Math.max(...arbol.map((r) => Number(r[1])))).toBe(4)
    const cadena = await sol('cadena_aprobacion')
    expect(cadena.map((r) => r[2])).toEqual(['Víctor Peña', 'Andrés Pino', 'Laura Méndez', 'Raúl Ortega', 'Jorge Llorente', 'Beatriz Sáez'])
    const rutas = await sol('rutas')
    expect(rutas.length).toBe(28)
    expect(rutas.find((r) => r[0] === '22')![1]).toBe('Beatriz Sáez > Lucía Herrero > Nuria Vidal')
    expect(String(rutas.find((r) => r[0] === '28')![1]).split(' > ').length).toBe(6)
    const equipos = await sol('equipo_total')
    expect(equipos.length).toBe(12)
    expect(equipos.find((r) => r[0] === '1')![2]).toBe('27')
    expect(equipos.find((r) => r[0] === '6')![2]).toBe('8')
    expect(await sol('ciclos')).toEqual(expect.arrayContaining([['36'], ['39']]))
    expect((await sol('ciclos')).length).toBe(2)
  })

  it('las trampas típicas no cumplen el encargo', async () => {
    // Solo los directos (sin recursiva).
    expect(await k.passes(db, 'organigrama', 'SELECT id, nombre, 1 AS nivel FROM empleados WHERE jefe_id = 6')).toBe(false)
    // La unión al revés sube en vez de bajar.
    expect(await k.passes(db, 'organigrama', 'WITH RECURSIVE q AS (SELECT id, nombre, jefe_id, 1 AS nivel FROM empleados WHERE id = 6 UNION ALL SELECT e.id, e.nombre, e.jefe_id, q.nivel + 1 FROM empleados e JOIN q ON e.id = q.jefe_id) SELECT id, nombre, nivel FROM q')).toBe(false)
    // La cadena sin ordenar no vale (se pide por nivel).
    expect(await k.passes(db, 'cadena_aprobacion', 'WITH RECURSIVE c AS (SELECT id, nombre, puesto, jefe_id, 0 AS nivel FROM empleados WHERE id = 28 UNION ALL SELECT e.id, e.nombre, e.puesto, e.jefe_id, c.nivel + 1 FROM empleados e JOIN c ON e.id = c.jefe_id) SELECT nivel, id, nombre, puesto FROM c ORDER BY nivel DESC')).toBe(false)
    // Contar solo los directos.
    expect(await k.passes(db, 'equipo_total', 'WITH RECURSIVE x AS (SELECT 1) SELECT e.id, e.nombre, COUNT(*) AS equipo_total FROM empleados s JOIN empleados e ON e.id = s.jefe_id GROUP BY e.id, e.nombre')).toBe(false)
    // El ciclo de dos con un self-join no es una recursiva.
    expect(await k.passes(db, 'ciclos', 'SELECT a.cliente_id FROM invitaciones a JOIN invitaciones b ON a.invitado_por = b.cliente_id AND b.invitado_por = a.cliente_id')).toBe(false)
    // La ruta con array también vale como protección.
    expect(await k.passes(db, 'ciclos', 'WITH RECURSIVE r AS (SELECT cliente_id AS o, invitado_por AS a, ARRAY[cliente_id] AS ruta FROM invitaciones UNION ALL SELECT r.o, i.invitado_por, r.ruta || i.cliente_id FROM r JOIN invitaciones i ON i.cliente_id = r.a WHERE NOT i.cliente_id = ANY(r.ruta)) SELECT DISTINCT o AS cliente_id FROM r WHERE a = o')).toBe(true)
  })

  it('una recursiva sin fin se corta sola con un mensaje que habla de ciclos', { timeout: 60_000 }, async () => {
    const r = await runSql(db, 'WITH RECURSIVE r AS (SELECT cliente_id, invitado_por, 1 AS n FROM invitaciones WHERE cliente_id = 36 UNION ALL SELECT r.cliente_id, i.invitado_por, n + 1 FROM r JOIN invitaciones i ON i.cliente_id = r.invitado_por) SELECT * FROM r')
    expect(r.ok).toBe(false)
    expect(r.error!.message).toMatch(/ciclo/)
    // Y la base de datos sigue viva.
    expect(await k.rows(db, 'SELECT COUNT(*) FROM empleados')).toEqual([['28']])
  })

  it('sin hacer los encargos llegan las consecuencias', () => {
    let s = k.start(1)
    s = k.waitUntil(s, 120)
    s = k.choose(s, 'ines_ciclo', 'union')
    s = k.waitUntil(s, 360)
    s = k.choose(s, 'ines_direccion', 'data')
    s = k.waitUntil(s, 480)
    k.expectBadDay(k.choose(s, 'closing', 'joins'))
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => k.expectConceptsExist())
})
