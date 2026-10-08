import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  CASES,
  DEV_EFFORT,
  HIST_RATIO,
  INITIAL_PLAN,
  QUADRANT_LABEL,
  QUAD_ITEMS,
  RISKS,
  SECTIONS,
  THREE_POINT,
  askLaura,
  edit,
  submit,
  type PlanState,
  type Quadrant,
  type RiskKind,
} from './planLogic'

type Send = (r: { state: PlanState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'plan' | 'risks' | 'estimate' | 'prio' | 'quad'

const TABS: { id: Tab; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'risks', label: 'Riesgos' },
  { id: 'estimate', label: 'Estimación' },
  { id: 'prio', label: 'Priorización' },
  { id: 'quad', label: 'Cuadrantes' },
]

/** Planificador de pruebas de la release de Kobalto Empresas. */
export function KobaltoPlanApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-plan'] as PlanState | undefined) ?? INITIAL_PLAN
  const [tab, setTab] = useState<Tab>('plan')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = !!app.submitted || !!state.flags['dev.started']
  const patch = (p: Partial<PlanState>, summary: string) => send(edit(app, p, summary))

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Plan de pruebas · Release Kobalto Empresas 1.0</span>
        <span>comité: 15:00</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label="Secciones del planificador">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-full px-4 py-1.5 font-medium ${tab === t.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'plan' && (
          <section className="space-y-3">
            {SECTIONS.map((s) => (
              <article key={s.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="font-sans text-base font-semibold text-slate-900">{s.label}</h3>
                <div className="mt-2 space-y-2" role="radiogroup" aria-label={s.label}>
                  {s.options.map((o, i) => (
                    <label key={i} className={`block cursor-pointer rounded-xl border p-3 text-sm ${app.sections[s.id] === i ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" className="mr-2" disabled={locked} checked={app.sections[s.id] === i} onChange={() => patch({ sections: { ...app.sections, [s.id]: i } }, `Plan: ${s.label}.`)} />
                      {o}
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === 'risks' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-sans text-base font-semibold text-slate-900">Riesgos de la release</h3>
            <p className="mt-1 text-sm text-slate-600">¿Afecta a la calidad de lo que entregamos (producto) o a cómo lo hacemos: plazos, personas, proveedores, entornos (proyecto)?</p>
            <ul className="mt-3 divide-y divide-slate-100">
              {RISKS.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="flex-1">{r.text}</span>
                  <select aria-label={`Tipo de riesgo ${r.id}`} disabled={locked} value={app.risks[r.id] ?? ''} onChange={(e) => patch({ risks: { ...app.risks, [r.id]: e.target.value as RiskKind | '' } }, `Riesgo ${r.id} clasificado.`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1">
                    <option value="">Elige…</option>
                    <option value="product">Riesgo de producto</option>
                    <option value="project">Riesgo de proyecto</option>
                  </select>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'estimate' && (
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-sans text-base font-semibold text-slate-900">Por ratio histórico</h3>
              <p className="mt-1 text-sm text-slate-600">
                En las tres últimas releases, el esfuerzo de pruebas fue el {Math.round(HIST_RATIO * 100)} % del de desarrollo. Desarrollo estima {DEV_EFFORT} persona-días.
              </p>
              <NumField label="Estimación por ratio (persona-días)" value={app.ratio} locked={locked} onCommit={(v) => patch({ ratio: v }, 'Estimación por ratio.')} />
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-sans text-base font-semibold text-slate-900">Tres puntos</h3>
              <p className="mt-1 text-sm text-slate-600">
                Optimista a = {THREE_POINT.a}, más probable m = {THREE_POINT.m}, pesimista b = {THREE_POINT.b} persona-días. E = (a + 4m + b) ÷ 6 y desviación estándar = (b − a) ÷ 6.
              </p>
              <NumField label="Estimación E (persona-días)" value={app.threeE} locked={locked} onCommit={(v) => patch({ threeE: v }, 'Estimación de tres puntos.')} />
              <NumField label="Desviación estándar" value={app.threeSD} locked={locked} onCommit={(v) => patch({ threeSD: v }, 'Desviación de tres puntos.')} />
            </article>
          </section>
        )}

        {tab === 'prio' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-sans text-base font-semibold text-slate-900">Orden de ejecución</h3>
            <p className="mt-1 text-sm text-slate-600">Primero lo de más riesgo, pero respetando las dependencias.</p>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Orden</th>
                  <th className="py-2">Caso</th>
                  <th className="py-2">Riesgo</th>
                  <th className="py-2">Depende de</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CASES.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2">
                      <select aria-label={`Orden de ${c.label}`} disabled={locked} value={app.order[c.id] ?? ''} onChange={(e) => patch({ order: { ...app.order, [c.id]: e.target.value ? Number(e.target.value) : null } }, `Orden de ${c.id}.`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1">
                        <option value="">—</option>
                        {CASES.map((_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 font-medium">{c.label}</td>
                    <td className="py-2">{c.risk}</td>
                    <td className="py-2 text-slate-500">{c.dependsOn ? CASES.find((x) => x.id === c.dependsOn)!.label : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === 'quad' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-sans text-base font-semibold text-slate-900">Cuadrantes de testing</h3>
            <p className="mt-1 text-sm text-slate-600">¿Están orientadas a tecnología o a negocio? ¿Apoyan al equipo mientras desarrolla o critican el producto terminado?</p>
            <ul className="mt-3 divide-y divide-slate-100">
              {QUAD_ITEMS.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="flex-1">{i.label}</span>
                  <select aria-label={`Cuadrante de ${i.label}`} disabled={locked} value={app.quadrants[i.id] ?? ''} onChange={(e) => patch({ quadrants: { ...app.quadrants, [i.id]: e.target.value as Quadrant | '' } }, `Cuadrante de ${i.id}.`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1">
                    <option value="">Elige…</option>
                    {(Object.keys(QUADRANT_LABEL) as Quadrant[]).map((q) => (
                      <option key={q} value={q}>
                        {QUADRANT_LABEL[q]}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </section>
        )}

        {app.feedback && !app.submitted && (
          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            <h4 className="font-sans font-semibold text-violet-900">Revisión de Laura</h4>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {app.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {app.submitted ? (
          <p className="text-sm font-medium text-emerald-700">✓ Plan enviado a Raúl para el comité de las 15:00.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={locked} onClick={() => send(askLaura(app))} className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-40">
              Pedir a Laura que revise · 10 min
            </button>
            <button type="button" disabled={locked} onClick={() => send(submit(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40">
              Enviar el plan a Raúl · 15 min
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NumField({ label, value, locked, onCommit }: { label: string; value: string; locked: boolean; onCommit: (v: string) => void }) {
  return (
    <label className="mt-3 block text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        key={value}
        aria-label={label}
        defaultValue={value}
        disabled={locked}
        inputMode="decimal"
        onBlur={(e) => e.target.value !== value && onCommit(e.target.value.slice(0, 10))}
        className="mt-1 block w-32 rounded-lg border border-slate-300 px-2 py-1 font-mono"
      />
    </label>
  )
}
