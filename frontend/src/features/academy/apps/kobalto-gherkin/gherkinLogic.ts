import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'

/**
 * App del curso 2, misión 2: editor de escenarios Gherkin (ATDD/BDD) y
 * ciclo TDD con Sofía. Todo es determinista: los escenarios se construyen con
 * pasos de una biblioteca y el evaluador decide qué reglas quedan cubiertas,
 * qué malos olores tienen y qué flags activa el acuerdo.
 */

export type Keyword = 'given' | 'when' | 'then'
export const KEYWORD_LABEL: Record<Keyword, string> = { given: 'Dado', when: 'Cuando', then: 'Entonces' }
export const KEYWORD_LABEL_EN: Record<Keyword, string> = { given: 'Given', when: 'When', then: 'Then' }

/** Palabras clave de Gherkin en cada idioma (Gherkin las define así en «# language: es» y en inglés). */
export const GHERKIN_KEYWORDS: Record<AcademyLang, { given: string; when: string; then: string; and: string; but: string; feature: string; scenario: string; outline: string; examples: string }> = {
  es: { given: 'Dado', when: 'Cuando', then: 'Entonces', and: 'Y', but: 'Pero', feature: 'Característica', scenario: 'Escenario', outline: 'Esquema del escenario', examples: 'Ejemplos' },
  en: { given: 'Given', when: 'When', then: 'Then', and: 'And', but: 'But', feature: 'Feature', scenario: 'Scenario', outline: 'Scenario Outline', examples: 'Examples' },
}

/** Etiquetas Dado/Cuando/Entonces en el idioma pedido. */
export function keywordLabelFor(lang: AcademyLang = 'es'): Record<Keyword, string> {
  return lang === 'en' ? KEYWORD_LABEL_EN : KEYWORD_LABEL
}

export interface StepDef {
  id: string
  kw: Keyword
  text: string
  /** Solo aparece si se hizo el mapeo de ejemplos con los tres amigos. */
  mapped?: boolean
  /** Paso de interfaz (pantallas, clics): mal olor en BDD. */
  ui?: boolean
  /** Resultado no verificable. */
  vague?: boolean
}

export const STEPS: StepDef[] = [
  { id: 'g_pend', kw: 'given', text: 'un enlace de pago pendiente de 120,00 €' },
  { id: 'g_ui', kw: 'given', text: 'que estoy en la pantalla «Mis enlaces» con la sesión iniciada', ui: true },
  { id: 'g_cad', kw: 'given', text: 'un enlace de pago creado hace 8 días', mapped: true },
  { id: 'g_pag', kw: 'given', text: 'un enlace de pago que ya se ha pagado', mapped: true },
  { id: 'g_anu', kw: 'given', text: 'un enlace de pago anulado por el emisor', mapped: true },

  { id: 'w_pay', kw: 'when', text: 'el cliente paga el enlace con tarjeta' },
  { id: 'w_create', kw: 'when', text: 'el emisor crea un enlace de <importe> €' },
  { id: 'w_ui', kw: 'when', text: 'hago clic en «Pagar», relleno la tarjeta y pulso «Confirmar»', ui: true },
  { id: 'w_cancel', kw: 'when', text: 'el emisor anula el enlace', mapped: true },

  { id: 't_paid', kw: 'then', text: 'el pago se acepta y el enlace queda «pagado»' },
  { id: 't_created', kw: 'then', text: 'la creación <resultado>' },
  { id: 't_ok', kw: 'then', text: 'todo funciona correctamente', vague: true },
  { id: 't_screen', kw: 'then', text: 'veo un mensaje verde en la pantalla', ui: true },
  { id: 't_rej_cad', kw: 'then', text: 'el pago se rechaza con el motivo «enlace caducado»', mapped: true },
  { id: 't_rej_pag', kw: 'then', text: 'el pago se rechaza con el motivo «enlace ya pagado»', mapped: true },
  { id: 't_rej_anu', kw: 'then', text: 'el pago se rechaza con el motivo «enlace anulado»', mapped: true },
  { id: 't_canceled', kw: 'then', text: 'el enlace queda «anulado» y ya no se puede pagar', mapped: true },
  { id: 't_cancel_rej', kw: 'then', text: 'la anulación se rechaza porque el enlace ya está pagado', mapped: true },
]
export const stepById = (id: string) => STEPS.find((s) => s.id === id)

