import type { AppEvent } from '../../engine/types'

/**
 * App «Equipo» del curso 4, misión 6 (Tu primer equipo): perfiles del equipo
 * de QA de Pagos, reparto del trabajo del sprint y preparación del primer 1:1
 * con Sergio. Evaluación determinista.
 */

export type PersonId = 'hector' | 'sergio' | 'lucia' | 'nerea' | 'pablo' | 'yo'

export interface Member {
  id: Exclude<PersonId, 'yo'>
  name: string
  role: string
  /** Lo que sabe hacer bien. */
  strengths: string
  /** Lo que quiere aprender o hacia dónde quiere crecer. */
  growth: string
  /** Su situación ahora mismo. */
  now: string
}

export const MEMBERS: Member[] = [
  { id: 'hector', name: 'Héctor Bravo', role: 'QA · Pagos · 5 años en Kobalto', strengths: 'El que más sabe de pagos y antifraude del equipo. Riguroso.', growth: 'Quiere que se le escuche más en las decisiones de release.', now: 'Probando las transferencias instantáneas. Ha visto algo raro en el antifraude.' },
  { id: 'sergio', name: 'Sergio Navas', role: 'QA Automation · ex-compañero tuyo', strengths: 'El mejor automatizando del equipo; montó la suite de Tarjetas.', growth: 'Optaba al puesto de QA Lead que te han dado a ti. Quiere un reto técnico visible.', now: 'Sin tarea grande asignada este sprint.' },
  { id: 'lucia', name: 'Lucía Campos', role: 'QA junior · 1 año', strengths: 'Meticulosa con los casos de prueba. Aprende rápido.', growth: 'Necesita ganar confianza con trabajo propio de riesgo controlado.', now: 'Insegura desde el error de producción del mes pasado.' },
  { id: 'nerea', name: 'Nerea Ortiz', role: 'QA · Pagos · 3 años', strengths: 'Fiable y autónoma; le gustan los problemas técnicos.', growth: 'Quiere aprender pruebas de rendimiento.', now: 'Con capacidad libre este sprint.' },
  { id: 'pablo', name: 'Pablo Ríos', role: 'QA · Tarjetas · 4 años', strengths: 'Conoce Tarjetas de memoria.', growth: 'Quiere dejar de apagar fuegos.', now: 'Da soporte a tres squads de Tarjetas a la vez. Va muy justo.' },
]

export interface Task {
  id: string
  title: string
  detail: string
  /** Persona más adecuada (y por qué). */
  best: Exclude<PersonId, 'yo'>
  why: string
}

export const TASKS: Task[] = [
  { id: 't1', title: 'Pruebas del release de transferencias instantáneas', detail: 'Crítico: sale el jueves, dinero de clientes y antifraude.', best: 'hector', why: 'Lo más crítico, a quien más sabe del dominio y ya lo está probando. No a la junior, y no lo coges tú: tu trabajo es que el equipo pueda hacerlo.' },
  { id: 't2', title: 'Automatizar la regresión de pagos', detail: 'Proyecto técnico de varias semanas, visible para toda Ingeniería.', best: 'sergio', why: 'Un reto técnico visible para el mejor automatizador, que además quería crecer.' },
  { id: 't3', title: 'Probar la nueva pantalla de ahorro', detail: 'Riesgo bajo: información, sin mover dinero.', best: 'lucia', why: 'Trabajo propio con riesgo controlado: así gana confianza sin poner en juego el negocio.' },
  { id: 't4', title: 'Primeras pruebas de rendimiento de la API de pagos', detail: 'Exploratorio: nadie lo ha hecho todavía en el equipo.', best: 'nerea', why: 'Tiene capacidad, autonomía y quiere aprender rendimiento: crecimiento alineado con lo que necesita el equipo.' },
  { id: 't5', title: 'Revisar criterios de aceptación de Tarjetas', detail: 'Lo que ya hace en sus squads, ahora antes de desarrollar.', best: 'pablo', why: 'Es su terreno y no le añade un frente nuevo: va al límite de capacidad.' },
]

export const PEOPLE: { id: PersonId; label: string }[] = [
  ...MEMBERS.map((m) => ({ id: m.id, label: m.name })),
  { id: 'yo', label: 'Yo (lo hago yo)' },
]

export interface Topic {
  id: string
  text: string
  good: boolean
  why: string
}

