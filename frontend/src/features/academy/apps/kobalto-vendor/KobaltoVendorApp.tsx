import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  CONDITIONS,
  CONTEXT,
  COST_ITEMS,
  CRITERIA,
  FACT_LABELS,
  INITIAL_VENDOR,
  OPTIONS,
  PILOTS,
  canSend,
  chooseOption,
  choosePilot,
  saveCriteria,
  saveTco,
  sendRecommendation,
  toggleCondition,
  toggleCost,
  toggleCriterion,
  totalCost,
  type FactId,
  type VendorState,
} from './vendorLogic'

type Send = (r: { state: VendorState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'needs' | 'options' | 'cost' | 'rec'

const card = 'rounded-2xl bg-white p-4 text-sm shadow-sm'
const button = 'rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40'
const k = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} k€`

/** Evaluación de la plataforma de entornos y datos de prueba (curso 4, misión 5). */
export function KobaltoVendorApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-vendor'] as VendorState | undefined) ?? INITIAL_VENDOR
  const [tab, setTab] = useState<Tab>('needs')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished || app.sent
  const tabs: { id: Tab; label: string }[] = [
    { id: 'needs', label: 'Necesidades' },
    { id: 'options', label: 'Opciones' },
    { id: 'cost', label: 'Coste a 3 años' },
    { id: 'rec', label: 'Recomendación' },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>EVAL-012 · Plataforma de entornos efímeros y datos de prueba</span>
        <span>{app.sent ? 'Recomendación enviada' : 'En evaluación'}</span>
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
        {tab === 'needs' && <NeedsView app={app} send={send} locked={locked} />}
        {tab === 'options' && <OptionsView />}
        {tab === 'cost' && <CostView app={app} send={send} locked={locked} />}
        {tab === 'rec' && <RecView app={app} send={send} locked={locked} />}
      </div>
    </div>
  )
}

function NeedsView({ app, send, locked }: { app: VendorState; send: Send; locked: boolean }) {
  return (
    <div className="space-y-4">
      <section className={card}>
        <h4 className="font-sans font-semibold text-slate-800">El problema</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {CONTEXT.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
      <section className={card}>
        <h4 className="font-sans font-semibold text-slate-800">Criterios de evaluación</h4>
        <p className="mt-1 text-slate-600">Marca los criterios con los que compararás las tres opciones.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {CRITERIA.map((c) => {
            const on = app.criteria.includes(c.id)
            return (
              <label key={c.id} className={`flex items-start gap-3 rounded-lg border p-3 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="checkbox" className="mt-1" checked={on} disabled={locked} onChange={() => send(toggleCriterion(app, c.id))} aria-label={`Criterio: ${c.text}`} />
                <span>
                  {c.text}
                  {app.criteriaSaved && on && <span className={`mt-1 block text-xs font-medium ${c.good ? 'text-emerald-700' : 'text-rose-700'}`}>{(c.good ? '✓ ' : '✗ ') + c.why}</span>}
                </span>
              </label>
            )
          })}
        </div>
        <button type="button" className={`${button} mt-3`} disabled={locked || app.criteria.length < 3} onClick={() => send(saveCriteria(app))}>
          {app.criteriaSaved ? 'Volver a guardar los criterios · 10 min' : 'Guardar los criterios · 10 min'}
        </button>
      </section>
    </div>
  )
}

