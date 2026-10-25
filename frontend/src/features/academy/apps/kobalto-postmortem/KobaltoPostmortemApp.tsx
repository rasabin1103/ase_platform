import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { ACTIONS, CAUSES, INITIAL_PM, TIMELINE, evaluatePostmortem, savePostmortem, toggleAction, toggleCause, type Item, type PostmortemState } from './postmortemLogic'

type Send = (r: { state: PostmortemState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'timeline' | 'causes' | 'actions'

const card = 'rounded-2xl bg-white p-4 text-sm shadow-sm'

/** Postmortem sin culpables del incidente de transferencias duplicadas (curso 4, misión 10). */
export function KobaltoPostmortemApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-postmortem'] as PostmortemState | undefined) ?? INITIAL_PM
  const [tab, setTab] = useState<Tab>('timeline')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished || app.saved
  const r = evaluatePostmortem(app)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'timeline', label: 'Cronología' },
    { id: 'causes', label: `Causas (${app.causes.length})` },
    { id: 'actions', label: `Acciones (${app.actions.length})` },
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
        <span>INC-2031 · Transferencias duplicadas · postmortem sin culpables</span>
        <span>{app.saved ? 'Borrador listo' : 'En análisis'}</span>
      </div>
      <div className="mx-auto max-w-4xl space-y-4 p-5">
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
        {tab === 'timeline' && (
          <ol className={`${card} space-y-3`}>
            {TIMELINE.map((t) => (
              <li key={t.when} className="flex gap-3">
                <span className="w-28 shrink-0 font-mono text-xs text-slate-500">{t.when}</span>
                <span className="text-slate-700">{t.what}</span>
              </li>
            ))}
          </ol>
        )}
        {tab === 'causes' && (
          <>
            <p className="text-sm text-slate-600">¿Qué permitió que pasara? Marca las causas que contribuyeron.</p>
            {list(CAUSES, app.causes, (id) => send(toggleCause(app, id)), 'Causa')}
          </>
        )}
        {tab === 'actions' && (
          <>
            <p className="text-sm text-slate-600">¿Qué cambia para que no vuelva a pasar? Cada acción tendrá dueño y fecha.</p>
            {list(ACTIONS, app.actions, (id) => send(toggleAction(app, id)), 'Acción')}
          </>
        )}
        {!app.saved ? (
          <button type="button" disabled={locked || !r.complete} onClick={() => send(savePostmortem(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            Guardar el borrador del postmortem · 30 min
          </button>
        ) : (
          <p className="text-sm text-slate-600">Borrador guardado. Se presenta a las 14:00.</p>
        )}
      </div>
    </div>
  )
}