/** Temas para el primer 1:1 con Sergio. */
export const TOPICS: Topic[] = [
  { id: 'elephant', text: 'Hablar abiertamente de que él también optaba al puesto y cómo se siente.', good: true, why: 'Nombrarlo quita tensión: ignorarlo la deja crecer.' },
  { id: 'boss', text: 'Dejar claro desde el principio que ahora eres su jefa y espero que lo acepte.', good: false, why: 'Imponer la jerarquía rompe la confianza que ya teníais.' },
  { id: 'growth', text: 'Preguntarle qué quiere hacer este año y hacia dónde quiere crecer.', good: true, why: 'El 1:1 es su espacio: empieza por sus objetivos.' },
  { id: 'feedback', text: 'Preguntarle cómo prefiere recibir feedback de ti.', good: true, why: 'Acordar cómo os vais a dar feedback evita malentendidos.' },
  { id: 'others', text: 'Preguntarle qué opina de Héctor y de Lucía.', good: false, why: 'Pedir opiniones sobre compañeros en el primer 1:1 abre la puerta a los chismes.' },
  { id: 'status', text: 'Repasar el estado de todas sus tareas.', good: false, why: 'Eso es una reunión de seguimiento, no un 1:1.' },
  { id: 'needs', text: 'Preguntarle qué necesita de ti como Lead.', good: true, why: 'Tu trabajo ahora es ayudarle a hacer el suyo.' },
  { id: 'nothing', text: 'Decirle que no va a cambiar nada entre vosotros.', good: false, why: 'Sí cambia: fingir que no confunde a los dos.' },
]
export const MAX_TOPICS = 4

export interface TeamState {
  assignments: Record<string, PersonId | ''>
  assigned: boolean
  topics: string[]
  prepared: boolean
}

export const INITIAL_TEAM: TeamState = { assignments: Object.fromEntries(TASKS.map((t) => [t.id, ''])) as Record<string, PersonId | ''>, assigned: false, topics: [], prepared: false }

const APP = 'kobalto-team'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `team.${action}`, status: 'ok', bugs: [], cost, flags }
}

export function assign(state: TeamState, taskId: string, person: PersonId | ''): { state: TeamState; event: AppEvent } {
  if (state.assigned || !TASKS.some((t) => t.id === taskId)) return { state, event: event('noop', 'Sin cambios.', 0) }
  return { state: { ...state, assignments: { ...state.assignments, [taskId]: person } }, event: event('assign', `Reparto: ${taskId} → ${person || '—'}.`, 0) }
}

export function evaluateAssignments(assignments: Record<string, PersonId | ''>) {
  const right = TASKS.filter((t) => assignments[t.id] === t.best).length
  return {
    right,
    complete: TASKS.every((t) => !!assignments[t.id]),
    self: TASKS.some((t) => assignments[t.id] === 'yo'),
    juniorOnCritical: assignments.t1 === 'lucia',
    pabloOverloaded: TASKS.some((t) => t.id !== 't5' && assignments[t.id] === 'pablo'),
  }
}

export function confirmAssignments(state: TeamState): { state: TeamState; event: AppEvent } {
  const r = evaluateAssignments(state.assignments)
  if (state.assigned || !r.complete) return { state, event: event('noop', 'Asigna antes todas las tareas.', 0) }
  const flags = ['assign.submitted']
  if (r.right === TASKS.length) flags.push('assign.ok')
  if (r.self) flags.push('assign.self')
  if (r.juniorOnCritical) flags.push('assign.junior_critical')
  if (r.pabloOverloaded) flags.push('assign.pablo_more')
  if (state.assignments.t1 === 'hector') flags.push('assign.hector')
  if (state.assignments.t2 === 'sergio') flags.push('assign.sergio')
  if (state.assignments.t3 === 'lucia') flags.push('assign.lucia')
  return { state: { ...state, assigned: true }, event: event('confirm', `Reparto del sprint confirmado: ${r.right} de ${TASKS.length} tareas a la persona más adecuada.`, 15, flags) }
}

export function toggleTopic(state: TeamState, id: string): { state: TeamState; event: AppEvent } {
  if (state.prepared || !TOPICS.some((t) => t.id === id)) return { state, event: event('noop', 'Sin cambios.', 0) }
  const has = state.topics.includes(id)
  if (!has && state.topics.length >= MAX_TOPICS) return { state, event: event('noop', `Como mucho ${MAX_TOPICS} temas: es media hora.`, 0) }
  const topics = has ? state.topics.filter((t) => t !== id) : [...state.topics, id]
  return { state: { ...state, topics }, event: event('topic', `Preparación del 1:1: ${topics.length} temas.`, 0) }
}

export function topicQuality(topics: string[]) {
  const chosen = TOPICS.filter((t) => topics.includes(t.id))
  return { good: chosen.filter((t) => t.good).length, bad: chosen.filter((t) => !t.good).length }
}

export function prepareOneOnOne(state: TeamState): { state: TeamState; event: AppEvent } {
  if (state.prepared || state.topics.length === 0) return { state, event: event('noop', 'Elige antes los temas.', 0) }
  const q = topicQuality(state.topics)
  const flags = ['one2one.prepped']
  if (q.good >= 3 && q.bad === 0) flags.push('one2one.ready')
  if (state.topics.includes('elephant')) flags.push('one2one.elephant')
  return { state: { ...state, prepared: true }, event: event('prepare', `1:1 con Sergio preparado: ${q.good} temas adecuados, ${q.bad} a evitar.`, 10, flags) }
}
