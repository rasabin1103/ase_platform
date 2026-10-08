import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  DIM_LABEL,
  FEATURE_FLAGS,
  INITIAL_INCIDENT,
  VALUES,
  affected,
  disableFlag,
  globalRate,
  query,
  reproduce,
  rollback,
  type Dim,
  type Filters,
  type IncidentState,
  type ReproInput,
} from './incidentLogic'

const DIMS = Object.keys(DIM_LABEL) as Dim[]

/** Consola de observabilidad de producción durante el incidente. */
export function KobaltoIncidentApp({ dispatch, state }: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const app = (state.appState['kobalto-incident'] as IncidentState | undefined) ?? INITIAL_INCIDENT
  const { activeBugs: active, fixedBugs: fixed } = state
  const [filters, setFilters] = useState<Filters>({})
  const [by, setBy] = useState<Dim>('endpoint')
  const [repro, setRepro] = useState<ReproInput>({ endpoint: 'instant', os: 'android', version: '5.1.0', amount: 'low', account: 'new' })
  const mitigated = app.rolledBack || app.flagsOff.includes('instant_fees_v2')
  const cause = active.find((b) => b === 'I1' || b === 'I1b') ?? 'none'
  const rate = globalRate(cause, mitigated)
  const hurt = affected(app, state.clock, active)

  const send = (r: { state: IncidentState; event: AppEvent }) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const sel = 'rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900'

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm font-semibold text-white ${mitigated ? 'bg-amber-600' : 'bg-red-700'}`}>
        <span>{mitigated ? '🟠 INCIDENTE MITIGADO · pendiente de causa raíz y fix' : '🔴 INCIDENTE ABIERTO · producción · desde las 09:00'}</span>
        <span>
          Error en la API de pagos: {rate.toString().replace('.', ',')} % · clientes afectados (estimado): {hurt}
        </span>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 p-5 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-sans text-sm font-semibold text-slate-900">Desglose de errores (última hora)</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Filtros:</span>
            {Object.keys(filters).length === 0 && <span className="text-slate-400">ninguno</span>}
            {(Object.keys(filters) as Dim[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFilters((f) => Object.fromEntries(Object.entries(f).filter(([k]) => k !== d)))}
                className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-800 hover:bg-indigo-200"
              >
                {DIM_LABEL[d]}: {VALUES[d].find((v) => v.id === filters[d])?.label} ✕
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1">
              Desglosar por
              <select aria-label="Desglosar por" className={sel} value={by} onChange={(e) => setBy(e.target.value as Dim)}>
                {DIMS.filter((d) => !filters[d]).map((d) => (
                  <option key={d} value={d}>
                    {DIM_LABEL[d]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => send(query(app, by, filters, active, fixed))}
              className="rounded-lg bg-indigo-700 px-3 py-1.5 font-semibold text-white hover:bg-indigo-800"
            >
              Consultar · 3 min
            </button>
          </div>
          {app.lastQuery && (
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1">{DIM_LABEL[app.lastQuery.by]}</th>
                  <th className="py-1 text-right">Peticiones</th>
                  <th className="py-1 text-right">Errores</th>
                  <th className="py-1 text-right">Tasa</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {app.lastQuery.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5">{r.label}</td>
                    <td className="py-1.5 text-right">{r.requests.toLocaleString('es-ES')}</td>
                    <td className="py-1.5 text-right">{r.errors.toLocaleString('es-ES')}</td>
                    <td className={`py-1.5 text-right font-semibold ${r.rate > 2 ? 'text-red-700' : 'text-slate-700'}`}>{r.rate.toString().replace('.', ',')} %</td>
                    <td className="py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => setFilters({ ...app.lastQuery!.filters, [app.lastQuery!.by]: r.id })}
                        className="rounded border border-slate-300 px-1.5 text-[11px] hover:bg-slate-50"
                      >
                        Filtrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-[11px] text-slate-400">Consejo: desglosa, filtra lo que destaca y vuelve a desglosar por otra dimensión.</p>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-sans text-sm font-semibold text-slate-900">Mitigación</h3>
            <ul className="space-y-1.5 text-xs">
              {FEATURE_FLAGS.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2">
                  <span className="font-mono">{f.label}</span>
                  {app.flagsOff.includes(f.id) ? (
                    <span className="text-slate-500">desactivado</span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Desactivar ${f.id}`}
                      onClick={() => send(disableFlag(app, f.id, state.clock, active, fixed))}
                      className="shrink-0 rounded border border-red-300 px-1.5 py-0.5 text-red-700 hover:bg-red-50"
                    >
                      Desactivar · 5 min
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={app.rolledBack}
              onClick={() => send(rollback(app, state.clock))}
              className="mt-3 w-full rounded-lg border border-slate-300 py-1.5 text-xs text-slate-800 hover:bg-slate-50 disabled:opacity-40"
            >
              {app.rolledBack ? 'Rollback hecho (5.0.3)' : 'Rollback del backend a 5.0.3 · 40 min'}
            </button>
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-sans text-sm font-semibold text-slate-900">Reproducir en staging</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DIMS.map((d) => (
                <label key={d} className="block">
                  <span className="mb-0.5 block text-slate-500">{DIM_LABEL[d]}</span>
                  <select aria-label={`Staging ${DIM_LABEL[d]}`} className={`${sel} w-full`} value={repro[d]} onChange={(e) => setRepro((r) => ({ ...r, [d]: e.target.value }))}>
                    {VALUES[d].map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => send(reproduce(app, repro, active, fixed))}
              className="mt-3 w-full rounded-lg bg-slate-800 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
            >
              Ejecutar en staging · 5 min
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
