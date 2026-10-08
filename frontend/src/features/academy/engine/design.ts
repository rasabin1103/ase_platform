import type { DesignCase, Mission, RunState, TestDesignModel } from './types'

/**
 * Cobertura del diseño de pruebas: qué particiones cubren los casos del
 * alumno, qué resultados esperados son incorrectos y qué bugs habrían
 * revelado. Funciones puras: las usan el motor, la UI y el debrief.
 */

export interface CaseAnalysis {
  case: DesignCase
  partitions: string[]
  /** Resultado esperado correcto; undefined si no aplica. */
  correctAccept?: boolean
  expectedWrong: boolean
  /** El alumno no podía saberlo sin las reglas (flag ausente). */
  missingRules: boolean
  reveals?: string
  /** Marcó "pasa" un caso que revela un bug, o "falla" uno correcto. */
  resultWrong: boolean
}

export interface AreaCoverage {
  areaId: string
  label: string
  covered: { id: string; label: string; technique: string }[]
  missing: { id: string; label: string; technique: string; hint: string }[]
  coreCovered: number
  coreTotal: number
}

export interface DesignCoverage {
  cases: CaseAnalysis[]
  areas: AreaCoverage[]
  coreCovered: number
  coreTotal: number
  /** 0–1 */
  ratio: number
  expectedErrors: number
  revealingCases: number
  designedBeforeExecuting: boolean
}

export function analyzeCase(model: TestDesignModel, state: RunState, c: DesignCase): CaseAnalysis {
  const area = model.areas.find((a) => a.id === c.area)
  const partitions = model.classify(c.area, c.input)
  const correctAccept = model.expected(c.area, c.input)
  const expectedWrong = correctAccept !== undefined && correctAccept !== c.expectAccept
  const needsRules = (area?.partitions ?? []).some(
    (p) => partitions.includes(p.id) && p.requiresFlag && !state.flags[p.requiresFlag],
  )
  const reveals = model.reveals?.(c.area, c.input, state.activeBugs)
  const resultWrong = (c.result === 'pass' && !!reveals) || (c.result === 'fail' && !reveals)
  return { case: c, partitions, correctAccept, expectedWrong, missingRules: expectedWrong && needsRules, reveals, resultWrong }
}

export function designCoverage(mission: Mission, state: RunState): DesignCoverage | null {
  const model = mission.testDesign
  if (!model) return null
  const cases = state.designCases.map((c) => analyzeCase(model, state, c))
  const areas: AreaCoverage[] = model.areas.map((area) => {
    const hit = new Set(cases.filter((a) => a.case.area === area.id).flatMap((a) => a.partitions))
    const covered = area.partitions.filter((p) => hit.has(p.id))
    const missing = area.partitions.filter((p) => p.core && !hit.has(p.id))
    const core = area.partitions.filter((p) => p.core)
    return {
      areaId: area.id,
      label: area.label,
      covered: covered.map(({ id, label, technique }) => ({ id, label, technique })),
      missing: missing.map(({ id, label, technique, hint }) => ({ id, label, technique, hint })),
      coreCovered: core.filter((p) => hit.has(p.id)).length,
      coreTotal: core.length,
    }
  })
  const coreCovered = areas.reduce((n, a) => n + a.coreCovered, 0)
  const coreTotal = areas.reduce((n, a) => n + a.coreTotal, 0)
  const firstExecution = state.log[0]?.at
  const firstCase = state.designCases[0]?.at
  return {
    cases,
    areas,
    coreCovered,
    coreTotal,
    ratio: coreTotal ? coreCovered / coreTotal : 0,
    expectedErrors: cases.filter((c) => c.expectedWrong).length,
    revealingCases: cases.filter((c) => c.reveals).length,
    designedBeforeExecuting: firstCase !== undefined && (firstExecution === undefined || firstCase <= firstExecution),
  }
}

/** Texto de la revisión del mentor. La primera da pistas; las siguientes, nombres. */
export function reviewMessage(mission: Mission, state: RunState, reviewNumber: number): string {
  const cov = designCoverage(mission, state)
  if (!cov) return ''
  if (cov.cases.length === 0) {
    return 'Todavía no veo ningún caso en tu diseño. Empieza por el importe: ¿qué grupos de valores debería tratar igual el sistema?'
  }
  const lines: string[] = [`He revisado tu diseño (${cov.cases.length} casos). Cubres ${cov.coreCovered} de ${cov.coreTotal} particiones clave.`]
  for (const area of cov.areas) {
    if (area.missing.length === 0) {
      lines.push(`- **${area.label}**: completo 👌`)
      continue
    }
    const detail =
      reviewNumber <= 1
        ? Array.from(new Set(area.missing.map((m) => m.hint))).join(' ')
        : `te falta: ${area.missing.map((m) => m.label).join(', ')}.`
    lines.push(`- **${area.label}** (${area.coreCovered}/${area.coreTotal}): ${detail}`)
  }
  const wrong = cov.cases.filter((c) => c.expectedWrong)
  for (const w of wrong.slice(0, 3)) {
    lines.push(
      w.missingRules
        ? `- Caso #${w.case.id} («${w.case.input}»): no puedes saber el resultado esperado sin la regla exacta. ¿Se lo has preguntado a Marta?`
        : `- Caso #${w.case.id} («${w.case.input}»): revisa el resultado esperado según los criterios.`,
    )
  }
  if (reviewNumber <= 1 && cov.ratio < 1) lines.push('Cuando lo completes, pídeme otra revisión y te digo exactamente qué falta.')
  return lines.join('\n')
}

/** Aportación del diseño a la nota de rigor (se suma en el debrief). */
export function designRigorBonus(cov: DesignCoverage | null): number {
  if (!cov || cov.cases.length === 0) return 0
  return Math.round(cov.ratio * 4) - (cov.expectedErrors > 2 ? 1 : 0)
}
