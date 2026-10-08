import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  INITIAL_GHERKIN,
  KEYWORD_LABEL,
  MAX_STEPS_PER_SCENARIO,
  RESULT_LABEL,
  STEPS,
  TDD_LABEL,
  addScenario,
  agree,
  askLaura,
  codeListing,
  evaluateScenario,
  isOutline,
  removeScenario,
  stepById,
  tddStep,
  testListing,
  updateScenario,
  type ExampleResult,
  type GherkinState,
  type Keyword,
  type Scenario,
  type TddAction,
} from './gherkinLogic'

type Send = (r: { state: GherkinState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }

/** Editor de escenarios Gherkin (ATDD/BDD) y ciclo TDD con Sofía. */
export function KobaltoGherkinApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-gherkin'] as GherkinState | undefined) ?? INITIAL_GHERKIN
  const [tab, setTab] = useState<'scenarios' | 'tdd'>('scenarios')
  const mapped = !!state.flags['amigos.mapped']
  const tddOpen = !!state.flags['sofia.asked']
  const locked = !!app.agreed || !!state.flags['dev.started']
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Escenarios · KOB-E-21 «Cobro por enlace de pago»</span>
        <span>Tomás empieza a programar: 15:00</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex gap-2 text-sm" role="tablist" aria-label="Secciones del editor">
          <button type="button" role="tab" aria-selected={tab === 'scenarios'} onClick={() => setTab('scenarios')} className={`rounded-full px-4 py-1.5 font-medium ${tab === 'scenarios' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
            Escenarios (ATDD/BDD)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tdd'}
            disabled={!tddOpen}
            onClick={() => setTab('tdd')}
            className={`rounded-full px-4 py-1.5 font-medium disabled:opacity-40 ${tab === 'tdd' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}
            title={tddOpen ? undefined : 'Sofía te escribirá cuando le toque la comisión'}
          >
            TDD con Sofía
          </button>
        </div>

        {tab === 'scenarios' ? (
          <ScenariosView app={app} mapped={mapped} locked={locked} send={send} />
        ) : (
          <TddView app={app} send={send} />
        )}
      </div>
    </div>
  )
}


