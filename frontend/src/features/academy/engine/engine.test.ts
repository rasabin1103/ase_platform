import { describe, expect, it } from 'vitest'
import { m00PrimerDia as mission } from '../content/courses/testing-fundamentals/m00-primer-dia'
import { INITIAL_BANK, submitTransfer } from '../apps/kobalto/transferLogic'
import { createRun, pendingMeeting, quizScore, replay, step, summarize, toolStatus } from './engine'
import type { Action, BugReportInput, RunState } from './types'

const VALID_IBAN = 'ES30 9101 0001 1202 0001 2345'

function run(actions: Action[], seed = 42): RunState {
  return replay(mission, seed, actions)
}

function msgId(s: RunState, sceneId: string): number {
  const m = s.messages.find((x) => x.sceneId === sceneId)
  if (!m) throw new Error(`no message for ${sceneId}`)
  return m.id
}

const goodReport = (evidence: number[]): BugReportInput => ({
  title: 'Transferencia acepta importe negativo y suma saldo',
  steps: '1. Abrir Transferencias\n2. Importe -50\n3. Confirmar',
  expected: 'Error: el importe debe ser mayor que 0',
  actual: 'Se envía y el saldo aumenta 50 €',
  severity: 'critical',
  evidence,
})

describe('motor de la academia', () => {
  it('al empezar entrega correos y el chat de IT a las 09:00', () => {
    const s = run([{ type: 'start' }])
    expect(s.messages.map((m) => m.sceneId)).toEqual(['mail_bienvenida', 'mail_laura', 'chat_oscar'])
    expect(s.clock).toBe(0)
  })

  it('pedir accesos completos habilita staging y logs y consume tiempo', () => {
    let s = run([{ type: 'start' }])
    expect(toolStatus(mission, s, 'app')).toBe('locked')
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'chat_oscar'), choiceId: 'full' })
    expect(toolStatus(mission, s, 'app')).toBe('enabled')
    expect(toolStatus(mission, s, 'logs')).toBe('enabled')
    expect(s.clock).toBe(5)
  })

  it('la daily llega a las 09:30 como reunión pendiente y lleva a Marta', () => {
    let s = run([{ type: 'start' }, { type: 'wait', minutes: 30 }])
    const meeting = pendingMeeting(s)
    expect(meeting?.sceneId).toBe('daily')
    s = step(mission, s, { type: 'choose', messageId: meeting!.id, choiceId: 'ask' })
    expect(pendingMeeting(s)).toBeUndefined()
    expect(s.messages.some((m) => m.sceneId === 'marta_rules')).toBe(true)
  })

  it('es determinista: misma semilla y acciones → mismo estado', () => {
    const actions: Action[] = [{ type: 'start' }, { type: 'wait', minutes: 200 }]
    expect(run(actions, 7)).toEqual(run(actions, 7))
  })

  it('evalúa bug reports: sin evidencia, disputado sin reglas y aceptado', () => {
    let s = run([{ type: 'start' }])
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'chat_oscar'), choiceId: 'full' })

    s = step(mission, s, { type: 'report', report: goodReport([]) })
    expect(s.reports.at(-1)?.status).toBe('rejected')

    const neg = submitTransfer(INITIAL_BANK, { iban: VALID_IBAN, beneficiary: 'Ana', amount: '-50', concept: '' })
    s = step(mission, s, { type: 'app', event: neg.event })
    const negLog = s.log.at(-1)!.id
    s = step(mission, s, { type: 'report', report: goodReport([negLog]) })
    expect(s.reports.at(-1)).toMatchObject({ status: 'accepted', bugId: 'B2', key: 'KOB-202' })
    expect(s.messages.some((m) => m.sceneId === 'laura_first_bug')).toBe(true)

    const over = submitTransfer(INITIAL_BANK, { iban: VALID_IBAN, beneficiary: 'Ana', amount: '5000.50', concept: '' })
    s = step(mission, s, { type: 'app', event: over.event })
    s = step(mission, s, { type: 'report', report: { ...goodReport([s.log.at(-1)!.id]), severity: 'high' } })
    expect(s.reports.at(-1)?.status).toBe('disputed')

    s = step(mission, s, { type: 'report', report: goodReport([negLog]) })
    expect(s.reports.at(-1)?.status).toBe('duplicate')
  })

  it('terminar el día lleva a la charla con Laura y cierra la misión', () => {
    let s = run([{ type: 'start' }, { type: 'endDay' }])
    expect(s.clock).toBe(480)
    const closing = pendingMeeting(s)
    expect(closing?.sceneId).toBe('closing')
    // Sin bugs reportados, la opción "pro" no está disponible.
    expect(step(mission, s, { type: 'choose', messageId: closing!.id, choiceId: 'pro' }).finished).toBe(false)
    s = step(mission, s, { type: 'choose', messageId: closing!.id, choiceId: 'vague' })
    expect(s.finished).toBe(true)
    const summary = summarize(mission, s)
    expect(summary.total).toBe(6)
    expect(summary.found).toBe(0)
  })

  it('el estado inicial no está empezado', () => {
    expect(createRun(mission, 1).started).toBe(false)
  })
})

