import type { AppEvent } from '../../engine/types'

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

/** El código cambia cuando el equipo despliega la corrección de un bug. */
export function codeLines(fixed: string[]): CodeLine[] {
  return CODE.map((l) => {
    if (l.n === 8 && fixed.includes('B-RET')) return { ...l, text: 'retención ← 0,15' }
    if (l.n === 11 && fixed.includes('B-REV')) return { ...l, text: 'si base ≥ 3000:' }
    return l
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

const round = (x: number) => Math.round(x * 100) / 100

/** «1.000,50» / «1000.50» / «3000» → número (NaN si no se entiende). */
export function parseNumber(raw: string): number {
  const t = raw.trim().replace(/\s|€/g, '')
  if (!t) return NaN
  let norm = t
  if (t.includes(',')) norm = t.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) norm = t.replace(/\./g, '')
  if (!/^-?\d+(\.\d+)?$/.test(norm)) return NaN
  return round(Number(norm))
}

export function formatEur(x: number): string {
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

export function runCase(tc: TestCase, fixed: string[] = []): CaseResult {
  const base = parseNumber(tc.base)
  const years = parseNumber(tc.years)
  if (Number.isNaN(base) || base <= 0 || Number.isNaN(years) || years < 0) {
    return { id: tc.id, lines: [], branches: [], actualTotal: 0, actualReview: false, status: 'invalid', bugs: [], message: 'Entradas no válidas: revisa la base y los años de alta.' }
  }
  const out = execute(base, tc.client, years, fixed)
  const want = spec(base, tc.client, years)
  const res: CaseResult = { id: tc.id, lines: out.lines, branches: out.branches, actualTotal: out.total, actualReview: out.review, status: 'pass', bugs: [], message: '' }
  if (!tc.assert) {
    res.status = 'pass_no_assert'
    res.message = `✓ Pasa… pero no comprueba nada (devuelve ${formatEur(out.total)}).`
    return res
  }
  const expTotal = parseNumber(tc.expectedTotal)
  if (Number.isNaN(expTotal) || !tc.expectedReview) {
    return { ...res, status: 'invalid', message: 'Falta el resultado esperado (total y revisión).' }
  }
  const expReview = tc.expectedReview === 'si'
  const totalOk = expTotal === out.total
  const reviewOk = expReview === out.review
  if (totalOk && reviewOk) {
    res.status = 'pass'
    res.copiedOracle = out.total !== want.total || out.review !== want.review
    res.message = `✓ Pasa: ${formatEur(out.total)}, revisión ${out.review ? 'sí' : 'no'}.`
    return res
  }
  const totalMatchesSpec = expTotal === want.total
  const reviewMatchesSpec = expReview === want.review
  if (totalMatchesSpec && reviewMatchesSpec) {
    if (!totalOk) res.bugs.push('B-RET')
    if (!reviewOk) res.bugs.push('B-REV')
    res.status = 'fail_bug'
    res.message = `✗ Falla: esperado ${formatEur(expTotal)} y revisión ${expReview ? 'sí' : 'no'}; obtenido ${formatEur(out.total)} y revisión ${out.review ? 'sí' : 'no'}.`
    return res
  }
  res.status = 'fail_wrong'
  res.message = `✗ Falla, pero tu resultado esperado no coincide con la especificación (obtenido ${formatEur(out.total)}, revisión ${out.review ? 'sí' : 'no'}). Revisa el cálculo.`
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

export function addCase(state: CoverageState): { state: CoverageState; event: AppEvent } {
  const tc: TestCase = { id: state.nextId, name: '', base: '', client: 'particular', years: '0', assert: true, expectedTotal: '', expectedReview: '', author: 'player' }
  const r = edit({ ...state, cases: [...state.cases, tc], nextId: state.nextId + 1 }, `Nuevo caso de prueba ${tc.id}.`, 5)
  return { ...r, event: { ...r.event, action: 'add_case' } }
}

export function updateCase(state: CoverageState, tc: TestCase): { state: CoverageState; event: AppEvent } {
  const clean: TestCase = {
    ...tc,
    name: tc.name.slice(0, 80),
    base: tc.base.slice(0, 14),
    years: tc.years.slice(0, 4),
    expectedTotal: tc.expectedTotal.slice(0, 14),
  }
  return edit({ ...state, cases: state.cases.map((c) => (c.id === tc.id ? clean : c)) }, `Caso ${tc.id} editado.`)
}

export function removeCase(state: CoverageState, id: number): { state: CoverageState; event: AppEvent } {
  return edit({ ...state, cases: state.cases.filter((c) => c.id !== id) }, `Caso ${id} eliminado.`)
}

export function runSuite(state: CoverageState, clock: number, fixed: string[] = []): { state: CoverageState; event: AppEvent } {
  const results = state.cases.map((c) => runCase(c, fixed))
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
  const summary =
    `Suite ejecutada: ${results.length} casos, ${failing} en rojo. Cobertura de sentencias ${pct(cov.stmt.length, STATEMENTS.length)} % (${cov.stmt.length}/${STATEMENTS.length}), ` +
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
