import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  ATTACK_COST,
  CHECKLIST,
  FOCUS_OPTIONS,
  FREE_ATTACK_COST,
  INITIAL_EXPLORE,
  TIMEBOXES,
  areasFor,
  attack,
  attacksFor,
  closeSession,
  focusLabel,
  focusOptionsFor,
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
export function KobaltoExploreApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const AREAS = areasFor(lang)
  const ATTACKS = attacksFor(lang)
  const app = (state.appState['kobalto-explore'] as ExploreState | undefined) ?? INITIAL_EXPLORE
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const session = openSession(app)
  const exhausted = !!session && session.used + ATTACK_COST > session.charter.timebox

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('staging · Panel de empresa · Tarjetas de equipo v2', 'staging · Business panel · Team Cards v2')}</span>
        <span>{t('go / no-go con Raúl: 13:00', 'go / no-go with Raúl: 1:00 PM')}</span>
      </div>
      <div className="mx-auto max-w-6xl space-y-4 p-5">
        <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          {session ? <SessionPanel lang={lang} app={app} send={send} exhausted={exhausted} /> : <CharterForm lang={lang} app={app} send={send} />}
          <ChecklistPanel lang={lang} app={app} send={send} clock={state.clock} />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">{t('Ataques (predicción de errores)', 'Attacks (error guessing)')}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {t('Elige dónde atacar y cómo.', 'Choose where to attack and how.')}{' '}
            {session
              ? t(`Dentro del charter: ${ATTACK_COST} min por ataque.`, `Within the charter: ${ATTACK_COST} min per attack.`)
              : t('Sin sesión abierta: explorar sin charter.', 'No open session: exploring without a charter.')}{' '}
            {t(`Fuera del charter: ${FREE_ATTACK_COST} min.`, `Outside the charter: ${FREE_ATTACK_COST} min.`)}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[920px] text-xs">
              <thead>
                <tr>
                  <th className="py-2 text-left text-slate-500">{t('Área', 'Area')}</th>
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
                        {area.isNew && <span className="ml-1 rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">{t('NUEVO', 'NEW')}</span>}
                        <span className="block text-[11px] text-slate-500">{area.note}</span>
                      </td>
                      {ATTACKS.map((a) => {
                        const tried = app.observations.filter((o) => o.area === area.id && o.attack === a.id)
                        const bug = tried.some((o) => o.bug)
                        return (
                          <td key={a.id} className="px-1 py-1 text-center">
                            <button
                              type="button"
                              aria-label={t(`Atacar ${area.label} con ${a.label}`, `Attack ${area.label} with ${a.label}`)}
                              disabled={state.finished}
                              onClick={() => send(attack(app, area.id as AreaId, a.id as AttackId, state.clock, lang))}
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
          <h3 className="font-sans text-base font-semibold text-slate-900">{t('Notas de la exploración', 'Session notes')}</h3>
          {app.observations.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">{t('Todavía no hay notas.', 'No notes yet.')}</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {[...app.observations].reverse().map((o, i) => (
                <li key={i} className={o.bug ? 'text-rose-700' : 'text-slate-700'}>
                  <span className="mr-1 font-mono text-[11px] text-slate-400">{o.inSession ? t('sesión', 'session') : t('libre', 'free')}</span>
                  {o.bug ? '⚠ ' : ''}
                  {o.text}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-slate-500">{t('Los fallos se reportan en el Tablero adjuntando la nota como evidencia.', 'Report failures on the Board, attaching the note as evidence.')}</p>
        </section>
      </div>
    </div>
  )
}

function CharterForm({ lang, app, send }: { lang: AcademyLang; app: ExploreState; send: Send }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const AREAS = areasFor(lang)
  const focusOptions = focusOptionsFor(lang)
  const [areas, setAreas] = useState<AreaId[]>([])
  const [focus, setFocus] = useState('')
  const [timebox, setTimebox] = useState(60)
  const toggle = (id: AreaId) => setAreas((a) => (a.includes(id) ? a.filter((x) => x !== id) : a.length >= 2 ? a : [...a, id]))
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-base font-semibold text-slate-900">{app.sessions.length ? t('Nueva sesión exploratoria', 'New exploratory session') : t('Charter de la sesión exploratoria', 'Exploratory session charter')}</h3>
      <p className="mt-1 text-sm text-slate-600">
        {t('«Explorar [áreas] con [recursos] para descubrir [información]». Máximo dos áreas por sesión.', '“Explore [areas] with [resources] to discover [information].” Two areas per session at most.')}
      </p>
      <fieldset className="mt-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('Explorar', 'Explore')}</legend>
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
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('Para descubrir', 'To discover')}</span>
        <select aria-label={t('Objetivo del charter', 'Charter goal')} value={focus} onChange={(e) => setFocus(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1">
          <option value="">{t('Elige…', 'Choose…')}</option>
          {FOCUS_OPTIONS.map((f, i) => (
            <option key={f} value={f}>
              {focusOptions[i]}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('Duración (timebox)', 'Timebox')}</span>
        <select aria-label={t('Duración de la sesión', 'Session timebox')} value={timebox} onChange={(e) => setTimebox(Number(e.target.value))} className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1">
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
        onClick={() => send(startSession(app, { areas, focus, timebox }, lang))}
        className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
      >
        {t('Empezar la sesión · 5 min', 'Start the session · 5 min')}
      </button>
    </article>
  )
}

function SessionPanel({ lang, app, send, exhausted }: { lang: AcademyLang; app: ExploreState; send: Send; exhausted: boolean }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const s = openSession(app)!
  const names = s.charter.areas.map((a) => areasFor(lang).find((x) => x.id === a)!.label).join(t(' y ', ' and '))
  const pctUsed = Math.round((s.used / s.charter.timebox) * 100)
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-base font-semibold text-slate-900">{t(`Sesión ${app.sessions.length} en curso`, `Session ${app.sessions.length} in progress`)}</h3>
      <p className="mt-1 text-sm text-slate-700">
        {lang === 'en' ? (
          <>
            Explore <strong>{names}</strong> with error guessing attacks to “{focusLabel(s.charter.focus, lang)}”.
          </>
        ) : (
          <>
            Explorar <strong>{names}</strong> con ataques de predicción de errores para «{s.charter.focus}».
          </>
        )}
      </p>
      <div className="mt-3 flex justify-between text-sm">
        <span>{t('Tiempo de sesión', 'Session time')}</span>
        <span className="font-mono">
          {s.used} / {s.charter.timebox} min
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${exhausted ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pctUsed}%` }} />
      </div>
      {exhausted && <p className="mt-2 text-sm font-medium text-rose-700">{t('Se acabó el tiempo de la sesión: ciérrala con su informe.', 'The session timebox is used up: close it with its report.')}</p>}
      <button type="button" onClick={() => send(closeSession(app, lang))} className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">
        {t('Cerrar la sesión con informe · 10 min', 'Close the session with a report · 10 min')}
      </button>
    </article>
  )
}

function ChecklistPanel({ lang, app, send, clock }: { lang: AcademyLang; app: ExploreState; send: Send; clock: number }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const AREAS = areasFor(lang)
  const ATTACKS = attacksFor(lang)
  const [extra, setExtra] = useState<AttackId[]>(app.checklistAdded)
  const label = (area: AreaId, atk: AttackId) => `${AREAS.find((a) => a.id === area)!.label}: ${ATTACKS.find((a) => a.id === atk)!.label.toLowerCase()}`
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-base font-semibold text-slate-900">{t('Checklist del equipo', 'Team checklist')}</h3>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
        {CHECKLIST.map((c) => (
          <li key={`${c.area}${c.attack}`}>{label(c.area, c.attack)}</li>
        ))}
        {app.checklistAdded.map((a) => (
          <li key={a} className="text-indigo-700">
            {t('Cualquier área', 'Any area')}: {ATTACKS.find((x) => x.id === a)!.label.toLowerCase()} {t('(añadido por ti)', '(added by you)')}
          </li>
        ))}
      </ul>
      {!app.checklistRun ? (
        <button type="button" onClick={() => send(runChecklist(app, clock, lang))} className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          {t('Pasar la checklist · 20 min', 'Run the checklist · 20 min')}
        </button>
      ) : (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-sm font-medium">{t('Mejorar la checklist con ataques que hayan funcionado', 'Improve the checklist with attacks that worked')}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {ATTACKS.map((a) => (
              <label key={a.id} className={`cursor-pointer rounded border px-2 py-0.5 ${extra.includes(a.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="checkbox" className="mr-1" checked={extra.includes(a.id)} onChange={() => setExtra((x) => (x.includes(a.id) ? x.filter((y) => y !== a.id) : [...x, a.id]))} />
                {a.label}
              </label>
            ))}
          </div>
          <button type="button" disabled={extra.length === 0} onClick={() => send(improveChecklist(app, extra, lang))} className="mt-2 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-800 hover:bg-indigo-50 disabled:opacity-40">
            {t('Guardar la checklist · 10 min', 'Save the checklist · 10 min')}
          </button>
        </div>
      )}
    </article>
  )
}
