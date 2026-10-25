// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { checkReto, sameRows, stripComments } from './check'
import { openDb, runSql, translateError } from './engine'
import { kobaltoData, kobaltoDbSql } from './kobaltoDb'
import { m00PrimeraConsulta } from '../content/courses/sql-iniciacion/m00-primera-consulta'

let db: PGlite
beforeAll(async () => {
  db = await openDb(kobaltoDbSql(), true)
}, 60_000)

const retos = m00PrimeraConsulta.sqlLab!.retos
const reto = (id: string) => retos.find((r) => r.id === id)!

describe('base de datos de Kobalto', () => {
  it('es determinista y tiene las anomalías sembradas', async () => {
    expect(kobaltoData()).toEqual(kobaltoData())
    const counts = await runSql(db, `SELECT (SELECT count(*) FROM clientes), (SELECT count(*) FROM cuentas), (SELECT count(*) FROM transferencias), (SELECT count(*) FROM incidencias)`)
    expect(counts.rows[0]).toEqual(['40', '52', '120', '30'])
    const dup = await runSql(db, `SELECT email FROM clientes GROUP BY email HAVING count(*) > 1`)
    expect(dup.rowCount).toBe(1)
    const sinCuenta = await runSql(db, `SELECT c.id FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id WHERE a.id IS NULL`)
    expect(sinCuenta.rows).toEqual([['38']])
    const negativo = await runSql(db, `SELECT id, saldo FROM cuentas WHERE saldo < 0`)
    expect(negativo.rows).toEqual([['17', '-245.30']])
    const huerfana = await runSql(db, `SELECT id FROM transferencias WHERE cuenta_destino_id IS NOT NULL AND cuenta_destino_id NOT IN (SELECT id FROM cuentas)`)
    expect(huerfana.rows).toEqual([['77']])
  })

  it('devuelve fechas y decimales como texto estable', async () => {
    const r = await runSql(db, `SELECT fecha_alta, saldo FROM clientes JOIN cuentas ON cuentas.cliente_id = clientes.id WHERE cuentas.id = 1`)
    expect(r.rows[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(r.rows[0][1]).toMatch(/^\d+\.\d{2}$/)
  })
})

describe('motor y errores', () => {
  it('la réplica es de solo lectura y los errores salen en español', async () => {
    const del = await runSql(db, 'DELETE FROM clientes')
    expect(del.ok).toBe(false)
    expect(del.error!.message).toMatch(/solo lectura/)
    const typo = await runSql(db, 'SELECT emial FROM clientes')
    expect(typo.error!.message).toBe("La columna «emial» no existe. Si es un texto, va entre comillas simples: 'emial'.")
    const syntax = await runSql(db, 'SELEC * FROM clientes')
    expect(syntax.error!.message).toBe('Error de sintaxis cerca de «SELEC».')
    expect(syntax.error!.position).toBe(1)
    expect((await runSql(db, 'SELECT * FROM clientess')).error!.message).toMatch(/La tabla «clientess» no existe/)
    expect((await runSql(db, '   ')).ok).toBe(false)
    expect(translateError('something new')).toBe('something new')
  })

  it('con varias sentencias devuelve la última que tiene filas', async () => {
    const r = await runSql(db, 'SELECT 1 AS a; SELECT 2 AS b;')
    expect(r.columns).toEqual(['b'])
    expect(r.rows).toEqual([['2']])
  })

  it('compara filas sin importar el orden (salvo que se pida) ni los nombres de columna', () => {
    const a = { ok: true, columns: ['x'], rows: [['1'], ['2']], rowCount: 2, command: 'SELECT', ms: 0 }
    const b = { ...a, columns: ['y'], rows: [['2'], ['1']] }
    expect(sameRows(a, b)).toBe(true)
    expect(sameRows(a, b, true)).toBe(false)
    expect(stripComments('SELECT 1 -- SELECT *\n/* * */')).toBe('SELECT 1 \n')
  })
})

describe('encargos de la misión 0', () => {
  const ok = async (id: string, sql: string) => (await checkReto(db, reto(id), await runSql(db, sql), sql)).done

  it('se cumplen con la consulta correcta, escrita de cualquier forma', async () => {
    expect(await ok('clientes', 'select * from clientes;')).toBe(true)
    expect(await ok('contacto', 'SELECT nombre, apellidos, email FROM clientes')).toBe(true)
    expect(await ok('contacto', 'SELECT c.nombre, c.apellidos, c.email FROM clientes AS c')).toBe(true)
    expect(await ok('cuentas', 'SELECT iban, tipo, saldo FROM cuentas')).toBe(true)
    expect(await ok('alias', 'SELECT nombre AS cliente, ciudad, fecha_alta AS alta FROM clientes')).toBe(true)
    expect(await ok('vistazo', 'SELECT * FROM transferencias LIMIT 5')).toBe(true)
  })

  it('no se cumplen con columnas de más, de menos, en otro orden o sin alias', async () => {
    expect(await ok('contacto', 'SELECT * FROM clientes')).toBe(false)
    expect(await ok('contacto', 'SELECT email, nombre, apellidos FROM clientes')).toBe(false)
    expect(await ok('contacto', 'SELECT nombre email FROM clientes')).toBe(false)
    expect(await ok('cuentas', 'SELECT iban, tipo, saldo FROM cuentas LIMIT 10')).toBe(false)
    expect(await ok('alias', 'SELECT nombre, ciudad, fecha_alta FROM clientes')).toBe(false)
    expect(await ok('vistazo', 'SELECT * FROM transferencias')).toBe(false)
    expect(await ok('vistazo', 'SELECT id FROM transferencias LIMIT 5')).toBe(false)
    expect(await ok('clientes', 'SELEC * FROM clientes')).toBe(false)
  })
})
