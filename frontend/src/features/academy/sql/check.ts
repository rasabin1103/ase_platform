import type { PGlite } from '@electric-sql/pglite'
import { pendingTransaction, runSql } from './engine'
import type { SqlCell, SqlResult, SqlReto } from './types'

/**
 * Comprobación de encargos: el resultado del alumno se compara con el de la
 * consulta de referencia, ejecutada sobre la misma base de datos. Cuenta lo
 * que devuelve, no cómo está escrita la consulta.
 */

const key = (row: SqlCell[]) => JSON.stringify(row)

/** Mismas filas (en el mismo orden si `ordered`), sin mirar los nombres de columna. */
export function sameRows(a: SqlResult, b: SqlResult, ordered = false): boolean {
  if (!a.ok || !b.ok || a.columns.length !== b.columns.length || a.rowCount !== b.rowCount) return false
  const ra = a.rows.map(key)
  const rb = b.rows.map(key)
  if (!ordered) {
    ra.sort()
    rb.sort()
  }
  return ra.every((r, i) => r === rb[i])
}

export interface RetoVerdict {
  id: string
  done: boolean
  /** Por qué no se cumple, si se puede decir sin dar la solución. */
  reason?: string
}

/** Quita comentarios para que una palabra comentada no cuente en `forbid`. */
export function stripComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Comprueba un encargo con el resultado de una ejecución del alumno. */
export async function checkReto(db: PGlite, reto: SqlReto, result: SqlResult, sql: string, expected?: Map<string, SqlResult>): Promise<RetoVerdict> {
  if (!result.ok) return { id: reto.id, done: false }
  const clean = stripComments(sql)
  for (const f of reto.forbid ?? []) if (f.pattern.test(clean)) return { id: reto.id, done: false, reason: f.message }
  for (const r of reto.requires ?? []) if (!r.pattern.test(clean)) return { id: reto.id, done: false, reason: r.message }
  if (reto.state) {
    if (await pendingTransaction(db)) return { id: reto.id, done: false, reason: 'Tienes una transacción abierta: confírmala con COMMIT o deshazla con ROLLBACK.' }
    for (const v of reto.state) {
      const r = await runSql(db, v.query)
      if (!r.ok || JSON.stringify(r.rows) !== JSON.stringify(v.rows)) return { id: reto.id, done: false }
    }
  }
  if (reto.columns && (reto.columns.length !== result.columns.length || reto.columns.some((c, i) => c !== result.columns[i]))) {
    return { id: reto.id, done: false }
  }
  if (reto.solution) {
    let exp = expected?.get(reto.id)
    if (!exp) {
      exp = await runSql(db, reto.solution)
      expected?.set(reto.id, exp)
    }
    if (!sameRows(result, exp, reto.ordered)) return { id: reto.id, done: false }
  }
  if (reto.check && !reto.check(result, clean)) return { id: reto.id, done: false }
  return { id: reto.id, done: true }
}