/** Texto en inglés de cada paso (mismos ids, palabra clave y marcas). */
const STEP_TEXT_EN: Record<string, string> = {
  g_pend: 'a pending payment link for €120.00',
  g_ui: 'I am on the "My links" screen and logged in',
  g_cad: 'a payment link created 8 days ago',
  g_pag: 'a payment link that has already been paid',
  g_anu: 'a payment link canceled by the issuer',
  w_pay: 'the customer pays the link by card',
  w_create: 'the issuer creates a link for €<amount>',
  w_ui: 'I click "Pay", fill in the card and press "Confirm"',
  w_cancel: 'the issuer cancels the link',
  t_paid: 'the payment is accepted and the link becomes "paid"',
  t_created: 'the creation <result>',
  t_ok: 'everything works correctly',
  t_screen: 'I see a green message on the screen',
  t_rej_cad: 'the payment is rejected with the reason "link expired"',
  t_rej_pag: 'the payment is rejected with the reason "link already paid"',
  t_rej_anu: 'the payment is rejected with the reason "link canceled"',
  t_canceled: 'the link becomes "canceled" and can no longer be paid',
  t_cancel_rej: 'the cancellation is rejected because the link has already been paid',
}

/** Biblioteca de pasos en el idioma pedido (mismos ids). */
export function stepsFor(lang: AcademyLang = 'es'): StepDef[] {
  return lang === 'en' ? STEPS.map((s) => ({ ...s, text: STEP_TEXT_EN[s.id] ?? s.text })) : STEPS
}

/** Texto de un paso en el idioma pedido. */
export function stepText(id: string, lang: AcademyLang = 'es'): string | undefined {
  const s = stepById(id)
  if (!s) return undefined
  return lang === 'en' ? (STEP_TEXT_EN[id] ?? s.text) : s.text
}

export type ExampleResult = 'acepta' | 'rechaza' | ''
export const RESULT_LABEL: Record<Exclude<ExampleResult, ''>, string> = {
  acepta: 'se acepta',
  rechaza: 'se rechaza: importe fuera de límites',
}

export const RESULT_LABEL_EN: Record<Exclude<ExampleResult, ''>, string> = {
  acepta: 'is accepted',
  rechaza: 'is rejected: amount out of range',
}

/** Etiquetas del resultado de los ejemplos en el idioma pedido (los valores siguen siendo «acepta»/«rechaza»). */
export function resultLabelFor(lang: AcademyLang = 'es'): Record<Exclude<ExampleResult, ''>, string> {
  return lang === 'en' ? RESULT_LABEL_EN : RESULT_LABEL
}

export interface Scenario {
  id: number
  title: string
  steps: { kw: Keyword; stepId: string }[]
  examples: { importe: string; resultado: ExampleResult }[]
}

export type TddAction = 'test100' | 'test5' | 'run' | 'code' | 'codeAll' | 'refactor'
export const TDD_LABEL: Record<TddAction, string> = {
  test100: 'Escribir test: comisión de 100,00 € = 1,40 €',
  test5: 'Escribir test: comisión de 5,00 € = 0,25 € (mínimo)',
  run: 'Ejecutar los tests',
  code: 'Escribir el código mínimo para que pasen los tests',
  codeAll: 'Escribir todo el código de la comisión de una vez',
  refactor: 'Refactorizar (nombrar la tasa y el mínimo)',
}

export const TDD_LABEL_EN: Record<TddAction, string> = {
  test100: 'Write test: commission on €100.00 = €1.40',
  test5: 'Write test: commission on €5.00 = €0.25 (minimum)',
  run: 'Run the tests',
  code: 'Write the minimum code to make the tests pass',
  codeAll: 'Write all the commission code at once',
  refactor: 'Refactor (name the rate and the minimum)',
}

/** Etiquetas de las acciones TDD en el idioma pedido. */
export function tddLabelFor(lang: AcademyLang = 'es'): Record<TddAction, string> {
  return lang === 'en' ? TDD_LABEL_EN : TDD_LABEL
}

