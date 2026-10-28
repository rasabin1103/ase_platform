import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import { INITIAL_PREP, MAX_EXAMPLES, chooseStep, contextFor, evaluatePrep, examplesFor, expectedFor, savePrep, stepsFor, toggleExample, type PrepState } from './oneOnOneLogic'

type Send = (r: { state: PrepState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'context' | 'examples' | 'script'

const card = 'rounded-2xl bg-white p-4 text-sm shadow-sm'

/** Preparación de la conversación difícil con Lucía (curso 4, misión 7). */
export function KobaltoOneOnOneApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-oneonone'] as PrepState | undefined) ?? INITIAL_PREP
  const [tab, setTab] = useState<Tab>('context')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished
  const r = evaluatePrep(app)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'context', label: 'Lucía' },
    { id: 'examples', label: `${t('Ejemplos', 'Examples')} (${app.examples.length}/${MAX_EXAMPLES})` },
    { id: 'script', label: t('Guion', 'Script') },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('1:1 · Lucía Campos · confidencial', '1:1 · Lucía Campos · confidential')}</span>
        <span>{app.saved ? t('Preparación guardada', 'Preparation saved') : t('Sin preparar', 'Not prepared')}</span>
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

        {tab === 'context' && (
          <div className="space-y-4">
            <section className={card}>
              <h4 className="font-sans font-semibold text-slate-800">{t('Lo que se espera de su puesto', 'What is expected in her role')}</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                {expectedFor(lang).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
            <section className={card}>
              <h4 className="font-sans font-semibold text-slate-800">{t('Lo que sabes', 'What you know')}</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                {contextFor(lang).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {tab === 'examples' && (
          <section className={`${card} space-y-2`}>
            <p className="text-slate-600">{t(`Elige los ${MAX_EXAMPLES} ejemplos que llevarás a la conversación.`, `Choose the ${MAX_EXAMPLES} examples you will bring to the conversation.`)}</p>
            {examplesFor(lang).map((e) => {
              const on = app.examples.includes(e.id)
              return (
                <label key={e.id} className={`flex items-start gap-3 rounded-lg border p-3 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="checkbox" className="mt-1" checked={on} disabled={locked} onChange={() => send(toggleExample(app, e.id, lang))} aria-label={t(`Ejemplo: ${e.text}`, `Example: ${e.text}`)} />
                  <span>
                    {e.text}
                    {app.saved && on && <span className={`mt-1 block text-xs font-medium ${e.good ? 'text-emerald-700' : 'text-rose-700'}`}>{(e.good ? '✓ ' : '✗ ') + e.why}</span>}
                  </span>
                </label>
              )
            })}
          </section>
        )}

        {tab === 'script' && (
          <div className="space-y-3">
            {stepsFor(lang).map((s) => (
              <fieldset key={s.id} className={card}>
                <legend className="px-1 font-sans font-semibold text-slate-800">{s.title}</legend>
                <div className="space-y-2">
                  {s.options.map((o) => {
                    const chosen = app.script[s.id] === o.id
                    return (
                      <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                        <input type="radio" name={`prep-${s.id}`} className="mt-1" checked={chosen} disabled={locked} onChange={() => send(chooseStep(app, s.id, o.id, lang))} aria-label={o.text} />
                        <span>
                          {o.text}
                          {app.saved && chosen && <span className={`mt-1 block text-xs font-medium ${o.good ? 'text-emerald-700' : 'text-rose-700'}`}>{(o.good ? '✓ ' : '✗ ') + o.why}</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        <button type="button" disabled={locked || !r.complete} onClick={() => send(savePrep(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {app.saved ? t('Volver a guardar la preparación · 20 min', 'Save the preparation again · 20 min') : t('Guardar la preparación · 20 min', 'Save the preparation · 20 min')}
        </button>
      </div>
    </div>
  )
}
