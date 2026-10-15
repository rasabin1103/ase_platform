import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'

/**
 * App del curso 2, misión 3: visor de código con cobertura de sentencias y de
 * ramas (CTFL 4.3). El módulo de cálculo de facturas tiene dos bugs:
 * - B-RET: rama «sino» de D2 retiene 1,5 % en lugar de 15 %.
 * - B-REV: D3 usa «> 3000» y la especificación dice «3.000 € o más».
 * La suite heredada de Tomás da 100 % de sentencias y 83 % de ramas, y su
 * único test que pasa por el bug no comprueba nada.
 */

export interface CodeLine {
  n: number
  text: string
  indent: number
  /** Sentencia ejecutable (cuenta para la cobertura de sentencias). */
  stmt: boolean
  /** Decisión de la que esta línea es la condición. */
  decision?: DecisionId
}

export type DecisionId = 'D1' | 'D2' | 'D3'
export type BranchId = `${DecisionId}${'T' | 'F'}`
export const BRANCHES: BranchId[] = ['D1T', 'D1F', 'D2T', 'D2F', 'D3T', 'D3F']

export const CODE: CodeLine[] = [
  { n: 1, text: 'función totalFactura(base, cliente, emisor):', indent: 0, stmt: false },
  { n: 2, text: 'iva ← redondear(base × 0,21)', indent: 1, stmt: true },
  { n: 3, text: 'retención ← 0', indent: 1, stmt: true },
  { n: 4, text: 'si cliente.esEmpresa:', indent: 1, stmt: true, decision: 'D1' },
  { n: 5, text: 'si emisor.añosDeAlta < 3:', indent: 2, stmt: true, decision: 'D2' },
  { n: 6, text: 'retención ← 0,07', indent: 3, stmt: true },
  { n: 7, text: 'sino:', indent: 2, stmt: false },
  { n: 8, text: 'retención ← 0,015', indent: 3, stmt: true },
  { n: 9, text: 'irpf ← redondear(base × retención)', indent: 1, stmt: true },
  { n: 10, text: 'revisión ← falso', indent: 1, stmt: true },
  { n: 11, text: 'si base > 3000:', indent: 1, stmt: true, decision: 'D3' },
  { n: 12, text: 'revisión ← verdadero', indent: 2, stmt: true },
  { n: 13, text: 'devolver (base + iva − irpf, revisión)', indent: 1, stmt: true },
]
export const STATEMENTS = CODE.filter((l) => l.stmt).map((l) => l.n)

/** Pseudocódigo en inglés: misma estructura y numeración de líneas que CODE. */
const CODE_EN: Record<number, string> = {
  1: 'FUNCTION invoiceTotal(base, client, issuer):',
  2: 'vat ← round(base × 0.21)',
  3: 'withholding ← 0',
  4: 'IF client.isBusiness THEN',
  5: 'IF issuer.yearsRegistered < 3 THEN',
  6: 'withholding ← 0.07',
  7: 'ELSE',
  8: 'withholding ← 0.015',
  9: 'incomeTax ← round(base × withholding)',
  10: 'review ← FALSE',
  11: 'IF base > 3000 THEN',
  12: 'review ← TRUE',
  13: 'RETURN (base + vat − incomeTax, review)',
}

/** El código cambia cuando el equipo despliega la corrección de un bug. */
export function codeLines(fixed: string[], lang: AcademyLang = 'es'): CodeLine[] {
  const en = lang === 'en'
  return CODE.map((l) => {
    if (l.n === 8 && fixed.includes('B-RET')) return { ...l, text: en ? 'withholding ← 0.15' : 'retención ← 0,15' }
    if (l.n === 11 && fixed.includes('B-REV')) return { ...l, text: en ? 'IF base ≥ 3000 THEN' : 'si base ≥ 3000:' }
    return en ? { ...l, text: CODE_EN[l.n] } : l
  })
}

export type ClientKind = 'empresa' | 'particular'

export interface TestCase {
  id: number
  name: string
  base: string
  client: ClientKind
  years: string
  assert: boolean
  expectedTotal: string
  expectedReview: 'si' | 'no' | ''
  author: 'tomas' | 'player'
}