export interface TddState {
  tests: ('test100' | 'test5')[]
  /** 0 sin código · 1 solo la tasa · 2 tasa con mínimo. */
  code: 0 | 1 | 2
  refactored: boolean
  history: TddAction[]
  lastRun?: { failing: string[]; total: number }
  codeFirst?: boolean
  redBeforeCode?: boolean
  refactorRed?: boolean
}

export interface AgreeResult {
  rules: Record<RuleId, boolean>
  smells: string[]
  wrong: string[]
  valid: number
}

export interface GherkinState {
  scenarios: Scenario[]
  nextId: number
  agreed?: AgreeResult
  feedback?: string[]
  feedbackCount: number
  tdd: TddState
}

export const INITIAL_GHERKIN: GherkinState = {
  scenarios: [],
  nextId: 1,
  feedbackCount: 0,
  tdd: { tests: [], code: 0, refactored: false, history: [] },
}

export const MAX_STEPS_PER_SCENARIO = 6
export const MIN = 1
export const MAX = 5000

// --------------------------------------------------------------- Reglas
export type RuleId = 'happy' | 'r1min' | 'r1max' | 'r2' | 'r3' | 'r4' | 'r5'
export const RULES: { id: RuleId; label: string; mapped?: boolean }[] = [
  { id: 'happy', label: 'Caso feliz: pagar un enlace pendiente' },
  { id: 'r1min', label: 'Importe mínimo: 0,99 € se rechaza y 1,00 € se acepta' },
  { id: 'r1max', label: 'Importe máximo: 5.000,00 € se acepta y 5.000,01 € se rechaza' },
  { id: 'r2', label: 'Un enlace caducado (más de 7 días) no se puede pagar', mapped: true },
  { id: 'r3', label: 'Un enlace pagado no admite un segundo pago', mapped: true },
  { id: 'r4', label: 'Un enlace anulado no se puede pagar', mapped: true },
  { id: 'r5', label: 'Un enlace pagado no se puede anular', mapped: true },
]

export const RULE_LABEL_EN: Record<RuleId, string> = {
  happy: 'Happy path: pay a pending link',
  r1min: 'Minimum amount: €0.99 is rejected and €1.00 is accepted',
  r1max: 'Maximum amount: €5,000.00 is accepted and €5,000.01 is rejected',
  r2: 'An expired link (more than 7 days) cannot be paid',
  r3: 'A paid link does not accept a second payment',
  r4: 'A canceled link cannot be paid',
  r5: 'A paid link cannot be canceled',
}

/** Reglas en el idioma pedido (mismos ids). */
export function rulesFor(lang: AcademyLang = 'es'): typeof RULES {
  return lang === 'en' ? RULES.map((r) => ({ ...r, label: RULE_LABEL_EN[r.id] })) : RULES
}

/** Comportamiento esperado: (contexto, acción) → resultado correcto y regla que cubre. */
const BEHAVIOUR: { given: string | null; when: string; then: string; rule: RuleId | null }[] = [
  { given: 'g_pend', when: 'w_pay', then: 't_paid', rule: 'happy' },
  { given: null, when: 'w_pay', then: 't_paid', rule: 'happy' },
  { given: 'g_cad', when: 'w_pay', then: 't_rej_cad', rule: 'r2' },
  { given: 'g_pag', when: 'w_pay', then: 't_rej_pag', rule: 'r3' },
  { given: 'g_anu', when: 'w_pay', then: 't_rej_anu', rule: 'r4' },
  { given: 'g_pag', when: 'w_cancel', then: 't_cancel_rej', rule: 'r5' },
  { given: 'g_pend', when: 'w_cancel', then: 't_canceled', rule: null },
]
const OUTCOMES = ['t_paid', 't_rej_cad', 't_rej_pag', 't_rej_anu', 't_canceled', 't_cancel_rej', 't_created']

/**
 * «1.000,50» / «1000.50» / «0,99» → número (NaN si no se entiende).
 * En inglés se aceptan «1,000.50» / «5000.01» / «0.99» (y, si hay duda, la coma decimal).
 */
