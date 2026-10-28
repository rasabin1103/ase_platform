import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

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

const MEMBER_EN: Record<string, Pick<Member, 'role' | 'strengths' | 'growth' | 'now'>> = {
  hector: { role: 'QA · Payments · 5 years at Kobalto', strengths: 'The one who knows the most about payments and anti-fraud on the team. Rigorous.', growth: 'Wants to be listened to more in release decisions.', now: 'Testing instant transfers. Has seen something odd in the anti-fraud.' },
  sergio: { role: 'QA Automation · your former colleague', strengths: 'The best automator on the team; built the Cards suite.', growth: 'Was applying for the QA Lead position that was given to you. Wants a visible technical challenge.', now: 'No big task assigned this sprint.' },
  lucia: { role: 'Junior QA · 1 year', strengths: 'Meticulous with test cases. Learns fast.', growth: 'Needs to gain confidence with her own work of controlled risk.', now: 'Insecure since the production error last month.' },
  nerea: { role: 'QA · Payments · 3 years', strengths: 'Reliable and autonomous; likes technical problems.', growth: 'Wants to learn performance testing.', now: 'Has free capacity this sprint.' },
  pablo: { role: 'QA · Cards · 4 years', strengths: 'Knows Cards inside out.', growth: 'Wants to stop firefighting.', now: 'Supports three Cards squads at once. Stretched very thin.' },
}

const TASK_EN: Record<string, Pick<Task, 'title' | 'detail' | 'why'>> = {
  t1: { title: 'Instant transfers release testing', detail: 'Critical: ships on Thursday, customer money and anti-fraud.', why: "The most critical work goes to whoever knows the domain best and is already testing it. Not the junior, and you don't take it yourself: your job is to enable the team to do it." },
  t2: { title: 'Automate payments regression', detail: 'Technical project of several weeks, visible to all Engineering.', why: 'A visible technical challenge for the best automator, who also wanted to grow.' },
  t3: { title: 'Test the new savings screen', detail: 'Low risk: information, no money moves.', why: 'Her own work with controlled risk: she gains confidence without putting the business at stake.' },
  t4: { title: 'First performance tests of the payments API', detail: 'Exploratory: nobody on the team has done it yet.', why: 'She has capacity, autonomy and wants to learn performance: growth aligned with what the team needs.' },
  t5: { title: 'Review acceptance criteria for Cards', detail: 'What he already does in his squads, now before development.', why: "It is his turf and adds no new front: he is at capacity." },
}

const TOPIC_EN: Record<string, [string, string]> = {
  elephant: ['Talk openly about the fact that he also applied for the position and how he feels.', 'Naming it removes tension: ignoring it lets it grow.'],
  boss: ["Make it clear from the start that you are now his boss and that you expect him to accept it.", 'Imposing hierarchy breaks the trust you already had.'],
  growth: ['Ask him what he wants to do this year and where he wants to grow.', "The 1:1 is his space: start with his goals."],
  feedback: ['Ask him how he prefers to receive feedback from you.', 'Agreeing on how you will give each other feedback avoids misunderstandings.'],
  others: ['Ask him what he thinks of Héctor and Lucía.', 'Asking for opinions about colleagues in the first 1:1 opens the door to gossip.'],
  status: ['Go over the status of all his tasks.', 'That is a follow-up meeting, not a 1:1.'],
  needs: ['Ask him what he needs from you as Lead.', 'Your job now is to help him do his.'],
  nothing: ['Tell him nothing is going to change between you.', 'It does change: pretending otherwise confuses both of you.'],
}

