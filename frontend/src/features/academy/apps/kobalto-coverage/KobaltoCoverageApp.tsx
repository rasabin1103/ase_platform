import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  BRANCHES,
  codeLines,
  initialCoverage,
  STATEMENTS,
  addCase,
  pct,
  removeCase,
  runSuite,
  updateCase,
  type BranchId,
  type CaseResult,
  type CoverageState,
  type TestCase,
} from './coverageLogic'

type Send = (r: { state: CoverageState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }

/** Visor de código con cobertura de sentencias y ramas, y la suite de tests del módulo de facturas. */
export function KobaltoCoverageApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-coverage'] as CoverageState | undefined) ?? initialCoverage(lang)
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const run = app.lastRun
  const covered = new Set(run?.stmtCovered ?? [])
  const branches = new Set<BranchId>(run?.branchesCovered ?? [])

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('facturas/totalFactura.kob · suite de componente', 'invoices/invoiceTotal.kob · component suite')}</span>
        <span>{run ? t(`última ejecución: ${run.results.length} casos`, `last run: ${run.results.length} cases`) : t('sin ejecutar', 'not run yet')}</span>
      </div>
      <div className="mx-auto max-w-6xl space-y-4 p-5">
        <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <article className="rounded-2xl bg-slate-900 p-4 text-slate-100 shadow-sm">
            <h3 className="mb-2 font-sans text-sm font-semibold text-slate-300">{t('Código bajo prueba', 'Code under test')}</h3>
            <ol className="font-mono text-[13px] leading-6">
              {codeLines(state.fixedBugs, lang).map((l) => {
                const hit = covered.has(l.n)
                const color = !run || !l.stmt ? 'text-slate-300' : hit ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/20 text-rose-200'
                return (
                  <li key={l.n} className={`flex items-center gap-3 rounded px-2 ${color}`} aria-label={`${t('Línea', 'Line')} ${l.n}${run && l.stmt ? (hit ? t(', ejecutada', ', executed') : t(', no ejecutada', ', not executed')) : ''}`}>
                    <span className="w-5 shrink-0 text-right text-slate-500">{l.n}</span>
                    <span style={{ paddingLeft: `${l.indent * 1.25}rem` }} className="flex-1 whitespace-pre">
                      {l.text}
                    </span>
                    {l.decision && run && (
                      <span className="flex gap-1 text-[11px]">
                        {(['T', 'F'] as const).map((o) => {
                          const id = `${l.decision}${o}` as BranchId
                          return (
                            <span key={o} className={`rounded px-1.5 ${branches.has(id) ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`} title={o === 'T' ? t('Rama verdadera', 'True branch') : t('Rama falsa', 'False branch')}>
                              {o === 'T' ? t('V', 'T') : 'F'}
                            </span>
                          )
                        })}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </article>
          <article className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-sans text-base font-semibold text-slate-900">{t('Cobertura', 'Coverage')}</h3>
            <Meter lang={lang} label={t('Sentencias', 'Statements')} value={run?.stmtCovered.length ?? 0} total={STATEMENTS.length} known={!!run} />
            <Meter lang={lang} label={t('Ramas (decisiones V/F)', 'Branches (T/F decisions)')} value={run?.branchesCovered.length ?? 0} total={BRANCHES.length} known={!!run} />
            <p className="text-xs text-slate-500">
              {t(
                'Verde: ejecutado por algún caso. Rojo: ningún caso pasa por ahí. La cobertura dice qué se ha ejecutado, no si se ha comprobado el resultado.',
                'Green: executed by at least one case. Red: no case goes through it. Coverage tells you what was executed, not whether the result was checked.',
              )}
            </p>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-sans text-base font-semibold text-slate-900">{t('Casos de prueba', 'Test cases')}</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => send(addCase(app, lang))} className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-50">
                {t('+ Añadir caso · 5 min', '+ Add case · 5 min')}
              </button>
              <button type="button" onClick={() => send(runSuite(app, state.clock, state.fixedBugs, lang))} className="rounded-lg bg-indigo-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-800">
                {t('Ejecutar la suite · 5 min', 'Run the suite · 5 min')}
              </button>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">{t('Caso', "Case")}</th>
                  <th className="py-2">{t('Base (€)', "Base (€)")}</th>
                  <th className="py-2">{t('Cliente', "Client")}</th>
                  <th className="py-2">{t('Años de alta del emisor', "Issuer's years registered")}</th>
                  <th className="py-2">{t('Comprueba', "Checks")}</th>
                  <th className="py-2">{t('Total esperado (€)', "Expected total (€)")}</th>
                  <th className="py-2">{t('Revisión esperada', "Expected review")}</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {app.cases.map((tc) => (
                  <CaseRow key={tc.id} lang={lang} tc={tc} app={app} send={send} result={run?.results.find((r) => r.id === tc.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function Meter({ lang, label, value, total, known }: { lang: AcademyLang; label: string; value: number; total: number; known: boolean }) {
  const p = pct(value, total)
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono">{known ? `${p}${lang === 'en' ? '' : ' '}% (${value}/${total})` : '—'}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${p === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: known ? `${p}%` : '0%' }} />
      </div>
    </div>
  )
}

function CaseRow({ lang, tc, app, send, result }: { lang: AcademyLang; tc: TestCase; app: CoverageState; send: Send; result?: CaseResult }) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const update = (patch: Partial<TestCase>) => send(updateCase(app, { ...tc, ...patch }, lang))
  const text = (field: 'name' | 'base' | 'years' | 'expectedTotal', label: string, width: string, disabled = false) => (
    <input
      key={`${field}-${tc[field]}`}
      aria-label={t(`${label} del caso ${tc.id}`, `${label} for case ${tc.id}`)}
      defaultValue={tc[field]}
      disabled={disabled}
      onBlur={(e) => e.target.value !== tc[field] && update({ [field]: e.target.value })}
      className={`${width} rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100 disabled:text-slate-400`}
    />
  )
  const tone =
    !result ? '' : result.status === 'fail_bug' || result.status === 'fail_wrong' || result.status === 'invalid' ? 'text-rose-700' : result.status === 'pass_no_assert' ? 'text-amber-700' : 'text-emerald-700'
  return (
    <>
      <tr>
        <td className="py-2 pr-2">
          <span className="mr-1 font-mono text-xs text-slate-400">#{tc.id}</span>
          {text('name', t('Nombre', 'Name'), 'w-56')}
          <span className="block text-xs text-slate-400">{tc.author === 'tomas' ? t('Escrito por Tomás', 'Written by Tomás') : t('Tuyo', 'Yours')}</span>
        </td>
        <td className="py-2 pr-2">{text('base', 'Base', 'w-24')}</td>
        <td className="py-2 pr-2">
          <select aria-label={t(`Cliente del caso ${tc.id}`, `Client for case ${tc.id}`)} value={tc.client} onChange={(e) => update({ client: e.target.value as TestCase['client'] })} className="rounded border border-slate-300 bg-white px-2 py-1">
            <option value="particular">{t('Particular', 'Individual')}</option>
            <option value="empresa">{t('Empresa', 'Business')}</option>
          </select>
        </td>
        <td className="py-2 pr-2">{text('years', t('Años de alta', 'Years registered'), 'w-16')}</td>
        <td className="py-2 pr-2">
          <input type="checkbox" aria-label={t(`Comprobar resultado del caso ${tc.id}`, `Check result of case ${tc.id}`)} checked={tc.assert} onChange={(e) => update({ assert: e.target.checked })} />
        </td>
        <td className="py-2 pr-2">{text('expectedTotal', t('Total esperado', 'Expected total'), 'w-28', !tc.assert)}</td>
        <td className="py-2 pr-2">
          <select
            aria-label={t(`Revisión esperada del caso ${tc.id}`, `Expected review for case ${tc.id}`)}
            disabled={!tc.assert}
            value={tc.expectedReview}
            onChange={(e) => update({ expectedReview: e.target.value as TestCase['expectedReview'] })}
            className="rounded border border-slate-300 bg-white px-2 py-1 disabled:bg-slate-100"
          >
            <option value="">—</option>
            <option value="si">{t('Sí', 'Yes')}</option>
            <option value="no">No</option>
          </select>
        </td>
        <td className="py-2">
          {tc.author === 'player' && (
            <button type="button" aria-label={t(`Eliminar caso ${tc.id}`, `Remove case ${tc.id}`)} onClick={() => send(removeCase(app, tc.id, lang))} className="text-xs text-slate-400 hover:text-rose-600">
              ✕
            </button>
          )}
        </td>
      </tr>
      {result && (
        <tr>
          <td colSpan={8} className={`pb-2 pl-6 text-xs ${tone}`}>
            {result.message}
            {result.lines.length > 0 && <span className="ml-2 text-slate-400">{t('Ramas', 'Branches')}: {result.branches.map((b) => (lang === 'en' ? b.replace('T', ' T').replace('F', ' F') : b.replace('T', ' V').replace('F', ' F'))).join(' · ')}</span>}
          </td>
        </tr>
      )}
    </>
  )
}
