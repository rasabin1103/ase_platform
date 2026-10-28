import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

/**
 * App «Evaluación» del curso 4, misión 5 (Construir o comprar): criterios de
 * evaluación, comparación de opciones, coste total a tres años y
 * recomendación para el comité. Evaluación determinista.
 */

export type OptionId = 'buy' | 'build' | 'oss'

export interface PlatformOption {
  id: OptionId
  name: string
  summary: string
  facts: Record<FactId, string>
}

export type FactId = 'time' | 'anon' | 'pipeline' | 'exit' | 'maint'

export const FACT_LABELS: Record<FactId, string> = {
  time: 'Entornos disponibles',
  anon: 'Anonimización de datos',
  pipeline: 'Integración con el pipeline',
  exit: 'Salida y dependencia',
  maint: 'Carga para Plataforma',
}

export const OPTIONS: PlatformOption[] = [
  {
    id: 'buy',
    name: 'Comprar · Sandbloq (SaaS)',
    summary: 'Plataforma comercial de entornos efímeros y datos de prueba.',
    facts: {
      time: 'En 2 meses',
      anon: 'Incluida y certificada',
      pipeline: 'API y plugin oficial; sin probar con nuestro pipeline',
      exit: 'Alta dependencia si el contrato no incluye exportar datos y salir',
      maint: 'Baja: unas horas a la semana',
    },
  },
  {
    id: 'build',
    name: 'Construir · plataforma interna',
    summary: 'La construye el equipo de Plataforma a medida.',
    facts: {
      time: 'En 12 meses',
      anon: 'Hay que construirla',
      pipeline: 'A medida',
      exit: 'Sin dependencia externa',
      maint: 'Alta: 1,5 personas de forma permanente',
    },
  },
  {
    id: 'oss',
    name: 'Open source + integración',
    summary: 'Herramientas libres integradas por Plataforma.',
    facts: {
      time: 'En 6 meses',
      anon: 'Hay que construirla',
      pipeline: 'Plugins de la comunidad, a adaptar',
      exit: 'Sin dependencia externa',
      maint: 'Media-alta: 1,2 personas de forma permanente',
    },
  },
]

/** Contexto de la decisión (pestaña «Necesidades»). */
export const CONTEXT = [
  'Hoy montar un entorno de pruebas tarda 3 días y los squads lo comparten: se pisan los datos.',
  'Varios squads copian datos de producción para probar: Riesgos ya ha dado un aviso.',
  'Dirección quiere entornos bajo demanda en un trimestre.',
  'Plataforma son 3 personas con el backlog lleno hasta el tercer trimestre.',
]

export interface Criterion {
  id: string
  text: string
  good: boolean
  why: string
}

export const CRITERIA: Criterion[] = [
  { id: 'anon', text: 'Datos de prueba anonimizados (RGPD)', good: true, why: 'Es el riesgo que ya ha señalado Riesgos.' },
  { id: 'time', text: 'Entornos disponibles en un trimestre', good: true, why: 'Es el plazo de Dirección.' },
  { id: 'pipeline', text: 'Integración con nuestro pipeline', good: true, why: 'Si no se integra, nadie lo usará.' },
  { id: 'tco', text: 'Coste total a tres años', good: true, why: 'Lo que pide Raúl, con personas e infraestructura.' },
  { id: 'exit', text: 'Salida: exportar los datos y poder cambiar', good: true, why: 'Evita quedar atados al renovar.' },
  { id: 'maint', text: 'Esfuerzo de mantenimiento para Plataforma', good: true, why: 'Plataforma no tiene capacidad libre.' },
  { id: 'demo', text: 'La mejor demo', good: false, why: 'Una demo enseña lo que el proveedor elige, no tu caso.' },
  { id: 'discount', text: 'El descuento por firmar esta semana', good: false, why: 'Las prisas del proveedor no son un criterio tuyo.' },
  { id: 'trend', text: 'Lo que usan otras empresas del sector', good: false, why: 'Su contexto no es el tuyo.' },
  { id: 'fun', text: 'Lo que al equipo le apetece construir', good: false, why: 'Motiva, pero no resuelve el problema.' },
]

export type CostItem = 'licences' | 'setup' | 'people' | 'infra' | 'exit'

