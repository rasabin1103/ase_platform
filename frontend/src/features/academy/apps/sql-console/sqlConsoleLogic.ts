import { evaluate } from '../../engine/engine'
import type { AppEvent, Mission, RunState } from '../../engine/types'
import type { RetoVerdict } from '../../sql/check'
import type { SqlConsoleState, SqlResult } from '../../sql/types'

export const SQL_APP = 'sql-console'
/** Filas que se guardan en la partida del último resultado (la consola muestra más mientras está abierta). */
export const SAVED_ROWS = 50

export function initialConsole(mission: Mission): SqlConsoleState {
  return { sql: mission.sqlLab?.starter ?? '', runs: 0 }
}

export function consoleState(mission: Mission, state: RunState): SqlConsoleState {
  return (state.appState[SQL_APP] as SqlConsoleState | undefined) ?? initialConsole(mission)
}

/** Encargos visibles ahora (los que ya han llegado). */
export function visibleRetos(mission: Mission, state: RunState) {
  return (mission.sqlLab?.retos ?? []).filter((r) => !r.visibleWhen || evaluate(mission, state, r.visibleWhen))
}

const firstLine = (sql: string) => sql.replace(/\s+/g, ' ').trim().slice(0, 140)

/**
 * Evento de una ejecución: coste en minutos, encargos cumplidos (flags
 * `reto.<id>`) y el resultado (recortado) para que la partida se reproduzca
 * sin volver a ejecutar SQL.
 */
export function runEvent(mission: Mission, state: RunState, sql: string, result: SqlResult, verdicts: RetoVerdict[]): { state: SqlConsoleState; event: AppEvent } {
  const prev = consoleState(mission, state)
  const done = verdicts.filter((v) => v.done).map((v) => v.id)
  const flags = ['sql.ran', ...(result.ok ? [] : ['sql.error']), ...done.map((id) => `reto.${id}`)]
  const saved: SqlResult = { ...result, rows: result.rows.slice(0, SAVED_ROWS) }
  const next: SqlConsoleState = { sql, runs: prev.runs + 1, last: { sql, result: saved, at: state.clock } }
  const fresh = done.filter((id) => !state.flags[`reto.${id}`])
  const summary = result.ok
    ? `${result.command || 'SQL'}: ${result.rowCount} ${result.columns.length ? 'filas' : 'filas afectadas'}${fresh.length ? ` · encargo cumplido` : ''}`
    : `Error: ${result.error?.message ?? ''}`
  return {
    state: next,
    event: {
      app: SQL_APP,
      action: 'run',
      summary,
      technical: `[sql] ${firstLine(sql)} → ${result.ok ? `${result.rowCount} rows · ${result.ms} ms` : `ERROR ${result.error?.original}`}`,
      status: result.ok ? 'ok' : 'error',
      bugs: [],
      cost: mission.sqlLab?.runCost ?? 2,
      flags,
      state: next,
    },
  }
}

/** «Restaurar la base de datos»: vuelve a los datos de partida (solo entornos modificables). */
export function restoreEvent(mission: Mission, state: RunState): { state: SqlConsoleState; event: AppEvent } {
  const prev = consoleState(mission, state)
  const next: SqlConsoleState = { sql: prev.sql, runs: prev.runs }
  return {
    state: next,
    event: {
      app: SQL_APP,
      action: 'restore',
      summary: 'Base de datos restaurada a los datos de partida',
      technical: '[sql] restore → base de datos recreada',
      status: 'ok',
      bugs: [],
      cost: mission.sqlLab?.restoreCost ?? 5,
      flags: ['sql.restored'],
      state: next,
    },
  }
}