export function parseAmount(raw: string, lang: AcademyLang = 'es'): number {
  const t = raw.trim().replace(/\s|€/g, '')
  if (!t) return NaN
  let norm = t
  if (lang === 'en') {
    const comma = t.lastIndexOf(',')
    const dot = t.lastIndexOf('.')
    if (comma >= 0 && dot >= 0) norm = comma > dot ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '')
    else if (comma >= 0) norm = /^-?\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.')
  } else if (t.includes(',')) norm = t.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) norm = t.replace(/\./g, '')
  if (!/^-?\d+(\.\d+)?$/.test(norm)) return NaN
  return Math.round(Number(norm) * 100) / 100
}

export const isOutline = (sc: Scenario) => sc.steps.some((st) => (stepById(st.stepId)?.text ?? '').includes('<'))

export interface ScenarioEval {
  rules: RuleId[]
  smells: string[]
  wrong: string[]
  valid: boolean
  min: boolean
  max: boolean
}

/** Textos del evaluador (malos olores y resultados incorrectos) en cada idioma. */
const EVAL_TEXT = {
  es: {
    name: (title: string, id: number) => (title ? `«${title}»` : `el escenario ${id}`),
    missing: (n: string, noWhen: boolean) => `${n}: le falta ${noWhen ? 'el Cuando' : 'el Entonces'}.`,
    ui: (n: string) => `${n}: describe pantallas y clics en lugar del comportamiento.`,
    manyWhens: (n: string) => `${n}: tiene varios Cuando; cada escenario debe probar una sola acción.`,
    vague: (n: string) => `${n}: «todo funciona correctamente» no se puede verificar.`,
    manyGivens: (n: string) => `${n}: mezcla varios contextos en el Dado.`,
    createThen: (n: string) => `${n}: crear un enlace no termina en un pago; el Entonces no corresponde a la acción.`,
    noExamples: (n: string) => `${n}: es un esquema sin ejemplos.`,
    badRow: (n: string, v: string) => `${n}: hay ejemplos incompletos o con importes que no se entienden («${v || 'vacío'}»).`,
    wrongRow: (n: string, v: string, expected: string, got: string) => `${n}: con ${v} € la creación ${expected}, no «${got}».`,
    notRule: (n: string) => `${n}: esa combinación de contexto y acción no es una regla acordada.`,
    wrongThen: (n: string, then: string) => `${n}: el resultado esperado no es el que acordasteis (debería ser «${then}»).`,
  },
  en: {
    name: (title: string, id: number) => (title ? `"${title}"` : `scenario ${id}`),
    missing: (n: string, noWhen: boolean) => `${n}: it is missing ${noWhen ? 'the When' : 'the Then'}.`,
    ui: (n: string) => `${n}: it describes screens and clicks instead of the behavior.`,
    manyWhens: (n: string) => `${n}: it has several Whens; each scenario should test a single action.`,
    vague: (n: string) => `${n}: "everything works correctly" cannot be verified.`,
    manyGivens: (n: string) => `${n}: it mixes several contexts in the Given.`,
    createThen: (n: string) => `${n}: creating a link does not end in a payment; the Then does not match the action.`,
    noExamples: (n: string) => `${n}: it is a Scenario Outline without examples.`,
    badRow: (n: string, v: string) => `${n}: some examples are incomplete or have amounts that cannot be read ("${v || 'empty'}").`,
    wrongRow: (n: string, v: string, expected: string, got: string) => `${n}: with €${v} the creation ${expected}, not "${got}".`,
    notRule: (n: string) => `${n}: that combination of context and action is not an agreed rule.`,
    wrongThen: (n: string, then: string) => `${n}: the expected result is not the one you agreed on (it should be "${then}").`,
  },
}

