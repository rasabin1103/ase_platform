import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import { INITIAL_STRATEGY, MAX_METRICS, chooseSection, evaluateStrategy, factsFor, metricsFor, saveStrategy, sectionsFor, toggleMetric, type StrategyState } from './strategyLogic'

type Send = (r: { state: StrategyState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'facts' | 'metrics' | 'plan'

const card = 'rounded-2xl bg-white p-4 text-sm shadow-sm'
const verdict = (good: boolean, why: string) => <span className={`mt-1 block text-xs font-medium ${good ? 'text-emerald-700' : 'text-rose-700'}`}>{(good ? '✓ ' : '✗ ') + why}</span>

/** Estrategia de calidad a tres años para el comité de dirección (curso 4, misión 11). */
export function KobaltoStrategyApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-strategy'] as StrategyState | undefined) ?? INITIAL_STRATEGY
  const [tab, setTab] = useState<Tab>('facts')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished || app.saved
  const r = evaluateStrategy(app)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'facts', label: t('Situación', 'Situation') },
    { id: 'metrics', label: `${t('Métricas', 'Metrics')} (${app.metrics.length}/${MAX_METRICS})` },
    { id: 'plan', label: t('Estrategia', 'Strategy') },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('Estrategia de calidad 2028–2030 · comité de dirección', 'Quality strategy 2028–2030 · management committee')}</span>
        <span>{app.saved ? t('Lista para el ensayo', 'Ready for the rehearsal') : t('Borrador', 'Draft')}</span>
      </div>
      <div className="mx-auto max-w-4xl space-y-4 p-5">
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

        {tab === 'facts' && (
          <section className={card}>
            <h4 className="font-sans font-semibold text-slate-800">{t('Lo que sabes hoy', 'What you know today')}</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
              {factsFor(lang).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'metrics' && (
          <section className={`${card} space-y-2`}>
            <p className="text-slate-600">{t(`Elige las ${MAX_METRICS} métricas que llevarás al comité y que revisaréis cada trimestre.`, `Choose the ${MAX_METRICS} metrics you will take to the committee and review every quarter.`)}</p>
            {metricsFor(lang).map((m) => {
              const on = app.metrics.includes(m.id)
              return (
                <label key={m.id} className={`flex items-start gap-3 rounded-lg border p-3 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="checkbox" className="mt-1" checked={on} disabled={locked} onChange={() => send(toggleMetric(app, m.id, lang))} aria-label={t(`Métrica: ${m.text}`, `Metric: ${m.text}`)} />
                  <span>
                    {m.text}
                    {app.saved && on && verdict(m.good, m.why)}
                  </span>
                </label>
              )
            })}
          </section>
        )}

        {tab === 'plan' &&
          sectionsFor(lang).map((s) => (
            <fieldset key={s.id} className={card}>
              <legend className="px-1 font-sans font-semibold text-slate-800">{s.title}</legend>
              <div className="space-y-2">
                {s.options.map((o) => {
                  const chosen = app.choices[s.id] === o.id
                  return (
                    <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                      <input type="radio" name={`strategy-${s.id}`} className="mt-1" checked={chosen} disabled={locked} onChange={() => send(chooseSection(app, s.id, o.id, lang))} aria-label={o.text} />
                      <span>
                        {o.text}
                        {app.saved && chosen && verdict(o.good, o.why)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))}

        {!app.saved ? (
          <button type="button" disabled={locked || !r.complete} onClick={() => send(saveStrategy(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            {t('Guardar la estrategia · 30 min', 'Save the strategy · 30 min')}
          </button>
        ) : (
          <p className="text-sm text-slate-600">{t('Estrategia guardada. A las 16:00, ensayo con Irene.', 'Strategy saved. At 4:00 PM, rehearsal with Irene.')}</p>
        )}
      </div>
    </div>
  )
}
