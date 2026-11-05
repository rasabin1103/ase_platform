import type { PGlite } from '@electric-sql/pglite'
import type { AcademyLang } from '../i18n'
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
  // PGlite no tiene statement_timeout: este límite corta una consulta recursiva sin fin (un ciclo) en un segundo o dos.
  await db.exec("SET temp_file_limit = '8MB'")
  // La pila de WebAssembly es más pequeña que la que PostgreSQL cree tener: con el valor por defecto, un
  // trigger que se dispara a sí mismo rompe la base de datos en vez de dar «stack depth limit exceeded».
  await db.exec("SET max_stack_depth = '256kB'")
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
  [/^invalid input syntax for type json$/, () => 'Ese texto no es JSON válido. Si comparas con -> (que devuelve jsonb), el otro lado tiene que ser JSON (\'"ios"\'); para comparar con un texto normal, saca el valor con ->>.'],
  [/^function round\(double precision, integer\) does not exist$/, () => 'ROUND(x, decimales) no acepta double precision (lo que devuelven PERCENTILE_CONT, PERCENT_RANK…): convierte antes, ROUND(x::numeric, 2).'],
  [/^operator does not exist: jsonb = text$/, () => '-> devuelve jsonb y lo comparas con un texto: usa ->> para sacar el valor como texto.'],
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
  [/^each (UNION|INTERSECT|EXCEPT) query must have the same number of columns$/, (m) => `Las dos consultas del ${m[1]} tienen que devolver el mismo número de columnas.`],
  [/^(UNION|INTERSECT|EXCEPT) types (.*) and (.*) cannot be matched$/, (m) => `En ${m[1]}, una columna es de tipo ${m[2]} en una consulta y ${m[3]} en la otra: las columnas se emparejan por posición y tienen que ser del mismo tipo.`],
  [/^relation "(.*)" already exists$/, (m) => `Ya existe una tabla o vista llamada «${m[1]}». Para cambiar una vista: CREATE OR REPLACE VIEW; para rehacer una tabla, bórrala antes con DROP TABLE.`],
  [/^cannot change name of view column "(.*)" to "(.*)"$/, (m) => `CREATE OR REPLACE VIEW no puede renombrar la columna «${m[1]}» a «${m[2]}»: borra la vista con DROP VIEW y créala de nuevo.`],
  [/^cannot drop (?:view|table) (.*) because other objects depend on it$/, (m) => `No se puede borrar ${m[1]}: hay otras vistas que dependen de ella. Bórralas antes (o usa CASCADE sabiendo que se las lleva).`],
  [/^window functions are not allowed in (WHERE|HAVING)$/, (m) => `Las funciones de ventana no se pueden usar en el ${m[1]}: se calculan después. Calcúlala en un WITH y filtra en la consulta de fuera.`],
  [/^aggregate function calls cannot be nested$/, () => 'No se puede meter un agregado dentro de otro (AVG(COUNT(*))): calcula el primero en una subconsulta del FROM y el segundo fuera.'],
  [/^more than one row returned by a subquery used as an expression$/, () => 'La subconsulta devuelve más de una fila y aquí solo cabe un valor: usa IN, o un agregado (MAX, COUNT…) para quedarte con uno.'],
  [/^division by zero$/, () => 'División entre cero.'],
  [/^temporary file size exceeds "temp_file_limit"/, () => 'La consulta ha generado demasiadas filas intermedias y se ha detenido. Si es recursiva, probablemente no termina nunca: ¿hay un ciclo en los datos? Guarda la ruta y no vuelvas a un nodo ya visitado, o limita la profundidad.'],
  [/^infinite recursion detected in rules for relation "(.*)"$/, (m) => `Recursión infinita en «${m[1]}».`],
  [/^stack depth limit exceeded$/, () => 'Se ha superado la profundidad máxima de llamadas: probablemente un trigger que se dispara a sí mismo (o una función que se llama sin fin).'],
  [/^control reached end of trigger procedure without RETURN$/, () => 'La función del trigger termina sin RETURN: un trigger BEFORE tiene que devolver NEW (o NULL para descartar la fila); uno AFTER, NEW o NULL.'],
  [/^check constraint "(.*)" of relation "(.*)" is violated by some row$/, (m) => `No se puede añadir la regla ${m[1]}: hay filas de «${m[2]}» que ya la incumplen. Corrige (o revisa) esos datos antes.`],
  [/^could not create unique index "(.*)"$/, (m) => `No se puede crear el índice único ${m[1]}: hay valores repetidos en los datos. Encuéntralos y resuélvelos antes.`],
  [/^update or delete on table "(.*)" violates foreign key constraint "(.*)" on table "(.*)"$/, (m) => `No se puede borrar o cambiar esa fila de «${m[1]}»: hay filas en «${m[3]}» que dependen de ella (clave foránea ${m[2]}).`],
  [/^cannot insert a non-DEFAULT value into column "(.*)"$/, (m) => `La columna «${m[1]}» es calculada (GENERATED): no se le puede dar valor, se calcula sola.`],
  [/^ON CONFLICT DO UPDATE command cannot affect row a second time$/, () => 'ON CONFLICT DO UPDATE intentaría actualizar la misma fila dos veces: hay claves repetidas en los datos que insertas.'],
  [/^MERGE command cannot affect row a second time$/, () => 'MERGE intentaría cambiar la misma fila dos veces: hay claves repetidas en la tabla de origen.'],
  [/^there is no unique or exclusion constraint matching the ON CONFLICT specification$/, () => 'ON CONFLICT necesita una clave primaria o un índice único sobre esas columnas.'],
  [/^recursive query "(.*)" column (\d+) has type (.*) in non-recursive term but type (.*) overall$/, (m) => `En la consulta recursiva «${m[1]}», la columna ${m[2]} es de tipo ${m[3]} en la parte inicial y ${m[4]} en la recursiva: convierte la inicial (por ejemplo, ::text o ::varchar).`],
  [/^cannot change materialized view "(.*)"$/, (m) => `«${m[1]}» es una vista materializada: no se modifica a mano, se recalcula con REFRESH MATERIALIZED VIEW.`],
  [/^null value in column "(.*)" of relation "(.*)" violates not-null constraint$/, (m) => `La columna «${m[1]}» de «${m[2]}» no admite valores vacíos (NOT NULL).`],
  [/^duplicate key value violates unique constraint "(.*)"$/, (m) => `Ese valor ya existe y debe ser único (${m[1]}).`],
  [/^insert or update on table "(.*)" violates foreign key constraint "(.*)"$/, (m) => `El valor no existe en la tabla relacionada (clave foránea ${m[2]} de «${m[1]}»).`],
  [/^new row for relation "(.*)" violates check constraint "(.*)"$/, (m) => `La fila no cumple la regla ${m[2]} de «${m[1]}».`],
  [/^function (.*) does not exist$/, (m) => `La función ${m[1]} no existe (o sus argumentos no son del tipo correcto).`],
]

