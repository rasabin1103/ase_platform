import type { Mission, RunState } from './types'

/**
 * Evaluación de la priorización por riesgo (probabilidad × impacto) del
 * alumno frente a la referencia de un QA senior.
 */
export interface RiskAssessment {
  rated: number
  total: number
  rows: {
    id: string
    label: string
    mine?: { p: number; i: number; score: number }
    ref: { p: number; i: number; score: number }
    why: string
    gap: number
  }[]
  myTop: string[]
  refTop: string[]
  topMatches: number
  /** Zonas de impacto alto (3) que el alumno valoró con impacto bajo (1). */
  underratedImpact: string[]
  good: boolean
}

function topIds(entries: { id: string; score: number }[], n: number): string[] {
  return entries
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((e) => e.id)
}

export function riskAssessment(mission: Mission, state: RunState): RiskAssessment | null {
  const model = mission.riskModel
  if (!model) return null
  const rows = model.items.map((item) => {
    const r = state.riskRatings[item.id]
    const ref = { p: item.reference.p, i: item.reference.i, score: item.reference.p * item.reference.i }
    const mine = r ? { p: r.p, i: r.i, score: r.p * r.i } : undefined
    return {
      id: item.id,
      label: item.label,
      mine,
      ref,
      why: item.reference.why,
      gap: mine ? Math.abs(mine.p - ref.p) + Math.abs(mine.i - ref.i) : 4,
    }
  })
  const rated = rows.filter((r) => r.mine)
  const myTop = topIds(rated.map((r) => ({ id: r.id, score: r.mine!.score })), model.topN)
  const refTop = topIds(rows.map((r) => ({ id: r.id, score: r.ref.score })), model.topN)
  const topMatches = myTop.filter((id) => refTop.includes(id)).length
  const underratedImpact = rows.filter((r) => r.mine && r.ref.i === 3 && r.mine.i === 1).map((r) => r.label)
  return {
    rated: rated.length,
    total: rows.length,
    rows,
    myTop,
    refTop,
    topMatches,
    underratedImpact,
    good: rated.length === rows.length && topMatches >= model.topN - 1 && underratedImpact.length === 0,
  }
}

export function riskFeedback(mission: Mission, state: RunState): string {
  const a = riskAssessment(mission, state)
  if (!a) return ''
  const label = (id: string) => mission.riskModel?.items.find((i) => i.id === id)?.label ?? id
  if (a.rated < a.total) {
    return `Te faltan zonas por valorar (${a.rated} de ${a.total}). Valóralas todas: lo que no está en la matriz no se prioriza, se olvida.`
  }
  const lines = [`Tu prioridad: ${a.myTop.map(label).join(', ')}.`]
  if (a.good) lines.push('Muy bien: coincide con lo que haría yo. Empieza por ahí y di claramente qué queda sin probar.')
  else {
    if (a.topMatches < a.refTop.length) {
      lines.push('Revisa la probabilidad: ¿qué partes son lógica nueva con números y reglas? ¿Qué cosas «probó en local» el dev?')
    }
    if (a.underratedImpact.length) {
      lines.push(`Ojo con el impacto de ${a.underratedImpact.join(', ')}: en un banco, todo lo que mueve dinero es impacto alto.`)
    }
  }
  return lines.join('\n')
}