export function membersFor(lang: AcademyLang = 'es'): Member[] {
  return lang === 'en' ? MEMBERS.map((m) => ({ ...m, ...MEMBER_EN[m.id] })) : MEMBERS
}
export function tasksFor(lang: AcademyLang = 'es'): Task[] {
  return lang === 'en' ? TASKS.map((t) => ({ ...t, ...TASK_EN[t.id] })) : TASKS
}
export function peopleFor(lang: AcademyLang = 'es'): { id: PersonId; label: string }[] {
  return lang === 'en' ? PEOPLE.map((p) => (p.id === 'yo' ? { ...p, label: 'Me (I do it)' } : p)) : PEOPLE
}
export function topicsFor(lang: AcademyLang = 'es'): Topic[] {
  return lang === 'en' ? TOPICS.map((t) => ({ ...t, text: TOPIC_EN[t.id][0], why: TOPIC_EN[t.id][1] })) : TOPICS
}

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

export function assign(state: TeamState, taskId: string, person: PersonId | '', lang: AcademyLang = 'es'): { state: TeamState; event: AppEvent } {
  if (state.assigned || !TASKS.some((t) => t.id === taskId)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  return { state: { ...state, assignments: { ...state.assignments, [taskId]: person } }, event: event('assign', tr(lang, `Reparto: ${taskId} → ${person || '—'}.`, `Allocation: ${taskId} → ${person || '—'}.`), 0) }
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

export function confirmAssignments(state: TeamState, lang: AcademyLang = 'es'): { state: TeamState; event: AppEvent } {
  const r = evaluateAssignments(state.assignments)
  if (state.assigned || !r.complete) return { state, event: event('noop', tr(lang, 'Asigna antes todas las tareas.', 'First assign all the tasks.'), 0) }
  const flags = ['assign.submitted']
  if (r.right === TASKS.length) flags.push('assign.ok')
  if (r.self) flags.push('assign.self')
  if (r.juniorOnCritical) flags.push('assign.junior_critical')
  if (r.pabloOverloaded) flags.push('assign.pablo_more')
  if (state.assignments.t1 === 'hector') flags.push('assign.hector')
  if (state.assignments.t2 === 'sergio') flags.push('assign.sergio')
  if (state.assignments.t3 === 'lucia') flags.push('assign.lucia')
  return { state: { ...state, assigned: true }, event: event('confirm', tr(lang, `Reparto del sprint confirmado: ${r.right} de ${TASKS.length} tareas a la persona más adecuada.`, `Sprint allocation confirmed: ${r.right} of ${TASKS.length} tasks to the most suitable person.`), 15, flags) }
}

export function toggleTopic(state: TeamState, id: string, lang: AcademyLang = 'es'): { state: TeamState; event: AppEvent } {
  if (state.prepared || !TOPICS.some((t) => t.id === id)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  const has = state.topics.includes(id)
  if (!has && state.topics.length >= MAX_TOPICS) return { state, event: event('noop', tr(lang, `Como mucho ${MAX_TOPICS} temas: es media hora.`, `At most ${MAX_TOPICS} topics: it's half an hour.`), 0) }
  const topics = has ? state.topics.filter((t) => t !== id) : [...state.topics, id]
  return { state: { ...state, topics }, event: event('topic', tr(lang, `Preparación del 1:1: ${topics.length} temas.`, `1:1 preparation: ${topics.length} topics.`), 0) }
}

export function topicQuality(topics: string[]) {
  const chosen = TOPICS.filter((t) => topics.includes(t.id))
  return { good: chosen.filter((t) => t.good).length, bad: chosen.filter((t) => !t.good).length }
}

export function prepareOneOnOne(state: TeamState, lang: AcademyLang = 'es'): { state: TeamState; event: AppEvent } {
  if (state.prepared || state.topics.length === 0) return { state, event: event('noop', tr(lang, 'Elige antes los temas.', 'First choose the topics.'), 0) }
  const q = topicQuality(state.topics)
  const flags = ['one2one.prepped']
  if (q.good >= 3 && q.bad === 0) flags.push('one2one.ready')
  if (state.topics.includes('elephant')) flags.push('one2one.elephant')
  return { state: { ...state, prepared: true }, event: event('prepare', tr(lang, `1:1 con Sergio preparado: ${q.good} temas adecuados, ${q.bad} a evitar.`, `1:1 with Sergio prepared: ${q.good} suitable topics, ${q.bad} to avoid.`), 10, flags) }
}
