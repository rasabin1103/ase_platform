import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  CANDIDATES,
  INITIAL_HIRING,
  VACANCIES,
  candidatesFor,
  criteriaFor,
  needsFor,
  requirementsFor,
  stepsFor,
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
export function KobaltoHiringApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-hiring'] as HiringState | undefined) ?? INITIAL_HIRING
  const [tab, setTab] = useState<Tab>('profile')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished
  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: t('Perfil y proceso', 'Profile and process') },
    { id: 'candidates', label: `${t('Candidatos', 'Candidates')} (${CANDIDATES.length})` },
  ]
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t(`Contratación · ${VACANCIES} vacantes de QA · Banca diaria`, `Hiring · ${VACANCIES} QA vacancies · Daily Banking`)}</span>
        <span>{app.decided ? t('Decisión enviada', 'Decision sent') : app.profileSaved ? t('Entrevistas hechas', 'Interviews done') : t('Perfil sin publicar', 'Profile unpublished')}</span>
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
        {tab === 'profile' ? <ProfileView app={app} send={send} locked={locked} lang={lang} /> : <CandidatesView app={app} send={send} locked={locked} lang={lang} />}
      </div>
    </div>
  )
}

function ProfileView({ app, send, locked, lang }: { app: HiringState; send: Send; locked: boolean; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const r = evaluateProfile(app)
  const off = locked || app.profileSaved
  return (
    <div className="space-y-4">
      <section className={card}>
        <h4 className="font-sans font-semibold text-slate-800">{t('Lo que necesita el área', 'What the area needs')}</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {needsFor(lang).map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
      <section className={card}>
        <h4 className="font-sans font-semibold text-slate-800">{t('Requisitos del perfil', 'Profile requirements')}</h4>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {requirementsFor(lang).map((q) => {
            const on = app.requirements.includes(q.id)
            return (
              <label key={q.id} className={`flex items-start gap-3 rounded-lg border p-3 ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="checkbox" className="mt-1" checked={on} disabled={off} onChange={() => send(toggleRequirement(app, q.id, lang))} aria-label={t(`Requisito: ${q.text}`, `Requirement: ${q.text}`)} />
                <span>
                  {q.text}
                  {app.profileSaved && on && verdict(q.good, q.why)}
                </span>
              </label>
            )
          })}
        </div>
      </section>
      {stepsFor(lang).map((s) => (
        <fieldset key={s.id} className={card}>
          <legend className="px-1 font-sans font-semibold text-slate-800">{s.title}</legend>
          <div className="space-y-2">
            {s.options.map((o) => {
              const chosen = app.steps[s.id] === o.id
              return (
                <label key={o.id} className={`flex items-start gap-3 rounded-lg border p-3 ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <input type="radio" name={`hiring-${s.id}`} className="mt-1" checked={chosen} disabled={off} onChange={() => send(chooseStep(app, s.id, o.id, lang))} aria-label={o.text} />
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
        <button type="button" className={button} disabled={off || !r.complete} onClick={() => send(saveProfile(app, lang))}>
          {t('Publicar el perfil y el proceso · 10 min', 'Publish the profile and the process · 10 min')}
        </button>
      ) : (
        <p className="text-sm text-slate-600">{t('Perfil y proceso publicados. El panel ya ha entrevistado a los candidatos.', 'Profile and process published. The panel has already interviewed the candidates.')}</p>
      )}
    </div>
  )
}

function CandidatesView({ app, send, locked, lang }: { app: HiringState; send: Send; locked: boolean; lang: AcademyLang }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  if (!app.profileSaved) return <p className={`${card} text-slate-600`}>{t('Publica antes el perfil y el proceso: el panel entrevistará con ellos.', 'First publish the profile and the process: the panel will interview with them.')}</p>
  const r = evaluateDecisions(app.decisions)
  const structured = app.steps.format === 'structured'
  const off = locked || app.decided
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {structured ? t('Tarjeta del panel: media de las puntuaciones individuales por criterio (1 a 4).', 'Panel scorecard: average of the individual scores per criterion (1 to 4).') : t('Sin tarjeta común: cada entrevistador anotó lo que le pareció.', 'No common scorecard: each interviewer noted what they thought.')} {t(`Tienes ${VACANCIES} vacantes.`, `You have ${VACANCIES} vacancies.`)}
      </p>
      {candidatesFor(lang).map((c) => (
        <article key={c.id} className={card}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-sans font-semibold text-slate-900">{c.name}</h4>
            <span className="text-xs text-slate-500">{c.background}</span>
          </div>
          <p className="mt-1 text-xs italic text-slate-500">{c.impression}</p>
          {structured && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {criteriaFor(lang).map((k) => (
                <div key={k.id} className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="text-[11px] text-slate-500">{k.label}</div>
                  <div className="font-mono text-lg font-semibold">{c.scores[k.id]}/4</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-slate-700">{structured ? c.evidence : t('Notas sueltas: «buena impresión», «no sé», «me gustó».', 'Loose notes: “good impression”, “not sure”, “I liked them”.')}</p>
          <div className="mt-3 flex gap-2" role="radiogroup" aria-label={t(`Decisión sobre ${c.name}`, `Decision on ${c.name}`)}>
            {(['hire', 'no'] as Decision[]).map((d) => (
              <label key={d} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${app.decisions[c.id] === d ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="radio" name={`dec-${c.id}`} checked={app.decisions[c.id] === d} disabled={off} onChange={() => send(decide(app, c.id, d, lang))} aria-label={`${d === 'hire' ? t('Contratar', 'Hire') : t('No contratar', 'Do not hire')}: ${c.name}`} />
                {d === 'hire' ? t('Contratar', 'Hire') : t('No contratar', 'Do not hire')}
              </label>
            ))}
          </div>
          {app.decided && verdict(app.decisions[c.id] === c.best, c.best === 'hire' ? t('La tarjeta respalda contratarla o contratarlo.', 'The scorecard supports hiring them.') : t('La tarjeta no respalda la contratación.', 'The scorecard does not support hiring.'))}
        </article>
      ))}
      {!app.decided ? (
        <button type="button" className={button} disabled={off || !r.complete || r.hires === 0 || r.hires > VACANCIES} onClick={() => send(submitDecisions(app, lang))}>
          {t('Enviar la decisión del panel', 'Send the panel decision')} ({r.hires}/{VACANCIES}) · 15 min
        </button>
      ) : (
        <p className="text-sm text-slate-600">{t('Decisión enviada a Personas.', 'Decision sent to People.')}</p>
      )}
    </div>
  )
}
