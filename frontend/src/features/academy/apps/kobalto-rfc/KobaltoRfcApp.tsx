import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { COMMENTS, INITIAL_RFC, PAINS, SECTIONS, SQUADS, choose, evaluateResponses, evaluateRfc, publishAdr, respond, sendRfc, type RfcState } from './rfcLogic'

type Send = (r: { state: RfcState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'map' | 'rfc' | 'comments'

/** RFC de estándar de automatización para cinco squads (curso 4, misión 4). */
export function KobaltoRfcApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-rfc'] as RfcState | undefined) ?? INITIAL_RFC
  const [tab, setTab] = useState<Tab>('map')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished
  const tabs: { id: Tab; label: string }[] = [
    { id: 'map', label: 'Mapa de squads' },
    { id: 'rfc', label: 'Tu RFC' },
    { id: 'comments', label: `Comentarios${app.sent ? ` (${COMMENTS.length})` : ''}` },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>RFC-007 · Estándar de automatización de pruebas</span>
        <span>{app.adr ? 'ADR publicado' : app.sent ? 'En revisión por los squads' : 'Borrador'}</span>
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
        {tab === 'map' && <MapView />}
        {tab === 'rfc' && <RfcView app={app} send={send} locked={locked} />}
        {tab === 'comments' && <CommentsView app={app} send={send} locked={locked} />}
      </div>
    </div>
  )
}

function MapView() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <h4 className="font-sans font-semibold text-slate-800">Por qué Dirección quiere un estándar</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {PAINS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
      <table className="w-full overflow-hidden rounded-2xl bg-white text-left text-sm shadow-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="p-3">Squad</th>
            <th className="p-3">Herramienta</th>
            <th className="p-3">Tests</th>
            <th className="p-3">Contexto</th>
          </tr>
        </thead>
        <tbody>
          {SQUADS.map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="p-3 font-medium">{s.name}</td>
              <td className="p-3">{s.tool}</td>
              <td className="p-3">{String(s.tests).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
              <td className="p-3 text-slate-600">{s.context}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RfcView({ app, send, locked }: { app: RfcState; send: Send; locked: boolean }) {
  const r = evaluateRfc(app.choices)
  return (
    <section className="space-y-3">
      <p className="text-sm text-slate-600">No tienes autoridad sobre los squads: el estándar solo funcionará si lo adoptan. Elige una opción por sección y envía el RFC para que lo comenten.</p>
      {SECTIONS.map((s) => (
        <fieldset key={s.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <legend className="px-1 font-sans font-semibold text-slate-800">{s.title}</legend>
          <div className="space-y-2">
            {s.options.map((o) => {
              const chosen = app.choices[s.id] === o.id
              return (
                <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="radio" name={`rfc-${s.id}`} className="mt-1" checked={chosen} disabled={locked || app.sent} onChange={() => send(choose(app, s.id, o.id))} aria-label={o.text} />
                  <span>
                    {o.text}
                    {app.sent && chosen && <span className={`mt-1 block text-xs font-medium ${o.good ? 'text-emerald-700' : 'text-rose-700'}`}>{(o.good ? '✓ ' : '✗ ') + o.why}</span>}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}
      {!app.sent ? (
        <button type="button" disabled={locked || !r.complete} onClick={() => send(sendRfc(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          Enviar el RFC a los squads · 20 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">RFC enviado. Revisa los comentarios de los squads.</p>
      )}
    </section>
  )
}

function CommentsView({ app, send, locked }: { app: RfcState; send: Send; locked: boolean }) {
  if (!app.sent) return <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">Los squads comentarán cuando envíes el RFC.</p>
  const r = evaluateResponses(app.responses)
  return (
    <section className="space-y-3">
      {COMMENTS.map((c) => (
        <div key={c.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <p className="text-xs text-slate-500">
            {c.author.includes(c.squad) ? c.author : `${c.author} · squad ${c.squad}`}
          </p>
          <p className="mt-1 font-medium text-slate-900">«{c.text}»</p>
          <div className="mt-2 space-y-2">
            {c.responses.map((o) => {
              const chosen = app.responses[c.id] === o.id
              return (
                <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="radio" name={`resp-${c.id}`} className="mt-1" checked={chosen} disabled={locked || app.adr} onChange={() => send(respond(app, c.id, o.id))} aria-label={`Responder a ${c.squad}: ${o.text}`} />
                  <span>
                    {o.text}
                    {app.adr && chosen && <span className={`mt-1 block text-xs font-medium ${o.good ? 'text-emerald-700' : 'text-rose-700'}`}>{(o.good ? '✓ ' : '✗ ') + o.why}</span>}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
      {!app.adr ? (
        <button type="button" disabled={locked || !r.complete} onClick={() => send(publishAdr(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          Cerrar el RFC y publicar el ADR · 15 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">ADR publicado en el repositorio de arquitectura.</p>
      )}
    </section>
  )
}
