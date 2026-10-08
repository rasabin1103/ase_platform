import { useState } from 'react'
import { Play, Trash2 } from 'lucide-react'
import { analyzeCase } from '../engine/design'
import type { CaseResult } from '../engine/types'
import { RiskPanel } from './RiskPanel'
import type { ToolProps } from './types'

const RESULT_LABEL: Record<CaseResult, string> = { pass: 'Pasa', fail: 'Falla', blocked: 'Bloqueado' }
const RESULT_CLS: Record<CaseResult, string> = {
  pass: 'text-ase-success',
  fail: 'text-ase-error',
  blocked: 'text-ase-warning',
}

const inputCls =
  'w-full rounded-ase-md border border-ase-border bg-ase-bg px-3 py-2 text-body-sm text-ase-text placeholder:text-ase-muted/70 focus:border-ase-brand focus:outline-none'

/**
 * Diseño de pruebas: el alumno define casos (zona + valor + resultado
 * esperado) antes de ejecutar. Cada caso muestra qué partición cubre; lo
 * que falta solo lo dice la revisión de la mentora.
 */
export function DesignTool({ mission, state, dispatch, onRun }: ToolProps & { onRun: (values: Record<string, string>) => void }) {
  const model = mission.testDesign
  const [areaId, setAreaId] = useState(model?.areas[0]?.id ?? '')
  const [input, setInput] = useState('')
  const [expectAccept, setExpectAccept] = useState<boolean | null>(null)
  const [tab, setTab] = useState<'cases' | 'risk'>(mission.riskModel ? 'risk' : 'cases')
  if (!model) {
    if (!mission.riskModel) return null
    return (
      <div className="h-full min-h-0 overflow-y-auto p-5">
        <div className="mx-auto max-w-5xl space-y-6">
          <header>
            <p className="font-mono text-caption text-ase-brand">Priorización por riesgo</p>
            <h2 className="font-sans text-heading-sm font-semibold">¿Qué puede fallar y cuánto dolería?</h2>
          </header>
          <RiskPanel mission={mission} state={state} dispatch={dispatch} />
        </div>
      </div>
    )
  }
  const area = model.areas.find((a) => a.id === areaId) ?? model.areas[0]
  const reviewer = mission.world.npcs.find((n) => n.id === model.reviewer)?.name ?? model.reviewer

  const addCase = () => {
    if (expectAccept === null) return
    dispatch({ type: 'designAdd', area: area.id, input, expectAccept })
    setInput('')
    setExpectAccept(null)
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-5">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-caption text-ase-brand">{model.storyId} · Diseño de pruebas</p>
            <h2 className="font-sans text-heading-sm font-semibold">Prioriza y diseña antes de ejecutar</h2>
            <p className="max-w-2xl text-body-sm text-ase-text2">
              {model.intro ??
                'Para cada zona, piensa en grupos de valores que el sistema debería tratar igual y en sus bordes. Cada caso lleva el valor que probarás y el resultado que esperas según los criterios.'}
            </p>
          </div>
          <button
            type="button"
            disabled={state.finished}
            onClick={() => dispatch({ type: 'designReview' })}
            className="rounded-ase-md border border-ase-brand/60 px-3 py-2 text-body-sm text-ase-text hover:bg-ase-brand/10 disabled:opacity-40"
          >
            Pedir revisión a {reviewer.split(' ')[0]} · {model.reviewCost} min
          </button>
        </header>

        {mission.riskModel && (
          <div className="flex gap-1 border-b border-ase-border" role="tablist" aria-label="Diseño">
            {[
              { id: 'risk' as const, l: '1 · Riesgos' },
              { id: 'cases' as const, l: '2 · Casos de prueba' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-body-sm ${tab === t.id ? 'border-ase-brand text-ase-text' : 'border-transparent text-ase-muted hover:text-ase-text'}`}
              >
                {t.l}
              </button>
            ))}
          </div>
        )}

        {tab === 'risk' && mission.riskModel ? (
          <RiskPanel mission={mission} state={state} dispatch={dispatch} />
        ) : (
          <>
        {/* Nuevo caso */}
        <section className="space-y-4 rounded-ase-lg border border-ase-border bg-ase-bg2 p-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Zona a probar">
            {model.areas.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={a.id === area.id}
                onClick={() => setAreaId(a.id)}
                className={`rounded-ase-pill border px-3 py-1 text-caption transition ${
                  a.id === area.id ? 'border-ase-brand bg-ase-brand/15 text-ase-text' : 'border-ase-border text-ase-muted hover:text-ase-text'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <form
            className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              addCase()
            }}
          >
            <label className="block space-y-1">
              <span className="text-label uppercase text-ase-muted">{area.inputLabel}</span>
              <input className={inputCls} value={input} onChange={(e) => setInput(e.target.value)} placeholder={area.inputPlaceholder} />
            </label>
            <fieldset className="space-y-1">
              <legend className="text-label uppercase text-ase-muted">{area.expectedQuestion}</legend>
              <div className="flex gap-1">
                {[
                  { v: true, l: 'Sí' },
                  { v: false, l: 'No' },
                ].map((o) => (
                  <button
                    key={o.l}
                    type="button"
                    onClick={() => setExpectAccept(o.v)}
                    aria-pressed={expectAccept === o.v}
                    className={`rounded-ase-md border px-4 py-2 text-body-sm ${
                      expectAccept === o.v ? 'border-ase-brand bg-ase-brand/20 text-ase-text' : 'border-ase-border text-ase-muted hover:text-ase-text'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={state.finished || expectAccept === null}
              className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-40"
            >
              Añadir caso · {model.caseCost} min
            </button>
          </form>
        </section>

        {/* Casos */}
        <section>
          <h3 className="mb-2 text-label uppercase text-ase-muted">Tus casos ({state.designCases.length})</h3>
          {state.designCases.length === 0 ? (
            <p className="text-body-sm text-ase-muted">Aún no has diseñado ningún caso.</p>
          ) : (
            <div className="overflow-x-auto rounded-ase-lg border border-ase-border">
              <table className="w-full min-w-[720px] text-left text-body-sm">
                <thead className="bg-ase-bg2 text-caption uppercase text-ase-muted">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Zona</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Esperado</th>
                    <th className="px-3 py-2">Cubre</th>
                    <th className="px-3 py-2">Resultado</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ase-border">
                  {state.designCases.map((c) => {
                    const a = model.areas.find((x) => x.id === c.area)
                    const info = analyzeCase(model, state, c)
                    const covers = (a?.partitions ?? []).filter((p) => info.partitions.includes(p.id))
                    return (
                      <tr key={c.id} className="align-top">
                        <td className="px-3 py-2 font-mono text-caption text-ase-muted">{c.id}</td>
                        <td className="px-3 py-2">{a?.label}</td>
                        <td className="px-3 py-2 font-mono text-caption">{c.input || '(vacío)'}</td>
                        <td className="px-3 py-2">{c.expectAccept ? (a?.expectedLabels?.yes ?? 'Se acepta') : (a?.expectedLabels?.no ?? 'Se rechaza')}</td>
                        <td className="px-3 py-2">
                          {covers.length === 0 ? (
                            <span className="text-caption text-ase-warning">No encaja en ninguna partición</span>
                          ) : (
                            covers.map((p) => (
                              <span key={p.id} className="mb-1 mr-1 inline-block rounded bg-white/5 px-1.5 text-caption text-ase-text2" title={p.technique}>
                                {p.label}
                              </span>
                            ))
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            aria-label={`Resultado del caso ${c.id}`}
                            value={c.result ?? ''}
                            disabled={state.finished}
                            onChange={(e) => dispatch({ type: 'designResult', caseId: c.id, result: (e.target.value || null) as CaseResult | null })}
                            className={`rounded border border-ase-border bg-ase-bg px-2 py-1 text-caption ${c.result ? RESULT_CLS[c.result] : 'text-ase-muted'}`}
                          >
                            <option value="">Sin ejecutar</option>
                            {(Object.keys(RESULT_LABEL) as CaseResult[]).map((r) => (
                              <option key={r} value={r}>
                                {RESULT_LABEL[r]}
                              </option>
                            ))}
                          </select>
                          {c.resultAt !== undefined && state.lastDeployAt !== undefined && c.resultAt < state.lastDeployAt && (
                            <span className="mt-1 block text-caption text-ase-brand" title="Hay un build nuevo en staging desde que lo ejecutaste">
                              ⟳ build nuevo: re-ejecutar
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          {model.prefill && (
                            <button
                              type="button"
                              title="Abrir en staging con estos datos"
                              onClick={() => onRun(model.prefill!(c.area, c.input))}
                              className="mr-1 rounded p-1 text-ase-brand hover:bg-ase-brand/10"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Quitar caso"
                            disabled={state.finished}
                            onClick={() => dispatch({ type: 'designRemove', caseId: c.id })}
                            className="rounded p-1 text-ase-muted hover:bg-white/5 hover:text-ase-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-caption text-ase-muted">
            ▶ abre staging con los datos del caso. Después marca si pasa o falla; si falla, regístralo en el tablero.
          </p>
        </section>
          </>
        )}
      </div>
    </div>
  )
}
