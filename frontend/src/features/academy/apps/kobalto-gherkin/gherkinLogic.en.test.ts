import { describe, expect, it } from 'vitest'
import { INITIAL_GHERKIN, GHERKIN_KEYWORDS, STEPS, agree, askLaura, evaluateScenario, parseAmount, stepsFor, tddStep, type GherkinState, type Scenario } from './gherkinLogic'

const sc = (id: number, title: string, steps: [Scenario['steps'][number]['kw'], string][], examples: Scenario['examples'] = []): Scenario => ({
  id,
  title,
  steps: steps.map(([kw, stepId]) => ({ kw, stepId })),
  examples,
})

const ES: Scenario[] = [
  sc(1, 'Pagar un enlace pendiente', [['given', 'g_pend'], ['when', 'w_pay'], ['then', 't_paid']]),
  sc(2, 'Límites del importe', [['when', 'w_create'], ['then', 't_created']], [
    { importe: '0,99', resultado: 'rechaza' },
    { importe: '1,00', resultado: 'acepta' },
    { importe: '5.000,00', resultado: 'acepta' },
    { importe: '5000,01', resultado: 'rechaza' },
  ]),
  sc(3, 'Pantalla', [['given', 'g_ui'], ['when', 'w_ui'], ['then', 't_screen']]),
  sc(4, 'Anular pagado', [['given', 'g_pag'], ['when', 'w_cancel'], ['then', 't_canceled']]),
]
// The same scenarios written by an English player: English titles and English-format amounts.
const EN: Scenario[] = [
  sc(1, 'Pay a pending link', [['given', 'g_pend'], ['when', 'w_pay'], ['then', 't_paid']]),
  sc(2, 'Amount boundaries', [['when', 'w_create'], ['then', 't_created']], [
    { importe: '0.99', resultado: 'rechaza' },
    { importe: '1.00', resultado: 'acepta' },
    { importe: '5,000.00', resultado: 'acepta' },
    { importe: '5000.01', resultado: 'rechaza' },
  ]),
  sc(3, 'Screen', [['given', 'g_ui'], ['when', 'w_ui'], ['then', 't_screen']]),
  sc(4, 'Cancel a paid link', [['given', 'g_pag'], ['when', 'w_cancel'], ['then', 't_canceled']]),
]

const strip = (e: ReturnType<typeof evaluateScenario>) => ({ rules: e.rules, valid: e.valid, min: e.min, max: e.max, smells: e.smells.length, wrong: e.wrong.length })

describe('Gherkin editor · English', () => {
  it('has English keywords and steps with the same ids', () => {
    expect(GHERKIN_KEYWORDS.en).toMatchObject({ given: 'Given', when: 'When', then: 'Then', and: 'And', but: 'But', feature: 'Feature', scenario: 'Scenario' })
    expect(stepsFor('en').map((s) => [s.id, s.kw])).toEqual(STEPS.map((s) => [s.id, s.kw]))
    expect(stepsFor('en').find((s) => s.id === 'w_create')!.text).toContain('<amount>')
  })

  it('parses English-format amounts', () => {
    expect(parseAmount('5,000.01', 'en')).toBe(5000.01)
    expect(parseAmount('0.99', 'en')).toBe(0.99)
    expect(parseAmount('1,000', 'en')).toBe(1000)
    expect(parseAmount('5000,01', 'en')).toBe(5000.01)
    expect(parseAmount('5.000,01')).toBe(5000.01)
  })

  it('an English scenario evaluates like its Spanish equivalent', () => {
    ES.forEach((s, i) => expect(strip(evaluateScenario(EN[i], 'en'))).toEqual(strip(evaluateScenario(s))))
    expect(evaluateScenario(EN[2], 'en').smells.join(' ')).toContain('screens and clicks')
    expect(evaluateScenario(EN[3], 'en').wrong[0]).toContain('the cancellation is rejected because the link has already been paid')
  })

  it('agree, Laura and TDD give the same flags and outcomes', () => {
    const es: GherkinState = { ...INITIAL_GHERKIN, scenarios: ES, nextId: 5 }
    const en: GherkinState = { ...INITIAL_GHERKIN, scenarios: EN, nextId: 5 }
    expect(agree(en, 'en').event.flags).toEqual(agree(es).event.flags)
    expect(agree(en, 'en').event.flags).toContain('gk.ui')
    expect(askLaura(en, true, 'en').state.feedback!.length).toBe(askLaura(es, true).state.feedback!.length)
    let tes = es
    let ten = en
    for (const a of ['test100', 'run', 'code', 'run'] as const) {
      const r1 = tddStep(tes, a)
      const r2 = tddStep(ten, a, 'en')
      expect(r2.event.flags).toEqual(r1.event.flags)
      expect(r2.event.status).toBe(r1.event.status)
      tes = r1.state
      ten = r2.state
    }
    expect(tddStep(en, 'test5', 'en').event.summary).toBe('You and Sofía write the test "commission on €5.00 = €0.25 (minimum)".')
  })
})
