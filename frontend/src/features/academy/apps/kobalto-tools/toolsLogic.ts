import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'

/**
 * App del curso 2, misión 8: selección de herramientas (CTFL 6.1 y 6.2).
 * Clasificar las necesidades del squad por categoría de herramienta,
 * evaluar candidatas con sus riesgos y proponer un piloto con criterios.
 */

const APP = 'kobalto-tools'

// ------------------------------------------------------------- Categorías
export type Category = 'management' | 'static' | 'design' | 'execution' | 'nonfunctional' | 'devops' | 'collaboration'
export const CATEGORY_LABEL: Record<Category, string> = {
  management: 'Gestión de pruebas',
  static: 'Pruebas estáticas',
  design: 'Diseño e implementación de pruebas',
  execution: 'Ejecución y cobertura',
  nonfunctional: 'Pruebas no funcionales',
  devops: 'DevOps (pipeline)',
  collaboration: 'Colaboración',
}

export const NEEDS: { id: string; text: string; category: Category }[] = [
  { id: 'N1', text: 'Trazar requisitos, casos y defectos en un solo sitio (hoy, en tres Excel).', category: 'management' },
  { id: 'N2', text: 'Detectar código duplicado y vulnerabilidades sin ejecutar el código.', category: 'static' },
  { id: 'N3', text: 'Generar datos de prueba de empresas y facturas.', category: 'design' },
  { id: 'N4', text: 'Ejecutar la regresión de la API y medir la cobertura de ramas.', category: 'execution' },
  { id: 'N5', text: 'Probar el panel con 500 tarjetas y 200 usuarios a la vez.', category: 'nonfunctional' },
  { id: 'N6', text: 'Lanzar las pruebas automáticamente en cada merge.', category: 'devops' },
  { id: 'N7', text: 'Compartir y comentar los escenarios BDD con Elena.', category: 'collaboration' },
]

// -------------------------------------------------------------- Candidatas
export type RiskTag = 'unrealistic' | 'maintenance' | 'lockin' | 'noci' | 'learning'
export const RISK_LABEL: Record<RiskTag, string> = {
  unrealistic: 'Expectativas irreales',
  maintenance: 'Coste de mantenimiento de los scripts',
  lockin: 'Dependencia del proveedor',
  noci: 'No se integra con el CI',
  learning: 'Curva de aprendizaje',
}

export const CANDIDATES: { id: string; name: string; pitch: string; facts: string[]; risks: RiskTag[] }[] = [
  {
    id: 'forge',
    name: 'TestForge Pro',
    pitch: 'La favorita de Sergio. «Automatizáis el 100 % en un mes.»',
    facts: [
      'Graba y reproduce pruebas por la interfaz.',
      'Licencia: 18.000 € al año, contrato mínimo de 3 años.',
      'En la demo grabaron 40 casos en una hora.',
      'Cada cambio de la interfaz obliga a regrabar: otros clientes dedican medio QA a mantener los scripts.',
      'Plugin para el CI: sí.',
    ],
    risks: ['unrealistic', 'maintenance'],
  },
  {
    id: 'cloud',
    name: 'QualiCloud',
    pitch: 'Todo en uno en la nube: gestión, ejecución e informes.',
    facts: [
      'Licencia: 9.000 € al año.',
      'Los scripts se guardan en un formato propio que no se puede exportar.',
      'Sin integración con nuestro CI: las ejecuciones se lanzan desde su web.',
      'Soporte en inglés por correo, 48 h.',
    ],
    risks: ['lockin', 'noci'],
  },
  {
    id: 'kestrel',
    name: 'Kestrel',
    pitch: 'Framework de código abierto para pruebas de API y BDD, en código.',
    facts: [
      'Licencia: 0 €. Soporte comercial opcional: 4.000 € al año.',
      'Las pruebas viven en el repositorio, con el código, y se revisan en los PR.',
      'Pruebas a nivel de API: se rompen poco con los cambios de interfaz.',
      'Plugin oficial para nuestro CI.',
      'Requiere saber programar: el equipo necesita dos semanas de formación.',
    ],
    risks: ['learning'],
  },
]
export const BEST_CANDIDATE = 'kestrel'

// ------------------------------------------------------------------ Piloto
export const PILOT_SCOPES: { id: string; text: string; ok: boolean }[] = [
  { id: 'all', text: 'Migrar toda la regresión a la herramienta desde el primer día.', ok: false },
  { id: 'pilot', text: 'Piloto de 4 semanas con la regresión de la API de facturas, con formación al principio y decisión al final.', ok: true },
  { id: 'none', text: 'Sin piloto: compramos y que cada uno la vaya usando.', ok: false },
]

export const CRITERIA: { id: string; text: string; good: boolean }[] = [
  { id: 'ci', text: 'La regresión de la API de facturas corre en cada merge en menos de 10 minutos.', good: true },
  { id: 'flaky', text: 'Menos del 5 % de fallos falsos (pruebas inestables).', good: true },
  { id: 'autonomy', text: 'El equipo crea y mantiene los scripts sin ayuda externa tras la formación.', good: true },
  { id: 'hundred', text: 'El 100 % de los casos automatizados en un mes.', good: false },
  { id: 'likes', text: 'Que a Sergio le guste.', good: false },
  { id: 'noexplore', text: 'Poder eliminar las pruebas exploratorias.', good: false },
]