export const COST_ITEMS: { id: CostItem; label: string }[] = [
  { id: 'licences', label: 'Licencias' },
  { id: 'setup', label: 'Puesta en marcha (desarrollo, integración y formación)' },
  { id: 'people', label: 'Personas para mantenerla' },
  { id: 'infra', label: 'Infraestructura' },
  { id: 'exit', label: 'Coste de salida o migración' },
]

/** Coste a tres años, en miles de euros. */
export const COSTS: Record<OptionId, Record<CostItem, number>> = {
  buy: { licences: 270, setup: 25, people: 54, infra: 0, exit: 30 },
  build: { licences: 0, setup: 150, people: 210, infra: 75, exit: 0 },
  oss: { licences: 0, setup: 90, people: 210, infra: 90, exit: 0 },
}

export function totalCost(option: OptionId, items: CostItem[]): number {
  return items.reduce((sum, i) => sum + COSTS[option][i], 0)
}

export const PILOTS: Criterion[] = [
  { id: 'demo', text: 'Sin piloto: la demo y las referencias del proveedor bastan.', good: false, why: 'Nada de lo que viste está probado con vuestro pipeline ni vuestros datos.' },
  { id: 'pilot', text: 'Piloto de 4 semanas con Pagos y Tarjetas, datos anonimizados y criterios de éxito medibles: entorno en menos de 15 minutos, cero datos reales e integración con el pipeline.', good: true, why: 'Acotado, con datos seguros y criterios para decidir.' },
  { id: 'open', text: 'Piloto abierto de 6 meses con todos los squads.', good: false, why: 'Sin criterios ni fin, el piloto se convierte en la implantación.' },
]

export const CONDITIONS: Criterion[] = [
  { id: 'exit', text: 'Cláusula de salida y exportación de datos en formato abierto.', good: true, why: 'Puedes cambiar sin perder nada.' },
  { id: 'pilot_first', text: 'Firmar solo si el piloto cumple los criterios de éxito.', good: true, why: 'La decisión depende de datos, no de la demo.' },
  { id: 'review', text: 'Revisar la decisión a los 12 meses con métricas de uso y coste.', good: true, why: 'Una decisión con fecha de revisión se puede corregir.' },
  { id: 'lock3', text: 'Contrato cerrado a 3 años para conseguir el 30 % de descuento.', good: false, why: 'Te ata antes de saber si funciona.' },
]

const FACT_LABELS_EN: Record<FactId, string> = {
  time: 'Environments available',
  anon: 'Data anonymization',
  pipeline: 'Pipeline integration',
  exit: 'Exit and dependency',
  maint: 'Load on Platform',
}

const OPTIONS_EN: Record<OptionId, Omit<PlatformOption, 'id'>> = {
  buy: {
    name: 'Buy · Sandbloq (SaaS)',
    summary: 'Commercial platform for ephemeral environments and test data.',
    facts: {
      time: 'In 2 months',
      anon: 'Included and certified',
      pipeline: 'Official API and plugin; not tested with our pipeline',
      exit: "High dependency if the contract doesn't include exporting data and leaving",
      maint: 'Low: a few hours a week',
    },
  },
  build: {
    name: 'Build · in-house platform',
    summary: 'Built by the Platform team to measure.',
    facts: { time: 'In 12 months', anon: 'We have to build it', pipeline: 'Custom-made', exit: 'No external dependency', maint: 'High: 1.5 people permanently' },
  },
  oss: {
    name: 'Open source + integration',
    summary: 'Free tools integrated by Platform.',
    facts: { time: 'In 6 months', anon: 'We have to build it', pipeline: 'Community plugins, to be adapted', exit: 'No external dependency', maint: 'Medium-high: 1.2 people permanently' },
  },
}

const CONTEXT_EN = [
  'Today setting up a test environment takes 3 days and the squads share it: they overwrite each other’s data.',
  'Several squads copy production data to test: Risk has already given a warning.',
  'Management wants on-demand environments within a quarter.',
  'Platform is 3 people with a backlog full until the third quarter.',
]

const CRITERIA_EN: Record<string, [string, string]> = {
  anon: ['Anonymized test data (GDPR)', 'It is the risk Risk has already flagged.'],
  time: ['Environments available within a quarter', "It is Management's deadline."],
  pipeline: ['Integration with our pipeline', "If it doesn't integrate, nobody will use it."],
  tco: ['Total cost over three years', 'What Raúl asks for, with people and infrastructure.'],
  exit: ['Exit: export the data and be able to switch', 'It avoids being tied down at renewal.'],
  maint: ['Maintenance effort for Platform', 'Platform has no free capacity.'],
  demo: ['The best demo', 'A demo shows what the vendor chooses, not your case.'],
  discount: ['The discount for signing this week', "The vendor's rush is not a criterion of yours."],
  trend: ['What other companies in the sector use', 'Their context is not yours.'],
  fun: ['What the team feels like building', 'It motivates, but does not solve the problem.'],
}