function OptionsView() {
  const facts = Object.keys(FACT_LABELS) as FactId[]
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="p-3" />
            {OPTIONS.map((o) => (
              <th key={o.id} className="p-3 text-slate-800">
                {o.name}
                <span className="mt-1 block font-normal text-slate-500">{o.summary}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {facts.map((f) => (
            <tr key={f} className="border-t border-slate-100">
              <td className="p-3 font-medium text-slate-600">{FACT_LABELS[f]}</td>
              {OPTIONS.map((o) => (
                <td key={o.id} className="p-3">
                  {o.facts[f]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CostView({ app, send, locked }: { app: VendorState; send: Send; locked: boolean }) {
  return (
    <section className={`${card} space-y-3`}>
      <p className="text-slate-600">Raúl pide el coste a tres años. Elige qué partidas incluyes en la comparativa.</p>
      <div className="flex flex-wrap gap-2">
        {COST_ITEMS.map((c) => {
          const on = app.costItems.includes(c.id)
          return (
            <label key={c.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
              <input type="checkbox" checked={on} disabled={locked} onChange={() => send(toggleCost(app, c.id))} aria-label={`Partida: ${c.label}`} />
              {c.label}
            </label>
          )
        })}
      </div>
      <table className="w-full text-left">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="p-2">Partida</th>
            {OPTIONS.map((o) => (
              <th key={o.id} className="p-2 text-right">
                {o.name.split(' · ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COST_ITEMS.filter((c) => app.costItems.includes(c.id)).map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="p-2">{c.label}</td>
              {OPTIONS.map((o) => (
                <td key={o.id} className="p-2 text-right font-mono">
                  {k(totalCost(o.id, [c.id]))}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t-2 border-slate-300 font-semibold">
            <td className="p-2">Total a 3 años</td>
            {OPTIONS.map((o) => (
              <td key={o.id} className="p-2 text-right font-mono">
                {k(totalCost(o.id, app.costItems))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <button type="button" className={button} disabled={locked || app.costItems.length === 0} onClick={() => send(saveTco(app))}>
        {app.tcoSaved ? 'Volver a guardar la comparativa · 15 min' : 'Guardar la comparativa de coste · 15 min'}
      </button>
    </section>
  )
}

function Choice({ name, text, checked, disabled, onChange, label, note }: { name: string; text: string; checked: boolean; disabled: boolean; onChange: () => void; label: string; note?: string }) {
  return (
    <label className={`flex items-start gap-3 rounded-lg border p-3 ${checked ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
      <input type={name ? 'radio' : 'checkbox'} name={name || undefined} className="mt-1" checked={checked} disabled={disabled} onChange={onChange} aria-label={label} />
      <span>
        {text}
        {note}
      </span>
    </label>
  )
}

function RecView({ app, send, locked }: { app: VendorState; send: Send; locked: boolean }) {
  if (!app.criteriaSaved || !app.tcoSaved)
    return <p className={`${card} text-slate-600`}>Guarda antes los criterios de evaluación y la comparativa de coste: la recomendación se apoya en ellos.</p>
  return (
    <div className="space-y-4">
      <fieldset className={card}>
        <legend className="px-1 font-sans font-semibold text-slate-800">Opción que recomiendas</legend>
        <div className="space-y-2">
          {OPTIONS.map((o) => (
            <Choice key={o.id} name="vendor-option" text={`${o.name} · ${k(totalCost(o.id, app.costItems))} en tu comparativa`} checked={app.option === o.id} disabled={locked} onChange={() => send(chooseOption(app, o.id))} label={`Recomendar: ${o.name}`} />
          ))}
        </div>
      </fieldset>
      <fieldset className={card}>
        <legend className="px-1 font-sans font-semibold text-slate-800">Piloto</legend>
        <div className="space-y-2">
          {PILOTS.map((p) => (
            <Choice key={p.id} name="vendor-pilot" text={p.text} checked={app.pilot === p.id} disabled={locked} onChange={() => send(choosePilot(app, p.id))} label={`Piloto: ${p.text}`} />
          ))}
        </div>
      </fieldset>
      <fieldset className={card}>
        <legend className="px-1 font-sans font-semibold text-slate-800">Condiciones</legend>
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <Choice key={c.id} name="" text={c.text} checked={app.conditions.includes(c.id)} disabled={locked} onChange={() => send(toggleCondition(app, c.id))} label={`Condición: ${c.text}`} />
          ))}
        </div>
      </fieldset>
      {!app.sent ? (
        <button type="button" className={button} disabled={!canSend(app) || locked} onClick={() => send(sendRecommendation(app))}>
          Enviar la recomendación a Raúl · 20 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">Recomendación enviada a Raúl para el comité.</p>
      )}
    </div>
  )
}
