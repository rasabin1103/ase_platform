import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import { COMMENTS, INITIAL_RFC, choose, commentsFor, painsFor, sectionsFor, squadsFor, evaluateResponses, evaluateRfc, publishAdr, respond, sendRfc, type RfcState } from './rfcLogic'

type Send = (r: { state: RfcState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'map' | 'rfc' | 'comments'

/** RFC de estándar de automatización para cinco squads (curso 4, misión 4). */
export function KobaltoRfcApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-rfc'] as RfcState | undefined) ?? INITIAL_RFC
  const [tab, setTab] = useState<Tab>('map')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished
  const tabs: { id: Tab; label: string }[] = [
    { id: 'map', label: t('Mapa de squads', 'Squad map') },
    { id: 'rfc', label: t('Tu RFC', 'Your RFC') },
    { id: 'comments', label: `${t('Comentarios', 'Comments')}${app.sent ? ` (${COMMENTS.length})` : ''}` },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('RFC-007 · Estándar de automatización de pruebas', 'RFC-007 · Test automation standard')}</span>
        <span>{app.adr ? t('ADR publicado', 'ADR published') : app.sent ? t('En revisión por los squads', 'Under review by the squads') : t('Borrador', 'Draft')}</span>
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
        {tab === 'map' && <MapView lang={lang} />}
        {tab === 'rfc' && <RfcView app={app} send={send} locked={locked} lang={lang} />}
        {tab === 'comments' && <CommentsView app={app} send={send} locked={locked} lang={lang} />}
      </div>
    </div>
  )
}

function MapView({ lang }: { lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <h4 className="font-sans font-semibold text-slate-800">{t('Por qué Dirección quiere un estándar', 'Why Management wants a standard')}</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {painsFor(lang).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
      <table className="w-full overflow-hidden rounded-2xl bg-white text-left text-sm shadow-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="p-3">Squad</th>
            <th className="p-3">{t('Herramienta', 'Tool')}</th>
            <th className="p-3">Tests</th>
            <th className="p-3">{t('Contexto', 'Context')}</th>
          </tr>
        </thead>
        <tbody>
          {squadsFor(lang).map((s) => (
            <tr key={s.id} className="border-t border-slate-100">
              <td className="p-3 font-medium">{s.name}</td>
              <td className="p-3">{s.tool}</td>
              <td className="p-3">{String(s.tests).replace(/\B(?=(\d{3})+(?!\d))/g, t('.', ','))}</td>
              <td className="p-3 text-slate-600">{s.context}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RfcView({ app, send, locked, lang }: { app: RfcState; send: Send; locked: boolean; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const r = evaluateRfc(app.choices)
  return (
    <section className="space-y-3">
      <p className="text-sm text-slate-600">{t('No tienes autoridad sobre los squads: el estándar solo funcionará si lo adoptan. Elige una opción por sección y envía el RFC para que lo comenten.', 'You have no authority over the squads: the standard will only work if they adopt it. Choose one option per section and send the RFC for them to comment.')}</p>
      {sectionsFor(lang).map((s) => (
        <fieldset key={s.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <legend className="px-1 font-sans font-semibold text-slate-800">{s.title}</legend>
          <div className="space-y-2">
            {s.options.map((o) => {
              const chosen = app.choices[s.id] === o.id
              return (
                <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="radio" name={`rfc-${s.id}`} className="mt-1" checked={chosen} disabled={locked || app.sent} onChange={() => send(choose(app, s.id, o.id, lang))} aria-label={o.text} />
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
        <button type="button" disabled={locked || !r.complete} onClick={() => send(sendRfc(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {t('Enviar el RFC a los squads · 20 min', 'Send the RFC to the squads · 20 min')}
        </button>
      ) : (
        <p className="text-sm text-slate-600">{t('RFC enviado. Revisa los comentarios de los squads.', 'RFC sent. Review the squads’ comments.')}</p>
      )}
    </section>
  )
}

function CommentsView({ app, send, locked, lang }: { app: RfcState; send: Send; locked: boolean; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  if (!app.sent) return <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">{t('Los squads comentarán cuando envíes el RFC.', 'The squads will comment when you send the RFC.')}</p>
  const r = evaluateResponses(app.responses)
  return (
    <section className="space-y-3">
      {commentsFor(lang).map((c) => (
        <div key={c.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <p className="text-xs text-slate-500">
            {c.author.includes(c.squad) ? c.author : `${c.author} · ${t('squad', 'squad')} ${c.squad}`}
          </p>
          <p className="mt-1 font-medium text-slate-900">{t('«', '“')}{c.text}{t('»', '”')}</p>
          <div className="mt-2 space-y-2">
            {c.responses.map((o) => {
              const chosen = app.responses[c.id] === o.id
              return (
                <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="radio" name={`resp-${c.id}`} className="mt-1" checked={chosen} disabled={locked || app.adr} onChange={() => send(respond(app, c.id, o.id, lang))} aria-label={t(`Responder a ${c.squad}: ${o.text}`, `Reply to ${c.squad}: ${o.text}`)} />
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
        <button type="button" disabled={locked || !r.complete} onClick={() => send(publishAdr(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {t('Cerrar el RFC y publicar el ADR · 15 min', 'Close the RFC and publish the ADR · 15 min')}
        </button>
      ) : (
        <p className="text-sm text-slate-600">{t('ADR publicado en el repositorio de arquitectura.', 'ADR published in the architecture repository.')}</p>
      )}
    </section>
  )
}
