import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  INITIAL_METRICS,
  SPRINT,
  actionsFor,
  askLaura,
  closureFor,
  edit,
  metricsFor,
  mgmtDraftsFor,
  panelFor,
  readingsFor,
  submitClosure,
  submitProgress,
  teamDraftsFor,
  toggle,
  type MetricsState,
  type Reading,
} from './metricsLogic'

type Send = (r: { state: MetricsState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'panel' | 'metrics' | 'readings' | 'reports' | 'control' | 'closure'

const TABS: { id: Tab; es: string; en: string }[] = [
  { id: 'panel', es: 'Panel', en: 'Dashboard' },
  { id: 'metrics', es: 'Métricas', en: 'Metrics' },
  { id: 'readings', es: 'Lecturas', en: 'Readings' },
  { id: 'reports', es: 'Informes', en: 'Reports' },
  { id: 'control', es: 'Control', en: 'Control' },
  { id: 'closure', es: 'Cierre', en: 'Closure' },
]

const card = 'rounded-2xl bg-white p-5 shadow-sm'
const h3 = 'font-sans text-base font-semibold text-slate-900'

/** Panel de métricas del sprint de Kobalto Empresas. */
export function KobaltoMetricsApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const PANEL = panelFor(lang)
  const METRICS = metricsFor(lang)
  const READINGS = readingsFor(lang)
  const MGMT_DRAFTS = mgmtDraftsFor(lang)
  const TEAM_DRAFTS = teamDraftsFor(lang)
  const ACTIONS = actionsFor(lang)
  const CLOSURE = closureFor(lang)
  const app = (state.appState['kobalto-metrics'] as MetricsState | undefined) ?? INITIAL_METRICS
  const [tab, setTab] = useState<Tab>('panel')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const ended = !!state.flags['dev.started']
  const locked = !!app.progress || ended
  const closureLocked = !app.progress || !!app.closed || ended
  const patch = (p: Partial<MetricsState>, summary: string) => send(edit(app, p, summary))
  const pct = Math.round((SPRINT.executedCases / SPRINT.plannedCases) * 100)
  const expectedPct = Math.round((SPRINT.expectedExecuted / SPRINT.plannedCases) * 100)

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('Métricas · Sprint 3 de Kobalto Empresas', 'Metrics · Kobalto Business Sprint 3')}</span>
        <span>{t(`día ${SPRINT.day} de ${SPRINT.days}`, `day ${SPRINT.day} of ${SPRINT.days}`)}</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label={t('Secciones del panel', 'Dashboard sections')}>
          {TABS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)} className={`rounded-full px-4 py-1.5 font-medium ${tab === x.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
              {lang === 'en' ? x.en : x.es}
            </button>
          ))}
        </div>

        {tab === 'panel' && (
          <section className="space-y-3">
            <article className={card}>
              <h3 className={h3}>{t('Avance de la ejecución', 'Execution progress')}</h3>
              <div className="relative mt-3 h-3 rounded-full bg-slate-200" aria-hidden>
                <div className="absolute inset-y-0 left-0 rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                <div className="absolute inset-y-[-4px] w-0.5 bg-amber-500" style={{ left: `${expectedPct}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {t(`Ejecutado ${pct} % · previsto a día ${SPRINT.day}: ${expectedPct} % (línea ámbar).`, `Executed ${pct}% · planned by day ${SPRINT.day}: ${expectedPct}% (amber line).`)}
              </p>
            </article>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PANEL.map((k) => (
                <article key={k.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-slate-900">{k.value}</p>
                  {k.hint ? <p className="mt-1 text-xs text-slate-500">{k.hint}</p> : null}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'metrics' && (
          <section className={card}>
            <h3 className={h3}>{t('¿Qué métricas van en el informe de progreso?', 'Which metrics go in the progress report?')}</h3>
            <p className="mt-1 text-sm text-slate-600">{t('Elige las que ayudan a decidir. El volumen sin contexto no cuenta nada.', 'Choose the ones that help make decisions. Volume without context tells you nothing.')}</p>
            <ul className="mt-3 space-y-2">
              {METRICS.map((m) => (
                <li key={m.id}>
                  <label className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${app.metrics.includes(m.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" className="mt-0.5" disabled={locked} checked={app.metrics.includes(m.id)} onChange={() => patch({ metrics: toggle(app.metrics, m.id) }, t(`Métrica: ${m.label}.`, `Metric: ${m.label}.`))} />
                    <span>{m.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'readings' && (
          <section className={card}>
            <h3 className={h3}>{t('¿Fiable o engañosa?', 'Reliable or misleading?')}</h3>
            <p className="mt-1 text-sm text-slate-600">{t('Cruza cada frase con el panel: ¿cuenta toda la verdad o solo la parte buena?', 'Cross-check each statement against the dashboard: does it tell the whole truth or only the good part?')}</p>
            <ul className="mt-3 divide-y divide-slate-100">
              {READINGS.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="flex-1">{r.text}</span>
                  <select aria-label={t(`Lectura ${r.id}`, `Reading ${r.id}`)} disabled={locked} value={app.readings[r.id] ?? ''} onChange={(e) => patch({ readings: { ...app.readings, [r.id]: e.target.value as Reading | '' } }, t(`Lectura ${r.id} evaluada.`, `Reading ${r.id} assessed.`))} className="rounded-lg border border-slate-300 bg-white px-2 py-1">
                    <option value="">{t('Elige…', 'Choose…')}</option>
                    <option value="reliable">{t('Fiable', 'Reliable')}</option>
                    <option value="misleading">{t('Engañosa', 'Misleading')}</option>
                  </select>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'reports' && (
          <section className="space-y-3">
            <Choice
              title={t('Informe de progreso para dirección', 'Progress report for management')}
              hint={t('Lo leerán en dos minutos y tienen que decidir con él.', "They'll read it in two minutes and have to make a decision with it.")}
              name="mgmt"
              options={MGMT_DRAFTS}
              value={app.mgmt}
              locked={locked}
              onPick={(id) => patch({ mgmt: id }, t('Informe para dirección.', 'Report for management.'))}
            />
            <Choice
              title={t('Informe de progreso para el equipo', 'Progress report for the team')}
              hint={t('Lo usaréis mañana a primera hora para organizaros.', "You'll use it first thing tomorrow to organize the work.")}
              name="team"
              options={TEAM_DRAFTS}
              value={app.team}
              locked={locked}
              onPick={(id) => patch({ team: id }, t('Informe para el equipo.', 'Report for the team.'))}
            />
          </section>
        )}

        {tab === 'control' && (
          <section className={card}>
            <h3 className={h3}>{t('Acciones de control', 'Control actions')}</h3>
            <p className="mt-1 text-sm text-slate-600">{t('Vamos por detrás del plan y con riesgos altos sin probar. ¿Qué haces para corregir el rumbo?', "We're behind the plan, with high risks untested. What do you do to correct course?")}</p>
            <ul className="mt-3 space-y-2">
              {ACTIONS.map((a) => (
                <li key={a.id}>
                  <label className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${app.actions.includes(a.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" className="mt-0.5" disabled={locked} checked={app.actions.includes(a.id)} onChange={() => patch({ actions: toggle(app.actions, a.id) }, t(`Acción de control: ${a.label}`, `Control action: ${a.label}`))} />
                    <span>{a.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'closure' && (
          <section className={card}>
            <h3 className={h3}>{t('Cierre de las pruebas del sprint', 'Sprint test completion')}</h3>
            <p className="mt-1 text-sm text-slate-600">{app.progress ? t('¿Qué actividades incluyes en el cierre?', 'Which activities do you include in the closure?') : t('Primero envía el informe de progreso: el cierre llega al final del día.', 'Send the progress report first: closure comes at the end of the day.')}</p>
            <ul className="mt-3 space-y-2">
              {CLOSURE.map((c) => (
                <li key={c.id}>
                  <label className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${closureLocked ? 'opacity-60' : 'cursor-pointer hover:bg-slate-50'} ${app.closure.includes(c.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                    <input type="checkbox" className="mt-0.5" disabled={closureLocked} checked={app.closure.includes(c.id)} onChange={() => patch({ closure: toggle(app.closure, c.id) }, t(`Cierre: ${c.label}`, `Closure: ${c.label}`))} />
                    <span>{c.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {app.feedback && (
          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            <h4 className="font-sans font-semibold text-violet-900">{t('Revisión de Laura', "Laura's review")}</h4>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {app.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {app.progress ? <p className="text-sm font-medium text-emerald-700">{t('✓ Informe de progreso enviado a Raúl.', '✓ Progress report sent to Raúl.')}</p> : null}
        {app.closed ? <p className="text-sm font-medium text-emerald-700">{t('✓ Informe de cierre del sprint enviado.', '✓ Sprint test completion report sent.')}</p> : null}

        {!ended && !app.closed ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => send(askLaura(app, lang))} className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50">
              {t('Pedir a Laura que revise · 10 min', 'Ask Laura to review · 10 min')}
            </button>
            {app.progress ? (
              <button type="button" onClick={() => send(submitClosure(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">
                {t('Enviar el informe de cierre · 15 min', 'Send the test completion report · 15 min')}
              </button>
            ) : (
              <button type="button" onClick={() => send(submitProgress(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">
                {t('Enviar el informe de progreso a Raúl · 15 min', 'Send the progress report to Raúl · 15 min')}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Choice({ title, hint, name, options, value, locked, onPick }: { title: string; hint: string; name: string; options: { id: string; text: string }[]; value: string; locked: boolean; onPick: (id: string) => void }) {
  return (
    <article className={card}>
      <h3 className={h3}>{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{hint}</p>
      <div className="mt-2 space-y-2" role="radiogroup" aria-label={title}>
        {options.map((o) => (
          <label key={o.id} className={`block cursor-pointer rounded-xl border p-3 text-sm ${value === o.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <input type="radio" name={name} className="mr-2" disabled={locked} checked={value === o.id} onChange={() => onPick(o.id)} />
            {o.text}
          </label>
        ))}
      </div>
    </article>
  )
}
