import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import { INITIAL_PM, actionsFor, causesFor, evaluatePostmortem, timelineFor, savePostmortem, toggleAction, toggleCause, type Item, type PostmortemState } from './postmortemLogic'

type Send = (r: { state: PostmortemState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'timeline' | 'causes' | 'actions'

const card = 'rounded-2xl bg-white p-4 text-sm shadow-sm'

/** Postmortem sin culpables del incidente de transferencias duplicadas (curso 4, misión 10). */
export function KobaltoPostmortemApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-postmortem'] as PostmortemState | undefined) ?? INITIAL_PM
  const [tab, setTab] = useState<Tab>('timeline')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished || app.saved
  const r = evaluatePostmortem(app)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'timeline', label: t('Cronología', 'Timeline') },
    { id: 'causes', label: `${t('Causas', 'Causes')} (${app.causes.length})` },
    { id: 'actions', label: `${t('Acciones', 'Actions')} (${app.actions.length})` },
  ]
  const list = (items: Item[], chosen: string[], onToggle: (id: string) => void, prefix: string) => (
    <section className={`${card} space-y-2`}>
      {items.map((i) => {
        const on = chosen.includes(i.id)
        return (
          <label key={i.id} className={`flex items-start gap-3 rounded-lg border p-3 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
            <input type="checkbox" className="mt-1" checked={on} disabled={locked} onChange={() => onToggle(i.id)} aria-label={`${prefix}: ${i.text}`} />
            <span>
              {i.text}
              {app.saved && on && <span className={`mt-1 block text-xs font-medium ${i.good ? 'text-emerald-700' : 'text-rose-700'}`}>{(i.good ? '✓ ' : '✗ ') + i.why}</span>}
            </span>
          </label>
        )
      })}
    </section>
  )
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('INC-2031 · Transferencias duplicadas · postmortem sin culpables', 'INC-2031 · Duplicated transfers · blameless postmortem')}</span>
        <span>{app.saved ? t('Borrador listo', 'Draft ready') : t('En análisis', 'Under analysis')}</span>
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
        {tab === 'timeline' && (
          <ol className={`${card} space-y-3`}>
            {timelineFor(lang).map((e) => (
              <li key={e.when} className="flex gap-3">
                <span className="w-28 shrink-0 font-mono text-xs text-slate-500">{e.when}</span>
                <span className="text-slate-700">{e.what}</span>
              </li>
            ))}
          </ol>
        )}
        {tab === 'causes' && (
          <>
            <p className="text-sm text-slate-600">{t('¿Qué permitió que pasara? Marca las causas que contribuyeron.', 'What allowed it to happen? Tick the contributing causes.')}</p>
            {list(causesFor(lang), app.causes, (id) => send(toggleCause(app, id, lang)), t('Causa', 'Cause'))}
          </>
        )}
        {tab === 'actions' && (
          <>
            <p className="text-sm text-slate-600">{t('¿Qué cambia para que no vuelva a pasar? Cada acción tendrá dueño y fecha.', 'What changes so it does not happen again? Each action will have an owner and a date.')}</p>
            {list(actionsFor(lang), app.actions, (id) => send(toggleAction(app, id, lang)), t('Acción', 'Action'))}
          </>
        )}
        {!app.saved ? (
          <button type="button" disabled={locked || !r.complete} onClick={() => send(savePostmortem(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            {t('Guardar el borrador del postmortem · 30 min', 'Save the postmortem draft · 30 min')}
          </button>
        ) : (
          <p className="text-sm text-slate-600">{t('Borrador guardado. Se presenta a las 14:00.', 'Draft saved. It is presented at 2:00 PM.')}</p>
        )}
      </div>
    </div>
  )
}
