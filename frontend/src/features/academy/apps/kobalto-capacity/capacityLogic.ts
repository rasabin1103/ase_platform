import type { AppEvent } from '../../engine/types'

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

export interface CapacityState {
  levers: string[]
  saved: boolean
}

export const INITIAL_CAPACITY: CapacityState = { levers: [], saved: false }

const APP = 'kobalto-capacity'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `capacity.${action}`, status: 'ok', bugs: [], cost, flags }
}

export function toggleLever(state: CapacityState, id: string): { state: CapacityState; event: AppEvent } {
  if (state.saved || !LEVERS.some((l) => l.id === id)) return { state, event: event('noop', 'Sin cambios.', 0) }
  const levers = state.levers.includes(id) ? state.levers.filter((l) => l !== id) : [...state.levers, id]
  return { state: { ...state, levers }, event: event('lever', `Plan: ${levers.length} palancas.`, 0) }
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

export function savePlan(state: CapacityState): { state: CapacityState; event: AppEvent } {
  if (state.saved || state.levers.length === 0) return { state, event: event('noop', 'Elige antes las palancas.', 0) }
  const r = evaluatePlan(state.levers)
  const flags = ['plan.saved']
  if (r.target) flags.push('plan.target')
  if (r.critical) flags.push('plan.critical')
  if (r.keyPeople) flags.push('plan.keypeople')
  if (r.morale) flags.push('plan.morale')
  if (state.levers.includes('scope_low')) flags.push('plan.scope')
  if (r.target && r.critical && r.keyPeople && r.morale) flags.push('plan.ok')
  return { state: { ...state, saved: true }, event: event('save', `Plan de capacidad enviado a Laura: ahorro de ${r.saving} k€ de ${TARGET} k€.`, 20, flags) }
}
