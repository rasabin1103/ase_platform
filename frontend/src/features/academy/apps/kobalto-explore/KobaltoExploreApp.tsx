import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  AREAS,
  ATTACKS,
  ATTACK_COST,
  CHECKLIST,
  FOCUS_OPTIONS,
  FREE_ATTACK_COST,
  INITIAL_EXPLORE,
  TIMEBOXES,
  attack,
  closeSession,
  improveChecklist,
  openSession,
  runChecklist,
  startSession,
  type AreaId,
  type AttackId,
  type ExploreState,
} from './exploreLogic'

type Send = (r: { state: ExploreState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }

/** Sesiones exploratorias sobre el panel de Tarjetas de equipo (staging). */
export function KobaltoExploreApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-explore'] as ExploreState | undefined) ?? INITIAL_EXPLORE
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const session = openSession(app)
  const exhausted = !!session && session.used + ATTACK_COST > session.charter.timebox

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>staging · Panel de empresa · Tarjetas de equipo v2</span>
        <span>go / no-go con Raúl: 13:00</span>
      </div>
      <div className="mx-auto max-w-6xl space-y-4 p-5">
        <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          {session ? <SessionPanel app={app} send={send} exhausted={exhausted} /> : <CharterForm app={app} send={send} />}
          <ChecklistPanel app={app} send={send} clock={state.clock} />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">Ataques (predicción de errores)</h3>
          <p className="mt-1 text-sm text-slate-600">
            Elige dónde atacar y cómo. {session ? `Dentro del charter: ${ATTACK_COST} min por ataque.` : 'Sin sesión abierta: explorar sin charter.'} Fuera del charter: {FREE_ATTACK_COST} min.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[920px] text-xs">
              <thead>
                <tr>
                  <th className="py-2 text-left text-slate-500">Área</th>
                  {ATTACKS.map((a) => (
                    <th key={a.id} className="px-1 py-2 text-center font-medium text-slate-600" title={a.how}>
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {AREAS.map((area) => {
                  const inCharter = !!session && session.charter.areas.includes(area.id) && !exhausted
                  return (
                    <tr key={area.id} className={inCharter ? 'bg-indigo-50/60' : ''}>
                      <td className="py-2 pr-2">
                        <span className="text-sm font-medium">{area.label}</span>
                        {area.isNew && <span className="ml-1 rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">NUEVO</span>}
                        <span className="block text-[11px] text-slate-500">{area.note}</span>
                      </td>
                      {ATTACKS.map((a) => {
                        const tried = app.observations.filter((o) => o.area === area.id && o.attack === a.id)
                        const bug = tried.some((o) => o.bug)
                        return (
                          <td key={a.id} className="px-1 py-1 text-center">
                            <button
                              type="button"
                              aria-label={`Atacar ${area.label} con ${a.label}`}
                              disabled={state.finished}
                              onClick={() => send(attack(app, area.id as AreaId, a.id as AttackId, state.clock))}
                              className={`h-8 w-full rounded border text-sm ${
                                bug ? 'border-rose-300 bg-rose-50 text-rose-700' : tried.length ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-700'
                              }`}
                            >
                              {bug ? '⚠' : tried.length ? '✓' : '▶'}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">Notas de la exploración</h3>
          {app.observations.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">Todavía no hay notas.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {[...app.observations].reverse().map((o, i) => (
                <li key={i} className={o.bug ? 'text-rose-700' : 'text-slate-700'}>
                  <span className="mr-1 font-mono text-[11px] text-slate-400">{o.inSession ? 'sesión' : 'libre'}</span>
                  {o.bug ? '⚠ ' : ''}
                  {o.text}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-slate-500">Los fallos se reportan en el Tablero adjuntando la nota como evidencia.</p>
        </section>
      </div>
    </div>
  )
}

function CharterForm({ app, send }: { app: ExploreState; send: Send }) {
  const [areas, setAreas] = useState<AreaId[]>([])
  const [focus, setFocus] = useState('')
  const [timebox, setTimebox] = useState(60)
  const toggle = (id: AreaId) => setAreas((a) => (a.includes(id) ? a.filter((x) => x !== id) : a.length >= 2 ? a : [...a, id]))
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-base font-semibold text-slate-900">{app.sessions.length ? 'Nueva sesión exploratoria' : 'Charter de la sesión exploratoria'}</h3>
      <p className="mt-1 text-sm text-slate-600">«Explorar [áreas] con [recursos] para descubrir [información]». Máximo dos áreas por sesión.</p>
      <fieldset className="mt-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Explorar</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <label key={a.id} className={`cursor-pointer rounded-lg border px-2 py-1 text-sm ${areas.includes(a.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
              <input type="checkbox" className="mr-1" checked={areas.includes(a.id)} onChange={() => toggle(a.id)} />
              {a.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 block text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Para descubrir</span>
        <select aria-label="Objetivo del charter" value={focus} onChange={(e) => setFocus(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1">
          <option value="">Elige…</option>
          {FOCUS_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duración (timebox)</span>
        <select aria-label="Duración de la sesión" value={timebox} onChange={(e) => setTimebox(Number(e.target.value))} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1">
          {TIMEBOXES.map((t) => (
            <option key={t} value={t}>
              {t} min
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={areas.length === 0 || !focus}
        onClick={() => send(startSession(app, { areas, focus, timebox }))}
        className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
      >
        Empezar la sesión · 5 min
      </button>
    </article>
  )
}

function SessionPanel({ app, send, exhausted }: { app: ExploreState; send: Send; exhausted: boolean }) {
  const s = openSession(app)!
  const names = s.charter.areas.map((a) => AREAS.find((x) => x.id === a)!.label).join(' y ')
  const pctUsed = Math.round((s.used / s.charter.timebox) * 100)
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-base font-semibold text-slate-900">Sesión {app.sessions.length} en curso</h3>
      <p className="mt-1 text-sm text-slate-700">
        Explorar <strong>{names}</strong> con ataques de predicción de errores para «{s.charter.focus}».
      </p>
      <div className="mt-3 flex justify-between text-sm">
        <span>Tiempo de sesión</span>
        <span className="font-mono">
          {s.used} / {s.charter.timebox} min
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${exhausted ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pctUsed}%` }} />
      </div>
      {exhausted && <p className="mt-2 text-sm font-medium text-rose-700">Se acabó el tiempo de la sesión: ciérrala con su informe.</p>}
      <button type="button" onClick={() => send(closeSession(app))} className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">
        Cerrar la sesión con informe · 10 min
      </button>
    </article>
  )
}

function ChecklistPanel({ app, send, clock }: { app: ExploreState; send: Send; clock: number }) {
  const [extra, setExtra] = useState<AttackId[]>(app.checklistAdded)
  const label = (area: AreaId, atk: AttackId) => `${AREAS.find((a) => a.id === area)!.label}: ${ATTACKS.find((a) => a.id === atk)!.label.toLowerCase()}`
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-base font-semibold text-slate-900">Checklist del equipo</h3>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
        {CHECKLIST.map((c) => (
          <li key={`${c.area}${c.attack}`}>{label(c.area, c.attack)}</li>
        ))}
        {app.checklistAdded.map((a) => (
          <li key={a} className="text-indigo-700">
            Cualquier área: {ATTACKS.find((x) => x.id === a)!.label.toLowerCase()} (añadido por ti)
          </li>
        ))}
      </ul>
      {!app.checklistRun ? (
        <button type="button" onClick={() => send(runChecklist(app, clock))} className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          Pasar la checklist · 20 min
        </button>
      ) : (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-sm font-medium">Mejorar la checklist con ataques que hayan funcionado</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {ATTACKS.map((a) => (
              <label key={a.id} className={`cursor-pointer rounded border px-2 py-0.5 ${extra.includes(a.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="checkbox" className="mr-1" checked={extra.includes(a.id)} onChange={() => setExtra((x) => (x.includes(a.id) ? x.filter((y) => y !== a.id) : [...x, a.id]))} />
                {a.label}
              </label>
            ))}
          </div>
          <button type="button" disabled={extra.length === 0} onClick={() => send(improveChecklist(app, extra))} className="mt-2 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-800 hover:bg-indigo-50 disabled:opacity-40">
            Guardar la checklist · 10 min
          </button>
        </div>
      )}
    </article>
  )
}
