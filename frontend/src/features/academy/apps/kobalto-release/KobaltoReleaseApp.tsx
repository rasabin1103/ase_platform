import { useState } from 'react'
import type { RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import { INITIAL_RELEASE, TOTAL_MINUTES, areasFor, casesFor, rerunCi, runCase, type ReleaseState } from './releaseLogic'

/** TestHub: regresión manual de la release 5.1 y estado de la integración continua. */
export function KobaltoReleaseApp({ dispatch, state, mission }: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const CASES = casesFor(lang)
  const app = (state.appState['kobalto-release'] as ReleaseState | undefined) ?? INITIAL_RELEASE
  const build = { active: state.activeBugs, fixed: state.fixedBugs, regressions: state.activeRegressions }
  const [open, setOpen] = useState<string | null>(null)
  const results = Object.entries(app.results)
  const executed = results.length
  const failed = results.filter(([, r]) => r.result === 'fail').length
  const spent = CASES.filter((c) => app.results[c.id]).reduce((n, c) => n + c.minutes, 0)
  const buildLabel = `5.1.0-rc${2 + state.build}`

  const run = (id: string) => {
    const r = runCase(app, id, state.build, build, lang)
    dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('⚠ STAGING · TestHub · release 5.1 · ventana de despliegue hoy 19:00', '⚠ STAGING · TestHub · release 5.1 · deployment window today 7:00 PM')}</span>
        <span>build {buildLabel}</span>
      </div>
      <header className="flex flex-wrap items-center justify-between gap-2 bg-indigo-800 px-5 py-3 text-white">
        <span className="text-lg font-bold tracking-tight">
          TestHub <span className="font-normal text-indigo-200">· {t('Regresión manual 5.1', 'Manual regression 5.1')}</span>
        </span>
        <span className="text-sm text-indigo-100">
          {lang === 'en'
            ? `${executed}/${CASES.length} executed · ${failed} failed · ${spent} of ${TOTAL_MINUTES} min`
            : `${executed}/${CASES.length} ejecutados · ${failed} fallos · ${spent} de ${TOTAL_MINUTES} min`}
        </span>
      </header>

      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <h3 className="font-sans text-sm font-semibold text-slate-900">{t('Integración continua', 'Continuous integration')} · build {buildLabel}</h3>
            <p className="text-sm text-slate-600">
              {t('Suite automática', 'Automated suite')}: <span className="font-semibold text-emerald-700">{t('212 pasan', '212 passed')}</span> ·{' '}
              {app.ciReruns > 0 ? (
                <span className="font-semibold text-emerald-700">
                  {t('0 fallan (test_export_csv_timeout pasó al relanzarlo)', '0 failed (test_export_csv_timeout passed on rerun)')}
                </span>
              ) : (
                <span className="font-semibold text-red-700">{t('1 falla', '1 failed')}: test_export_csv_timeout</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const r = rerunCi(app, lang)
              dispatch({ type: 'app', event: { ...r.event, state: r.state } })
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
          >
            {t('Relanzar el test y ver su histórico', 'Rerun the test and view its history')} · 5 min
          </button>
        </section>

        {areasFor(lang).map((area) => (
          <section key={area} className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-sans text-sm font-semibold text-slate-900">{area}</h3>
            <ul className="divide-y divide-slate-100">
              {CASES.filter((c) => c.area === area).map((c) => {
                const r = app.results[c.id]
                const stale = r && r.build < state.build
                return (
                  <li key={c.id} className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setOpen(open === c.id ? null : c.id)} className="flex-1 text-left text-sm">
                        <span className="font-mono text-xs text-indigo-700">{c.id}</span> <span className="text-slate-800">{c.title}</span>
                      </button>
                      {r && (
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${r.result === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {r.result === 'pass' ? t('Pasa', 'Pass') : t('Falla', 'Fail')}
                          {stale ? t(' · build anterior', ' · previous build') : ''}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => run(c.id)}
                        aria-label={`${t('Ejecutar', 'Run')} ${c.id}`}
                        className="rounded-lg border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-50"
                      >
                        {r ? t('Repetir', 'Rerun') : t('Ejecutar', 'Run')} · {c.minutes} min
                      </button>
                    </div>
                    {(open === c.id || r?.result === 'fail') && (
                      <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                        <ol className="ml-4 list-decimal">
                          {c.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                        <p className="mt-1">
                          <span className="font-semibold">{t('Esperado:', 'Expected:')}</span> {c.expected}
                        </p>
                        {r?.actual && (
                          <p className="text-red-700">
                            <span className="font-semibold">{t('Obtenido:', 'Actual:')}</span> {r.actual}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
