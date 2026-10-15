import type { RiskLevel } from '../engine/types'
import type { ToolProps } from './types'
import { missionLang } from '../i18n'

const LEVELS: RiskLevel[] = [1, 2, 3]

const COPY = {
  es: {
    levels: { 1: 'Baja', 2: 'Media', 3: 'Alta' } as Record<RiskLevel, string>,
    introA: 'No te dará tiempo a probarlo todo. Valora cada zona: ',
    likelihood: 'probabilidad',
    introB: ' de que falle × ',
    impact: 'impacto',
    introC: ' si falla. Empieza a probar por lo que salga más alto.',
    area: 'Zona',
    likelihoodH: 'Probabilidad',
    impactH: 'Impacto',
    risk: 'Riesgo',
    groupLabel: (field: 'p' | 'i', label: string) => `${field === 'p' ? 'Probabilidad' : 'Impacto'} de ${label}`,
    order: 'Tu orden de prueba: ',
    submit: (name: string, min: number) => `Enviar priorización a ${name} · ${min} min`,
  },
  en: {
    levels: { 1: 'Low', 2: 'Medium', 3: 'High' } as Record<RiskLevel, string>,
    introA: "You won't have time to test everything. Rate each area: ",
    likelihood: 'likelihood',
    introB: ' of failure × ',
    impact: 'impact',
    introC: ' if it fails. Start testing whatever scores highest.',
    area: 'Area',
    likelihoodH: 'Likelihood',
    impactH: 'Impact',
    risk: 'Risk',
    groupLabel: (field: 'p' | 'i', label: string) => `${field === 'p' ? 'Likelihood' : 'Impact'} of ${label}`,
    order: 'Your test order: ',
    submit: (name: string, min: number) => `Send prioritization to ${name} · ${min} min`,
  },
}

function scoreCls(score: number): string {
  if (score >= 6) return 'bg-ase-error/20 text-ase-error'
  if (score >= 3) return 'bg-ase-warning/20 text-ase-warning'
  return 'bg-white/5 text-ase-muted'
}

/** Matriz de riesgo: probabilidad × impacto por zona de la historia. */
export function RiskPanel({ mission, state, dispatch }: ToolProps) {
  const model = mission.riskModel
  if (!model) return null
  const c = COPY[missionLang(mission)]
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
        {c.introA}
        <strong className="text-ase-text">{c.likelihood}</strong>
        {c.introB}
        <strong className="text-ase-text">{c.impact}</strong>
        {c.introC}
      </p>
      <div className="overflow-x-auto rounded-ase-lg border border-ase-border">
        <table className="w-full min-w-[640px] text-left text-body-sm">
          <thead className="bg-ase-bg2 text-caption uppercase text-ase-muted">
            <tr>
              <th className="px-3 py-2">{c.area}</th>
              <th className="px-3 py-2">{c.likelihoodH}</th>
              <th className="px-3 py-2">{c.impactH}</th>
              <th className="px-3 py-2">{c.risk}</th>
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
                      <div className="flex gap-1" role="group" aria-label={c.groupLabel(field, item.label)}>
                        {LEVELS.map((lv) => (
                          <button
                            key={lv}
                            type="button"
                            disabled={state.finished}
                            aria-pressed={r?.[field] === lv}
                            onClick={() => rate(item.id, field, lv)}
                            className={`rounded border px-2 py-0.5 text-caption ${
                              r?.[field] === lv ? 'border-ase-brand bg-ase-brand/20 text-ase-text' : 'border-ase-border text-ase-muted hover:text-ase-text'
                            }`}
                          >
                            {c.levels[lv]}
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
          <span className="text-label uppercase text-ase-muted">{c.order}</span>
          {ranked.map((r, idx) => `${idx + 1}. ${r.label}`).join(' · ')}
        </p>
      )}
      <button
        type="button"
        disabled={state.finished}
        onClick={() => dispatch({ type: 'riskSubmit' })}
        className="rounded-ase-md border border-ase-brand/60 px-3 py-2 text-body-sm text-ase-text hover:bg-ase-brand/10 disabled:opacity-40"
      >
        {c.submit(reviewer, model.submitCost)}
      </button>
    </div>
  )
}
