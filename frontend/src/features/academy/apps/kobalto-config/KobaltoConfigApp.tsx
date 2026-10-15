import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  INITIAL_CONFIG,
  askLaura,
  buildOptionsFor,
  buildsFor,
  causeOptionsFor,
  edit,
  envsFor,
  itemsFor,
  regressionDays,
  reportFieldsFor,
  submit,
  suitesFor,
  toggle,
  triggersFor,
  type ConfigState,
} from './configLogic'

type Send = (r: { state: ConfigState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'envs' | 'builds' | 'defect' | 'maintenance'

const TABS: { id: Tab; es: string; en: string }[] = [
  { id: 'envs', es: 'Entornos', en: 'Environments' },
  { id: 'builds', es: 'Builds', en: 'Builds' },
  { id: 'defect', es: 'Defecto', en: 'Defect' },
  { id: 'maintenance', es: 'Mantenimiento', en: 'Maintenance' },
]

const card = 'rounded-2xl bg-white p-5 shadow-sm'
const h3 = 'font-sans text-base font-semibold text-slate-900'
const select = 'rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm'

/** Trazador de configuración de Kobalto Empresas. */
export function KobaltoConfigApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const ENVS = envsFor(lang)
  const ITEMS = itemsFor(lang)
  const BUILDS = buildsFor(lang)
  const CAUSE_OPTIONS = causeOptionsFor(lang)
  const BUILD_OPTIONS = buildOptionsFor(lang)
  const REPORT_FIELDS = reportFieldsFor(lang)
  const TRIGGERS = triggersFor(lang)
  const SUITES = suitesFor(lang)
  const app = (state.appState['kobalto-config'] as ConfigState | undefined) ?? INITIAL_CONFIG
  const [tab, setTab] = useState<Tab>('envs')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = !!app.submitted || !!state.flags['dev.started']
  const patch = (p: Partial<ConfigState>, summary: string) => send(edit(app, p, summary))

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('Trazador de configuración · Kobalto Empresas', 'Configuration tracker · Kobalto Business')}</span>
        <span>staging: API #409</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label={t('Secciones del trazador', 'Tracker sections')}>
          {TABS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)} className={`rounded-full px-4 py-1.5 font-medium ${tab === x.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
              {lang === 'en' ? x.en : x.es}
            </button>
          ))}
        </div>

        {tab === 'envs' && (
          <section className="space-y-3">
            <article className={`${card} overflow-x-auto`}>
              <h3 className={h3}>{t('Comparador de entornos', 'Environment comparison')}</h3>
              <p className="mt-1 text-sm text-slate-600">{t('Elena ve el IVA redondeado a la baja en staging; Tomás no lo reproduce en local.', "Elena sees VAT rounded down on staging; Tomás can't reproduce it locally.")}</p>
              <table className="mt-3 w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">{t('Elemento', 'Item')}</th>
                    {ENVS.map((e) => (
                      <th key={e.id} className="py-2 pr-3">
                        {e.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ITEMS.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2 pr-3 font-medium">{i.label}</td>
                      {ENVS.map((e) => (
                        <td key={e.id} className="py-2 pr-3 font-mono text-xs">
                          {i.values[e.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
            <article className={`${card} grid gap-4 sm:grid-cols-2`}>
              <label className="block text-sm">
                <span className="font-semibold">{t('¿Qué explica la diferencia entre staging y el local?', 'What explains the difference between staging and local?')}</span>
                <select aria-label={t('Causa de la diferencia', 'Cause of the difference')} disabled={locked} value={app.cause} onChange={(e) => patch({ cause: e.target.value }, t('Causa elegida.', 'Cause chosen.'))} className={`${select} mt-2 block w-full`}>
                  <option value="">{t('Elige…', 'Choose…')}</option>
                  {CAUSE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-semibold">{t('¿Qué elemento no está bajo control de versiones?', 'Which item is not under version control?')}</span>
                <select aria-label={t('Elemento sin control de versiones', 'Item without version control')} disabled={locked} value={app.unversioned} onChange={(e) => patch({ unversioned: e.target.value }, t('Elemento sin versionar elegido.', 'Unversioned item chosen.'))} className={`${select} mt-2 block w-full`}>
                  <option value="">{t('Elige…', 'Choose…')}</option>
                  {CAUSE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-slate-500 sm:col-span-2">
                {t(
                  'Pista: el historial de despliegues de staging registra la app, la API, el esquema y los flags. Del billing.yml solo hay una nota: «editado en el servidor, 3 oct».',
                  'Hint: the staging deployment history records the app, the API, the schema and the flags. For billing.yml there is only a note: "edited on the server, Oct 3".',
                )}
              </p>
            </article>
          </section>
        )}

        {tab === 'builds' && (
          <section className="space-y-3">
            <article className={card}>
              <h3 className={h3}>{t('Historial de builds de la API', 'API build history')}</h3>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {BUILDS.map((b) => (
                  <li key={b.id} className="flex gap-3 py-2">
                    <span className="w-14 shrink-0 font-mono font-semibold">{b.id}</span>
                    <span>{b.changes}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className={card}>
              <h3 className={h3}>{t('Tomás: «EMP-231 ya está subido, ciérralo». ¿Se puede verificar en staging?', 'Tomás: "EMP-231 is already pushed, close it." Can it be verified on staging?')}</h3>
              <div className="mt-2 space-y-2" role="radiogroup" aria-label={t('Build a verificar', 'Build to verify')}>
                {BUILD_OPTIONS.map((o) => (
                  <label key={o.id} className={`block cursor-pointer rounded-xl border p-3 text-sm ${app.build === o.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="build" className="mr-2" disabled={locked} checked={app.build === o.id} onChange={() => patch({ build: o.id }, t('Build a verificar.', 'Build to verify.'))} />
                    {o.text}
                  </label>
                ))}
              </div>
            </article>
          </section>
        )}

        {tab === 'defect' && (
          <section className="space-y-3">
            <p className="text-sm text-slate-600">{t('Informe del defecto del IVA para que cualquiera lo pueda reproducir.', 'VAT defect report, so that anyone can reproduce it.')}</p>
            {REPORT_FIELDS.map((f) => (
              <article key={f.id} className={card}>
                <h3 className={h3}>{f.label}</h3>
                <div className="mt-2 space-y-2" role="radiogroup" aria-label={f.label}>
                  {f.options.map((o, i) => (
                    <label key={i} className={`block cursor-pointer rounded-xl border p-3 text-sm ${app.report[f.id] === i ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name={`report-${f.id}`} className="mr-2" disabled={locked} checked={app.report[f.id] === i} onChange={() => patch({ report: { ...app.report, [f.id]: i } }, t(`Informe: ${f.label}.`, `Report: ${f.label}.`))} />
                      {o}
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === 'maintenance' && (
          <section className="space-y-3">
            <article className={card}>
              <h3 className={h3}>{t('Migración del proveedor de facturación electrónica a su API v2', 'Migration of the e-invoicing provider to its API v2')}</h3>
              <p className="mt-1 text-sm text-slate-600">{t('¿Qué tipo de disparador de mantenimiento es?', 'What kind of maintenance trigger is it?')}</p>
              <div className="mt-2 space-y-2" role="radiogroup" aria-label={t('Disparador de mantenimiento', 'Maintenance trigger')}>
                {TRIGGERS.map((x) => (
                  <label key={x.id} className={`block cursor-pointer rounded-xl border p-3 text-sm ${app.trigger === x.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="trigger" className="mr-2" disabled={locked} checked={app.trigger === x.id} onChange={() => patch({ trigger: x.id }, t('Disparador elegido.', 'Trigger chosen.'))} />
                    {x.text}
                  </label>
                ))}
              </div>
            </article>
            <article className={card}>
              <h3 className={h3}>{t('Análisis de impacto: ¿qué regresión ejecutas?', 'Impact analysis: which regression tests do you run?')}</h3>
              <p className="mt-1 text-sm text-slate-600">{t('Suites de TestHub. Hay 3 días hasta el jueves.', 'TestHub suites. There are 3 days until Thursday.')}</p>
              <ul className="mt-3 space-y-2">
                {SUITES.map((s) => (
                  <li key={s.id}>
                    <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${app.suites.includes(s.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="checkbox" disabled={locked} checked={app.suites.includes(s.id)} onChange={() => patch({ suites: toggle(app.suites, s.id) }, `Suite: ${s.label}.`)} />
                      <span className="flex-1">{s.label}</span>
                      <span className="font-mono text-xs text-slate-500">{s.days} d</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className={`mt-3 text-sm font-medium ${regressionDays(app.suites) > 3 ? 'text-rose-700' : 'text-slate-700'}`}>{t(`Regresión seleccionada: ${regressionDays(app.suites)} días`, `Selected regression: ${regressionDays(app.suites)} days`)}</p>
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
          <p className="text-sm font-medium text-emerald-700">{t('✓ Análisis enviado al equipo.', '✓ Analysis sent to the team.')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={locked} onClick={() => send(askLaura(app, lang))} className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-40">
              {t('Pedir a Laura que revise · 10 min', 'Ask Laura to review · 10 min')}
            </button>
            <button type="button" disabled={locked} onClick={() => send(submit(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40">
              {t('Enviar el análisis al equipo · 15 min', 'Send the analysis to the team · 15 min')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
