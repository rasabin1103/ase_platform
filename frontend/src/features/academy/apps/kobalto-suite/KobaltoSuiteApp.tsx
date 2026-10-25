import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  BASELINE_GREEN,
  DECISION_LABEL,
  INITIAL_SUITE,
  INVESTIGATE_COST,
  TESTS,
  applyDecisions,
  decide,
  decisionCost,
  evaluateDecisions,
  investigate,
  projectedGreen,
  publishReport,
  type Decision,
  type SuiteState,
} from './suiteLogic'

type Send = (r: { state: SuiteState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'flaky' | 'report'

const DECISIONS = Object.keys(DECISION_LABEL) as Decision[]

/** Salud de la suite de regresión de Tarjetas (curso 4, misión 2). */
export function KobaltoSuiteApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-suite'] as SuiteState | undefined) ?? INITIAL_SUITE
  const [tab, setTab] = useState<Tab>('flaky')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished
  const tabs: { id: Tab; label: string }[] = [
    { id: 'flaky', label: 'Tests inestables' },
    { id: 'report', label: 'Informe para los squads' },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Pipeline de regresión · últimos 30 días</span>
        <span>
          En verde: {app.applied ? projectedGreen(app.decisions) : BASELINE_GREEN} %{app.applied ? ' (estimado tras tus cambios)' : ''}
        </span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label="Secciones">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 font-medium ${tab === t.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'flaky' ? <FlakyView app={app} send={send} locked={locked} /> : <ReportView app={app} send={send} locked={locked} />}
      </div>
    </div>
  )
}

function FlakyView({ app, send, locked }: { app: SuiteState; send: Send; locked: boolean }) {
  const r = evaluateDecisions(app.decisions)
  const cost = TESTS.reduce((n, t) => n + (app.decisions[t.id] ? decisionCost(t, app.decisions[t.id] as Decision) : 0), 0)
  return (
    <section className="space-y-3">
      <p className="text-sm text-slate-600">
        Estos ocho tests provocan el 90 % de los rojos. Antes de decidir qué hacer con cada uno, investiga por qué falla ({INVESTIGATE_COST} min cada uno).
      </p>
      <ul className="space-y-2">
        {TESTS.map((t) => {
          const known = app.investigated.includes(t.id)
          const d = app.decisions[t.id] ?? ''
          return (
            <li key={t.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span>
                  <span className="font-mono text-xs text-indigo-700">{t.id}</span> · <strong className="font-mono">{t.name}</strong>
                  <span className="block text-xs text-slate-500">
                    Squad {t.squad} · en rojo el {t.failRate} % de las veces · {t.durationMin} min · {t.bugsFound} bugs reales detectados en un año
                  </span>
                </span>
                {!known ? (
                  <button type="button" disabled={locked} onClick={() => send(investigate(app, t.id))} className="rounded-lg border border-indigo-300 px-3 py-1 text-xs font-medium text-indigo-800 disabled:opacity-40">
                    Investigar · {INVESTIGATE_COST} min
                  </button>
                ) : (
                  <select
                    aria-label={`Decisión para ${t.name}`}
                    value={d}
                    disabled={locked || app.applied}
                    onChange={(e) => send(decide(app, t.id, e.target.value as Decision | ''))}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="">— Decide —</option>
                    {DECISIONS.map((x) => (
                      <option key={x} value={x}>
                        {DECISION_LABEL[x]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {known && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-800">Causa: {t.cause}</p>}
              {app.applied && (
                <p className={`mt-1 text-xs font-medium ${d === t.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {d === t.correct ? '✓ ' : `✗ Mejor: ${DECISION_LABEL[t.correct]}. `}
                  {t.why}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      {!app.applied ? (
        <button type="button" disabled={locked || !r.complete} onClick={() => send(applyDecisions(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          Aplicar las decisiones · {cost} min
        </button>
      ) : (
        <p className="text-sm text-slate-600">
          Decisiones aplicadas: {r.right} de {TESTS.length} adecuadas.
        </p>
      )}
    </section>
  )
}

function ReportView({ app, send, locked }: { app: SuiteState; send: Send; locked: boolean }) {
  const squads = [...new Set(TESTS.map((t) => t.squad))]
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">Informe de salud de la suite</h4>
      <p className="text-sm text-slate-600">
        Un informe para todos los squads: qué tests fallan, por qué y quién es el dueño de cada uno. Necesitas haber investigado los ocho.
      </p>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-slate-500">
            <th className="py-1">Squad dueño</th>
            <th className="py-1">Tests</th>
          </tr>
        </thead>
        <tbody>
          {squads.map((sq) => (
            <tr key={sq} className="border-t border-slate-100">
              <td className="py-1 font-medium">{sq}</td>
              <td className="py-1 font-mono">
                {TESTS.filter((t) => t.squad === sq)
                  .map((t) => t.name)
                  .join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!app.reported ? (
        <button
          type="button"
          disabled={locked || app.investigated.length < TESTS.length}
          onClick={() => send(publishReport(app))}
          className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Publicar el informe para los squads · 15 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">Informe publicado en el canal de Ingeniería.</p>
      )}
    </section>
  )
}
