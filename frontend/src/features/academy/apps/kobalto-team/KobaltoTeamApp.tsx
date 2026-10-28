import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  INITIAL_TEAM,
  MAX_TOPICS,
  TASKS,
  membersFor,
  peopleFor,
  tasksFor,
  topicsFor,
  assign,
  confirmAssignments,
  evaluateAssignments,
  prepareOneOnOne,
  toggleTopic,
  type PersonId,
  type TeamState,
} from './teamLogic'

type Send = (r: { state: TeamState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'people' | 'sprint' | 'one2one'

/** Equipo de QA de Pagos: personas, reparto del sprint y primer 1:1 (curso 4, misión 6). */
export function KobaltoTeamApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const tt = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-team'] as TeamState | undefined) ?? INITIAL_TEAM
  const [tab, setTab] = useState<Tab>('people')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished
  const tabs: { id: Tab; label: string }[] = [
    { id: 'people', label: tt('Tu equipo', 'Your team') },
    { id: 'sprint', label: tt('Reparto del sprint', 'Sprint allocation') },
    { id: 'one2one', label: tt('1:1 con Sergio', '1:1 with Sergio') },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{tt('Equipo QA · Pagos · 5 personas', 'QA team · Payments · 5 people')}</span>
        <span>{tt('1:1 con Sergio: 11:30 · Marta: 15:00', '1:1 with Sergio: 11:30 AM · Marta: 3:00 PM')}</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label={tt('Secciones', 'Sections')}>
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
        {tab === 'people' && <PeopleView lang={lang} />}
        {tab === 'sprint' && <SprintView app={app} send={send} locked={locked} lang={lang} />}
        {tab === 'one2one' && <OneOnOneView app={app} send={send} locked={locked} lang={lang} />}
      </div>
    </div>
  )
}

function PeopleView({ lang }: { lang: AcademyLang }) {
  const tt = (es: string, en: string) => tr(lang, es, en)
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {membersFor(lang).map((m) => (
        <li key={m.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <p className="font-sans font-semibold text-slate-900">{m.name}</p>
          <p className="text-xs text-slate-500">{m.role}</p>
          <dl className="mt-2 space-y-1">
            <div>
              <dt className="inline font-medium text-slate-700">{tt('Fortalezas: ', 'Strengths: ')}</dt>
              <dd className="inline text-slate-700">{m.strengths}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-700">{tt('Quiere crecer en: ', 'Wants to grow in: ')}</dt>
              <dd className="inline text-slate-700">{m.growth}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-700">{tt('Ahora mismo: ', 'Right now: ')}</dt>
              <dd className="inline text-slate-700">{m.now}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

function SprintView({ app, send, locked, lang }: { app: TeamState; send: Send; locked: boolean; lang: AcademyLang }) {
  const tt = (es: string, en: string) => tr(lang, es, en)
  const members = membersFor(lang)
  const r = evaluateAssignments(app.assignments)
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">{tt('¿Quién lleva qué este sprint?', 'Who takes what this sprint?')}</h4>
      <p className="text-sm text-slate-600">{tt('Asigna cada tarea a una persona. Mira en «Tu equipo» qué sabe hacer cada uno, hacia dónde quiere crecer y cómo está ahora.', 'Assign each task to a person. Look in “Your team” at what each one can do, where they want to grow and how they are doing now.')}</p>
      <ul className="space-y-2">
        {tasksFor(lang).map((t) => {
          const value = app.assignments[t.id] ?? ''
          const right = value === t.best
          return (
            <li key={t.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{t.title}</strong>
                  <span className="block text-xs text-slate-500">{t.detail}</span>
                </span>
                <select
                  aria-label={tt(`Responsable de ${t.title}`, `Owner of ${t.title}`)}
                  value={value}
                  disabled={locked || app.assigned}
                  onChange={(e) => send(assign(app, t.id, e.target.value as PersonId | '', lang))}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="">{tt('— Elige —', '— Choose —')}</option>
                  {peopleFor(lang).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {app.assigned && (
                <p className={`mt-1 text-xs font-medium ${right ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {right ? '✓ ' : `✗ ${tt('Mejor', 'Better')}: ${members.find((m) => m.id === t.best)?.name}. `}
                  {t.why}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      {!app.assigned ? (
        <button type="button" disabled={locked || !r.complete} onClick={() => send(confirmAssignments(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {tt('Confirmar el reparto · 15 min', 'Confirm the allocation · 15 min')}
        </button>
      ) : (
        <p className="text-sm text-slate-600">
          {tt(`Reparto confirmado: ${r.right} de ${TASKS.length} tareas a la persona más adecuada.`, `Allocation confirmed: ${r.right} of ${TASKS.length} tasks to the most suitable person.`)}
        </p>
      )}
    </section>
  )
}

function OneOnOneView({ app, send, locked, lang }: { app: TeamState; send: Send; locked: boolean; lang: AcademyLang }) {
  const tt = (es: string, en: string) => tr(lang, es, en)
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">{tt('Prepara tu primer 1:1 con Sergio', 'Prepare your first 1:1 with Sergio')}</h4>
      <p className="text-sm text-slate-600">
        {tt(`Sergio era tu compañero y optaba al puesto que te han dado. Tenéis media hora a las 11:30. Elige hasta ${MAX_TOPICS} temas.`, `Sergio was your colleague and applied for the position you were given. You have half an hour at 11:30 AM. Choose up to ${MAX_TOPICS} topics.`)}
      </p>
      <ul className="space-y-2">
        {topicsFor(lang).map((t) => {
          const chosen = app.topics.includes(t.id)
          return (
            <li key={t.id} className={`rounded-lg border p-3 text-sm ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={chosen} disabled={locked || app.prepared} onChange={() => send(toggleTopic(app, t.id, lang))} aria-label={t.text} />
                <span>
                  {t.text}
                  {app.prepared && chosen && (
                    <span className={`mt-1 block text-xs font-medium ${t.good ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {t.good ? '✓ ' : '✗ '}
                      {t.why}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {!app.prepared ? (
        <button type="button" disabled={locked || app.topics.length === 0} onClick={() => send(prepareOneOnOne(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {tt('Guardar la preparación · 10 min', 'Save the preparation · 10 min')}
        </button>
      ) : (
        <p className="text-sm text-slate-600">{tt('Preparación guardada: la llevas al 1:1.', 'Preparation saved: you take it to the 1:1.')}</p>
      )}
    </section>
  )
}
