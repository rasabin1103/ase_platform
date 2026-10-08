import { useState } from 'react'
import type { RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { AREAS, CASES, INITIAL_RELEASE, TOTAL_MINUTES, rerunCi, runCase, type ReleaseState } from './releaseLogic'

/** TestHub: regresión manual de la release 5.1 y estado de la integración continua. */
export function KobaltoReleaseApp({ dispatch, state }: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const app = (state.appState['kobalto-release'] as ReleaseState | undefined) ?? INITIAL_RELEASE
  const build = { active: state.activeBugs, fixed: state.fixedBugs, regressions: state.activeRegressions }
  const [open, setOpen] = useState<string | null>(null)
  const results = Object.entries(app.results)
  const executed = results.length
  const failed = results.filter(([, r]) => r.result === 'fail').length
  const spent = CASES.filter((c) => app.results[c.id]).reduce((n, c) => n + c.minutes, 0)
  const buildLabel = `5.1.0-rc${2 + state.build}`

  const run = (id: string) => {
    const r = runCase(app, id, state.build, build)
    dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>⚠ STAGING · TestHub · release 5.1 · ventana de despliegue hoy 19:00</span>
        <span>build {buildLabel}</span>
      </div>
      <header className="flex flex-wrap items-center justify-between gap-2 bg-indigo-800 px-5 py-3 text-white">
        <span className="text-lg font-bold tracking-tight">
          TestHub <span className="font-normal text-indigo-200">· Regresión manual 5.1</span>
        </span>
        <span className="text-sm text-indigo-100">
          {executed}/{CASES.length} ejecutados · {failed} fallos · {spent} de {TOTAL_MINUTES} min
        </span>
      </header>

      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <h3 className="font-sans text-sm font-semibold text-slate-900">Integración continua · build {buildLabel}</h3>
            <p className="text-sm text-slate-600">
              Suite automática: <span className="font-semibold text-emerald-700">212 pasan</span> ·{' '}
              {app.ciReruns > 0 ? (
                <span className="font-semibold text-emerald-700">0 fallan (test_export_csv_timeout pasó al relanzarlo)</span>
              ) : (
                <span className="font-semibold text-red-700">1 falla: test_export_csv_timeout</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const r = rerunCi(app)
              dispatch({ type: 'app', event: { ...r.event, state: r.state } })
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
          >
            Relanzar el test y ver su histórico · 5 min
          </button>
        </section>

        {AREAS.map((area) => (
          <section key={area} className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-sans text-sm font-semibold text-slate-900">{area}</h3>
            <ul className="divide-y divide-slate-100">
              {CASES.filter((c) => c.area === area).map((c) => {
                const r = app.results[c.id]
                const stale = r && r.build < state.build
                return (
                  <li key={c.id} className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setOpen(open === c.id ? null : c.id)} className="flex-1 text-left text-sm">
                        <span className="font-mono text-xs text-indigo-700">{c.id}</span> <span className="text-slate-800">{c.title}</span>
                      </button>
                      {r && (
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${r.result === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {r.result === 'pass' ? 'Pasa' : 'Falla'}
                          {stale ? ' · build anterior' : ''}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => run(c.id)}
                        aria-label={`Ejecutar ${c.id}`}
                        className="rounded-lg border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-50"
                      >
                        {r ? 'Repetir' : 'Ejecutar'} · {c.minutes} min
                      </button>
                    </div>
                    {(open === c.id || r?.result === 'fail') && (
                      <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                        <ol className="ml-4 list-decimal">
                          {c.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                        <p className="mt-1">
                          <span className="font-semibold">Esperado:</span> {c.expected}
                        </p>
                        {r?.actual && (
                          <p className="text-red-700">
                            <span className="font-semibold">Obtenido:</span> {r.actual}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
