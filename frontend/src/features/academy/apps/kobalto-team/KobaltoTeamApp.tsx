import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  INITIAL_TEAM,
  MAX_TOPICS,
  MEMBERS,
  PEOPLE,
  TASKS,
  TOPICS,
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
export function KobaltoTeamApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-team'] as TeamState | undefined) ?? INITIAL_TEAM
  const [tab, setTab] = useState<Tab>('people')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished
  const tabs: { id: Tab; label: string }[] = [
    { id: 'people', label: 'Tu equipo' },
    { id: 'sprint', label: 'Reparto del sprint' },
    { id: 'one2one', label: '1:1 con Sergio' },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Equipo QA · Pagos · 5 personas</span>
        <span>1:1 con Sergio: 11:30 · Marta: 15:00</span>
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
        {tab === 'people' && <PeopleView />}
        {tab === 'sprint' && <SprintView app={app} send={send} locked={locked} />}
        {tab === 'one2one' && <OneOnOneView app={app} send={send} locked={locked} />}
      </div>
    </div>
  )
}

function PeopleView() {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {MEMBERS.map((m) => (
        <li key={m.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <p className="font-sans font-semibold text-slate-900">{m.name}</p>
          <p className="text-xs text-slate-500">{m.role}</p>
          <dl className="mt-2 space-y-1">
            <div>
              <dt className="inline font-medium text-slate-700">Fortalezas: </dt>
              <dd className="inline text-slate-700">{m.strengths}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-700">Quiere crecer en: </dt>
              <dd className="inline text-slate-700">{m.growth}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-700">Ahora mismo: </dt>
              <dd className="inline text-slate-700">{m.now}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

function SprintView({ app, send, locked }: { app: TeamState; send: Send; locked: boolean }) {
  const r = evaluateAssignments(app.assignments)
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">¿Quién lleva qué este sprint?</h4>
      <p className="text-sm text-slate-600">Asigna cada tarea a una persona. Mira en «Tu equipo» qué sabe hacer cada uno, hacia dónde quiere crecer y cómo está ahora.</p>
      <ul className="space-y-2">
        {TASKS.map((t) => {
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
                  aria-label={`Responsable de ${t.title}`}
                  value={value}
                  disabled={locked || app.assigned}
                  onChange={(e) => send(assign(app, t.id, e.target.value as PersonId | ''))}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="">— Elige —</option>
                  {PEOPLE.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {app.assigned && (
                <p className={`mt-1 text-xs font-medium ${right ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {right ? '✓ ' : `✗ Mejor: ${MEMBERS.find((m) => m.id === t.best)?.name}. `}
                  {t.why}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      {!app.assigned ? (
        <button type="button" disabled={locked || !r.complete} onClick={() => send(confirmAssignments(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          Confirmar el reparto · 15 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">
          Reparto confirmado: {r.right} de {TASKS.length} tareas a la persona más adecuada.
        </p>
      )}
    </section>
  )
}

function OneOnOneView({ app, send, locked }: { app: TeamState; send: Send; locked: boolean }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">Prepara tu primer 1:1 con Sergio</h4>
      <p className="text-sm text-slate-600">
        Sergio era tu compañero y optaba al puesto que te han dado. Tenéis media hora a las 11:30. Elige hasta {MAX_TOPICS} temas.
      </p>
      <ul className="space-y-2">
        {TOPICS.map((t) => {
          const chosen = app.topics.includes(t.id)
          return (
            <li key={t.id} className={`rounded-lg border p-3 text-sm ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={chosen} disabled={locked || app.prepared} onChange={() => send(toggleTopic(app, t.id))} aria-label={t.text} />
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
        <button type="button" disabled={locked || app.topics.length === 0} onClick={() => send(prepareOneOnOne(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          Guardar la preparación · 10 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">Preparación guardada: la llevas al 1:1.</p>
      )}
    </section>
  )
}
