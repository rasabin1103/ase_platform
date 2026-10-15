import type { Mission, RunState } from './types'
import { missionLang, tr } from '../i18n'

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
  const lang = missionLang(mission)
  if (a.rated < a.total) {
    return tr(
      lang,
      `Te faltan zonas por valorar (${a.rated} de ${a.total}). Valóralas todas: lo que no está en la matriz no se prioriza, se olvida.`,
      `You still have areas to rate (${a.rated} of ${a.total}). Rate them all: what isn't in the matrix doesn't get prioritized, it gets forgotten.`,
    )
  }
  const lines = [tr(lang, `Tu prioridad: ${a.myTop.map(label).join(', ')}.`, `Your priority: ${a.myTop.map(label).join(', ')}.`)]
  if (a.good) {
    lines.push(
      tr(
        lang,
        'Muy bien: coincide con lo que haría yo. Empieza por ahí y di claramente qué queda sin probar.',
        "Very good: it matches what I would do. Start there and say clearly what's left untested.",
      ),
    )
  } else {
    if (a.topMatches < a.refTop.length) {
      lines.push(
        tr(
          lang,
          'Revisa la probabilidad: ¿qué partes son lógica nueva con números y reglas? ¿Qué cosas «probó en local» el dev?',
          'Revisit the likelihood: which parts are new logic with numbers and rules? What did the dev only “test locally”?',
        ),
      )
    }
    if (a.underratedImpact.length) {
      lines.push(
        tr(
          lang,
          `Ojo con el impacto de ${a.underratedImpact.join(', ')}: en un banco, todo lo que mueve dinero es impacto alto.`,
          `Watch the impact of ${a.underratedImpact.join(', ')}: in a bank, anything that moves money is high impact.`,
        ),
      )
    }
  }
  return lines.join('\n')
}
