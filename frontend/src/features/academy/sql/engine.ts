import type { PGlite } from '@electric-sql/pglite'
import type { SqlCell, SqlResult } from './types'

/**
 * Motor SQL del curso: PostgreSQL real (PGlite) dentro del navegador.
 * Se carga de forma perezosa (import dinámico) para que el resto de la web no
 * pague su peso. Una base de datos por misión, preparada con su SQL de setup.
 */

/** Filas como máximo en un resultado (la consola muestra el total igualmente). */
export const MAX_ROWS = 500

export async function openDb(setup: string, readOnly: boolean): Promise<PGlite> {
  const { PGlite } = await import('@electric-sql/pglite')
  // Fechas, horas y numeric como texto tal cual los devuelve PostgreSQL: sin
  // husos horarios del navegador ni decimales de coma flotante.
  const asText = (v: string) => v
  const db = await PGlite.create({ parsers: { 1082: asText, 1083: asText, 1114: asText, 1184: asText, 1700: asText } })
  await db.exec(setup)
  if (readOnly) await db.exec('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY')
  return db
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, '0')
}

/** Normaliza un valor de PostgreSQL a texto estable (números, fechas, booleanos). */
export function cell(v: unknown): SqlCell {
  if (v === null || v === undefined) return null
  if (v instanceof Date) {
    const date = `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`
    const time = `${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}:${pad(v.getUTCSeconds())}`
    return time === '00:00:00' ? date : `${date} ${time}`
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number' || typeof v === 'bigint') return String(v)
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const ERRORS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^syntax error at or near "(.*)"$/, (m) => `Error de sintaxis cerca de «${m[1]}».`],
  [/^syntax error at end of input$/, () => 'La consulta está incompleta: falta algo al final.'],
  [/^relation "(.*)" does not exist$/, (m) => `La tabla «${m[1]}» no existe. Revisa el nombre en el explorador.`],
  [/^column "(.*)" does not exist$/, (m) => `La columna «${m[1]}» no existe. Si es un texto, va entre comillas simples: '${m[1]}'.`],
  [/^column (.*) does not exist$/, (m) => `La columna ${m[1]} no existe.`],
  [/^missing FROM-clause entry for table "(.*)"$/, (m) => `Usas «${m[1]}» pero esa tabla no está en el FROM.`],
  [/^column "(.*)" must appear in the GROUP BY clause or be used in an aggregate function$/, (m) => `La columna «${m[1]}» debe ir en el GROUP BY o dentro de una función de agregación.`],
  [/^aggregate functions are not allowed in WHERE$/, () => 'No se pueden usar COUNT, SUM y demás agregados en el WHERE: el WHERE filtra filas antes de agrupar. Para filtrar grupos, usa HAVING.'],
  [/^column reference "(.*)" is ambiguous$/, (m) => `La columna «${m[1]}» existe en varias tablas: indica de cuál (tabla.${m[1]}).`],
  [/^unterminated quoted string at or near "(.*)"$/, () => 'Falta cerrar una comilla simple.'],
  [/^cannot execute (\w+) in a read-only transaction$/, (m) => `La réplica es de solo lectura: aquí no puedes ejecutar ${m[1]}.`],
  [/^invalid input syntax for type (\w+): "(.*)"$/, (m) => `«${m[2]}» no es un valor válido de tipo ${m[1]}.`],
  [/^operator does not exist: (.*)$/, (m) => `No se pueden comparar o combinar esos tipos (${m[1]}).`],
  [/^current transaction is aborted, commands ignored until end of transaction block$/, () => 'La transacción ha fallado y está abortada: ejecuta ROLLBACK para salir de ella.'],
  [/^there is no transaction in progress$/, () => 'No hay ninguna transacción abierta (falta un BEGIN).'],
  [/^division by zero$/, () => 'División entre cero.'],
  [/^null value in column "(.*)" of relation "(.*)" violates not-null constraint$/, (m) => `La columna «${m[1]}» de «${m[2]}» no admite valores vacíos (NOT NULL).`],
  [/^duplicate key value violates unique constraint "(.*)"$/, (m) => `Ese valor ya existe y debe ser único (${m[1]}).`],
  [/^insert or update on table "(.*)" violates foreign key constraint "(.*)"$/, (m) => `El valor no existe en la tabla relacionada (clave foránea ${m[2]} de «${m[1]}»).`],
  [/^new row for relation "(.*)" violates check constraint "(.*)"$/, (m) => `La fila no cumple la regla ${m[2]} de «${m[1]}».`],
  [/^function (.*) does not exist$/, (m) => `La función ${m[1]} no existe (o sus argumentos no son del tipo correcto).`],
]

