// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { m09CrearTabla as mission } from '../content/courses/sql-iniciacion/m09-crear-tabla'
import { runEvent, visibleRetos } from '../apps/sql-console/sqlConsoleLogic'
import { checkReto } from '../sql/check'
import { openDb, runSql } from '../sql/engine'
import { replay, step, summarize } from './engine'
import type { RunState } from './types'

/** Entorno de pruebas con las sondas: base de datos modificable, nueva en cada prueba. */
const fresh = () => openDb(mission.sqlLab!.setup, false)

async function query(db: PGlite, s: RunState, sql: string): Promise<RunState> {
  const r = await runSql(db, sql)
  const vs = []
  for (const reto of visibleRetos(mission, s)) vs.push(await checkReto(db, reto, r, sql))
  return step(mission, s, { type: 'app', event: runEvent(mission, s, sql, r, vs).event })
}
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)
const reto = (id: string) => mission.sqlLab!.retos.find((r) => r.id === id)!
const verdict = async (db: PGlite, id: string, sql: string) => checkReto(db, reto(id), await runSql(db, sql), sql)

const ETIQUETAS = 'CREATE TABLE etiquetas (id integer PRIMARY KEY, nombre text NOT NULL);'
const CASOS = "CREATE TABLE casos_prueba (id integer PRIMARY KEY, titulo text NOT NULL, prioridad text NOT NULL, estado text NOT NULL DEFAULT 'pendiente');"
const CHECK = "ALTER TABLE casos_prueba ADD CHECK (prioridad IN ('alta', 'media', 'baja'));"
const EJECUCIONES = "CREATE TABLE ejecuciones (id integer PRIMARY KEY, caso_id integer NOT NULL REFERENCES casos_prueba(id), resultado text NOT NULL CHECK (resultado IN ('ok', 'fallo')), ejecutada_en date NOT NULL);"
const VIGILANCIA = 'CREATE TABLE lista_vigilancia (id integer PRIMARY KEY, cliente_id integer NOT NULL UNIQUE REFERENCES clientes(id), motivo text NOT NULL);'
const POBLAR = "INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (1, 'Login con usuario válido', 'alta'), (2, 'Transferencia sin saldo', 'alta'), (3, 'Cambiar idioma', 'baja');"

async function goodDay(seed: number) {
  const db = await fresh()
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'chuleta_tablas' })
  s = await query(db, s, ETIQUETAS)
  s = waitUntil(s, 30)
  s = await query(db, s, CASOS)
  s = waitUntil(s, 75)
  s = await query(db, s, CHECK)
  s = waitUntil(s, 120)
  s = choose(s, 'ines_reglas', 'constraints')
  s = waitUntil(s, 150)
  s = await query(db, s, EJECUCIONES)
  s = waitUntil(s, 210)
  s = await query(db, s, VIGILANCIA)
  s = waitUntil(s, 270)
  s = await query(db, s, POBLAR)
  s = waitUntil(s, 300)
  s = await query(db, s, 'DROP TABLE etiquetas;')
  s = waitUntil(s, 360)
  s = choose(s, 'ines_tipos', 'types')
  s = waitUntil(s, 480)
  s = choose(s, 'closing', 'lesson')
  await db.close()
  return s
}

