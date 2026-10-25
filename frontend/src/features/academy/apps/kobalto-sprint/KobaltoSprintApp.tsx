import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  AGREEMENTS,
  DAY_CAPACITY,
  INITIAL_SPRINT,
  MAX_AGREEMENTS,
  STORIES,
  analyzeFlow,
  flowFacts,
  propose,
  testPlan,
  toggleAgreement,
  togglePlan,
  type SprintState,
} from './sprintLogic'

type Send = (r: { state: SprintState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'board' | 'flow' | 'retro'

/** Tablero del sprint 14 del squad Tarjetas (curso 4, misión 1). */
export function KobaltoSprintApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-sprint'] as SprintState | undefined) ?? INITIAL_SPRINT
  const [tab, setTab] = useState<Tab>('board')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished

  const tabs: { id: Tab; label: string }[] = [
    { id: 'board', label: 'Tablero' },
    { id: 'flow', label: 'Flujo del sprint' },
    { id: 'retro', label: 'Propuestas para la retro' },
  ]

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Sprint 14 · squad Tarjetas · día 9 de 10</span>
        <span>Retro: 16:00 · cierre: mañana</span>
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
        {tab === 'board' && <BoardView app={app} send={send} locked={locked} />}
        {tab === 'flow' && <FlowView app={app} send={send} locked={locked} />}
        {tab === 'retro' && <RetroView app={app} send={send} locked={locked} />}
      </div>
    </div>
  )
}

function BoardView({ app, send, locked }: { app: SprintState; send: Send; locked: boolean }) {
  const done = STORIES.filter((s) => s.column === 'done')
  const queue = STORIES.filter((s) => s.column === 'qa_ready')
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Hoy te da tiempo a probar <strong>{DAY_CAPACITY} historias</strong> de las {queue.length} que esperan. Elige cuáles y pruébalas.
      </p>
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h4 className="font-sans font-semibold text-slate-800">Hecho ({done.length})</h4>
          <ul className="mt-2 space-y-2">
            {done.map((s) => (
              <li key={s.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <span className="font-mono text-xs text-emerald-700">{s.id}</span> · {s.title}
                <p className="text-xs text-slate-500">
                  Llegó a QA el día {s.qaDay} · {s.points} puntos
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h4 className="font-sans font-semibold text-slate-800">Listo para QA ({queue.length})</h4>
          <ul className="mt-2 space-y-2">
            {queue.map((s) => {
              const chosen = app.plan.includes(s.id)
              return (
                <li key={s.id} className={`rounded-lg border p-3 text-sm ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={chosen}
                      disabled={locked || app.tested}
                      onChange={() => send(togglePlan(app, s.id))}
                      aria-label={`Probar hoy ${s.id}`}
                    />
                    <span>
                      <span className="font-mono text-xs text-indigo-700">{s.id}</span> · <strong>{s.title}</strong>
                      <span className="block text-xs text-slate-500">
                        Llegó a QA el día {s.qaDay} · {s.points} puntos · {s.acReviewed ? 'criterios revisados por QA' : 'criterios sin revisar por QA'}
                      </span>
                      <span className="block text-xs text-slate-700">Si falla: {s.impact}</span>
                      <span className="block text-xs text-slate-700">Qué cambia: {s.change}</span>
                      {app.tested && chosen && <span className="mt-1 block text-xs font-medium text-slate-900">Resultado: {s.finding}</span>}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          {!app.tested ? (
            <button
              type="button"
              disabled={locked || app.plan.length === 0}
              onClick={() => send(testPlan(app))}
              className="mt-3 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Probar las {app.plan.length} historias elegidas · 3 h
            </button>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Ya has probado lo que te daba tiempo hoy.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function FlowView({ app, send, locked }: { app: SprintState; send: Send; locked: boolean }) {
  const f = flowFacts()
  const days = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">¿Cuándo llegan las historias a QA?</h4>
      {!app.analyzed ? (
        <>
          <p className="text-sm text-slate-600">
            Antes de la retro, saca los datos del sprint: cuándo llegó cada historia a QA, su tamaño y si tenía los criterios revisados. Datos, no sensaciones.
          </p>
          <button type="button" disabled={locked} onClick={() => send(analyzeFlow(app))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            Analizar el flujo del sprint · 20 min
          </button>
        </>
      ) : (
        <>
          <ol className="flex items-end gap-2" aria-label="Historias que llegaron a QA cada día">
            {days.map((d) => {
              const n = STORIES.filter((s) => s.qaDay === d).length
              return (
                <li key={d} className="flex flex-1 flex-col items-center gap-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{n || ''}</span>
                  <span className={`w-full rounded-t ${n >= 3 ? 'bg-rose-500' : 'bg-indigo-400'}`} style={{ height: `${Math.max(4, n * 28)}px` }} />
                  <span>Día {d}</span>
                </li>
              )
            })}
          </ol>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
            <li>
              <strong>
                {f.lateEntries} de {f.total}
              </strong>{' '}
              historias llegaron a QA los días 8 y 9.
            </li>
            <li>
              Durante <strong>{f.daysWithoutArrivals} de 9 días</strong> no llegó ninguna historia nueva a QA.
            </li>
            <li>
              Solo <strong>
                {f.acReviewed} de {f.total}
              </strong>{' '}
              tenían los criterios de aceptación revisados por QA antes de desarrollar.
            </li>
            <li>
              <strong>
                {f.bigStories} de {f.total}
              </strong>{' '}
              historias son de 5 puntos o más.
            </li>
            <li>
              Hoy hay <strong>{f.queue} historias</strong> esperando en «Listo para QA».
            </li>
          </ul>
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            El cuello de botella no es una persona: es el flujo. El trabajo se acumula al final del sprint y llega todo a la vez.
          </p>
        </>
      )}
    </section>
  )
}

function RetroView({ app, send, locked }: { app: SprintState; send: Send; locked: boolean }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">Propuestas para la retro de las 16:00</h4>
      <p className="text-sm text-slate-600">Elige hasta {MAX_AGREEMENTS} acuerdos de equipo que propondrás. Busca los que atacan la causa y están en manos del equipo.</p>
      <ul className="space-y-2">
        {AGREEMENTS.map((a) => {
          const chosen = app.agreements.includes(a.id)
          return (
            <li key={a.id} className={`rounded-lg border p-3 text-sm ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={chosen} disabled={locked || app.proposed} onChange={() => send(toggleAgreement(app, a.id))} aria-label={a.text} />
                <span>
                  {a.text}
                  {app.proposed && chosen && (
                    <span className={`mt-1 block text-xs font-medium ${a.good ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {a.good ? '✓ ' : '✗ '}
                      {a.why}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {!app.proposed ? (
        <button
          type="button"
          disabled={locked || app.agreements.length === 0}
          onClick={() => send(propose(app))}
          className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Preparar las propuestas · 15 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">Propuestas preparadas: las llevarás a la retro.</p>
      )}
    </section>
  )
}