// ------------------------------------------------------------------ Inglés
/** En inglés, sustituye los textos de cada elemento (por id) conservando el resto de campos. */
function localize<T extends { id: string }>(list: T[], en: Record<string, Partial<T>>, lang: AcademyLang): T[] {
  return lang === 'en' ? list.map((x) => ({ ...x, ...en[x.id] })) : list
}

const CATEGORY_LABEL_EN: Record<Category, string> = {
  management: 'Test management',
  static: 'Static testing',
  design: 'Test design and implementation',
  execution: 'Test execution and coverage',
  nonfunctional: 'Non-functional testing',
  devops: 'DevOps (pipeline)',
  collaboration: 'Collaboration',
}

const RISK_LABEL_EN: Record<RiskTag, string> = {
  unrealistic: 'Unrealistic expectations',
  maintenance: 'Script maintenance cost',
  lockin: 'Vendor dependency (lock-in)',
  noci: "Doesn't integrate with the CI",
  learning: 'Learning curve',
}

const NEEDS_EN: Record<string, { text: string }> = {
  N1: { text: 'Trace requirements, test cases and defects in one place (today, in three Excel files).' },
  N2: { text: 'Detect duplicate code and vulnerabilities without executing the code.' },
  N3: { text: 'Generate test data for businesses and invoices.' },
  N4: { text: 'Run the API regression tests and measure branch coverage.' },
  N5: { text: 'Test the panel with 500 cards and 200 concurrent users.' },
  N6: { text: 'Trigger the tests automatically on every merge.' },
  N7: { text: 'Share and comment on the BDD scenarios with Elena.' },
}

const CANDIDATES_EN: Record<string, { pitch: string; facts: string[] }> = {
  forge: {
    pitch: 'Sergio\'s favorite. "You\'ll automate 100% in a month."',
    facts: [
      'Records and plays back tests through the UI.',
      'License: €18,000 per year, 3-year minimum contract.',
      'In the demo they recorded 40 cases in one hour.',
      'Every UI change forces a re-recording: other customers spend half a QA on maintaining the scripts.',
      'CI plugin: yes.',
    ],
  },
  cloud: {
    pitch: 'All-in-one in the cloud: management, execution and reports.',
    facts: [
      'License: €9,000 per year.',
      'Scripts are stored in a proprietary format that cannot be exported.',
      'No integration with our CI: runs are launched from their website.',
      'Support in English by email, 48 h.',
    ],
  },
  kestrel: {
    pitch: 'Open-source framework for API and BDD testing, in code.',
    facts: [
      'License: €0. Optional commercial support: €4,000 per year.',
      'Tests live in the repository, with the code, and are reviewed in PRs.',
      'API-level tests: they rarely break with UI changes.',
      'Official plugin for our CI.',
      'Requires programming skills: the team needs two weeks of training.',
    ],
  },
}

const PILOT_SCOPES_EN: Record<string, { text: string }> = {
  all: { text: 'Migrate the entire regression suite to the tool from day one.' },
  pilot: { text: '4-week pilot with the invoices API regression tests, with training at the start and a decision at the end.' },
  none: { text: 'No pilot: we buy it and everyone starts using it as they go.' },
}

const CRITERIA_EN: Record<string, { text: string }> = {
  ci: { text: 'The invoices API regression suite runs on every merge in under 10 minutes.' },
  flaky: { text: 'Less than 5% false failures (flaky tests).' },
  autonomy: { text: 'After the training, the team creates and maintains the scripts without outside help.' },
  hundred: { text: '100% of the cases automated in one month.' },
  likes: { text: 'Sergio likes it.' },
  noexplore: { text: 'Being able to drop exploratory testing.' },
}

export const categoryLabelFor = (lang: AcademyLang = 'es'): Record<Category, string> => (lang === 'en' ? CATEGORY_LABEL_EN : CATEGORY_LABEL)
export const riskLabelFor = (lang: AcademyLang = 'es'): Record<RiskTag, string> => (lang === 'en' ? RISK_LABEL_EN : RISK_LABEL)
export const needsFor = (lang: AcademyLang = 'es'): typeof NEEDS => localize(NEEDS, NEEDS_EN, lang)
export const candidatesFor = (lang: AcademyLang = 'es'): typeof CANDIDATES => localize(CANDIDATES, CANDIDATES_EN, lang)
export const pilotScopesFor = (lang: AcademyLang = 'es'): typeof PILOT_SCOPES => localize(PILOT_SCOPES, PILOT_SCOPES_EN, lang)
export const criteriaFor = (lang: AcademyLang = 'es'): typeof CRITERIA => localize(CRITERIA, CRITERIA_EN, lang)

// ------------------------------------------------------------------ Estado
export interface ToolsState {
  needs: Record<string, Category | ''>
  risks: Record<string, RiskTag[]>
  choice: string
  scope: string
  criteria: string[]
  submitted?: ToolsResult
  feedback?: string[]
}