describe('curso 5 · misión 9 · tu propia tabla', () => {
  it('cumplir los encargos y las buenas prácticas evita todas las consecuencias', async () => {
    for (const seed of [1, 2]) {
      const s = await goodDay(seed)
      expect(s.finished).toBe(true)
      for (const r of mission.sqlLab!.retos) expect(s.flags[`reto.${r.id}`], r.id).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  }, 60_000)

  it('las sondas no dejan rastro y los encargos aceptan formas equivalentes', async () => {
    const db = await fresh()
    // CHECK dentro del CREATE TABLE, columnas con otras mayúsculas en las palabras clave.
    await runSql(db, "create table casos_prueba (id integer primary key, titulo text not null, prioridad text not null check (prioridad in ('alta','media','baja')), estado text not null default 'pendiente')")
    expect((await verdict(db, 'casos_prueba', 'SELECT 1')).done).toBe(true)
    expect((await verdict(db, 'prioridad', 'SELECT 1')).done).toBe(true)
    // Las sondas insertan y deshacen: la tabla sigue vacía.
    expect((await runSql(db, 'SELECT COUNT(*) FROM casos_prueba')).rows).toEqual([['0']])
    // La clave foránea como restricción de tabla también vale.
    await runSql(db, 'CREATE TABLE lista_vigilancia (id integer PRIMARY KEY, cliente_id integer NOT NULL, motivo text NOT NULL, UNIQUE (cliente_id), FOREIGN KEY (cliente_id) REFERENCES clientes (id))')
    expect((await verdict(db, 'vigilancia', 'SELECT 1')).done).toBe(true)
    // El explorador no enseña el esquema de las sondas.
    expect((await runSql(db, "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'qa'")).rows).toEqual([['0']])
    await db.close()
  }, 60_000)

  it('las trampas típicas no cumplen el encargo', async () => {
    let db = await fresh()
    // Sin NOT NULL en titulo, sin DEFAULT, o con varchar en vez de text.
    await runSql(db, 'CREATE TABLE casos_prueba (id integer PRIMARY KEY, titulo text, prioridad text NOT NULL, estado text NOT NULL)')
    expect((await verdict(db, 'casos_prueba', 'SELECT 1')).done).toBe(false)
    await runSql(db, 'DROP TABLE casos_prueba')
    await runSql(db, "CREATE TABLE casos_prueba (id integer PRIMARY KEY, titulo varchar(100) NOT NULL, prioridad text NOT NULL, estado text NOT NULL DEFAULT 'pendiente')")
    expect((await verdict(db, 'casos_prueba', 'SELECT 1')).done).toBe(false)
    await runSql(db, 'DROP TABLE casos_prueba')
    // Sin clave primaria: admite ids repetidos.
    await runSql(db, "CREATE TABLE casos_prueba (id integer NOT NULL, titulo text NOT NULL, prioridad text NOT NULL, estado text NOT NULL DEFAULT 'pendiente')")
    expect((await verdict(db, 'casos_prueba', 'SELECT 1')).done).toBe(false)
    // Un CHECK que distingue mal (acepta «Alta»).
    await runSql(db, "ALTER TABLE casos_prueba ADD CHECK (lower(prioridad) IN ('alta', 'media', 'baja'))")
    expect((await verdict(db, 'prioridad', 'SELECT 1')).done).toBe(false)
    await db.close()

    db = await fresh()
    await runSql(db, CASOS)
    // Ejecuciones sin clave foránea: acepta casos que no existen.
    await runSql(db, "CREATE TABLE ejecuciones (id integer PRIMARY KEY, caso_id integer NOT NULL, resultado text NOT NULL CHECK (resultado IN ('ok', 'fallo')), ejecutada_en date NOT NULL)")
    expect((await verdict(db, 'ejecuciones', 'SELECT 1')).done).toBe(false)
    // Lista sin UNIQUE: admite el mismo cliente dos veces.
    await runSql(db, 'CREATE TABLE lista_vigilancia (id integer PRIMARY KEY, cliente_id integer NOT NULL REFERENCES clientes(id), motivo text NOT NULL)')
    expect((await verdict(db, 'vigilancia', 'SELECT 1')).done).toBe(false)
    // Poblar indicando otro estado no es lo pedido.
    await runSql(db, "INSERT INTO casos_prueba VALUES (1, 'Login con usuario válido', 'alta', 'hecho'), (2, 'Transferencia sin saldo', 'alta', 'pendiente'), (3, 'Cambiar idioma', 'baja', 'pendiente')")
    expect((await verdict(db, 'poblar', 'SELECT 1')).done).toBe(false)
    // Vaciar la tabla en vez de borrarla no es un DROP.
    await runSql(db, ETIQUETAS)
    expect((await verdict(db, 'drop', 'DELETE FROM etiquetas')).done).toBe(false)
    await db.close()
  }, 60_000)

  it('sin hacer los encargos llegan las consecuencias', async () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 120)
    s = choose(s, 'ines_reglas', 'app')
    s = waitUntil(s, 360)
    s = choose(s, 'ines_tipos', 'text')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'app')
    expect(s.activeBugs).toEqual(expect.arrayContaining(mission.bugs.map((b) => b.id)))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
