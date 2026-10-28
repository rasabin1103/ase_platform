import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

/**
 * App «Capacidad» del curso 4, misión 9 (Recortes): plan de capacidad para
 * recortar un 20 % del presupuesto de QA de Banca diaria eligiendo palancas,
 * cada una con su ahorro y su impacto en el riesgo y en las personas.
 * Evaluación determinista.
 */

export const BUDGET = 2000
export const TARGET = 400

/** Situación del área (cabecera de la app). */
export const AREA = [
  '3 QA Leads y 18 QA. Presupuesto anual: 2.000 k€.',
  'Lo crítico: pagos y tarjetas (dinero de clientes y regulador).',
  'Hay dos bajas previstas este año (una jubilación y un traslado) sin reponer todavía.',
  'La regresión manual del back-office interno ocupa a tres personas.',
  'Tenéis dos herramientas de gestión de pruebas que hacen lo mismo.',
  'Javier, contratado hace seis meses, lleva rendimiento; las campañas empiezan en tres meses.',
]

export type Kind = 'good' | 'critical' | 'people' | 'morale'

export interface Lever {
  id: string
  title: string
  saving: number
  impact: string
  /** good: palanca razonable; critical: deja sin cubrir riesgo crítico; people: pierde personas clave; morale: daña la retención. */
  kind: Kind
  why: string
}

export const LEVERS: Lever[] = [
  { id: 'vacancies', title: 'No reponer las dos bajas previstas', saving: 120, impact: 'Dos personas menos, sin despedir a nadie. Hay que redistribuir su trabajo.', kind: 'good', why: 'Ahorro sin despidos: el coste es menos margen, y se ve venir.' },
  { id: 'outsource_low', title: 'Externalizar la regresión manual del back-office interno', saving: 140, impact: 'Riesgo bajo. Las tres personas pasan a pagos y tarjetas.', kind: 'good', why: 'Se externaliza lo de bajo riesgo y las personas se mueven a lo crítico.' },
  { id: 'scope_low', title: 'Dejar de probar a mano las apps internas de bajo riesgo', saving: 90, impact: 'Riesgo bajo que debe aceptar negocio, por escrito.', kind: 'good', why: 'Reducir alcance donde el riesgo es bajo, si negocio lo acepta.' },
  { id: 'tools', title: 'Quedarse con una sola herramienta de gestión de pruebas', saving: 60, impact: 'Migración de un mes; ningún impacto en la cobertura.', kind: 'good', why: 'Ahorro limpio: duplicidad sin valor.' },
  { id: 'automate', title: 'Automatizar la regresión manual de tarjetas (inversión este año)', saving: 60, impact: 'Ahorro neto del primer año; crece los siguientes. Lo lideraría alguien senior del área.', kind: 'good', why: 'Ahorra y además da un reto a las personas clave.' },
  { id: 'outsource_payments', title: 'Externalizar también la regresión de pagos', saving: 220, impact: 'El proveedor no conoce el dominio ni el antifraude.', kind: 'critical', why: 'Lo crítico, en manos de quien no conoce el dominio: si falla, cuesta más que el ahorro.' },
  { id: 'seniors', title: 'Prescindir de los tres QA senior más caros', saving: 300, impact: 'Son los que más saben de pagos y tarjetas.', kind: 'people', why: 'Pierdes el conocimiento del que depende el riesgo crítico.' },
  { id: 'perf', title: 'Cerrar rendimiento (el puesto de Javier)', saving: 130, impact: 'Las campañas empiezan en tres meses sin nadie que sepa hacer pruebas de carga.', kind: 'people', why: 'Recién contratado para una necesidad que llega en tres meses.' },
  { id: 'training', title: 'Eliminar formación y conferencias', saving: 40, impact: 'Ahorro pequeño; el equipo lo valora mucho.', kind: 'morale', why: 'Poco ahorro y mucho daño a la moral y a la retención.' },
]

const AREA_EN = [
  '3 QA Leads and 18 QAs. Annual budget: 2,000 k€.',
  'What is critical: payments and cards (customer money and the regulator).',
  'Two departures are planned this year (a retirement and a transfer), not yet replaced.',
  'Manual regression of the internal back-office occupies three people.',
  'You have two test management tools that do the same thing.',
  'Javier, hired six months ago, leads performance; the campaigns start in three months.',
]