/** Traduce los errores más comunes de PostgreSQL al español (conserva el original). */
export function translateError(message: string): string {
  for (const [re, fn] of ERRORS) {
    const m = message.match(re)
    if (m) return fn(m)
  }
  return message
}

const COMMAND = /^\s*(?:--[^\n]*\n\s*)*(\w+)/

/** Ejecuta el SQL del alumno y devuelve la última sentencia con filas (o la última). */
export async function runSql(db: PGlite, sql: string): Promise<SqlResult> {
  const t0 = performance.now()
  const command = (sql.match(COMMAND)?.[1] ?? '').toUpperCase()
  if (!sql.trim()) return { ok: false, columns: [], rows: [], rowCount: 0, command, ms: 0, error: { message: 'Escribe una consulta antes de ejecutar.', original: 'empty query' } }
  try {
    // Filas como arrays: dos columnas pueden llamarse igual (p. ej. dos count).
    const results = await db.exec(sql, { rowMode: 'array' })
    const withRows = [...results].reverse().find((r) => r.fields.length > 0)
    const last = withRows ?? results[results.length - 1]
    const columns = last ? last.fields.map((f) => f.name) : []
    // Sin filas (INSERT, UPDATE…), el tipo es el de la última sentencia, no el de la primera (BEGIN).
    const statements = sql.replace(/--[^\n]*/g, '').split(';').map((x) => x.trim()).filter(Boolean)
    const lastCommand = withRows ? command : ((statements[statements.length - 1] ?? '').match(/^(\w+)/)?.[1] ?? command).toUpperCase()
    const all = last ? last.rows.map((row) => (row as unknown[]).map(cell)) : []
    return {
      ok: true,
      columns,
      rows: all.slice(0, MAX_ROWS),
      rowCount: withRows ? all.length : (last?.affectedRows ?? 0),
      command: lastCommand,
      ms: Math.round(performance.now() - t0),
    }
  } catch (e) {
    const err = e as { message?: string; position?: string | number }
    const original = err.message ?? String(e)
    const position = err.position !== undefined ? Number(err.position) : undefined
    return { ok: false, columns: [], rows: [], rowCount: 0, command, ms: Math.round(performance.now() - t0), error: { message: translateError(original), original, position } }
  }
}

/** Tablas y columnas del esquema público, para el explorador. */
export async function schemaOf(db: PGlite): Promise<{ table: string; columns: { name: string; type: string }[] }[]> {
  const r = await db.query<{ table_name: string; column_name: string; data_type: string }>(
    `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`,
  )
  const out = new Map<string, { name: string; type: string }[]>()
  for (const row of r.rows) {
    if (!out.has(row.table_name)) out.set(row.table_name, [])
    out.get(row.table_name)!.push({ name: row.column_name, type: row.data_type })
  }
  return [...out].map(([table, columns]) => ({ table, columns }))
}

/**
 * ¿Hay cambios sin confirmar? Dentro de una transacción con escrituras,
 * txid_current_if_assigned() devuelve un id; fuera, NULL. Una transacción
 * abortada también cuenta como abierta.
 */
export async function pendingTransaction(db: PGlite): Promise<boolean> {
  try {
    const r = await db.query<{ open: boolean }>('SELECT txid_current_if_assigned() IS NOT NULL AS open')
    return !!r.rows[0]?.open
  } catch {
    return true
  }
}
