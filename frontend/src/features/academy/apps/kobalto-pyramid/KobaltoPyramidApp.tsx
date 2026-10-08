import { useState } from 'react'
import type { RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { CHECKS, EFFORT, INITIAL_PLAN, LEVEL_LABEL, implement, metrics, submitPlan, type Level, type PlanState } from './pyramidLogic'

const LEVELS: Level[] = ['unit', 'api', 'e2e', 'manual', 'perf']
const BAR: { level: Level; cls: string }[] = [
  { level: 'e2e', cls: 'bg-rose-500' },
  { level: 'api', cls: 'bg-amber-500' },
  { level: 'unit', cls: 'bg-emerald-500' },
]

/** Planificador de pruebas de KOB-190: decidir en qué nivel vive cada comprobación. */
export function KobaltoPyramidApp({ dispatch, state }: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const app = (state.appState['kobalto-pyramid'] as PlanState | undefined) ?? INITIAL_PLAN
  const build = { active: state.activeBugs, fixed: state.fixedBugs }
  const [choice, setChoice] = useState<Record<string, Level | ''>>({})
  const m = metrics(app)
  const max = Math.max(1, m.counts.unit, m.counts.api, m.counts.e2e)

  const go = (id: string) => {
    const level = choice[id] || app.entries[id]?.level
    if (!level) return
    const r = implement(app, id, level, state.build, build)
    dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>⚠ STAGING · Planificador de pruebas · KOB-190 «Dividir un gasto»</span>
        <span>build 5.2.0-dev{1 + state.build}</span>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 p-5 lg:grid-cols-[1fr_18rem]">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-1 font-sans text-sm font-semibold text-slate-900">Comprobaciones de KOB-190</h3>
          <p className="mb-3 text-xs text-slate-500">
            Elige el nivel de cada comprobación y escríbela (o ejecútala, si es manual). Coste: unitaria {EFFORT.unit} min · API {EFFORT.api} · E2E {EFFORT.e2e} · manual{' '}
            {EFFORT.manual} · rendimiento {EFFORT.perf}.
          </p>
          <ul className="divide-y divide-slate-100">
            {CHECKS.map((c) => {
              const e = app.entries[c.id]
              const sel = choice[c.id] ?? e?.level ?? ''
              const same = e && sel === e.level
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="w-10 font-mono text-xs text-indigo-700">{c.id}</span>
                  <span className="min-w-[14rem] flex-1 text-slate-800">{c.title}</span>
                  {e && (
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${e.result === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {LEVEL_LABEL[e.level]} · {e.result === 'pass' ? 'pasa' : 'falla'}
                    </span>
                  )}
                  <select
                    aria-label={`Nivel de ${c.id}`}
                    value={sel}
                    onChange={(ev) => setChoice((x) => ({ ...x, [c.id]: ev.target.value as Level | '' }))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="">Nivel…</option>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {LEVEL_LABEL[l]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!sel}
                    onClick={() => go(c.id)}
                    aria-label={`Escribir ${c.id}`}
                    className="rounded-lg border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-50 disabled:opacity-40"
                  >
                    {!sel ? 'Escribir' : sel === 'manual' ? 'Ejecutar' : same ? 'Relanzar' : 'Escribir'} · {sel ? (same ? Math.ceil(EFFORT[sel] / 4) : EFFORT[sel]) : '—'} min
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-sans text-sm font-semibold text-slate-900">Forma de tu suite automática</h3>
            <div className="space-y-1.5">
              {BAR.map((b) => (
                <div key={b.level} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-slate-500">{LEVEL_LABEL[b.level].split(' ')[0]}</span>
                  <div className="flex flex-1 justify-center">
                    <div className={`h-5 rounded ${b.cls}`} style={{ width: `${Math.max(4, (m.counts[b.level] / max) * 100)}%` }} />
                  </div>
                  <span className="w-5 text-right font-semibold">{m.counts[b.level]}</span>
                </div>
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2">
                <dt className="text-slate-500">CI por ejecución</dt>
                <dd className={`font-semibold ${m.ciMinutes > 15 ? 'text-red-700' : ''}`}>{m.ciMinutes} min</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <dt className="text-slate-500">Fallos intermitentes</dt>
                <dd className={`font-semibold ${m.flakyRate > 10 ? 'text-red-700' : ''}`}>{m.flakyRate} %</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <dt className="text-slate-500">Manuales</dt>
                <dd className="font-semibold">{m.counts.manual}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <dt className="text-slate-500">Rendimiento</dt>
                <dd className="font-semibold">{m.counts.perf}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                const r = submitPlan(app)
                dispatch({ type: 'app', event: { ...r.event, state: r.state } })
              }}
              className="mt-4 w-full rounded-lg bg-indigo-700 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
            >
              Enviar el plan a Laura · 5 min
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
