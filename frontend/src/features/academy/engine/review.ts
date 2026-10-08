import type { IssueType, Mission, RunState } from './types'

export const ISSUE_LABEL: Record<IssueType, string> = {
  ambiguous: 'Ambiguo',
  incomplete: 'Incompleto',
  contradictory: 'Contradictorio',
  untestable: 'No verificable',
}

export interface ReviewSummary {
  total: number
  found: number
  falsePositives: number
  typeErrors: number
  issues: {
    key: string
    explanation: string
    clarification: string
    fragments: string[]
    found: boolean
    foundAt?: number
    typeOk?: boolean
    /** NPC que lo encontró (si no fue el jugador). */
    foundBy?: string
  }[]
  prevented: { id: string; title: string }[]
  appeared: { id: string; title: string; preventedBy: string }[]
}

/** Resumen de la revisión estática y de los bugs evitados (debrief). */
export function reviewSummary(mission: Mission, s: RunState): ReviewSummary | null {
  const model = mission.requirementsReview
  if (!model) return null
  const byKey = new Map<string, ReviewSummary['issues'][number]>()
  for (const f of model.fragments) {
    if (!f.issue) continue
    const entry =
      byKey.get(f.issue.key) ??
      ({ key: f.issue.key, explanation: f.issue.explanation, clarification: f.issue.clarification, fragments: [], found: false } as ReviewSummary['issues'][number])
    entry.fragments.push(f.text)
    const r = s.reviewResults[f.id]
    if (r?.correct && (!entry.found || (entry.foundAt ?? Infinity) > r.at)) {
      entry.found = true
      entry.foundAt = r.at
      entry.typeOk = r.typeOk
      entry.foundBy = r.by
    }
    byKey.set(f.issue.key, entry)
  }
  const issues = Array.from(byKey.values())
  const results = Object.entries(s.reviewResults)
  return {
    total: issues.length,
    found: issues.filter((i) => i.found).length,
    falsePositives: results.filter(([, r]) => !r.correct).length,
    typeErrors: results.filter(([, r]) => r.correct && !r.typeOk).length,
    issues,
    prevented: s.preventedBugs.map((id) => ({ id, title: mission.bugs.find((b) => b.id === id)?.title ?? id })),
    appeared: mission.bugs
      .filter((b) => b.preventedBy && s.activeBugs.includes(b.id))
      .map((b) => ({ id: b.id, title: b.title, preventedBy: b.preventedBy as string })),
  }
}
