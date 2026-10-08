import type { AppEvent } from '../../engine/types'

/**
 * App del curso 2, misión 2: editor de escenarios Gherkin (ATDD/BDD) y
 * ciclo TDD con Sofía. Todo es determinista: los escenarios se construyen con
 * pasos de una biblioteca y el evaluador decide qué reglas quedan cubiertas,
 * qué malos olores tienen y qué flags activa el acuerdo.
 */

export type Keyword = 'given' | 'when' | 'then'
export const KEYWORD_LABEL: Record<Keyword, string> = { given: 'Dado', when: 'Cuando', then: 'Entonces' }

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

export type ExampleResult = 'acepta' | 'rechaza' | ''
export const RESULT_LABEL: Record<Exclude<ExampleResult, ''>, string> = {
  acepta: 'se acepta',
  rechaza: 'se rechaza: importe fuera de límites',
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

/** «1.000,50» / «1000.50» / «0,99» → número (NaN si no se entiende). */
export function parseAmount(raw: string): number {
  const t = raw.trim().replace(/\s|€/g, '')
  if (!t) return NaN
  let norm = t
  if (t.includes(',')) norm = t.replace(/\./g, '').replace(',', '.')
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

export function evaluateScenario(sc: Scenario): ScenarioEval {
  const name = sc.title.trim() ? `«${sc.title.trim()}»` : `el escenario ${sc.id}`
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
    smells.push(`${name}: le falta ${whens.length === 0 ? 'el Cuando' : 'el Entonces'}.`)
    return { rules, smells, wrong, valid: false, min, max }
  }
  if (defs.some((d) => d.ui)) smells.push(`${name}: describe pantallas y clics en lugar del comportamiento.`)
  if (whens.length > 1) smells.push(`${name}: tiene varios Cuando; cada escenario debe probar una sola acción.`)
  if (thens.some((d) => d.vague)) smells.push(`${name}: «todo funciona correctamente» no se puede verificar.`)
  const domainGivens = givens.filter((d) => !d.ui)
  if (domainGivens.length > 1) smells.push(`${name}: mezcla varios contextos en el Dado.`)

  const when = whens[0].id === 'w_ui' ? 'w_pay' : whens[0].id
  const given = domainGivens.length === 1 ? domainGivens[0].id : null
  const outcomes = thens.filter((d) => OUTCOMES.includes(d.id)).map((d) => d.id)

  if (when === 'w_create') {
    if (!outcomes.includes('t_created')) {
      wrong.push(`${name}: crear un enlace no termina en un pago; el Entonces no corresponde a la acción.`)
    } else if (sc.examples.length === 0) {
      smells.push(`${name}: es un esquema sin ejemplos.`)
    } else {
      let rowsOk = true
      for (const ex of sc.examples) {
        const v = parseAmount(ex.importe)
        if (Number.isNaN(v) || !ex.resultado) {
          rowsOk = false
          smells.push(`${name}: hay ejemplos incompletos o con importes que no se entienden («${ex.importe || 'vacío'}»).`)
          continue
        }
        const expected = v >= MIN && v <= MAX ? 'acepta' : 'rechaza'
        if (ex.resultado !== expected) {
          rowsOk = false
          wrong.push(`${name}: con ${ex.importe} € la creación ${RESULT_LABEL[expected]}, no «${RESULT_LABEL[ex.resultado]}».`)
        }
      }
      const has = (v: number, r: ExampleResult) => sc.examples.some((ex) => parseAmount(ex.importe) === v && ex.resultado === r)
      min = has(0.99, 'rechaza') && has(1, 'acepta')
      max = has(5000, 'acepta') && has(5000.01, 'rechaza')
      if (min && rowsOk) rules.push('r1min')
      if (max && rowsOk) rules.push('r1max')
    }
  } else {
    const b = BEHAVIOUR.find((x) => x.when === when && x.given === given)
    if (!b) {
      if (outcomes.length) wrong.push(`${name}: esa combinación de contexto y acción no es una regla acordada.`)
    } else if (outcomes.length) {
      if (outcomes.includes(b.then) && outcomes.length === 1) {
        if (b.rule) rules.push(b.rule)
      } else {
        wrong.push(`${name}: el resultado esperado no es el que acordasteis (debería ser «${stepById(b.then)?.text}»).`)
      }
    }
  }
  const valid = wrong.length === 0 && smells.length === 0 && (rules.length > 0 || outcomes.length > 0)
  return { rules, smells, wrong, valid, min, max }
}

export function evaluateAll(state: GherkinState): AgreeResult {
  const rules = Object.fromEntries(RULES.map((r) => [r.id, false])) as Record<RuleId, boolean>
  const smells: string[] = []
  const wrong: string[] = []
  let valid = 0
  for (const sc of state.scenarios) {
    const e = evaluateScenario(sc)
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

export function addScenario(state: GherkinState): { state: GherkinState; event: AppEvent } {
  const sc: Scenario = { id: state.nextId, title: '', steps: [], examples: [] }
  const r = editEvent({ ...state, scenarios: [...state.scenarios, sc], nextId: state.nextId + 1 }, `Nuevo escenario ${sc.id}.`)
  return { ...r, event: { ...r.event, action: 'add_scenario', cost: 5 } }
}

export function updateScenario(state: GherkinState, sc: Scenario): { state: GherkinState; event: AppEvent } {
  const steps = sc.steps.slice(0, MAX_STEPS_PER_SCENARIO)
  const examples = isOutline({ ...sc, steps }) ? sc.examples.slice(0, 8).map((e) => ({ importe: e.importe.slice(0, 12), resultado: e.resultado })) : []
  const clean: Scenario = { ...sc, title: sc.title.slice(0, 80), steps, examples }
  return editEvent({ ...state, scenarios: state.scenarios.map((s) => (s.id === sc.id ? clean : s)) }, `Escenario ${sc.id} editado.`)
}

export function removeScenario(state: GherkinState, id: number): { state: GherkinState; event: AppEvent } {
  return editEvent({ ...state, scenarios: state.scenarios.filter((s) => s.id !== id) }, `Escenario ${id} eliminado.`)
}

/** Laura revisa los escenarios: señala malos olores y cuántas reglas quedan sin cubrir, sin dar la solución. */
export function askLaura(state: GherkinState, mapped: boolean): { state: GherkinState; event: AppEvent } {
  const r = evaluateAll(state)
  const known = RULES.filter((x) => mapped || !x.mapped)
  const uncovered = known.filter((x) => !r.rules[x.id]).length
  const fb: string[] = []
  if (state.scenarios.length === 0) fb.push('Todavía no hay escenarios. Empieza por el caso feliz y sigue regla por regla.')
  for (const s of r.smells.slice(0, 4)) fb.push(s)
  if (r.wrong.length) fb.push(`Hay ${r.wrong.length} resultado${r.wrong.length === 1 ? '' : 's'} esperado${r.wrong.length === 1 ? '' : 's'} que no coincide${r.wrong.length === 1 ? '' : 'n'} con lo acordado: revisa el mapa de ejemplos.`)
  if (uncovered > 0) fb.push(`${uncovered} de las ${known.length} reglas del mapa todavía no tienen un escenario correcto.`)
  if (!r.rules.r1min || !r.rules.r1max) fb.push('Para los límites de importe, usa un esquema de escenario con ejemplos justo a cada lado de cada borde.')
  if (!mapped) fb.push('¿Seguro que el caso feliz y los importes son todas las reglas? No preguntaste qué pasa con caducidad, pagos repetidos o anulaciones.')
  if (fb.length === 0) fb.push('Escenarios claros, uno por comportamiento, sin pantallas y con los bordes. Listos para acordar.')
  return {
    state: { ...state, feedback: fb, feedbackCount: state.feedbackCount + 1 },
    event: { app: 'kobalto-gherkin', action: 'ask_laura', summary: `Laura revisa tus escenarios: ${fb.join(' ')}`, technical: 'gherkin.review', status: 'ok', bugs: [], cost: 10 },
  }
}

/** Acordar los escenarios con PO y desarrollo: son los criterios de aceptación que se programan y automatizan. */
export function agree(state: GherkinState): { state: GherkinState; event: AppEvent } {
  const r = evaluateAll(state)
  const flags = ['gk.agreed']
  for (const [k, v] of Object.entries(r.rules)) if (v) flags.push(`gk.${k}`)
  const clean = r.smells.length === 0 && r.wrong.length === 0
  if (clean && r.valid >= 3) flags.push('gk.style')
  if (r.wrong.length) flags.push('gk.wrong')
  if (r.smells.some((x) => x.includes('pantallas'))) flags.push('gk.ui')
  const covered = Object.values(r.rules).filter(Boolean).length
  return {
    state: { ...state, agreed: r },
    event: {
      app: 'kobalto-gherkin',
      action: 'agree',
      summary: `Escenarios acordados con Elena y Tomás: ${state.scenarios.length} escenarios, ${covered} de ${RULES.length} reglas cubiertas.${r.smells.length ? ` Malos olores: ${r.smells.length}.` : ''}${r.wrong.length ? ` Resultados esperados incorrectos: ${r.wrong.length}.` : ''}`,
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

export function failingTests(t: TddState): string[] {
  return t.tests.filter((x) => (x === 'test100' ? t.code < 1 : t.code < 2)).map((x) => TEST_NAME[x])
}

export function tddStep(state: GherkinState, action: TddAction): { state: GherkinState; event: AppEvent } {
  const t: TddState = { ...state.tdd, tests: [...state.tdd.tests], history: [...state.tdd.history, action] }
  const flags: string[] = []
  let summary = ''
  switch (action) {
    case 'test100':
    case 'test5':
      if (!t.tests.includes(action)) t.tests.push(action)
      summary = `Sofía y tú escribís el test «${TEST_NAME[action]}».`
      break
    case 'run': {
      const failing = failingTests(t)
      t.lastRun = { failing, total: t.tests.length }
      if (failing.length > 0 && t.history.slice(0, -1).every((a) => a !== 'code' && a !== 'codeAll')) t.redBeforeCode = true
      summary = t.tests.length === 0 ? 'No hay tests que ejecutar.' : failing.length ? `Tests en rojo: ${failing.length} de ${t.tests.length} fallan.` : `Tests en verde: ${t.tests.length} de ${t.tests.length} pasan.`
      break
    }
    case 'code':
      if (t.tests.length === 0) t.codeFirst = true
      t.code = t.tests.includes('test5') ? 2 : 1
      t.lastRun = undefined
      summary = t.tests.length === 0 ? 'Sofía escribe código sin ningún test que lo guíe.' : 'Sofía escribe el código mínimo para que pasen los tests.'
      break
    case 'codeAll':
      if (t.tests.length === 0) t.codeFirst = true
      t.code = Math.max(t.code, 1) as 1 | 2
      t.lastRun = undefined
      summary = 'Sofía escribe de una vez «todo» el código de la comisión: 1,4 % del importe.'
      break
    case 'refactor':
      if (!t.lastRun || t.lastRun.failing.length > 0) t.refactorRed = true
      if (t.code > 0) t.refactored = true
      t.lastRun = undefined
      summary = 'Refactorizáis: la tasa y el mínimo pasan a ser constantes con nombre.'
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

export function codeListing(t: TddState): string {
  if (t.code === 0) return '// comision.ts\n// (todavía no hay código)'
  if (t.code === 1) return '// comision.ts\nexport function comision(importe: number): number {\n  return redondear(importe * 0.014)\n}'
  if (!t.refactored) return '// comision.ts\nexport function comision(importe: number): number {\n  return Math.max(redondear(importe * 0.014), 0.25)\n}'
  return '// comision.ts\nconst TASA = 0.014\nconst COMISION_MINIMA = 0.25\n\nexport function comision(importe: number): number {\n  return Math.max(redondear(importe * TASA), COMISION_MINIMA)\n}'
}

export function testListing(t: TddState): string {
  if (t.tests.length === 0) return '// comision.test.ts\n// (todavía no hay tests)'
  const lines = ['// comision.test.ts']
  if (t.tests.includes('test100')) lines.push("it('cobra el 1,4 % del importe', () => {\n  expect(comision(100.00)).toBe(1.40)\n})")
  if (t.tests.includes('test5')) lines.push("it('aplica la comisión mínima de 0,25 €', () => {\n  expect(comision(5.00)).toBe(0.25)\n})")
  return lines.join('\n\n')
}
