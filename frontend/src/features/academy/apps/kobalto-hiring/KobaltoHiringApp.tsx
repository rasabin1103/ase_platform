import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  CANDIDATES,
  CRITERIA,
  INITIAL_HIRING,
  NEEDS,
  REQUIREMENTS,
  STEPS,
  VACANCIES,
  chooseStep,
  decide,
  evaluateDecisions,
  evaluateProfile,
  saveProfile,
  submitDecisions,
  toggleRequirement,
  type Decision,
  type HiringState,
} from './hiringLogic'

type Send = (r: { state: HiringState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'profile' | 'candidates'

const card = 'rounded-2xl bg-white p-4 text-sm shadow-sm'
const button = 'rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40'
const verdict = (good: boolean, why: string) => <span className={`mt-1 block text-xs font-medium ${good ? 'text-emerald-700' : 'text-rose-700'}`}>{(good ? '✓ ' : '✗ ') + why}</span>

/** Contratación de tres QA para Banca diaria (curso 4, misión 8). */
export function KobaltoHiringApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-hiring'] as HiringState | undefined) ?? INITIAL_HIRING
  const [tab, setTab] = useState<Tab>('profile')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished
  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Perfil y proceso' },
    { id: 'candidates', label: `Candidatos (${CANDIDATES.length})` },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Contratación · {VACANCIES} vacantes de QA · Banca diaria</span>
        <span>{app.decided ? 'Decisión enviada' : app.profileSaved ? 'Entrevistas hechas' : 'Perfil sin publicar'}</span>
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
        {tab === 'profile' ? <ProfileView app={app} send={send} locked={locked} /> : <CandidatesView app={app} send={send} locked={locked} />}
      </div>
    </div>
  )
}

function ProfileView({ app, send, locked }: { app: HiringState; send: Send; locked: boolean }) {
  const r = evaluateProfile(app)
  const off = locked || app.profileSaved
  return (
    <div className="space-y-4">
      <section className={card}>
        <h4 className="font-sans font-semibold text-slate-800">Lo que necesita el área</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {NEEDS.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
      <section className={card}>
        <h4 className="font-sans font-semibold text-slate-800">Requisitos del perfil</h4>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {REQUIREMENTS.map((q) => {
            const on = app.requirements.includes(q.id)
            return (
              <label key={q.id} className={`flex items-start gap-3 rounded-lg border p-3 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="checkbox" className="mt-1" checked={on} disabled={off} onChange={() => send(toggleRequirement(app, q.id))} aria-label={`Requisito: ${q.text}`} />
                <span>
                  {q.text}
                  {app.profileSaved && on && verdict(q.good, q.why)}
                </span>
              </label>
            )
          })}
        </div>
      </section>
      {STEPS.map((s) => (
        <fieldset key={s.id} className={card}>
          <legend className="px-1 font-sans font-semibold text-slate-800">{s.title}</legend>
          <div className="space-y-2">
            {s.options.map((o) => {
              const chosen = app.steps[s.id] === o.id
              return (
                <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="radio" name={`hiring-${s.id}`} className="mt-1" checked={chosen} disabled={off} onChange={() => send(chooseStep(app, s.id, o.id))} aria-label={o.text} />
                  <span>
                    {o.text}
                    {app.profileSaved && chosen && verdict(o.good, o.why)}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}
      {!app.profileSaved ? (
        <button type="button" className={button} disabled={off || !r.complete} onClick={() => send(saveProfile(app))}>
          Publicar el perfil y el proceso · 10 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">Perfil y proceso publicados. El panel ya ha entrevistado a los candidatos.</p>
      )}
    </div>
  )
}

function CandidatesView({ app, send, locked }: { app: HiringState; send: Send; locked: boolean }) {
  if (!app.profileSaved) return <p className={`${card} text-slate-600`}>Publica antes el perfil y el proceso: el panel entrevistará con ellos.</p>
  const r = evaluateDecisions(app.decisions)
  const structured = app.steps.format === 'structured'
  const off = locked || app.decided
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {structured ? 'Tarjeta del panel: media de las puntuaciones individuales por criterio (1 a 4).' : 'Sin tarjeta común: cada entrevistador anotó lo que le pareció.'} Tienes {VACANCIES} vacantes.
      </p>
      {CANDIDATES.map((c) => (
        <article key={c.id} className={card}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-sans font-semibold text-slate-900">{c.name}</h4>
            <span className="text-xs text-slate-500">{c.background}</span>
          </div>
          <p className="mt-1 text-xs italic text-slate-500">{c.impression}</p>
          {structured && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CRITERIA.map((k) => (
                <div key={k.id} className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="text-[11px] text-slate-500">{k.label}</div>
                  <div className="font-mono text-lg font-semibold">{c.scores[k.id]}/4</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-slate-700">{structured ? c.evidence : 'Notas sueltas: «buena impresión», «no sé», «me gustó».'}</p>
          <div className="mt-3 flex gap-2" role="radiogroup" aria-label={`Decisión sobre ${c.name}`}>
            {(['hire', 'no'] as Decision[]).map((d) => (
              <label key={d} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${app.decisions[c.id] === d ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="radio" name={`dec-${c.id}`} checked={app.decisions[c.id] === d} disabled={off} onChange={() => send(decide(app, c.id, d))} aria-label={`${d === 'hire' ? 'Contratar' : 'No contratar'} a ${c.name}`} />
                {d === 'hire' ? 'Contratar' : 'No contratar'}
              </label>
            ))}
          </div>
          {app.decided && verdict(app.decisions[c.id] === c.best, c.best === 'hire' ? 'La tarjeta respalda contratarla o contratarlo.' : 'La tarjeta no respalda la contratación.')}
        </article>
      ))}
      {!app.decided ? (
        <button type="button" className={button} disabled={off || !r.complete || r.hires === 0 || r.hires > VACANCIES} onClick={() => send(submitDecisions(app))}>
          Enviar la decisión del panel ({r.hires}/{VACANCIES}) · 15 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">Decisión enviada a Personas.</p>
      )}
    </div>
  )
}
