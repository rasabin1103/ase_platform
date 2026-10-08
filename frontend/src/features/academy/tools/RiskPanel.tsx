import type { RiskLevel } from '../engine/types'
import type { ToolProps } from './types'

const LEVELS: { v: RiskLevel; l: string }[] = [
  { v: 1, l: 'Baja' },
  { v: 2, l: 'Media' },
  { v: 3, l: 'Alta' },
]

function scoreCls(score: number): string {
  if (score >= 6) return 'bg-ase-error/20 text-ase-error'
  if (score >= 3) return 'bg-ase-warning/20 text-ase-warning'
  return 'bg-white/5 text-ase-muted'
}

/** Matriz de riesgo: probabilidad × impacto por zona de la historia. */
export function RiskPanel({ mission, state, dispatch }: ToolProps) {
  const model = mission.riskModel
  if (!model) return null
  const reviewer = mission.world.npcs.find((n) => n.id === model.reviewer)?.name.split(' ')[0] ?? model.reviewer
  const ranked = model.items
    .filter((i) => state.riskRatings[i.id])
    .map((i) => ({ ...i, score: state.riskRatings[i.id].p * state.riskRatings[i.id].i }))
    .sort((a, b) => b.score - a.score)

  const rate = (itemId: string, field: 'p' | 'i', value: RiskLevel) => {
    const current = state.riskRatings[itemId] ?? { p: 2 as RiskLevel, i: 2 as RiskLevel }
    dispatch({ type: 'riskRate', itemId, p: field === 'p' ? value : current.p, i: field === 'i' ? value : current.i })
  }

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-body-sm text-ase-text2">
        No te dará tiempo a probarlo todo. Valora cada zona: <strong className="text-ase-text">probabilidad</strong> de que falle
        × <strong className="text-ase-text">impacto</strong> si falla. Empieza a probar por lo que salga más alto.
      </p>
      <div className="overflow-x-auto rounded-ase-lg border border-ase-border">
        <table className="w-full min-w-[640px] text-left text-body-sm">
          <thead className="bg-ase-bg2 text-caption uppercase text-ase-muted">
            <tr>
              <th className="px-3 py-2">Zona</th>
              <th className="px-3 py-2">Probabilidad</th>
              <th className="px-3 py-2">Impacto</th>
              <th className="px-3 py-2">Riesgo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ase-border">
            {model.items.map((item) => {
              const r = state.riskRatings[item.id]
              return (
                <tr key={item.id}>
                  <td className="px-3 py-2">
                    <span className="block text-ase-text">{item.label}</span>
                    <span className="text-caption text-ase-muted">{item.description}</span>
                  </td>
                  {(['p', 'i'] as const).map((field) => (
                    <td key={field} className="px-3 py-2">
                      <div className="flex gap-1" role="group" aria-label={`${field === 'p' ? 'Probabilidad' : 'Impacto'} de ${item.label}`}>
                        {LEVELS.map((lv) => (
                          <button
                            key={lv.v}
                            type="button"
                            disabled={state.finished}
                            aria-pressed={r?.[field] === lv.v}
                            onClick={() => rate(item.id, field, lv.v)}
                            className={`rounded border px-2 py-0.5 text-caption ${
                              r?.[field] === lv.v ? 'border-ase-brand bg-ase-brand/20 text-ase-text' : 'border-ase-border text-ase-muted hover:text-ase-text'
                            }`}
                          >
                            {lv.l}
                          </button>
                        ))}
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {r ? <span className={`rounded px-2 py-0.5 font-mono text-caption ${scoreCls(r.p * r.i)}`}>{r.p * r.i}</span> : <span className="text-caption text-ase-muted">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {ranked.length > 0 && (
        <p className="text-body-sm text-ase-text2">
          <span className="text-label uppercase text-ase-muted">Tu orden de prueba: </span>
          {ranked.map((r, idx) => `${idx + 1}. ${r.label}`).join(' · ')}
        </p>
      )}
      <button
        type="button"
        disabled={state.finished}
        onClick={() => dispatch({ type: 'riskSubmit' })}
        className="rounded-ase-md border border-ase-brand/60 px-3 py-2 text-body-sm text-ase-text hover:bg-ase-brand/10 disabled:opacity-40"
      >
        Enviar priorización a {reviewer} · {model.submitCost} min
      </button>
    </div>
  )
}