export function evaluateScenario(sc: Scenario, lang: AcademyLang = 'es'): ScenarioEval {
  const T = EVAL_TEXT[lang]
  const results = resultLabelFor(lang)
  const name = T.name(sc.title.trim(), sc.id)
  const smells: string[] = []
  const wrong: string[] = []
  const rules: RuleId[] = []
  const defs = sc.steps.map((st) => stepById(st.stepId)).filter((d): d is StepDef => !!d)
  const givens = defs.filter((d) => d.kw === 'given')
  const whens = defs.filter((d) => d.kw === 'when')
  const thens = defs.filter((d) => d.kw === 'then')
  let min = false
  let max = false
  if (whens.length === 0 || thens.length === 0) {
    smells.push(T.missing(name, whens.length === 0))
    return { rules, smells, wrong, valid: false, min, max }
  }
  if (defs.some((d) => d.ui)) smells.push(T.ui(name))
  if (whens.length > 1) smells.push(T.manyWhens(name))
  if (thens.some((d) => d.vague)) smells.push(T.vague(name))
  const domainGivens = givens.filter((d) => !d.ui)
  if (domainGivens.length > 1) smells.push(T.manyGivens(name))

  const when = whens[0].id === 'w_ui' ? 'w_pay' : whens[0].id
  const given = domainGivens.length === 1 ? domainGivens[0].id : null
  const outcomes = thens.filter((d) => OUTCOMES.includes(d.id)).map((d) => d.id)

  if (when === 'w_create') {
    if (!outcomes.includes('t_created')) {
      wrong.push(T.createThen(name))
    } else if (sc.examples.length === 0) {
      smells.push(T.noExamples(name))
    } else {
      let rowsOk = true
      for (const ex of sc.examples) {
        const v = parseAmount(ex.importe, lang)
        if (Number.isNaN(v) || !ex.resultado) {
          rowsOk = false
          smells.push(T.badRow(name, ex.importe))
          continue
        }
        const expected = v >= MIN && v <= MAX ? 'acepta' : 'rechaza'
        if (ex.resultado !== expected) {
          rowsOk = false
          wrong.push(T.wrongRow(name, ex.importe, results[expected], results[ex.resultado]))
        }
      }
      const has = (v: number, r: ExampleResult) => sc.examples.some((ex) => parseAmount(ex.importe, lang) === v && ex.resultado === r)
      min = has(0.99, 'rechaza') && has(1, 'acepta')
      max = has(5000, 'acepta') && has(5000.01, 'rechaza')
      if (min && rowsOk) rules.push('r1min')
      if (max && rowsOk) rules.push('r1max')
    }
  } else {
    const b = BEHAVIOUR.find((x) => x.when === when && x.given === given)
    if (!b) {
      if (outcomes.length) wrong.push(T.notRule(name))
    } else if (outcomes.length) {
      if (outcomes.includes(b.then) && outcomes.length === 1) {
        if (b.rule) rules.push(b.rule)
      } else {
        wrong.push(T.wrongThen(name, stepText(b.then, lang) ?? b.then))
      }
    }
  }
  const valid = wrong.length === 0 && smells.length === 0 && (rules.length > 0 || outcomes.length > 0)
  return { rules, smells, wrong, valid, min, max }
}

export function evaluateAll(state: GherkinState, lang: AcademyLang = 'es'): AgreeResult {
  const rules = Object.fromEntries(RULES.map((r) => [r.id, false])) as Record<RuleId, boolean>
  const smells: string[] = []
  const wrong: string[] = []
  let valid = 0
  for (const sc of state.scenarios) {
    const e = evaluateScenario(sc, lang)
    for (const r of e.rules) rules[r] = true
    smells.push(...e.smells)
    wrong.push(...e.wrong)
    if (e.valid) valid++
  }
  return { rules, smells, wrong, valid }
}

// ------------------------------------------------------------ Edición
function editEvent(state: GherkinState, summary: string): { state: GherkinState; event: AppEvent } {
  return {
    state,
    event: { app: 'kobalto-gherkin', action: 'edit', summary, technical: 'gherkin.edit', status: 'ok', bugs: [], cost: 0 },
  }
}

export function addScenario(state: GherkinState, lang: AcademyLang = 'es'): { state: GherkinState; event: AppEvent } {
  const sc: Scenario = { id: state.nextId, title: '', steps: [], examples: [] }
  const r = editEvent({ ...state, scenarios: [...state.scenarios, sc], nextId: state.nextId + 1 }, lang === 'en' ? `New scenario ${sc.id}.` : `Nuevo escenario ${sc.id}.`)
  return { ...r, event: { ...r.event, action: 'add_scenario', cost: 5 } }
}

