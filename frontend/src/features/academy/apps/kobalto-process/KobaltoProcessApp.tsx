import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  INITIAL_PROCESS,
  TRACE_TOTAL,
  activitiesFor,
  askLaura,
  propose,
  roleLabelFor,
  sendTrace,
  setActivity,
  setLink,
  testwareFor,
  traceItemsFor,
  type ActivityId,
  type ProcessState,
  type RoleId,
} from './processLogic'

type Send = (r: { state: ProcessState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }

/** Mapa del proceso de pruebas y matriz de trazabilidad del squad Empresas. */
export function KobaltoProcessApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-process'] as ProcessState | undefined) ?? INITIAL_PROCESS
  const [tab, setTab] = useState<'process' | 'trace'>('process')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const devStarted = !!state.flags['dev.started']
  const allDone = !!app.proposed && !!app.traceSent

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('Proceso de pruebas · squad Kobalto Empresas', 'Test process · Kobalto Business squad')}</span>
        <span>{t('Carmen: 14:00 · comité: 15:00', 'Carmen: 2:00 PM · committee: 3:00 PM')}</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex gap-2 text-sm" role="tablist" aria-label={t('Secciones', 'Sections')}>
          <button type="button" role="tab" aria-selected={tab === 'process'} onClick={() => setTab('process')} className={`rounded-full px-4 py-1.5 font-medium ${tab === 'process' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
            {t('Mapa del proceso', 'Process map')}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'trace'} onClick={() => setTab('trace')} className={`rounded-full px-4 py-1.5 font-medium ${tab === 'trace' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
            {t('Trazabilidad', 'Traceability')}
          </button>
        </div>
        {tab === 'process' ? (
          <ProcessView app={app} send={send} locked={!!app.proposed || devStarted} lang={lang} />
        ) : (
          <TraceView app={app} send={send} locked={!!app.traceSent || devStarted} lang={lang} />
        )}
        {app.feedback && !allDone && (
          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            <h4 className="font-sans font-semibold text-violet-900">{t('Revisión de Laura', "Laura's review")}</h4>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {app.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}
        {!allDone && !devStarted && (
          <button type="button" onClick={() => send(askLaura(app, lang))} className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50">
            {t('Pedir a Laura que revise', 'Ask Laura to review')} · 10 min
          </button>
        )}
      </div>
    </div>
  )
}

function ProcessView({ app, send, locked, lang }: { app: ProcessState; send: Send; locked: boolean; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const ACTIVITIES = activitiesFor(lang)
  const TESTWARE = testwareFor(lang)
  const ROLE_LABEL = roleLabelFor(lang)
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-base font-semibold text-slate-900">{t('Actividades del proceso de pruebas', 'Test process activities')}</h3>
      <p className="mt-1 text-sm text-slate-600">
        {t(
          'Ordena las actividades, indica qué testware produce cada una y quién es responsable. El proceso se adapta al contexto, pero las actividades son siempre estas.',
          'Order the activities, state what testware each one produces and who is responsible. The process is tailored to the context, but the activities are always these.',
        )}
      </p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2">{t('Orden', 'Order')}</th>
            <th className="py-2">{t('Actividad', 'Activity')}</th>
            <th className="py-2">{t('Testware que produce', 'Testware produced')}</th>
            <th className="py-2">{t('Responsable', 'Responsible')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ACTIVITIES.map((a) => {
            const p = app.plan[a.id]
            return (
              <tr key={a.id}>
                <td className="py-2 pr-2">
                  <select
                    aria-label={`${t('Orden de', 'Order of')} ${a.label}`}
                    disabled={locked}
                    value={p.position ?? ''}
                    onChange={(e) => send(setActivity(app, a.id as ActivityId, { position: e.target.value ? Number(e.target.value) : null }, lang))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1"
                  >
                    <option value="">—</option>
                    {ACTIVITIES.map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <span className="font-medium">{a.label}</span>
                  <span className="block text-xs text-slate-500">{a.summary}</span>
                </td>
                <td className="py-2 pr-2">
                  <select
                    aria-label={`${t('Testware de', 'Testware for')} ${a.label}`}
                    disabled={locked}
                    value={p.testware}
                    onChange={(e) => send(setActivity(app, a.id as ActivityId, { testware: e.target.value }, lang))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                  >
                    <option value="">{t('Elige…', 'Choose…')}</option>
                    {TESTWARE.map((tw) => (
                      <option key={tw.id} value={tw.id}>
                        {tw.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <select
                    aria-label={`${t('Responsable de', 'Responsible for')} ${a.label}`}
                    disabled={locked}
                    value={p.role}
                    onChange={(e) => send(setActivity(app, a.id as ActivityId, { role: e.target.value as RoleId | '' }, lang))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1"
                  >
                    <option value="">{t('Elige…', 'Choose…')}</option>
                    {(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {app.proposed ? (
        <p className="mt-4 text-sm font-medium text-emerald-700">✓ {t('Propuesta enviada a Raúl para el comité de las 15:00.', "Proposal sent to Raúl for the 3:00 PM committee.")}</p>
      ) : (
        <button
          type="button"
          disabled={locked}
          onClick={() => send(propose(app, lang))}
          className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
        >
          {t('Enviar la propuesta de proceso a Raúl', 'Send the process proposal to Raúl')} · 15 min
        </button>
      )}
    </section>
  )
}

function LinkSelect({
  id,
  label,
  value,
  options,
  locked,
  onChange,
  lang,
}: {
  lang: AcademyLang
  id: string
  label: string
  value: string
  options: { id: string; label: string }[]
  locked: boolean
  onChange: (v: string) => void
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
      <span className="min-w-0 flex-1">{label}</span>
      <span className="text-slate-400">→</span>
      <select aria-label={`${tr(lang, 'Enlace de', 'Link for')} ${id}`} disabled={locked} value={value} onChange={(e) => onChange(e.target.value)} className="w-72 rounded-lg border border-slate-300 bg-white px-2 py-1">
        <option value="">{tr(lang, 'Sin enlazar', 'Not linked')}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </li>
  )
}

function TraceView({ app, send, locked, lang }: { app: ProcessState; send: Send; locked: boolean; lang: AcademyLang }) {
  const tx = (es: string, en: string) => tr(lang, es, en)
  const { stories: STORIES, conditions: CONDITIONS, cases: CASES, defects: DEFECTS } = traceItemsFor(lang)
  const link = (from: string, to: string) => send(setLink(app, from, to, lang))
  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-sans text-base font-semibold text-slate-900">{tx('Matriz de trazabilidad · Tarjetas de equipo', 'Traceability matrix · Team cards')}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {tx(
            'Enlaza cada elemento con el que lo origina. Con la cadena completa (historia → condición → caso → defecto) se puede responder qué requisitos están probados y cuáles tienen defectos abiertos.',
            'Link each item to the one it comes from. With the complete chain (story → test condition → test case → defect) you can answer which requirements are tested and which have open defects.',
          )}
        </p>
      </article>
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h4 className="font-sans text-sm font-semibold uppercase tracking-wide text-slate-500">{tx('Condiciones → historia', 'Test conditions → story')}</h4>
        <ul className="divide-y divide-slate-100">
          {CONDITIONS.map((c) => (
            <LinkSelect key={c.id} id={c.id} label={c.label} value={app.links[c.id] ?? ''} options={STORIES} locked={locked} lang={lang} onChange={(v) => link(c.id, v)} />
          ))}
        </ul>
      </article>
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h4 className="font-sans text-sm font-semibold uppercase tracking-wide text-slate-500">{tx('Casos → condición', 'Test cases → test condition')}</h4>
        <ul className="divide-y divide-slate-100">
          {CASES.map((t) => (
            <LinkSelect key={t.id} id={t.id} label={t.label} value={app.links[t.id] ?? ''} options={CONDITIONS} locked={locked} lang={lang} onChange={(v) => link(t.id, v)} />
          ))}
        </ul>
      </article>
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h4 className="font-sans text-sm font-semibold uppercase tracking-wide text-slate-500">{tx('Defectos → caso que los detectó', 'Defects → test case that detected them')}</h4>
        <ul className="divide-y divide-slate-100">
          {DEFECTS.map((d) => (
            <LinkSelect key={d.id} id={d.id} label={d.label} value={app.links[d.id] ?? ''} options={CASES} locked={locked} lang={lang} onChange={(v) => link(d.id, v)} />
          ))}
        </ul>
      </article>
      {app.traceSent ? (
        <p className="text-sm font-medium text-emerald-700">
          ✓{' '}
          {lang === 'en'
            ? `Matrix sent to Carmen (${app.traceSent.correct} of ${TRACE_TOTAL} links correct).`
            : `Matriz enviada a Carmen (${app.traceSent.correct} de ${TRACE_TOTAL} enlaces correctos).`}
        </p>
      ) : (
        <button
          type="button"
          disabled={locked}
          onClick={() => send(sendTrace(app, lang))}
          className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
        >
          {tx('Enviar la matriz a Carmen', 'Send the matrix to Carmen')} · 10 min
        </button>
      )}
    </section>
  )
}