const COST_ITEMS_EN: Record<CostItem, string> = {
  licences: 'Licences',
  setup: 'Setup (development, integration and training)',
  people: 'People to maintain it',
  infra: 'Infrastructure',
  exit: 'Exit or migration cost',
}

const PILOTS_EN: Record<string, [string, string]> = {
  demo: ["No pilot: the vendor's demo and references are enough.", "Nothing you saw has been tested with your pipeline or your data."],
  pilot: ['4-week pilot with Payments and Cards, anonymized data and measurable success criteria: environment in under 15 minutes, zero real data and pipeline integration.', 'Bounded, with safe data and criteria to decide.'],
  open: ['Open 6-month pilot with all squads.', 'Without criteria or an end, the pilot becomes the rollout.'],
}

const CONDITIONS_EN: Record<string, [string, string]> = {
  exit: ['Exit clause and data export in an open format.', 'You can switch without losing anything.'],
  pilot_first: ['Sign only if the pilot meets the success criteria.', 'The decision depends on data, not on the demo.'],
  review: ['Review the decision at 12 months with usage and cost metrics.', 'A decision with a review date can be corrected.'],
  lock3: ['Contract locked for 3 years to get the 30 % discount.', 'It ties you down before you know whether it works.'],
}

const pair = (m: Record<string, [string, string]>) => (c: Criterion): Criterion => ({ ...c, text: m[c.id][0], why: m[c.id][1] })

export function factLabels(lang: AcademyLang = 'es'): Record<FactId, string> {
  return lang === 'en' ? FACT_LABELS_EN : FACT_LABELS
}
export function optionsFor(lang: AcademyLang = 'es'): PlatformOption[] {
  return lang === 'en' ? OPTIONS.map((o) => ({ ...o, ...OPTIONS_EN[o.id] })) : OPTIONS
}
export function contextFor(lang: AcademyLang = 'es'): string[] {
  return lang === 'en' ? CONTEXT_EN : CONTEXT
}
export function criteriaFor(lang: AcademyLang = 'es'): Criterion[] {
  return lang === 'en' ? CRITERIA.map(pair(CRITERIA_EN)) : CRITERIA
}
export function costItemsFor(lang: AcademyLang = 'es'): { id: CostItem; label: string }[] {
  return lang === 'en' ? COST_ITEMS.map((c) => ({ ...c, label: COST_ITEMS_EN[c.id] })) : COST_ITEMS
}
export function pilotsFor(lang: AcademyLang = 'es'): Criterion[] {
  return lang === 'en' ? PILOTS.map(pair(PILOTS_EN)) : PILOTS
}
export function conditionsFor(lang: AcademyLang = 'es'): Criterion[] {
  return lang === 'en' ? CONDITIONS.map(pair(CONDITIONS_EN)) : CONDITIONS
}

export interface VendorState {
  criteria: string[]
  criteriaSaved: boolean
  costItems: CostItem[]
  tcoSaved: boolean
  option?: OptionId
  pilot?: string
  conditions: string[]
  sent: boolean
}

export const INITIAL_VENDOR: VendorState = { criteria: [], criteriaSaved: false, costItems: ['licences'], tcoSaved: false, conditions: [], sent: false }

const APP = 'kobalto-vendor'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `vendor.${action}`, status: 'ok', bugs: [], cost, flags }
}
const noop = (state: VendorState, summary = 'Sin cambios.') => ({ state, event: event('noop', summary, 0) })
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export function toggleCriterion(state: VendorState, id: string, lang: AcademyLang = 'es'): { state: VendorState; event: AppEvent } {
  if (state.sent || !CRITERIA.some((c) => c.id === id)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, criteria: toggle(state.criteria, id) }, event: event('criterion', tr(lang, `Criterio: ${id}.`, `Criterion: ${id}.`), 0) }
}

export function evaluateCriteria(criteria: string[]) {
  const chosen = CRITERIA.filter((c) => criteria.includes(c.id))
  return { count: chosen.length, ok: CRITERIA.filter((c) => c.good).every((c) => criteria.includes(c.id)) && chosen.every((c) => c.good) }
}