export function updateScenario(state: GherkinState, sc: Scenario, lang: AcademyLang = 'es'): { state: GherkinState; event: AppEvent } {
  const steps = sc.steps.slice(0, MAX_STEPS_PER_SCENARIO)
  const examples = isOutline({ ...sc, steps }) ? sc.examples.slice(0, 8).map((e) => ({ importe: e.importe.slice(0, 12), resultado: e.resultado })) : []
  const clean: Scenario = { ...sc, title: sc.title.slice(0, 80), steps, examples }
  return editEvent({ ...state, scenarios: state.scenarios.map((s) => (s.id === sc.id ? clean : s)) }, lang === 'en' ? `Scenario ${sc.id} edited.` : `Escenario ${sc.id} editado.`)
}

export function removeScenario(state: GherkinState, id: number, lang: AcademyLang = 'es'): { state: GherkinState; event: AppEvent } {
  return editEvent({ ...state, scenarios: state.scenarios.filter((s) => s.id !== id) }, lang === 'en' ? `Scenario ${id} removed.` : `Escenario ${id} eliminado.`)
}

/** Laura revisa los escenarios: señala malos olores y cuántas reglas quedan sin cubrir, sin dar la solución. */
export function askLaura(state: GherkinState, mapped: boolean, lang: AcademyLang = 'es'): { state: GherkinState; event: AppEvent } {
  const en = lang === 'en'
  const r = evaluateAll(state, lang)
  const known = RULES.filter((x) => mapped || !x.mapped)
  const uncovered = known.filter((x) => !r.rules[x.id]).length
  const fb: string[] = []
  const n = r.wrong.length
  if (state.scenarios.length === 0)
    fb.push(en ? 'There are no scenarios yet. Start with the happy path and go rule by rule.' : 'Todavía no hay escenarios. Empieza por el caso feliz y sigue regla por regla.')
  for (const s of r.smells.slice(0, 4)) fb.push(s)
  if (n)
    fb.push(
      en
        ? `${n} expected result${n === 1 ? ' does' : 's do'} not match what was agreed: check the example map.`
        : `Hay ${n} resultado${n === 1 ? '' : 's'} esperado${n === 1 ? '' : 's'} que no coincide${n === 1 ? '' : 'n'} con lo acordado: revisa el mapa de ejemplos.`,
    )
  if (uncovered > 0)
    fb.push(
      en
        ? `${uncovered} of the ${known.length} rules in the map still have no correct scenario.`
        : `${uncovered} de las ${known.length} reglas del mapa todavía no tienen un escenario correcto.`,
    )
  if (!r.rules.r1min || !r.rules.r1max)
    fb.push(
      en
        ? 'For the amount limits, use a Scenario Outline with examples right on each side of each boundary.'
        : 'Para los límites de importe, usa un esquema de escenario con ejemplos justo a cada lado de cada borde.',
    )
  if (!mapped)
    fb.push(
      en
        ? 'Are you sure the happy path and the amounts are all the rules? You did not ask about expiry, repeated payments or cancellations.'
        : '¿Seguro que el caso feliz y los importes son todas las reglas? No preguntaste qué pasa con caducidad, pagos repetidos o anulaciones.',
    )
  if (fb.length === 0)
    fb.push(
      en
        ? 'Clear scenarios, one per behavior, no screens and with the boundaries. Ready to agree on.'
        : 'Escenarios claros, uno por comportamiento, sin pantallas y con los bordes. Listos para acordar.',
    )
  return {
    state: { ...state, feedback: fb, feedbackCount: state.feedbackCount + 1 },
    event: {
      app: 'kobalto-gherkin',
      action: 'ask_laura',
      summary: `${en ? 'Laura reviews your scenarios' : 'Laura revisa tus escenarios'}: ${fb.join(' ')}`,
      technical: 'gherkin.review',
      status: 'ok',
      bugs: [],
      cost: 10,
    },
  }
}