export interface CaseResult {
  id: number
  lines: number[]
  branches: BranchId[]
  actualTotal: number
  actualReview: boolean
  status: 'pass' | 'pass_no_assert' | 'fail_bug' | 'fail_wrong' | 'invalid'
  /** El test pasa pero solo porque copia el resultado del código, que no cumple la especificación. */
  copiedOracle?: boolean
  bugs: string[]
  message: string
}

export interface RunResult {
  at: number
  results: CaseResult[]
  stmtCovered: number[]
  branchesCovered: BranchId[]
}

export interface CoverageState {
  cases: TestCase[]
  nextId: number
  lastRun?: RunResult
  runs: number
}

export const INITIAL_COVERAGE: CoverageState = {
  cases: [
    { id: 1, name: 'Empresa, emisor de 1 año, 5.000 €', base: '5000', client: 'empresa', years: '1', assert: true, expectedTotal: '5700', expectedReview: 'si', author: 'tomas' },
    { id: 2, name: 'Particular, 4.000 €', base: '4000', client: 'particular', years: '6', assert: true, expectedTotal: '4840', expectedReview: 'si', author: 'tomas' },
    { id: 3, name: 'Empresa, emisor de 5 años, 4.000 €', base: '4000', client: 'empresa', years: '5', assert: false, expectedTotal: '', expectedReview: '', author: 'tomas' },
  ],
  nextId: 4,
  runs: 0,
}

const INITIAL_CASE_NAMES_EN: Record<number, string> = {
  1: 'Business, 1-year issuer, €5,000',
  2: 'Individual, €4,000',
  3: 'Business, 5-year issuer, €4,000',
}

/** Estado inicial con los nombres de los casos de Tomás en el idioma de la misión. */
export function initialCoverage(lang: AcademyLang = 'es'): CoverageState {
  if (lang !== 'en') return INITIAL_COVERAGE
  return { ...INITIAL_COVERAGE, cases: INITIAL_COVERAGE.cases.map((c) => ({ ...c, name: INITIAL_CASE_NAMES_EN[c.id] ?? c.name })) }
}

const round = (x: number) => Math.round(x * 100) / 100

/** «1.000,50» / «1000.50» / «3000» → número (NaN si no se entiende). */
export function parseNumber(raw: string, lang: AcademyLang = 'es'): number {
  let t = raw.trim().replace(/\s|€/g, '')
  // En inglés, «5,700.00» usa la coma como separador de miles.
  if (lang === 'en' && /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, '')
  else if (lang === 'en' && /^-?\d+\.\d+$/.test(t)) return round(Number(t))
  if (!t) return NaN
  let norm = t
  if (t.includes(',')) norm = t.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) norm = t.replace(/\./g, '')
  if (!/^-?\d+(\.\d+)?$/.test(norm)) return NaN
  return round(Number(norm))
}