export function saveCriteria(state: VendorState, lang: AcademyLang = 'es'): { state: VendorState; event: AppEvent } {
  const r = evaluateCriteria(state.criteria)
  if (state.sent || r.count < 3) return noop(state, tr(lang, 'Elige al menos tres criterios.', 'Choose at least three criteria.'))
  const flags = ['criteria.set']
  if (r.ok) flags.push('criteria.ok')
  return { state: { ...state, criteriaSaved: true }, event: event('criteria', tr(lang, `Criterios de evaluación guardados (${r.count}).`, `Evaluation criteria saved (${r.count}).`), 10, flags) }
}

export function toggleCost(state: VendorState, item: CostItem, lang: AcademyLang = 'es'): { state: VendorState; event: AppEvent } {
  if (state.sent || !COST_ITEMS.some((c) => c.id === item)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, costItems: toggle(state.costItems, item) }, event: event('cost', tr(lang, `Partida: ${item}.`, `Line item: ${item}.`), 0) }
}

export function saveTco(state: VendorState, lang: AcademyLang = 'es'): { state: VendorState; event: AppEvent } {
  if (state.sent || state.costItems.length === 0) return noop(state, tr(lang, 'Incluye al menos una partida.', 'Include at least one line item.'))
  const complete = COST_ITEMS.every((c) => state.costItems.includes(c.id))
  const flags = ['tco.saved', complete ? 'tco.ok' : 'tco.partial']
  const totals = OPTIONS.map((o) => `${o.id} ${totalCost(o.id, state.costItems)} k€`).join(', ')
  return { state: { ...state, tcoSaved: true }, event: event('tco', tr(lang, `Comparativa de coste guardada: ${totals}.`, `Cost comparison saved: ${totals}.`), 15, flags) }
}

export function chooseOption(state: VendorState, option: OptionId, lang: AcademyLang = 'es'): { state: VendorState; event: AppEvent } {
  if (state.sent || !OPTIONS.some((o) => o.id === option)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, option }, event: event('option', tr(lang, `Recomendación: ${option}.`, `Recommendation: ${option}.`), 0) }
}

export function choosePilot(state: VendorState, pilot: string, lang: AcademyLang = 'es'): { state: VendorState; event: AppEvent } {
  if (state.sent || !PILOTS.some((p) => p.id === pilot)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, pilot }, event: event('pilot', tr(lang, `Piloto: ${pilot}.`, `Pilot: ${pilot}.`), 0) }
}

export function toggleCondition(state: VendorState, id: string, lang: AcademyLang = 'es'): { state: VendorState; event: AppEvent } {
  if (state.sent || !CONDITIONS.some((c) => c.id === id)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, conditions: toggle(state.conditions, id) }, event: event('condition', tr(lang, `Condición: ${id}.`, `Condition: ${id}.`), 0) }
}

export function canSend(state: VendorState) {
  return !state.sent && state.criteriaSaved && state.tcoSaved && !!state.option && !!state.pilot
}

export function sendRecommendation(state: VendorState, lang: AcademyLang = 'es'): { state: VendorState; event: AppEvent } {
  if (!canSend(state)) return noop(state, tr(lang, 'Guarda antes los criterios y el coste, y elige opción y piloto.', 'First save the criteria and the cost, and choose an option and a pilot.'))
  const has = (id: string) => state.conditions.includes(id)
  const flags = ['rec.sent', `rec.${state.option}`]
  const pilotOk = state.pilot === 'pilot' && has('pilot_first')
  // Sin proveedor no hay atadura que evitar; con proveedor, cláusula de salida y sin contrato cerrado.
  const exitOk = state.option !== 'buy' || (has('exit') && !has('lock3'))
  if (pilotOk) flags.push('pilot.ok')
  if (exitOk) flags.push('exit.ok')
  const criteriaOk = evaluateCriteria(state.criteria).ok
  const tcoOk = COST_ITEMS.every((c) => state.costItems.includes(c.id))
  if (state.option === 'buy' && criteriaOk && tcoOk && pilotOk && exitOk && has('review')) flags.push('rec.good')
  return { state: { ...state, sent: true }, event: event('send', tr(lang, `Recomendación enviada a Raúl: ${state.option}.`, `Recommendation sent to Raúl: ${state.option}.`), 20, flags) }
}
