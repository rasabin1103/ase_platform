import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  FACT_LABELS,
  INITIAL_VENDOR,
  conditionsFor,
  contextFor,
  costItemsFor,
  criteriaFor,
  factLabels,
  optionsFor,
  pilotsFor,
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
const k = (n: number, lang: AcademyLang = 'es') => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.')} k€`

/** Evaluación de la plataforma de entornos y datos de prueba (curso 4, misión 5). */
export function KobaltoVendorApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-vendor'] as VendorState | undefined) ?? INITIAL_VENDOR
  const [tab, setTab] = useState<Tab>('needs')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished || app.sent
  const tabs: { id: Tab; label: string }[] = [
    { id: 'needs', label: t('Necesidades', 'Needs') },
    { id: 'options', label: t('Opciones', 'Options') },
    { id: 'cost', label: t('Coste a 3 años', '3-year cost') },
    { id: 'rec', label: t('Recomendación', 'Recommendation') },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('EVAL-012 · Plataforma de entornos efímeros y datos de prueba', 'EVAL-012 · Ephemeral environments and test data platform')}</span>
        <span>{app.sent ? t('Recomendación enviada', 'Recommendation sent') : t('En evaluación', 'Under evaluation')}</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label={t('Secciones', 'Sections')}>
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => setTab(x.id)}
              className={`rounded-full px-4 py-1.5 font-medium ${tab === x.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        {tab === 'needs' && <NeedsView app={app} send={send} locked={locked} lang={lang} />}
        {tab === 'options' && <OptionsView lang={lang} />}
        {tab === 'cost' && <CostView app={app} send={send} locked={locked} lang={lang} />}
        {tab === 'rec' && <RecView app={app} send={send} locked={locked} lang={lang} />}
      </div>
    </div>
  )
}

function NeedsView({ app, send, locked, lang }: { app: VendorState; send: Send; locked: boolean; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  return (
    <div className="space-y-4">
      <section className={card}>
        <h4 className="font-sans font-semibold text-slate-800">{t('El problema', 'The problem')}</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {contextFor(lang).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
      <section className={card}>
        <h4 className="font-sans font-semibold text-slate-800">{t('Criterios de evaluación', 'Evaluation criteria')}</h4>
        <p className="mt-1 text-slate-600">{t('Marca los criterios con los que compararás las tres opciones.', 'Tick the criteria you will use to compare the three options.')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {criteriaFor(lang).map((c) => {
            const on = app.criteria.includes(c.id)
            return (
              <label key={c.id} className={`flex items-start gap-3 rounded-lg border p-3 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="checkbox" className="mt-1" checked={on} disabled={locked} onChange={() => send(toggleCriterion(app, c.id, lang))} aria-label={t(`Criterio: ${c.text}`, `Criterion: ${c.text}`)} />
                <span>
                  {c.text}
                  {app.criteriaSaved && on && <span className={`mt-1 block text-xs font-medium ${c.good ? 'text-emerald-700' : 'text-rose-700'}`}>{(c.good ? '✓ ' : '✗ ') + c.why}</span>}
                </span>
              </label>
            )
          })}
        </div>
        <button type="button" className={`${button} mt-3`} disabled={locked || app.criteria.length < 3} onClick={() => send(saveCriteria(app, lang))}>
          {app.criteriaSaved ? t('Volver a guardar los criterios · 10 min', 'Save the criteria again · 10 min') : t('Guardar los criterios · 10 min', 'Save the criteria · 10 min')}
        </button>
      </section>
    </div>
  )
}