describe('ciclo de vida del bug', () => {
  const negativeReport = (evidence: number[]): BugReportInput => ({
    title: 'Transferencia acepta importe negativo y suma saldo',
    steps: '1. Abrir Transferencias\n2. Importe -50\n3. Confirmar',
    expected: 'Error: el importe debe ser mayor que 0',
    actual: 'Se envía y el saldo aumenta 50 €',
    severity: 'critical',
    evidence,
  })

  function withAccess() {
    let s = run([{ type: 'start' }])
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'chat_oscar'), choiceId: 'full' })
    return s
  }

  it('tras aceptar un bug, el fix se despliega y queda pendiente de verificar', () => {
    let s = withAccess()
    const neg = submitTransfer(INITIAL_BANK, { iban: VALID_IBAN, beneficiary: 'Ana', amount: '-50', concept: '' })
    s = step(mission, s, { type: 'app', event: neg.event })
    s = step(mission, s, { type: 'report', report: negativeReport([s.log.at(-1)!.id]) })
    expect(s.pendingFixes).toHaveLength(1)
    s = step(mission, s, { type: 'wait', minutes: 45 })
    const report = s.reports.at(-1)!
    expect(report.status).toBe('resolved')
    expect(s.fixedBugs).toContain('B2')
    expect(s.build).toBe(1)
    expect(s.messages.some((m) => m.sceneId === 'laura_regression')).toBe(true)

    // Cerrar sin re-probar penaliza.
    const closedBlind = step(mission, s, { type: 'verifyReport', key: report.key, verdict: 'close', evidence: [] })
    expect(closedBlind.reports.at(-1)!.verifications![0].retested).toBe(false)

    // Re-probar en el build nuevo y cerrar es correcto.
    const retest = submitTransfer(neg.bank, { iban: VALID_IBAN, beneficiary: 'Ana', amount: '-50', concept: '' }, { fixed: s.fixedBugs })
    expect(retest.ok).toBe(false)
    s = step(mission, s, { type: 'app', event: retest.event })
    s = step(mission, s, { type: 'verifyReport', key: report.key, verdict: 'close', evidence: [s.log.at(-1)!.id] })
    expect(s.reports.at(-1)!.status).toBe('verified')
    expect(s.reports.at(-1)!.verifications![0]).toMatchObject({ retested: true, correct: true })
  })

  it('un fix que no funciona se reabre con evidencia y llega un segundo fix', () => {
    let s = withAccess()
    const dbl = submitTransfer(INITIAL_BANK, { iban: VALID_IBAN, beneficiary: 'Ana', amount: '100', concept: '' }, { concurrent: true })
    s = step(mission, s, { type: 'app', event: dbl.event })
    s = step(mission, s, {
      type: 'report',
      report: { ...negativeReport([s.log.at(-1)!.id]), title: 'Doble clic en Confirmar duplica la transferencia' },
    })
    s = step(mission, s, { type: 'wait', minutes: 45 })
    const key = s.reports.at(-1)!.key
    expect(s.reports.at(-1)!.status).toBe('resolved')
    expect(s.fixedBugs).not.toContain('B5')
    const again = submitTransfer(INITIAL_BANK, { iban: VALID_IBAN, beneficiary: 'Ana', amount: '100', concept: '' }, { concurrent: true, fixed: s.fixedBugs })
    s = step(mission, s, { type: 'app', event: again.event })
    s = step(mission, s, { type: 'verifyReport', key, verdict: 'reopen', evidence: [s.log.at(-1)!.id] })
    expect(s.reports.at(-1)!.status).toBe('reopened')
    s = step(mission, s, { type: 'wait', minutes: 45 })
    expect(s.reports.at(-1)!.status).toBe('resolved')
    expect(s.fixedBugs).toContain('B5')
  })

  it('el fix de la coma introduce la regresión R1, que aparece en el debrief', () => {
    let s = withAccess()
    const comma = submitTransfer(INITIAL_BANK, { iban: VALID_IBAN, beneficiary: 'Ana', amount: '10,50', concept: '' })
    s = step(mission, s, { type: 'app', event: comma.event })
    s = step(mission, s, { type: 'report', report: { ...negativeReport([s.log.at(-1)!.id]), title: 'Importe con coma se multiplica por 100' } })
    expect(summarize(mission, s).bugs.some((b) => b.id === 'R1')).toBe(false)
    s = step(mission, s, { type: 'wait', minutes: 50 })
    expect(s.activeRegressions).toContain('R1')
    expect(summarize(mission, s).bugs.some((b) => b.id === 'R1')).toBe(true)
  })
})