/** Acordar los escenarios con PO y desarrollo: son los criterios de aceptación que se programan y automatizan. */
export function agree(state: GherkinState, lang: AcademyLang = 'es'): { state: GherkinState; event: AppEvent } {
  const r = evaluateAll(state, lang)
  const flags = ['gk.agreed']
  for (const [k, v] of Object.entries(r.rules)) if (v) flags.push(`gk.${k}`)
  const clean = r.smells.length === 0 && r.wrong.length === 0
  if (clean && r.valid >= 3) flags.push('gk.style')
  if (r.wrong.length) flags.push('gk.wrong')
  // Los flags nunca dependen del idioma: el mal olor de interfaz se detecta sobre la evaluación en español.
  const ui = lang === 'es' ? r.smells : evaluateAll(state, 'es').smells
  if (ui.some((x) => x.includes('pantallas'))) flags.push('gk.ui')
  const covered = Object.values(r.rules).filter(Boolean).length
  return {
    state: { ...state, agreed: r },
    event: {
      app: 'kobalto-gherkin',
      action: 'agree',
      summary: lang === 'en'
        ? `Scenarios agreed with Elena and Tomás: ${state.scenarios.length} scenarios, ${covered} of ${RULES.length} rules covered.${r.smells.length ? ` Smells: ${r.smells.length}.` : ''}${r.wrong.length ? ` Incorrect expected results: ${r.wrong.length}.` : ''}`
        : `Escenarios acordados con Elena y Tomás: ${state.scenarios.length} escenarios, ${covered} de ${RULES.length} reglas cubiertas.${r.smells.length ? ` Malos olores: ${r.smells.length}.` : ''}${r.wrong.length ? ` Resultados esperados incorrectos: ${r.wrong.length}.` : ''}`,
      technical: `gherkin.agree ${JSON.stringify(r.rules)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}

// ----------------------------------------------------------------- TDD
const TEST_NAME: Record<'test100' | 'test5', string> = {
  test100: 'comisión de 100,00 € = 1,40 €',
  test5: 'comisión de 5,00 € = 0,25 € (mínimo)',
}

const TEST_NAME_EN: Record<'test100' | 'test5', string> = {
  test100: 'commission on €100.00 = €1.40',
  test5: 'commission on €5.00 = €0.25 (minimum)',
}

export function failingTests(t: TddState, lang: AcademyLang = 'es'): string[] {
  const names = lang === 'en' ? TEST_NAME_EN : TEST_NAME
  return t.tests.filter((x) => (x === 'test100' ? t.code < 1 : t.code < 2)).map((x) => names[x])
}

/** Resúmenes del ciclo TDD en cada idioma. */
const TDD_TEXT = {
  es: {
    wrote: (name: string) => `Sofía y tú escribís el test «${name}».`,
    noTests: 'No hay tests que ejecutar.',
    red: (f: number, n: number) => `Tests en rojo: ${f} de ${n} fallan.`,
    green: (n: number) => `Tests en verde: ${n} de ${n} pasan.`,
    codeNoTests: 'Sofía escribe código sin ningún test que lo guíe.',
    code: 'Sofía escribe el código mínimo para que pasen los tests.',
    codeAll: 'Sofía escribe de una vez «todo» el código de la comisión: 1,4 % del importe.',
    refactor: 'Refactorizáis: la tasa y el mínimo pasan a ser constantes con nombre.',
  },
  en: {
    wrote: (name: string) => `You and Sofía write the test "${name}".`,
    noTests: 'There are no tests to run.',
    red: (f: number, n: number) => `Tests red: ${f} of ${n} failing.`,
    green: (n: number) => `Tests green: ${n} of ${n} passing.`,
    codeNoTests: 'Sofía writes code without any test to guide it.',
    code: 'Sofía writes the minimum code to make the tests pass.',
    codeAll: 'Sofía writes "all" the commission code at once: 1.4% of the amount.',
    refactor: 'You refactor: the rate and the minimum become named constants.',
  },
}

export function tddStep(state: GherkinState, action: TddAction, lang: AcademyLang = 'es'): { state: GherkinState; event: AppEvent } {
  const T = TDD_TEXT[lang]
  const t: TddState = { ...state.tdd, tests: [...state.tdd.tests], history: [...state.tdd.history, action] }
  const flags: string[] = []
  let summary = ''
  switch (action) {
    case 'test100':
    case 'test5':
      if (!t.tests.includes(action)) t.tests.push(action)
      summary = T.wrote((lang === 'en' ? TEST_NAME_EN : TEST_NAME)[action])
      break
    case 'run': {
      const failing = failingTests(t, lang)
      t.lastRun = { failing, total: t.tests.length }
      if (failing.length > 0 && t.history.slice(0, -1).every((a) => a !== 'code' && a !== 'codeAll')) t.redBeforeCode = true
      summary = t.tests.length === 0 ? T.noTests : failing.length ? T.red(failing.length, t.tests.length) : T.green(t.tests.length)
      break
    }
    case 'code':
      if (t.tests.length === 0) t.codeFirst = true
      t.code = t.tests.includes('test5') ? 2 : 1
      t.lastRun = undefined
      summary = t.tests.length === 0 ? T.codeNoTests : T.code
      break
    case 'codeAll':
      if (t.tests.length === 0) t.codeFirst = true
      t.code = Math.max(t.code, 1) as 1 | 2
      t.lastRun = undefined
      summary = T.codeAll
      break
    case 'refactor':
      if (!t.lastRun || t.lastRun.failing.length > 0) t.refactorRed = true
      if (t.code > 0) t.refactored = true
      t.lastRun = undefined
      summary = T.refactor
      break
  }
  const green = !!t.lastRun && t.lastRun.total > 0 && t.lastRun.failing.length === 0
  if (t.code === 2 && t.tests.includes('test5') && green) flags.push('tdd.min')
  if (t.codeFirst) flags.push('tdd.code_first')
  if (t.refactorRed) flags.push('tdd.refactor_red')
  const lastRefactor = t.history.lastIndexOf('refactor')
  if (!t.codeFirst && t.redBeforeCode && t.refactored && green && lastRefactor >= 0 && t.history.lastIndexOf('run') > lastRefactor) flags.push('tdd.cycle')
  return {
    state: { ...state, tdd: t },
    event: { app: 'kobalto-gherkin', action: `tdd_${action}`, summary, technical: `tdd.${action}`, status: green || action !== 'run' ? 'ok' : 'error', bugs: [], cost: 5, flags },
  }
}

export function codeListing(t: TddState, lang: AcademyLang = 'es'): string {
  if (lang === 'en') {
    if (t.code === 0) return '// commission.ts\n// (no code yet)'
    if (t.code === 1) return '// commission.ts\nexport function commission(amount: number): number {\n  return round(amount * 0.014)\n}'
    if (!t.refactored) return '// commission.ts\nexport function commission(amount: number): number {\n  return Math.max(round(amount * 0.014), 0.25)\n}'
    return '// commission.ts\nconst RATE = 0.014\nconst MINIMUM_COMMISSION = 0.25\n\nexport function commission(amount: number): number {\n  return Math.max(round(amount * RATE), MINIMUM_COMMISSION)\n}'
  }
  if (t.code === 0) return '// comision.ts\n// (todavía no hay código)'
  if (t.code === 1) return '// comision.ts\nexport function comision(importe: number): number {\n  return redondear(importe * 0.014)\n}'
  if (!t.refactored) return '// comision.ts\nexport function comision(importe: number): number {\n  return Math.max(redondear(importe * 0.014), 0.25)\n}'
  return '// comision.ts\nconst TASA = 0.014\nconst COMISION_MINIMA = 0.25\n\nexport function comision(importe: number): number {\n  return Math.max(redondear(importe * TASA), COMISION_MINIMA)\n}'
}

export function testListing(t: TddState, lang: AcademyLang = 'es'): string {
  if (lang === 'en') {
    if (t.tests.length === 0) return '// commission.test.ts\n// (no tests yet)'
    const en = ['// commission.test.ts']
    if (t.tests.includes('test100')) en.push("it('charges 1.4% of the amount', () => {\n  expect(commission(100.00)).toBe(1.40)\n})")
    if (t.tests.includes('test5')) en.push("it('applies the €0.25 minimum commission', () => {\n  expect(commission(5.00)).toBe(0.25)\n})")
    return en.join('\n\n')
  }
  if (t.tests.length === 0) return '// comision.test.ts\n// (todavía no hay tests)'
  const lines = ['// comision.test.ts']
  if (t.tests.includes('test100')) lines.push("it('cobra el 1,4 % del importe', () => {\n  expect(comision(100.00)).toBe(1.40)\n})")
  if (t.tests.includes('test5')) lines.push("it('aplica la comisión mínima de 0,25 €', () => {\n  expect(comision(5.00)).toBe(0.25)\n})")
  return lines.join('\n\n')
}
