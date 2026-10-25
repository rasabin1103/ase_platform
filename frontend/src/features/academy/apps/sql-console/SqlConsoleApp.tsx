import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Database, Lightbulb, Loader2, Play, RotateCcw, Table2 } from 'lucide-react'
import type { PGlite } from '@electric-sql/pglite'
import type { RunState } from '../../engine/types'
import { checkReto, type RetoVerdict } from '../../sql/check'
import { openDb, pendingTransaction, runSql, schemaOf } from '../../sql/engine'
import type { SqlLabModel, SqlResult } from '../../sql/types'
import type { ToolProps } from '../../tools/types'
import { RichText } from '../../ui'
import { npcOf } from '../../uiHelpers'
import { CodeEditor, type CodeEditorHandle } from '../karate-ide/CodeEditor'
import { consoleState, restoreEvent, runEvent, visibleRetos } from './sqlConsoleLogic'

type Props = ToolProps & { stateRef?: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Schema = Awaited<ReturnType<typeof schemaOf>>
type Lab = { db: PGlite; schema: Schema; expected: Map<string, SqlResult> }

// Una base de datos por misión mientras la pestaña esté abierta (arrancar PostgreSQL cuesta unos segundos).
const LABS = new Map<string, Promise<Lab>>()
function labFor(key: string, model: SqlLabModel): Promise<Lab> {
  let lab = LABS.get(key)
  if (!lab) {
    lab = openDb(model.setup, model.readOnly).then(async (db) => {
      // Resultados esperados calculados sobre los datos de partida, antes de que el alumno toque nada
      // (en un entorno modificable, borrar datos no puede hacer que «coincida» un resultado vacío).
      const expected = new Map<string, SqlResult>()
      for (const r of model.retos) if (r.solution) expected.set(r.id, await runSql(db, r.solution))
      return { db, schema: await schemaOf(db), expected }
    })
    lab.catch(() => LABS.delete(key))
    LABS.set(key, lab)
  }
  return lab
}

/** Descarta la base de datos de la misión (para «Restaurar»): la próxima vez se crea de nuevo. */
async function dropLab(key: string) {
  const lab = LABS.get(key)
  LABS.delete(key)
  try {
    await (await lab)?.db.close()
  } catch {
    /* ya estaba cerrada o no llegó a abrirse */
  }
}

// Borrador sin ejecutar: sobrevive a cambiar de herramienta.
const DRAFTS = new Map<string, string>()

/** Consola SQL con PostgreSQL real (curso «SQL desde cero»). */
export function SqlConsoleApp({ mission, state, dispatch }: Props) {
  const model = mission.sqlLab
  const saved = consoleState(mission, state)
  const draftKey = `${mission.courseKey}:${mission.id}:${state.seed}`
  const [sql, setSql] = useState(() => DRAFTS.get(draftKey) ?? saved.sql)
  const [lab, setLab] = useState<Lab | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState<SqlResult | null>(null)
  const [verdicts, setVerdicts] = useState<Record<string, RetoVerdict>>({})
  const [openTables, setOpenTables] = useState<Record<string, boolean>>({})
  const [hints, setHints] = useState<Record<string, boolean>>({})
  const [pending, setPending] = useState(false)
  const [generation, setGeneration] = useState(0)
  const editor = useRef<CodeEditorHandle>(null)

  useEffect(() => {
    if (!model) return
    let alive = true
    labFor(`${mission.courseKey}:${mission.id}`, model).then(
      (l) => alive && setLab(l),
      (e) => alive && setLoadError(String(e)),
    )
    return () => {
      alive = false
    }
  }, [model, mission.courseKey, mission.id, generation])

  if (!model) return null
  const retos = visibleRetos(mission, state)
  const result = live ?? saved.last?.result ?? null
  const locked = state.finished

  const change = (v: string) => {
    setSql(v)
    DRAFTS.set(draftKey, v)
  }

  const run = async () => {
    if (!lab || busy || locked) return
    setBusy(true)
    try {
      const r = await runSql(lab.db, sql)
      const vs: RetoVerdict[] = []
      for (const reto of retos) vs.push(await checkReto(lab.db, reto, r, sql, lab.expected))
      setLive(r)
      setVerdicts(Object.fromEntries(vs.map((v) => [v.id, v])))
      if (!model.readOnly) {
        setPending(await pendingTransaction(lab.db))
        // CREATE/DROP TABLE cambian el esquema: el explorador se actualiza.
        lab.schema = await schemaOf(lab.db).catch(() => lab.schema)
      }
      const { event } = runEvent(mission, state, sql, r, vs)
      dispatch({ type: 'app', event })
    } finally {
      setBusy(false)
    }
  }

  const restore = async () => {
    if (!lab || busy || locked) return
    setBusy(true)
    try {
      await dropLab(`${mission.courseKey}:${mission.id}`)
      setLab(null)
      setLive(null)
      setVerdicts({})
      setPending(false)
      setGeneration((g) => g + 1)
      dispatch({ type: 'app', event: restoreEvent(mission, state).event })
    } finally {
      setBusy(false)
    }
  }

  const doneCount = retos.filter((r) => state.flags[`reto.${r.id}`]).length

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0f14] text-slate-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#11161d] px-3 py-2 text-sm">
        <Database className="h-4 w-4 text-sky-300" aria-hidden />
        <span className="font-mono text-xs text-slate-400">kobalto · PostgreSQL · {model.readOnly ? 'réplica de solo lectura' : 'entorno de pruebas'}</span>
        {pending && (
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300" role="status">
            Transacción abierta: COMMIT o ROLLBACK
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          Encargos: {doneCount}/{retos.length}
        </span>
        {!model.readOnly && (
          <button
            type="button"
            onClick={restore}
            disabled={!lab || busy || locked}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-40"
            title="Vuelve a los datos de partida"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar la base de datos · {model.restoreCost ?? 5} min
          </button>
        )}
        <button
          type="button"
          onClick={run}
          disabled={!lab || busy || locked}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
          title="Ctrl/Cmd + Enter"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Ejecutar · {model.runCost} min
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[13rem_minmax(0,1fr)_19rem]">
        <nav aria-label="Esquema de la base de datos" className="hidden min-h-0 overflow-y-auto border-r border-white/10 bg-[#0e131a] py-2 text-xs lg:block">
          <p className="px-3 pb-1 font-semibold uppercase tracking-wide text-slate-500">Tablas</p>
          {!lab && !loadError && <p className="px-3 text-slate-500">Cargando…</p>}
          {lab?.schema.map((t) => (
            <div key={t.table}>
              <button
                type="button"
                onClick={() => setOpenTables((o) => ({ ...o, [t.table]: !o[t.table] }))}
                className="flex w-full items-center gap-1.5 px-3 py-1 text-left text-slate-200 hover:bg-white/5"
                aria-expanded={!!openTables[t.table]}
              >
                {openTables[t.table] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Table2 className="h-3.5 w-3.5 text-sky-300" />
                <span className="font-mono">{t.table}</span>
              </button>
              {openTables[t.table] && (
                <ul className="pb-1">
                  {t.columns.map((c) => (
                    <li key={c.name}>
                      <button
                        type="button"
                        onClick={() => editor.current?.insert(c.name)}
                        className="flex w-full justify-between gap-2 py-0.5 pl-9 pr-3 text-left font-mono text-slate-300 hover:bg-white/5"
                        title={`Insertar ${c.name}`}
                      >
                        <span>{c.name}</span>
                        <span className="text-[10px] text-slate-500">{c.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="min-h-[9rem] flex-[0_0_40%] overflow-auto border-b border-white/10">
            <CodeEditor ref={editor} path="consulta.sql" value={sql} onChange={change} onRun={run} readOnly={locked} label="Consulta SQL" />
          </div>
          <div className="min-h-0 flex-1 overflow-auto" aria-live="polite">
            {loadError ? (
              <p className="p-4 text-sm text-rose-300">No se pudo arrancar la base de datos. Recarga la página.</p>
            ) : !lab ? (
              <p className="flex items-center gap-2 p-4 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Arrancando PostgreSQL…
              </p>
            ) : !result ? (
              <p className="p-4 text-sm text-slate-400">Escribe una consulta y pulsa «Ejecutar» (o Ctrl/Cmd + Enter).</p>
            ) : (
              <ResultView result={result} partial={!live && !!saved.last} />
            )}
          </div>
        </section>

        <aside aria-label="Encargos" className="min-h-0 overflow-y-auto border-t border-white/10 bg-[#0e131a] p-3 lg:border-l lg:border-t-0">
          <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Encargos</p>
          {retos.length === 0 && <p className="text-xs text-slate-500">Todavía no te han pedido nada. Revisa el correo y el chat.</p>}
          <ol className="space-y-2">
            {retos.map((r) => {
              const done = !!state.flags[`reto.${r.id}`]
              const reason = verdicts[r.id]?.reason
              return (
                <li key={r.id} className={`rounded-lg border p-2.5 text-xs ${done ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                  <p className="flex items-start gap-2 font-semibold text-slate-100">
                    {done ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-label="Cumplido" /> : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-label="Pendiente" />}
                    <span>{r.title}</span>
                  </p>
                  {r.from && <p className="mt-0.5 pl-5 text-[11px] text-slate-500">Lo pide {npcOf(mission, r.from).name}</p>}
                  <RichText text={r.description} className="mt-1 pl-5 text-slate-300" />
                  {reason && !done && <p className="mt-1 pl-5 text-amber-300">{reason}</p>}
                  {!done && r.hint && (
                    <button type="button" onClick={() => setHints((h) => ({ ...h, [r.id]: !h[r.id] }))} className="mt-1.5 inline-flex items-center gap-1 pl-5 text-[11px] text-sky-300 hover:underline" aria-expanded={!!hints[r.id]}>
                      <Lightbulb className="h-3 w-3" /> {hints[r.id] ? 'Ocultar pista' : 'Ver pista'}
                    </button>
                  )}
                  {hints[r.id] && !done && <RichText text={r.hint} className="mt-1 pl-5 text-slate-400" />}
                </li>
              )
            })}
          </ol>
        </aside>
      </div>
    </div>
  )
}

function ResultView({ result, partial }: { result: SqlResult; partial: boolean }) {
  if (!result.ok) {
    return (
      <div className="p-4 text-sm" role="alert">
        <p className="font-semibold text-rose-300">{result.error?.message}</p>
        {result.error && result.error.original !== result.error.message && <p className="mt-1 font-mono text-xs text-slate-500">PostgreSQL: {result.error.original}</p>}
      </div>
    )
  }
  if (result.columns.length === 0) {
    return <p className="p-4 text-sm text-emerald-300">{result.command || 'SQL'} ejecutado · {result.rowCount} filas afectadas.</p>
  }
  return (
    <div>
      <p className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0f14] px-3 py-1.5 text-xs text-slate-400">
        {result.rowCount} {result.rowCount === 1 ? 'fila' : 'filas'} · {result.ms} ms{partial && result.rows.length < result.rowCount ? ` · se muestran las ${result.rows.length} primeras (ejecuta de nuevo para ver todas)` : ''}
      </p>
      <table className="w-full border-collapse text-left font-mono text-xs">
        <thead className="sticky top-7 bg-[#11161d] text-slate-300">
          <tr>
            {result.columns.map((c, i) => (
              <th key={`${c}-${i}`} className="whitespace-nowrap border-b border-white/10 px-3 py-1.5 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i} className="odd:bg-white/[0.02]">
              {row.map((v, j) => (
                <td key={j} className={`whitespace-nowrap border-b border-white/5 px-3 py-1 ${v === null ? 'italic text-slate-500' : 'text-slate-200'}`}>
                  {v === null ? 'NULL' : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
