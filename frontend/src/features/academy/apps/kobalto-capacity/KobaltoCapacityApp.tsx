import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { AREA, BUDGET, INITIAL_CAPACITY, LEVERS, TARGET, evaluatePlan, savePlan, toggleLever, type CapacityState } from './capacityLogic'

type Send = (r: { state: CapacityState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }

const k = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} k€`

/** Plan de capacidad con un 20 % menos de presupuesto (curso 4, misión 9). */
export function KobaltoCapacityApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-capacity'] as CapacityState | undefined) ?? INITIAL_CAPACITY
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished || app.saved
  const r = evaluatePlan(app.levers)
  const pct = Math.min(100, Math.round((r.saving / TARGET) * 100))
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Plan de capacidad 2027 · QA Banca diaria</span>
        <span>{app.saved ? 'Enviado a Laura' : 'Borrador'}</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <h4 className="font-sans font-semibold text-slate-800">Tu área hoy</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            {AREA.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-4 text-sm shadow-sm" aria-label="Ahorro">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-sans font-semibold text-slate-800">
              Ahorro: {k(r.saving)} de {k(TARGET)}
            </span>
            <span className="text-xs text-slate-500">20 % de {k(BUDGET)}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200">
            <div className={`h-2 rounded-full ${r.target ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </section>

        <section className="space-y-2">
          {LEVERS.map((l) => {
            const on = app.levers.includes(l.id)
            return (
              <label key={l.id} className={`flex items-start gap-3 rounded-2xl border bg-white p-4 text-sm shadow-sm ${on ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-transparent'}`}>
                <input type="checkbox" className="mt-1" checked={on} disabled={locked} onChange={() => send(toggleLever(app, l.id))} aria-label={`Palanca: ${l.title}`} />
                <span className="flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-slate-900">{l.title}</span>
                    <span className="font-mono text-slate-700">−{k(l.saving)}</span>
                  </span>
                  <span className="mt-1 block text-slate-600">{l.impact}</span>
                  {app.saved && on && <span className={`mt-1 block text-xs font-medium ${l.kind === 'good' ? 'text-emerald-700' : 'text-rose-700'}`}>{(l.kind === 'good' ? '✓ ' : '✗ ') + l.why}</span>}
                </span>
              </label>
            )
          })}
        </section>

        {!app.saved ? (
          <button type="button" disabled={locked || app.levers.length === 0} onClick={() => send(savePlan(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            Enviar el plan de capacidad a Laura · 20 min
          </button>
        ) : (
          <p className="text-sm text-slate-600">Plan enviado. Laura lo llevará al comité.</p>
        )}
      </div>
    </div>
  )
}