export function formatEur(x: number, lang: AcademyLang = 'es'): string {
  if (lang === 'en') return (x < 0 ? '−€' : '€') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return x.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

/** Lo que hace el código (con sus bugs), con la traza de líneas y ramas. */
export function execute(base: number, client: ClientKind, years: number, fixed: string[] = []): { total: number; review: boolean; lines: number[]; branches: BranchId[] } {
  const lines = [2, 3, 4]
  const branches: BranchId[] = []
  const iva = round(base * 0.21)
  let ret = 0
  if (client === 'empresa') {
    branches.push('D1T')
    lines.push(5)
    if (years < 3) {
      branches.push('D2T')
      lines.push(6)
      ret = 0.07
    } else {
      branches.push('D2F')
      lines.push(8)
      ret = fixed.includes('B-RET') ? 0.15 : 0.015
    }
  } else branches.push('D1F')
  lines.push(9, 10, 11)
  const irpf = round(base * ret)
  let review = false
  if (fixed.includes('B-REV') ? base >= 3000 : base > 3000) {
    branches.push('D3T')
    lines.push(12)
    review = true
  } else branches.push('D3F')
  lines.push(13)
  return { total: round(base + iva - irpf), review, lines, branches }
}

/** Lo que dice la especificación. */
export function spec(base: number, client: ClientKind, years: number): { total: number; review: boolean } {
  const iva = round(base * 0.21)
  const ret = client === 'empresa' ? (years < 3 ? 0.07 : 0.15) : 0
  return { total: round(base + iva - round(base * ret)), review: base >= 3000 }
}

export function runCase(tc: TestCase, fixed: string[] = [], lang: AcademyLang = 'es'): CaseResult {
  const en = lang === 'en'
  const eur = (x: number) => formatEur(x, lang)
  const yn = (b: boolean) => (en ? (b ? 'yes' : 'no') : b ? 'sí' : 'no')
  const base = parseNumber(tc.base, lang)
  const years = parseNumber(tc.years, lang)
  if (Number.isNaN(base) || base <= 0 || Number.isNaN(years) || years < 0) {
    return { id: tc.id, lines: [], branches: [], actualTotal: 0, actualReview: false, status: 'invalid', bugs: [], message: en ? 'Invalid inputs: check the base amount and the years registered.' : 'Entradas no válidas: revisa la base y los años de alta.' }
  }
  const out = execute(base, tc.client, years, fixed)
  const want = spec(base, tc.client, years)
  const res: CaseResult = { id: tc.id, lines: out.lines, branches: out.branches, actualTotal: out.total, actualReview: out.review, status: 'pass', bugs: [], message: '' }
  if (!tc.assert) {
    res.status = 'pass_no_assert'
    res.message = en ? `✓ Passes… but it doesn't check anything (returns ${eur(out.total)}).` : `✓ Pasa… pero no comprueba nada (devuelve ${eur(out.total)}).`
    return res
  }
  const expTotal = parseNumber(tc.expectedTotal, lang)
  if (Number.isNaN(expTotal) || !tc.expectedReview) {
    return { ...res, status: 'invalid', message: en ? 'The expected result is missing (total and review).' : 'Falta el resultado esperado (total y revisión).' }
  }
  const expReview = tc.expectedReview === 'si'
  const totalOk = expTotal === out.total
  const reviewOk = expReview === out.review
  if (totalOk && reviewOk) {
    res.status = 'pass'
    res.copiedOracle = out.total !== want.total || out.review !== want.review
    res.message = en ? `✓ Passes: ${eur(out.total)}, review ${yn(out.review)}.` : `✓ Pasa: ${eur(out.total)}, revisión ${yn(out.review)}.`
    return res
  }
  const totalMatchesSpec = expTotal === want.total
  const reviewMatchesSpec = expReview === want.review
  if (totalMatchesSpec && reviewMatchesSpec) {
    if (!totalOk) res.bugs.push('B-RET')
    if (!reviewOk) res.bugs.push('B-REV')
    res.status = 'fail_bug'
    res.message = en
      ? `✗ Fails: expected ${eur(expTotal)} and review ${yn(expReview)}; got ${eur(out.total)} and review ${yn(out.review)}.`
      : `✗ Falla: esperado ${eur(expTotal)} y revisión ${yn(expReview)}; obtenido ${eur(out.total)} y revisión ${yn(out.review)}.`
    return res
  }
  res.status = 'fail_wrong'
  res.message = en
    ? `✗ Fails, but your expected result doesn't match the specification (got ${eur(out.total)}, review ${yn(out.review)}). Check your calculation.`
    : `✗ Falla, pero tu resultado esperado no coincide con la especificación (obtenido ${eur(out.total)}, revisión ${yn(out.review)}). Revisa el cálculo.`
  return res
}

export function coverageOf(results: CaseResult[]): { stmt: number[]; branches: BranchId[] } {
  const stmt = new Set<number>()
  const br = new Set<BranchId>()
  for (const r of results) {
    r.lines.forEach((l) => stmt.add(l))
    r.branches.forEach((b) => br.add(b))
  }
  return { stmt: STATEMENTS.filter((n) => stmt.has(n)), branches: BRANCHES.filter((b) => br.has(b)) }
}

export const pct = (a: number, b: number) => Math.round((a / b) * 100)

// ------------------------------------------------------------ Acciones
function edit(state: CoverageState, summary: string, cost = 0): { state: CoverageState; event: AppEvent } {
  return { state, event: { app: 'kobalto-coverage', action: 'edit', summary, technical: 'coverage.edit', status: 'ok', bugs: [], cost } }
}

export function addCase(state: CoverageState, lang: AcademyLang = 'es'): { state: CoverageState; event: AppEvent } {
  const tc: TestCase = { id: state.nextId, name: '', base: '', client: 'particular', years: '0', assert: true, expectedTotal: '', expectedReview: '', author: 'player' }
  const r = edit({ ...state, cases: [...state.cases, tc], nextId: state.nextId + 1 }, lang === 'en' ? `New test case ${tc.id}.` : `Nuevo caso de prueba ${tc.id}.`, 5)
  return { ...r, event: { ...r.event, action: 'add_case' } }
}

export function updateCase(state: CoverageState, tc: TestCase, lang: AcademyLang = 'es'): { state: CoverageState; event: AppEvent } {
  const clean: TestCase = {
    ...tc,
    name: tc.name.slice(0, 80),
    base: tc.base.slice(0, 14),
    years: tc.years.slice(0, 4),
    expectedTotal: tc.expectedTotal.slice(0, 14),
  }
  return edit({ ...state, cases: state.cases.map((c) => (c.id === tc.id ? clean : c)) }, lang === 'en' ? `Case ${tc.id} edited.` : `Caso ${tc.id} editado.`)
}

export function removeCase(state: CoverageState, id: number, lang: AcademyLang = 'es'): { state: CoverageState; event: AppEvent } {
  return edit({ ...state, cases: state.cases.filter((c) => c.id !== id) }, lang === 'en' ? `Case ${id} removed.` : `Caso ${id} eliminado.`)
}

export function runSuite(state: CoverageState, clock: number, fixed: string[] = [], lang: AcademyLang = 'es'): { state: CoverageState; event: AppEvent } {
  const results = state.cases.map((c) => runCase(c, fixed, lang))
  const cov = coverageOf(results.filter((r) => r.status !== 'invalid'))
  const bugs = Array.from(new Set(results.flatMap((r) => r.bugs)))
  const flags = ['suite.ran']
  if (cov.stmt.length === STATEMENTS.length) flags.push('cov.stmt100')
  if (cov.branches.length === BRANCHES.length) flags.push('cov.branch100')
  if (results.some((r) => r.status === 'pass_no_assert')) flags.push('cov.noassert_present')
  const t3 = state.cases.find((c) => c.id === 3)
  if (t3?.assert) flags.push('cov.t3_asserted')
  if (results.some((r) => r.copiedOracle)) flags.push('cov.copied_oracle')
  if (results.some((r) => r.status === 'fail_wrong')) flags.push('cov.wrong_oracle')
  const failing = results.filter((r) => r.status === 'fail_bug' || r.status === 'fail_wrong').length
  const run: RunResult = { at: clock, results, stmtCovered: cov.stmt, branchesCovered: cov.branches }
  const summary = lang === 'en'
    ? `Suite run: ${results.length} cases, ${failing} red. Statement coverage ${pct(cov.stmt.length, STATEMENTS.length)}% (${cov.stmt.length}/${STATEMENTS.length}), ` +
      `branch coverage ${pct(cov.branches.length, BRANCHES.length)}% (${cov.branches.length}/${BRANCHES.length}).` +
      results
        .filter((r) => r.status === 'fail_bug')
        .map((r) => ` Case ${r.id}: ${r.message}`)
        .join('')
    : `Suite ejecutada: ${results.length} casos, ${failing} en rojo. Cobertura de sentencias ${pct(cov.stmt.length, STATEMENTS.length)} % (${cov.stmt.length}/${STATEMENTS.length}), ` +
    `de ramas ${pct(cov.branches.length, BRANCHES.length)} % (${cov.branches.length}/${BRANCHES.length}).` +
    results
      .filter((r) => r.status === 'fail_bug')
      .map((r) => ` Caso ${r.id}: ${r.message}`)
      .join('')
  return {
    state: { ...state, lastRun: run, runs: state.runs + 1 },
    event: {
      app: 'kobalto-coverage',
      action: 'run_suite',
      summary,
      technical: `coverage.run stmt=${cov.stmt.length}/${STATEMENTS.length} branches=${cov.branches.join(',')}`,
      status: failing ? 'error' : 'ok',
      bugs,
      cost: 5,
      flags,
    },
  }
}
