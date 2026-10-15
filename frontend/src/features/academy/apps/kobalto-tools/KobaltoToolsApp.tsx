import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  INITIAL_TOOLS,
  askLaura,
  candidatesFor,
  categoryLabelFor,
  criteriaFor,
  edit,
  needsFor,
  pilotScopesFor,
  riskLabelFor,
  submit,
  toggle,
  type Category,
  type RiskTag,
  type ToolsState,
} from './toolsLogic'

type Send = (r: { state: ToolsState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'needs' | 'candidates' | 'pilot'

const TABS: { id: Tab; es: string; en: string }[] = [
  { id: 'needs', es: 'Necesidades', en: 'Needs' },
  { id: 'candidates', es: 'Candidatas', en: 'Candidates' },
  { id: 'pilot', es: 'Piloto', en: 'Pilot' },
]

const card = 'rounded-2xl bg-white p-5 shadow-sm'
const h3 = 'font-sans text-base font-semibold text-slate-900'

/** Selección de herramientas de pruebas del squad Empresas. */
export function KobaltoToolsApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const NEEDS = needsFor(lang)
  const CANDIDATES = candidatesFor(lang)
  const CATEGORY_LABEL = categoryLabelFor(lang)
  const RISK_LABEL = riskLabelFor(lang)
  const PILOT_SCOPES = pilotScopesFor(lang)
  const CRITERIA = criteriaFor(lang)
  const app = (state.appState['kobalto-tools'] as ToolsState | undefined) ?? INITIAL_TOOLS
  const [tab, setTab] = useState<Tab>('needs')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = !!app.submitted || !!state.flags['dev.started']
  const patch = (p: Partial<ToolsState>, summary: string) => send(edit(app, p, summary))

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('Herramientas del squad Empresas', 'Business squad tools')}</span>
        <span>{t('presupuesto: 20.000 €/año', 'budget: €20,000/year')}</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label={t('Secciones de la selección', 'Selection sections')}>
          {TABS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)} className={`rounded-full px-4 py-1.5 font-medium ${tab === x.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
              {lang === 'en' ? x.en : x.es}
            </button>
          ))}
        </div>

        {tab === 'needs' && (
          <section className={card}>
            <h3 className={h3}>{t('¿Qué tipo de herramienta resuelve cada necesidad?', 'Which type of tool addresses each need?')}</h3>
            <p className="mt-1 text-sm text-slate-600">{t('Necesidades recogidas en la retro del squad.', "Needs gathered in the squad's retro.")}</p>
            <ul className="mt-3 divide-y divide-slate-100">
              {NEEDS.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="flex-1">{n.text}</span>
                  <select aria-label={t(`Categoría de ${n.id}`, `Category for ${n.id}`)} disabled={locked} value={app.needs[n.id] ?? ''} onChange={(e) => patch({ needs: { ...app.needs, [n.id]: e.target.value as Category | '' } }, t(`Necesidad ${n.id} clasificada.`, `Need ${n.id} classified.`))} className="rounded-lg border border-slate-300 bg-white px-2 py-1">
                    <option value="">{t('Elige…', 'Choose…')}</option>
                    {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'candidates' && (
          <section className="space-y-3">
            {CANDIDATES.map((c) => {
              const tags = app.risks[c.id] ?? []
              return (
                <article key={c.id} className={card}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className={h3}>{c.name}</h3>
                      <p className="mt-0.5 text-sm italic text-slate-600">{c.pitch}</p>
                    </div>
                    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm ${app.choice === c.id ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200'}`}>
                      <input type="radio" name="choice" disabled={locked} checked={app.choice === c.id} onChange={() => patch({ choice: c.id }, t(`Candidata para el piloto: ${c.name}.`, `Pilot candidate: ${c.name}.`))} />
                      {t('Proponer para el piloto', 'Propose for the pilot')}
                    </label>
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {c.facts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('Riesgos principales', 'Main risks')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Object.keys(RISK_LABEL) as RiskTag[]).map((r) => (
                      <label key={r} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${tags.includes(r) ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-600'}`}>
                        <input type="checkbox" disabled={locked} checked={tags.includes(r)} onChange={() => patch({ risks: { ...app.risks, [c.id]: toggle(tags, r) } }, t(`Riesgo de ${c.name}.`, `Risk for ${c.name}.`))} />
                        {RISK_LABEL[r]}
                      </label>
                    ))}
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {tab === 'pilot' && (
          <section className="space-y-3">
            <article className={card}>
              <h3 className={h3}>{t('Alcance de la adopción', 'Adoption scope')}</h3>
              <div className="mt-2 space-y-2" role="radiogroup" aria-label={t('Alcance de la adopción', 'Adoption scope')}>
                {PILOT_SCOPES.map((s) => (
                  <label key={s.id} className={`block cursor-pointer rounded-xl border p-3 text-sm ${app.scope === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="scope" className="mr-2" disabled={locked} checked={app.scope === s.id} onChange={() => patch({ scope: s.id }, t('Alcance de la adopción.', 'Adoption scope.'))} />
                    {s.text}
                  </label>
                ))}
              </div>
            </article>
            <article className={card}>
              <h3 className={h3}>{t('Criterios de éxito del piloto', 'Pilot success criteria')}</h3>
              <ul className="mt-2 space-y-2">
                {CRITERIA.map((c) => (
                  <li key={c.id}>
                    <label className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${app.criteria.includes(c.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="checkbox" className="mt-0.5" disabled={locked} checked={app.criteria.includes(c.id)} onChange={() => patch({ criteria: toggle(app.criteria, c.id) }, t(`Criterio: ${c.text}`, `Criterion: ${c.text}`))} />
                      <span>{c.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        )}

        {app.feedback && !app.submitted && (
          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            <h4 className="font-sans font-semibold text-violet-900">{t('Revisión de Laura', "Laura's review")}</h4>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {app.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {app.submitted ? (
          <p className="text-sm font-medium text-emerald-700">{t('✓ Propuesta enviada a Raúl.', '✓ Proposal sent to Raúl.')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={locked} onClick={() => send(askLaura(app, lang))} className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-40">
              {t('Pedir a Laura que revise · 10 min', 'Ask Laura to review · 10 min')}
            </button>
            <button type="button" disabled={locked} onClick={() => send(submit(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40">
              {t('Enviar la propuesta a Raúl · 15 min', 'Send the proposal to Raúl · 15 min')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