function ScenariosView({ app, mapped, locked, send }: { app: GherkinState; mapped: boolean; locked: boolean; send: Send }) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">Historia (tarjeta)</h3>
          <p className="mt-1 text-sm text-slate-700">
            <strong>Como</strong> autónomo cliente de Kobalto Empresas, <strong>quiero</strong> enviar un enlace de pago a mi cliente <strong>para</strong> cobrar sin datáfono.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            3C: la <em className="not-italic font-medium">tarjeta</em> es solo el recordatorio; la <span className="font-medium">conversación</span> con los tres amigos aporta los detalles y la <span className="font-medium">confirmación</span> son los escenarios que acordéis.
          </p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">Mapa de ejemplos</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>• Importe del enlace: entre 1,00 € y 5.000,00 € (ambos incluidos).</li>
            <li>• El cliente paga con tarjeta y el enlace queda «pagado».</li>
            {mapped ? (
              <>
                <li>• El enlace caduca a los 7 días: caducado no se puede pagar.</li>
                <li>• Un enlace solo se puede pagar una vez.</li>
                <li>• El emisor puede anularlo mientras no esté pagado; anulado no se puede pagar.</li>
              </>
            ) : (
              <li className="text-slate-400">• (sin más reglas: nadie preguntó por los casos que no son el feliz)</li>
            )}
          </ul>
        </article>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">Característica: Cobro por enlace de pago</h3>
          {!locked && (
            <button type="button" onClick={() => send(addScenario(app))} className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-50">
              + Nuevo escenario · 5 min
            </button>
          )}
        </div>
        {app.scenarios.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">Todavía no hay escenarios.</p>}
        {app.scenarios.map((sc) => (
          <ScenarioCard key={sc.id} sc={sc} app={app} mapped={mapped} locked={locked} send={send} />
        ))}
      </section>

      {app.feedback && !app.agreed && (
        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <h4 className="font-semibold">Revisión de Laura</h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {app.feedback.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {app.agreed ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">✓ Escenarios acordados</h3>
          <p className="mt-1 text-sm text-slate-600">Son los criterios de aceptación de la historia: Tomás programa a partir de ellos y se automatizan tal cual.</p>
        </section>
      ) : (
        <section className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={locked}
            onClick={() => send(askLaura(app, mapped))}
            className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-40"
          >
            Pedir a Laura que revise los escenarios · 10 min
          </button>
          <button
            type="button"
            disabled={locked || app.scenarios.length === 0}
            onClick={() => send(agree(app))}
            className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
          >
            Acordar los escenarios con Elena y Tomás · 15 min
          </button>
        </section>
      )}
    </>
  )
}

function ScenarioCard({ sc, app, mapped, locked, send }: { sc: Scenario; app: GherkinState; mapped: boolean; locked: boolean; send: Send }) {
  const outline = isOutline(sc)
  const update = (next: Scenario) => send(updateScenario(app, next))
  const options = (kw: Keyword) => STEPS.filter((s) => s.kw === kw && (mapped || !s.mapped))
  const ev = app.agreed ? evaluateScenario(sc) : null
  const kwLabel = (i: number) => {
    const kw = sc.steps[i].kw
    return i > 0 && sc.steps[i - 1].kw === kw ? 'Y' : KEYWORD_LABEL[kw]
  }
  const addStep = (kw: Keyword) => {
    const order: Keyword[] = ['given', 'when', 'then']
    const steps = [...sc.steps, { kw, stepId: '' }].sort((a, b) => order.indexOf(a.kw) - order.indexOf(b.kw))
    update({ ...sc, steps })
  }

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm" aria-label={`Escenario ${sc.id}`}>
      <div className="flex items-center gap-2 font-mono text-sm">
        <span className="font-semibold text-indigo-700">{outline ? 'Esquema del escenario:' : 'Escenario:'}</span>
        <input
          aria-label={`Título del escenario ${sc.id}`}
          key={sc.title}
          defaultValue={sc.title}
          disabled={locked}
          onBlur={(e) => e.target.value !== sc.title && update({ ...sc, title: e.target.value })}
          placeholder="Nombre del comportamiento"
          className="flex-1 rounded border border-transparent bg-slate-50 px-2 py-1 font-sans hover:border-slate-200 focus:border-indigo-300 disabled:bg-transparent"
        />
        {!locked && (
          <button type="button" aria-label={`Eliminar escenario ${sc.id}`} onClick={() => send(removeScenario(app, sc.id))} className="text-xs text-slate-400 hover:text-rose-600">
            Eliminar
          </button>
        )}
      </div>
      <ol className="mt-2 space-y-1">
        {sc.steps.map((st, i) => (
          <li key={i} className="flex items-center gap-2 pl-4 font-mono text-sm">
            <span className="w-20 shrink-0 text-right font-semibold text-slate-500">{kwLabel(i)}</span>
            {locked ? (
              <span className="font-sans text-slate-800">{stepById(st.stepId)?.text ?? '—'}</span>
            ) : (
              <>
                <select
                  aria-label={`Paso ${i + 1} del escenario ${sc.id}`}
                  value={st.stepId}
                  onChange={(e) => update({ ...sc, steps: sc.steps.map((x, j) => (j === i ? { ...x, stepId: e.target.value } : x)) })}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 font-sans text-sm"
                >
                  <option value="">Elige un paso…</option>
                  {options(st.kw).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.text}
                    </option>
                  ))}
                </select>
                <button type="button" aria-label={`Quitar paso ${i + 1} del escenario ${sc.id}`} onClick={() => update({ ...sc, steps: sc.steps.filter((_, j) => j !== i) })} className="text-xs text-slate-400 hover:text-rose-600">
                  ✕
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
      {!locked && sc.steps.length < MAX_STEPS_PER_SCENARIO && (
        <div className="mt-2 flex gap-2 pl-4 text-xs">
          {(['given', 'when', 'then'] as Keyword[]).map((kw) => (
            <button key={kw} type="button" onClick={() => addStep(kw)} className="rounded border border-slate-200 px-2 py-0.5 text-slate-600 hover:bg-slate-50">
              + {KEYWORD_LABEL[kw]}
            </button>
          ))}
        </div>
      )}
      {outline && <ExamplesTable sc={sc} locked={locked} update={update} />}
      {ev && (
        <div className="mt-3 border-t border-slate-100 pt-2 text-xs">
          {ev.valid && <p className="text-emerald-700">✓ Escenario claro y correcto.</p>}
          {[...ev.wrong, ...ev.smells].map((x, i) => (
            <p key={i} className="text-amber-700">
              ! {x}
            </p>
          ))}
        </div>
      )}
    </article>
  )
}

function ExamplesTable({ sc, locked, update }: { sc: Scenario; locked: boolean; update: (s: Scenario) => void }) {
  const setResult = (i: number, r: ExampleResult) => update({ ...sc, examples: sc.examples.map((e, j) => (j === i ? { ...e, resultado: r } : e)) })
  return (
    <div className="mt-3 pl-4">
      <p className="font-mono text-sm font-semibold text-slate-500">Ejemplos:</p>
      <table className="mt-1 text-sm">
        <thead>
          <tr className="text-left font-mono text-xs text-slate-500">
            <th className="px-2">| importe</th>
            <th className="px-2">| resultado |</th>
          </tr>
        </thead>
        <tbody>
          {sc.examples.map((ex, i) => (
            <tr key={i}>
              <td className="px-2 py-0.5">
                <input
                  aria-label={`Importe del ejemplo ${i + 1} del escenario ${sc.id}`}
                  key={`${i}-${ex.importe}`}
                  defaultValue={ex.importe}
                  disabled={locked}
                  inputMode="decimal"
                  onBlur={(e) => {
                    const v = e.target.value
                    if (v !== ex.importe) update({ ...sc, examples: sc.examples.map((x, j) => (j === i ? { ...x, importe: v } : x)) })
                  }}
                  placeholder="0,00"
                  className="w-28 rounded border border-slate-300 px-2 py-0.5 font-mono"
                />
              </td>
              <td className="px-2 py-0.5">
                <select
                  aria-label={`Resultado del ejemplo ${i + 1} del escenario ${sc.id}`}
                  value={ex.resultado}
                  disabled={locked}
                  onChange={(e) => setResult(i, e.target.value as ExampleResult)}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5"
                >
                  <option value="">—</option>
                  <option value="acepta">{RESULT_LABEL.acepta}</option>
                  <option value="rechaza">{RESULT_LABEL.rechaza}</option>
                </select>
              </td>
              {!locked && (
                <td>
                  <button type="button" aria-label={`Quitar ejemplo ${i + 1} del escenario ${sc.id}`} onClick={() => update({ ...sc, examples: sc.examples.filter((_, j) => j !== i) })} className="text-xs text-slate-400 hover:text-rose-600">
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!locked && sc.examples.length < 8 && (
        <button type="button" onClick={() => update({ ...sc, examples: [...sc.examples, { importe: '', resultado: '' }] })} className="mt-1 rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50">
          + Ejemplo
        </button>
      )}
    </div>
  )
}

const TDD_ACTIONS: TddAction[] = ['test100', 'test5', 'run', 'code', 'codeAll', 'refactor']

function TddView({ app, send }: { app: GherkinState; send: Send }) {
  const t = app.tdd
  const run = t.lastRun
  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-sans text-base font-semibold text-slate-900">Regla: comisión del enlace</h3>
        <p className="mt-1 text-sm text-slate-700">Kobalto cobra al emisor el 1,4 % del importe, con un mínimo de 0,25 €. Sofía la programa contigo. Cada paso lleva 5 minutos.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TDD_ACTIONS.map((a) => (
            <button key={a} type="button" onClick={() => send(tddStep(app, a))} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
              {TDD_LABEL[a]}
            </button>
          ))}
        </div>
      </article>
      <div className="grid gap-4 md:grid-cols-2">
        <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{testListing(t)}</pre>
        <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{codeListing(t)}</pre>
      </div>
      <div
        className={`rounded-2xl p-4 font-mono text-sm ${!run ? 'bg-white text-slate-500' : run.failing.length ? 'bg-rose-50 text-rose-800' : run.total ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-500'}`}
        aria-live="polite"
      >
        {!run
          ? 'Sin ejecutar desde el último cambio.'
          : run.total === 0
            ? 'No hay tests.'
            : run.failing.length
              ? `✗ ${run.failing.length} de ${run.total} en rojo: ${run.failing.join(' · ')}`
              : `✓ ${run.total} de ${run.total} en verde`}
      </div>
      {t.history.length > 0 && (
        <p className="text-xs text-slate-500">Secuencia: {t.history.map((h) => ({ test100: 'test', test5: 'test', run: 'ejecutar', code: 'código', codeAll: 'código', refactor: 'refactor' })[h]).join(' → ')}</p>
      )}
    </section>
  )
}