describe('bugs variables por partida', () => {
  it('cada semilla activa una variante por hueco y el debrief solo muestra esas', () => {
    const sets = new Set<string>()
    for (let seed = 1; seed <= 40; seed++) {
      const s = createRun(mission, seed)
      expect(s.activeBugs).toHaveLength(6)
      expect(s.activeBugs).toContain('B5')
      sets.add(s.activeBugs.join(','))
      expect(summarize(mission, s).bugs.map((b) => b.id).sort()).toEqual([...s.activeBugs].sort())
    }
    expect(sets.size).toBeGreaterThan(5)
  })
})

describe('mentor y priorización por riesgo', () => {
  it('consultar una microlección cuesta tiempo una vez y desbloquea el concepto', () => {
    let s = run([{ type: 'start' }, { type: 'askMentor', lessonId: 'boundaries' }])
    expect(s.clock).toBe(5)
    expect(s.unlocked).toContain('boundary_values')
    s = step(mission, s, { type: 'askMentor', lessonId: 'boundaries' })
    expect(s.clock).toBe(5)
  })

  it('una priorización acertada suma en gestión del riesgo', () => {
    const rate = (itemId: string, p: 1 | 2 | 3, i: 1 | 2 | 3): Action => ({ type: 'riskRate', itemId, p, i })
    const good = run([
      { type: 'start' },
      rate('amount', 3, 3),
      rate('double', 2, 3),
      rate('daily', 2, 3),
      rate('iban', 2, 2),
      rate('beneficiary', 1, 1),
      rate('concept', 1, 1),
      { type: 'riskSubmit' },
    ])
    expect(good.scores.risk).toBe(2)
    expect(good.messages.at(-1)!.body).toContain('coincide')
    const bad = run([
      { type: 'start' },
      rate('amount', 1, 1),
      rate('double', 1, 1),
      rate('daily', 1, 1),
      rate('iban', 3, 3),
      rate('beneficiary', 3, 3),
      rate('concept', 3, 3),
      { type: 'riskSubmit' },
    ])
    expect(bad.scores.risk).toBe(0)
    expect(bad.messages.at(-1)!.body).toContain('impacto')
  })
})

describe('test antes y después', () => {
  it('el diagnóstico solo se responde antes de empezar y la comprobación al terminar', () => {
    let s = run([{ type: 'quizAnswer', phase: 'pre', questionId: 'pre_boundaries', option: 2 }])
    expect(s.quizAnswers.pre.pre_boundaries).toBe(2)
    s = step(mission, s, { type: 'start' })
    s = step(mission, s, { type: 'quizAnswer', phase: 'pre', questionId: 'pre_risk', option: 1 })
    expect(s.quizAnswers.pre.pre_risk).toBeUndefined()
    s = step(mission, s, { type: 'quizAnswer', phase: 'post', questionId: 'post_risk', option: 3 })
    expect(s.quizAnswers.post.post_risk).toBeUndefined()
    s = step(mission, s, { type: 'endDay' })
    s = step(mission, s, { type: 'choose', messageId: pendingMeeting(s)!.id, choiceId: 'none' })
    expect(s.finished).toBe(true)
    s = step(mission, s, { type: 'quizAnswer', phase: 'post', questionId: 'post_risk', option: 3 })
    expect(quizScore(mission, s, 'post')).toEqual({ total: 6, answered: 1, correct: 1 })
    expect(quizScore(mission, s, 'pre').correct).toBe(1)
  })
})

describe('revisión con IA', () => {
  it('guarda la revisión en la acción, suma rigor si es buena y no se repite', () => {
    let s = run([{ type: 'start' }])
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'chat_oscar'), choiceId: 'full' })
    const neg = submitTransfer(INITIAL_BANK, { iban: VALID_IBAN, beneficiary: 'Ana', amount: '-50', concept: '' })
    s = step(mission, s, { type: 'app', event: neg.event })
    s = step(mission, s, { type: 'report', report: goodReport([s.log.at(-1)!.id]) })
    const key = s.reports.at(-1)!.key
    const rigor = s.scores.rigor
    const review = { type: 'aiReview' as const, key, score: 4, strengths: ['Claro'], improvements: [], suggestedTitle: 'T' }
    s = step(mission, s, review)
    expect(s.reports.at(-1)!.aiReview?.score).toBe(4)
    expect(s.scores.rigor).toBe(rigor + 1)
    expect(step(mission, s, review).scores.rigor).toBe(rigor + 1)
  })
})

describe('evidencia del bug report', () => {
  it('adjuntar toda la evidencia a granel penaliza la calidad', () => {
    let s = run([{ type: 'start' }])
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'chat_oscar'), choiceId: 'full' })
    const ok = (amount: string) => submitTransfer(INITIAL_BANK, { iban: VALID_IBAN, beneficiary: 'Ana', amount, concept: '' }).event
    for (const a of ['100', '200', '300', '-50']) s = step(mission, s, { type: 'app', event: ok(a) })
    s = step(mission, s, { type: 'report', report: goodReport(s.log.map((l) => l.id)) })
    expect(s.reports.at(-1)!.status).toBe('needs_info')
    expect(s.reports.at(-1)!.feedback.join(' ')).toContain('solo la evidencia')
  })
})