function OptionsView({ lang }: { lang: AcademyLang }) {
  const facts = Object.keys(FACT_LABELS) as FactId[]
  const OPTIONS = optionsFor(lang)
  const labels = factLabels(lang)
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
              <td className="p-3 font-medium text-slate-600">{labels[f]}</td>
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

function CostView({ app, send, locked, lang }: { app: VendorState; send: Send; locked: boolean; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const OPTIONS = optionsFor(lang)
  return (
    <section className={`${card} space-y-3`}>
      <p className="text-slate-600">{t('Raúl pide el coste a tres años. Elige qué partidas incluyes en la comparativa.', 'Raúl asks for the three-year cost. Choose which line items you include in the comparison.')}</p>
      <div className="flex flex-wrap gap-2">
        {costItemsFor(lang).map((c) => {
          const on = app.costItems.includes(c.id)
          return (
            <label key={c.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
              <input type="checkbox" checked={on} disabled={locked} onChange={() => send(toggleCost(app, c.id, lang))} aria-label={t(`Partida: ${c.label}`, `Line item: ${c.label}`)} />
              {c.label}
            </label>
          )
        })}
      </div>
      <table className="w-full text-left">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="p-2">{t('Partida', 'Line item')}</th>
            {OPTIONS.map((o) => (
              <th key={o.id} className="p-2 text-right">
                {o.name.split(' · ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {costItemsFor(lang).filter((c) => app.costItems.includes(c.id)).map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <td className="p-2">{c.label}</td>
              {OPTIONS.map((o) => (
                <td key={o.id} className="p-2 text-right font-mono">
                  {k(totalCost(o.id, [c.id]), lang)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t-2 border-slate-300 font-semibold">
            <td className="p-2">{t('Total a 3 años', '3-year total')}</td>
            {OPTIONS.map((o) => (
              <td key={o.id} className="p-2 text-right font-mono">
                {k(totalCost(o.id, app.costItems), lang)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <button type="button" className={button} disabled={locked || app.costItems.length === 0} onClick={() => send(saveTco(app, lang))}>
        {app.tcoSaved ? t('Volver a guardar la comparativa · 15 min', 'Save the comparison again · 15 min') : t('Guardar la comparativa de coste · 15 min', 'Save the cost comparison · 15 min')}
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

function RecView({ app, send, locked, lang }: { app: VendorState; send: Send; locked: boolean; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const OPTIONS = optionsFor(lang)
  if (!app.criteriaSaved || !app.tcoSaved)
    return <p className={`${card} text-slate-600`}>{t('Guarda antes los criterios de evaluación y la comparativa de coste: la recomendación se apoya en ellos.', 'First save the evaluation criteria and the cost comparison: the recommendation is based on them.')}</p>
  return (
    <div className="space-y-4">
      <fieldset className={card}>
        <legend className="px-1 font-sans font-semibold text-slate-800">{t('Opción que recomiendas', 'Option you recommend')}</legend>
        <div className="space-y-2">
          {OPTIONS.map((o) => (
            <Choice key={o.id} name="vendor-option" text={`${o.name} · ${k(totalCost(o.id, app.costItems), lang)} ${t('en tu comparativa', 'in your comparison')}`} checked={app.option === o.id} disabled={locked} onChange={() => send(chooseOption(app, o.id, lang))} label={t(`Recomendar: ${o.name}`, `Recommend: ${o.name}`)} />
          ))}
        </div>
      </fieldset>
      <fieldset className={card}>
        <legend className="px-1 font-sans font-semibold text-slate-800">{t('Piloto', 'Pilot')}</legend>
        <div className="space-y-2">
          {pilotsFor(lang).map((p) => (
            <Choice key={p.id} name="vendor-pilot" text={p.text} checked={app.pilot === p.id} disabled={locked} onChange={() => send(choosePilot(app, p.id, lang))} label={t(`Piloto: ${p.text}`, `Pilot: ${p.text}`)} />
          ))}
        </div>
      </fieldset>
      <fieldset className={card}>
        <legend className="px-1 font-sans font-semibold text-slate-800">{t('Condiciones', 'Conditions')}</legend>
        <div className="space-y-2">
          {conditionsFor(lang).map((c) => (
            <Choice key={c.id} name="" text={c.text} checked={app.conditions.includes(c.id)} disabled={locked} onChange={() => send(toggleCondition(app, c.id, lang))} label={t(`Condición: ${c.text}`, `Condition: ${c.text}`)} />
          ))}
        </div>
      </fieldset>
      {!app.sent ? (
        <button type="button" className={button} disabled={!canSend(app) || locked} onClick={() => send(sendRecommendation(app, lang))}>
          {t('Enviar la recomendación a Raúl · 20 min', 'Send the recommendation to Raúl · 20 min')}
        </button>
      ) : (
        <p className="text-sm text-slate-600">{t('Recomendación enviada a Raúl para el comité.', 'Recommendation sent to Raúl for the committee.')}</p>
      )}
    </div>
  )
}