/** Same rules, in English (the original PostgreSQL text is always kept next to it). */
const ERRORS_EN: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^invalid input syntax for type json$/, () => 'That text is not valid JSON. If you compare with -> (which returns jsonb), the other side has to be JSON (\'"ios"\'); to compare with plain text, get the value with ->>.'],
  [/^function round\(double precision, integer\) does not exist$/, () => 'ROUND(x, decimals) does not accept double precision (what PERCENTILE_CONT, PERCENT_RANK… return): cast first, ROUND(x::numeric, 2).'],
  [/^operator does not exist: jsonb = text$/, () => '-> returns jsonb and you are comparing it with text: use ->> to get the value as text.'],
  [/^syntax error at or near "(.*)"$/, (m) => `Syntax error near “${m[1]}”.`],
  [/^syntax error at end of input$/, () => 'The query is incomplete: something is missing at the end.'],
  [/^relation "(.*)" does not exist$/, (m) => `The table “${m[1]}” does not exist. Check the name in the explorer.`],
  [/^column "(.*)" does not exist$/, (m) => `The column “${m[1]}” does not exist. If it is text, it goes in single quotes: '${m[1]}'.`],
  [/^column (.*) does not exist$/, (m) => `The column ${m[1]} does not exist.`],
  [/^missing FROM-clause entry for table "(.*)"$/, (m) => `You use “${m[1]}” but that table is not in the FROM.`],
  [/^column "(.*)" must appear in the GROUP BY clause or be used in an aggregate function$/, (m) => `The column “${m[1]}” must be in the GROUP BY or inside an aggregate function.`],
  [/^aggregate functions are not allowed in WHERE$/, () => 'COUNT, SUM and the other aggregates cannot be used in WHERE: WHERE filters rows before grouping. To filter groups, use HAVING.'],
  [/^column reference "(.*)" is ambiguous$/, (m) => `The column “${m[1]}” exists in several tables: say which one (table.${m[1]}).`],
  [/^unterminated quoted string at or near "(.*)"$/, () => 'A single quote is not closed.'],
  [/^cannot execute (\w+) in a read-only transaction$/, (m) => `The replica is read-only: you cannot run ${m[1]} here.`],
  [/^invalid input syntax for type (\w+): "(.*)"$/, (m) => `“${m[2]}” is not a valid ${m[1]} value.`],
  [/^operator does not exist: (.*)$/, (m) => `Those types cannot be compared or combined (${m[1]}).`],
  [/^current transaction is aborted, commands ignored until end of transaction block$/, () => 'The transaction failed and is aborted: run ROLLBACK to leave it.'],
  [/^there is no transaction in progress$/, () => 'There is no open transaction (a BEGIN is missing).'],
  [/^each (UNION|INTERSECT|EXCEPT) query must have the same number of columns$/, (m) => `Both queries of the ${m[1]} must return the same number of columns.`],
  [/^(UNION|INTERSECT|EXCEPT) types (.*) and (.*) cannot be matched$/, (m) => `In ${m[1]}, a column is ${m[2]} in one query and ${m[3]} in the other: columns are matched by position and must have the same type.`],
  [/^relation "(.*)" already exists$/, (m) => `A table or view called “${m[1]}” already exists. To change a view: CREATE OR REPLACE VIEW; to rebuild a table, drop it first with DROP TABLE.`],
  [/^cannot change name of view column "(.*)" to "(.*)"$/, (m) => `CREATE OR REPLACE VIEW cannot rename the column “${m[1]}” to “${m[2]}”: drop the view with DROP VIEW and create it again.`],
  [/^cannot drop (?:view|table) (.*) because other objects depend on it$/, (m) => `${m[1]} cannot be dropped: other views depend on it. Drop them first (or use CASCADE, knowing it drops them too).`],
  [/^window functions are not allowed in (WHERE|HAVING)$/, (m) => `Window functions cannot be used in ${m[1]}: they are computed afterwards. Compute it in a WITH and filter in the outer query.`],
  [/^aggregate function calls cannot be nested$/, () => 'An aggregate cannot go inside another one (AVG(COUNT(*))): compute the first in a subquery in the FROM and the second outside.'],
  [/^more than one row returned by a subquery used as an expression$/, () => 'The subquery returns more than one row and only one value fits here: use IN, or an aggregate (MAX, COUNT…) to keep just one.'],
  [/^division by zero$/, () => 'Division by zero.'],
  [/^temporary file size exceeds "temp_file_limit"/, () => 'The query generated too many intermediate rows and was stopped. If it is recursive, it probably never ends: is there a cycle in the data? Keep the path and do not go back to a node you already visited, or limit the depth.'],
  [/^infinite recursion detected in rules for relation "(.*)"$/, (m) => `Infinite recursion in “${m[1]}”.`],
  [/^stack depth limit exceeded$/, () => 'The maximum call depth was exceeded: probably a trigger that fires itself (or a function that calls itself endlessly).'],
  [/^control reached end of trigger procedure without RETURN$/, () => 'The trigger function ends without RETURN: a BEFORE trigger has to return NEW (or NULL to discard the row); an AFTER one, NEW or NULL.'],
  [/^check constraint "(.*)" of relation "(.*)" is violated by some row$/, (m) => `The rule ${m[1]} can't be added: some rows of “${m[2]}” already break it. Fix (or review) that data first.`],
  [/^could not create unique index "(.*)"$/, (m) => `The unique index ${m[1]} can't be created: there are repeated values in the data. Find them and resolve them first.`],
  [/^update or delete on table "(.*)" violates foreign key constraint "(.*)" on table "(.*)"$/, (m) => `That row of “${m[1]}” can't be deleted or changed: rows in “${m[3]}” depend on it (foreign key ${m[2]}).`],
  [/^cannot insert a non-DEFAULT value into column "(.*)"$/, (m) => `The column “${m[1]}” is calculated (GENERATED): it can't be given a value, it calculates itself.`],
  [/^ON CONFLICT DO UPDATE command cannot affect row a second time$/, () => 'ON CONFLICT DO UPDATE would update the same row twice: there are repeated keys in the data you are inserting.'],
  [/^MERGE command cannot affect row a second time$/, () => 'MERGE would change the same row twice: there are repeated keys in the source table.'],
  [/^there is no unique or exclusion constraint matching the ON CONFLICT specification$/, () => 'ON CONFLICT needs a primary key or a unique index on those columns.'],
  [/^recursive query "(.*)" column (\d+) has type (.*) in non-recursive term but type (.*) overall$/, (m) => `In the recursive query “${m[1]}”, column ${m[2]} is of type ${m[3]} in the initial part and ${m[4]} in the recursive one: cast the initial one (for example, ::text or ::varchar).`],
  [/^cannot change materialized view "(.*)"$/, (m) => `“${m[1]}” is a materialized view: it is not modified by hand, it is recalculated with REFRESH MATERIALIZED VIEW.`],
  [/^null value in column "(.*)" of relation "(.*)" violates not-null constraint$/, (m) => `The column “${m[1]}” of “${m[2]}” does not accept empty values (NOT NULL).`],
  [/^duplicate key value violates unique constraint "(.*)"$/, (m) => `That value already exists and must be unique (${m[1]}).`],
  [/^insert or update on table "(.*)" violates foreign key constraint "(.*)"$/, (m) => `The value does not exist in the related table (foreign key ${m[2]} of “${m[1]}”).`],
  [/^new row for relation "(.*)" violates check constraint "(.*)"$/, (m) => `The row breaks the rule ${m[2]} of “${m[1]}”.`],
  [/^function (.*) does not exist$/, (m) => `The function ${m[1]} does not exist (or its arguments are not of the right type).`],
]