const LEVERS_EN: Record<string, Pick<Lever, 'title' | 'impact' | 'why'>> = {
  vacancies: { title: 'Do not replace the two planned departures', impact: 'Two fewer people, without firing anyone. Their work has to be redistributed.', why: 'Savings without layoffs: the cost is less margin, and you can see it coming.' },
  outsource_low: { title: 'Outsource the manual regression of the internal back-office', impact: 'Low risk. The three people move to payments and cards.', why: 'You outsource the low-risk work and people move to what is critical.' },
  scope_low: { title: 'Stop manually testing low-risk internal apps', impact: 'Low risk that the business must accept, in writing.', why: 'Reduce scope where risk is low, if the business accepts it.' },
  tools: { title: 'Keep a single test management tool', impact: 'One-month migration; no impact on coverage.', why: 'Clean savings: duplication with no value.' },
  automate: { title: 'Automate the manual regression of cards (investment this year)', impact: 'Net savings in the first year; it grows in the following ones. A senior person in the area would lead it.', why: 'It saves and also gives a challenge to key people.' },
  outsource_payments: { title: 'Also outsource payments regression', impact: 'The vendor does not know the domain or the anti-fraud.', why: 'What is critical, in the hands of someone who does not know the domain: if it fails, it costs more than the savings.' },
  seniors: { title: 'Let go of the three most expensive senior QAs', impact: 'They are the ones who know the most about payments and cards.', why: 'You lose the knowledge on which the critical risk depends.' },
  perf: { title: "Close performance (Javier's position)", impact: 'The campaigns start in three months with nobody who can do load testing.', why: 'Just hired for a need that arrives in three months.' },
  training: { title: 'Eliminate training and conferences', impact: 'Small savings; the team values it a lot.', why: 'Little savings and a lot of damage to morale and retention.' },
}

export function areaFor(lang: AcademyLang = 'es'): string[] {
  return lang === 'en' ? AREA_EN : AREA
}
export function leversFor(lang: AcademyLang = 'es'): Lever[] {
  return lang === 'en' ? LEVERS.map((l) => ({ ...l, ...LEVERS_EN[l.id] })) : LEVERS
}

export interface CapacityState {
  levers: string[]
  saved: boolean
}

export const INITIAL_CAPACITY: CapacityState = { levers: [], saved: false }

const APP = 'kobalto-capacity'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `capacity.${action}`, status: 'ok', bugs: [], cost, flags }
}

export function toggleLever(state: CapacityState, id: string, lang: AcademyLang = 'es'): { state: CapacityState; event: AppEvent } {
  if (state.saved || !LEVERS.some((l) => l.id === id)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  const levers = state.levers.includes(id) ? state.levers.filter((l) => l !== id) : [...state.levers, id]
  return { state: { ...state, levers }, event: event('lever', tr(lang, `Plan: ${levers.length} palancas.`, `Plan: ${levers.length} levers.`), 0) }
}

export function evaluatePlan(levers: string[]) {
  const chosen = LEVERS.filter((l) => levers.includes(l.id))
  const saving = chosen.reduce((sum, l) => sum + l.saving, 0)
  return {
    saving,
    target: saving >= TARGET,
    critical: !chosen.some((l) => l.kind === 'critical'),
    keyPeople: !chosen.some((l) => l.kind === 'people'),
    morale: !chosen.some((l) => l.kind === 'morale'),
  }
}

export function savePlan(state: CapacityState, lang: AcademyLang = 'es'): { state: CapacityState; event: AppEvent } {
  if (state.saved || state.levers.length === 0) return { state, event: event('noop', tr(lang, 'Elige antes las palancas.', 'First choose the levers.'), 0) }
  const r = evaluatePlan(state.levers)
  const flags = ['plan.saved']
  if (r.target) flags.push('plan.target')
  if (r.critical) flags.push('plan.critical')
  if (r.keyPeople) flags.push('plan.keypeople')
  if (r.morale) flags.push('plan.morale')
  if (state.levers.includes('scope_low')) flags.push('plan.scope')
  if (r.target && r.critical && r.keyPeople && r.morale) flags.push('plan.ok')
  return { state: { ...state, saved: true }, event: event('save', tr(lang, `Plan de capacidad enviado a Laura: ahorro de ${r.saving} k€ de ${TARGET} k€.`, `Capacity plan sent to Laura: savings of ${r.saving} k€ of ${TARGET} k€.`), 20, flags) }
}