export interface ToolsResult {
  needs: number
  risks: number
  choice: boolean
  scope: boolean
  criteria: boolean
}

export const INITIAL_TOOLS: ToolsState = { needs: {}, risks: {}, choice: '', scope: '', criteria: [] }

const sameSet = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((x) => b.includes(x))
const goodCriteria = CRITERIA.filter((c) => c.good).map((c) => c.id)

export function evaluate(p: ToolsState): ToolsResult {
  return {
    needs: NEEDS.filter((n) => p.needs[n.id] === n.category).length,
    risks: CANDIDATES.filter((c) => sameSet(p.risks[c.id] ?? [], c.risks)).length,
    choice: p.choice === BEST_CANDIDATE,
    scope: PILOT_SCOPES.find((s) => s.id === p.scope)?.ok ?? false,
    criteria: sameSet(p.criteria, goodCriteria),
  }
}

export function toggle<T>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

// ---------------------------------------------------------------- Acciones
export function edit(state: ToolsState, patch: Partial<ToolsState>, summary: string): { state: ToolsState; event: AppEvent } {
  return { state: { ...state, ...patch }, event: { app: APP, action: 'edit', summary, technical: 'tools.edit', status: 'ok', bugs: [], cost: 0 } }
}

export function askLaura(state: ToolsState, lang: AcademyLang = 'es'): { state: ToolsState; event: AppEvent } {
  const r = evaluate(state)
  const fb: string[] = []
  if (lang === 'en') {
    if (r.needs < NEEDS.length)
      fb.push("A need is in a category that doesn't fit: does it manage, analyze without executing, prepare, execute, measure something non-functional, automate the pipeline or help collaboration?")
    if (r.risks < CANDIDATES.length) fb.push("Review each candidate's risks: read the fine print (script format, CI, maintenance, demo promises).")
    if (!r.choice) fb.push('For the pilot, think about the total cost over three years and which risks you can manage yourselves.')
    if (!r.scope) fb.push('Before committing the whole squad, try the tool on something bounded, with a decision date.')
    if (!r.criteria) fb.push("The pilot's success criteria have to be measurable and realistic.")
    if (fb.length === 0) fb.push('Needs well classified, risks identified and a measurable pilot. Send it to Raúl.')
    return {
      state: { ...state, feedback: fb },
      event: { app: APP, action: 'ask_laura', summary: `Laura reviews the proposal: ${fb.join(' ')}`, technical: 'tools.review', status: 'ok', bugs: [], cost: 10 },
    }
  }
  if (r.needs < NEEDS.length) fb.push('Alguna necesidad está en una categoría que no le toca: ¿gestiona, analiza sin ejecutar, prepara, ejecuta, mide algo no funcional, automatiza el pipeline o ayuda a colaborar?')
  if (r.risks < CANDIDATES.length) fb.push('Revisa los riesgos de cada candidata: lee la letra pequeña (formato de los scripts, CI, mantenimiento, promesas de la demo).')
  if (!r.choice) fb.push('Para el piloto, piensa en el coste total a tres años y en qué riesgos podéis gestionar vosotros.')
  if (!r.scope) fb.push('Antes de comprometer a todo el squad, prueba la herramienta en algo acotado y con fecha de decisión.')
  if (!r.criteria) fb.push('Los criterios de éxito del piloto tienen que ser medibles y realistas.')
  if (fb.length === 0) fb.push('Necesidades bien clasificadas, riesgos identificados y un piloto medible. Envíaselo a Raúl.')
  return {
    state: { ...state, feedback: fb },
    event: { app: APP, action: 'ask_laura', summary: `Laura revisa la propuesta: ${fb.join(' ')}`, technical: 'tools.review', status: 'ok', bugs: [], cost: 10 },
  }
}

export function submit(state: ToolsState, lang: AcademyLang = 'es'): { state: ToolsState; event: AppEvent } {
  const r = evaluate(state)
  const flags = ['proposal.sent']
  if (r.needs === NEEDS.length) flags.push('needs.ok')
  if (r.risks === CANDIDATES.length) flags.push('eval.ok')
  if (r.choice) flags.push('choice.ok')
  if (r.scope && r.criteria) flags.push('pilot.ok')
  const chosen = CANDIDATES.find((c) => c.id === state.choice)?.name ?? (lang === 'en' ? 'none' : 'ninguna')
  return {
    state: { ...state, submitted: r, feedback: undefined },
    event: {
      app: APP,
      action: 'submit',
      summary:
        lang === 'en'
          ? `Proposal sent to Raúl: needs ${r.needs}/${NEEDS.length}, risks ${r.risks}/${CANDIDATES.length} candidates, pilot with ${chosen}${r.scope && r.criteria ? ' and measurable criteria' : ' without solid criteria'}.`
          : `Propuesta enviada a Raúl: necesidades ${r.needs}/${NEEDS.length}, riesgos ${r.risks}/${CANDIDATES.length} candidatas, piloto con ${chosen}${r.scope && r.criteria ? ' y criterios medibles' : ' sin criterios sólidos'}.`,
      technical: `tools.submit ${JSON.stringify(r)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}
