import type { Condition } from '../engine/types'

/** Valor de una celda ya normalizado: texto (números y fechas incluidos) o null. */
export type SqlCell = string | null

/** Resultado de ejecutar SQL (la última sentencia que devuelve filas, o la última). */
export interface SqlResult {
  ok: boolean
  columns: string[]
  rows: SqlCell[][]
  /** Filas devueltas o afectadas. */
  rowCount: number
  /** Tipo de la última sentencia (SELECT, INSERT, UPDATE…). */
  command: string
  ms: number
  error?: { message: string; original: string; position?: number }
}

/** Encargo de la consola SQL: se cumple cuando una ejecución devuelve el resultado esperado. */
export interface SqlReto {
  id: string
  /** Quién lo pide (id de NPC), para la tarjeta del encargo. */
  from?: string
  title: string
  /** Qué hay que conseguir (markdown ligero: **negrita**, `código`). */
  description: string
  hint: string
  /** Solo aparece cuando se cumple (p. ej. tras llegar el mensaje que lo pide). */
  visibleWhen?: Condition
  /** Consulta de referencia: el resultado del alumno debe coincidir con el suyo. */
  solution?: string
  /** El orden de las filas cuenta (cuando el encargo pide ordenar). */
  ordered?: boolean
  /** Nombres exactos de las columnas, en orden (p. ej. cuando se pide un alias). */
  columns?: string[]
  /** Comprobación propia, además (o en lugar) de la de referencia. */
  check?: (result: SqlResult, sql: string) => boolean
  /** Lo que no debe aparecer en la consulta (p. ej. `SELECT *`). */
  forbid?: { pattern: RegExp; message: string }[]
  /** Lo que tiene que aparecer en la consulta (p. ej. `ROLLBACK`); el motivo, si se da, se enseña al alumno. */
  requires?: { pattern: RegExp; message?: string }[]
  /**
   * Encargos que modifican datos: después de la ejecución, cada consulta de
   * verificación tiene que devolver exactamente estas filas (en orden). No se
   * da por cumplido con una transacción abierta sin confirmar.
   */
  state?: { query: string; rows: SqlCell[][] }[]
}

/** Laboratorio SQL de una misión (app «sql-console»). */
export interface SqlLabModel {
  /** SQL que prepara la base de datos de la misión (esquema y datos). */
  setup: string
  /** Réplica de solo lectura (misiones de consulta) o entorno de pruebas modificable. */
  readOnly: boolean
  /** Minutos de jornada por ejecución. */
  runCost: number
  /** Minutos que cuesta «Restaurar la base de datos» (solo en entornos modificables). */
  restoreCost?: number
  /** Consulta con la que empieza el editor. */
  starter: string
  retos: SqlReto[]
}

/** Estado de la consola que se guarda en la partida (sin la base de datos). */
export interface SqlConsoleState {
  sql: string
  runs: number
  last?: { sql: string; result: SqlResult; at: number }
}