/** Traduce los errores más comunes de PostgreSQL al idioma de la misión (conserva el original). */
export function translateError(message: string, lang: AcademyLang = 'es'): string {
  for (const [re, fn] of lang === 'en' ? ERRORS_EN : ERRORS) {
    const m = message.match(re)
    if (m) return fn(m)
  }
  return message
}

/**
 * Arrays (text[], integer[], numeric[]…) y JSON tal cual los escribe
 * PostgreSQL ({a,b} y {"a": 1}): así se ve la diferencia entre -> (jsonb, con
 * comillas) y ->> (texto). Va en cada consulta porque PGlite registra sus
 * propios parsers de arrays al arrancar, por encima de los de PGlite.create.
 */
const RAW_TEXT = Object.fromEntries([114, 3802, 1007, 1009, 1015, 1016, 1021, 1022, 1182, 1231, 199, 3807].map((oid) => [oid, (v: string) => v]))

const COMMAND = /^\s*(?:--[^\n]*\n\s*)*(\w+)/

/** Ejecuta el SQL del alumno y devuelve la última sentencia con filas (o la última). */
export async function runSql(db: PGlite, sql: string, lang: AcademyLang = 'es'): Promise<SqlResult> {
  const t0 = performance.now()
  const command = (sql.match(COMMAND)?.[1] ?? '').toUpperCase()
  if (!sql.trim()) return { ok: false, columns: [], rows: [], rowCount: 0, command, ms: 0, error: { message: lang === 'en' ? 'Write a query before running.' : 'Escribe una consulta antes de ejecutar.', original: 'empty query' } }
  try {
    // Filas como arrays: dos columnas pueden llamarse igual (p. ej. dos count).
    const results = await db.exec(sql, { rowMode: 'array', parsers: RAW_TEXT })
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
    return { ok: false, columns: [], rows: [], rowCount: 0, command, ms: Math.round(performance.now() - t0), error: { message: translateError(original, lang), original, position } }
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
