import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

/**
 * App «Sprint» del curso 4, misión 1 (El cuello de botella): tablero del
 * sprint 14 del squad Tarjetas, análisis del flujo, plan del día de pruebas
 * por riesgo y propuestas para la retro. Evaluación determinista.
 */

export type Column = 'done' | 'qa_ready'

export interface Story {
  id: string
  title: string
  points: number
  column: Column
  /** Día del sprint (1–10) en que llegó a «Listo para QA». */
  qaDay: number
  /** QA revisó los criterios de aceptación antes de desarrollar. */
  acReviewed: boolean
  /** Qué pasa si falla en producción (para priorizar por riesgo). */
  impact: string
  /** Qué ha cambiado (pista de probabilidad de fallo). */
  change: string
  /** Lo que encuentras si la pruebas hoy. */
  finding: string
}

export const STORIES: Story[] = [
  { id: 'KOB-432', title: 'Bloqueo temporal desde la app', points: 3, column: 'done', qaDay: 3, acReviewed: true, impact: 'Un cliente no podría bloquear una tarjeta robada.', change: 'Pantalla y servicio nuevos.', finding: 'Probada el día 4.' },
  { id: 'KOB-437', title: 'Exportar movimientos a CSV', points: 2, column: 'done', qaDay: 2, acReviewed: true, impact: 'Un fichero con formato incorrecto.', change: 'Solo exportación.', finding: 'Probada el día 3.' },
  { id: 'KOB-431', title: 'Pago con tarjeta virtual en comercios online', points: 8, column: 'qa_ready', qaDay: 8, acReviewed: false, impact: 'Cobros erróneos a clientes: dinero real y reclamaciones.', change: 'Integración nueva con la pasarela de pagos.', finding: 'Funciona; un pago rechazado por la pasarela no muestra el motivo al cliente (bug menor, reportado).' },
  { id: 'KOB-433', title: 'Límite diario de gasto configurable', points: 8, column: 'qa_ready', qaDay: 9, acReviewed: false, impact: 'Un cliente podría gastar por encima de su límite: fraude y pérdidas.', change: 'Lógica de cálculo nueva sobre pagos concurrentes.', finding: '¡Bug grave! Dos pagos simultáneos superan el límite diario. Reportado como crítico.' },
  { id: 'KOB-434', title: 'Historial de movimientos con filtros', points: 5, column: 'qa_ready', qaDay: 9, acReviewed: false, impact: 'Un filtro que no muestra algún movimiento.', change: 'Filtros nuevos sobre una consulta existente.', finding: 'Sin incidencias.' },
  { id: 'KOB-435', title: 'Notificación push de cada pago (obligatoria por normativa)', points: 5, column: 'qa_ready', qaDay: 8, acReviewed: false, impact: 'Incumplimiento normativo: el regulador exige avisar de cada pago.', change: 'Servicio de notificaciones nuevo.', finding: 'Las notificaciones de pagos en dólares no llegan. Reportado como alto.' },
  { id: 'KOB-436', title: 'Alias de la tarjeta', points: 2, column: 'qa_ready', qaDay: 9, acReviewed: true, impact: 'Un alias que no se guarda.', change: 'Un campo de texto.', finding: 'Sin incidencias.' },
  { id: 'KOB-438', title: 'Color de la tarjeta', points: 3, column: 'qa_ready', qaDay: 9, acReviewed: false, impact: 'Un color que no se ve bien.', change: 'Solo interfaz.', finding: 'Sin incidencias.' },
]

/** Las tres historias de la cola con más riesgo (impacto × probabilidad). */
export const RISK_TOP: string[] = ['KOB-431', 'KOB-433', 'KOB-435']
export const QUEUE = STORIES.filter((s) => s.column === 'qa_ready').map((s) => s.id)
/** Lo que da tiempo a probar en un día. */
export const DAY_CAPACITY = 3

export interface Agreement {
  id: string
  text: string
  /** Ataca la causa (el flujo del equipo) y está en manos del equipo. */
  good: boolean
  /** Por qué sí o por qué no (se muestra tras enviar). */
  why: string
}

export const AGREEMENTS: Agreement[] = [
  { id: 'hire', text: 'Pedir a dirección otro QA para el squad.', good: false, why: 'Sin cambiar el flujo, otro QA solo alarga la cola. Y el headcount no lo decide el equipo en una retro.' },
  { id: 'ac_first', text: 'QA revisa los criterios de aceptación de cada historia antes de que empiece el desarrollo.', good: true, why: 'Los defectos se encuentran antes y QA prepara las pruebas mientras se desarrolla (shift-left).' },
  { id: 'happy_path', text: 'Para llegar al cierre, QA prueba solo el camino feliz de cada historia.', good: false, why: 'Esconde el problema y traslada el riesgo a producción.' },
  { id: 'wip', text: 'Límite de trabajo en curso: si hay 2 historias en «Listo para QA», nadie empieza otra; quien esté libre ayuda a probar.', good: true, why: 'Hace que el equipo termine historias en vez de empezarlas y reparte las pruebas.' },
  { id: 'extend', text: 'Alargar el sprint dos días para que QA pueda terminar.', good: false, why: 'Convierte el sprint en una mini-cascada: desarrollo y luego QA. La cola sigue igual.' },
  { id: 'small', text: 'Partir las historias grandes para que lleguen a QA a lo largo del sprint, no todas al final.', good: true, why: 'Lotes pequeños: el trabajo fluye y los defectos aparecen pronto.' },
  { id: 'weekend', text: 'QA trabaja el fin de semana antes de cada cierre.', good: false, why: 'Ritmo insostenible: el problema vuelve el sprint siguiente, y tú más cansada.' },
  { id: 'pair', text: 'Cada dev prueba su historia con los casos de QA (en pareja) antes de pasarla a «Listo para QA».', good: true, why: 'La calidad es del equipo: menos idas y vueltas y menos cola.' },
]
export const MAX_AGREEMENTS = 3

const STORY_EN: Record<string, Pick<Story, 'title' | 'impact' | 'change' | 'finding'>> = {
  'KOB-432': { title: 'Temporary card block from the app', impact: 'A customer could not block a stolen card.', change: 'New screen and service.', finding: 'Tested on day 4.' },
  'KOB-437': { title: 'Export transactions to CSV', impact: 'A file with the wrong format.', change: 'Export only.', finding: 'Tested on day 3.' },
  'KOB-431': { title: 'Virtual card payment at online merchants', impact: 'Wrong charges to customers: real money and complaints.', change: 'New integration with the payment gateway.', finding: "It works; a payment rejected by the gateway does not show the customer the reason (minor bug, reported)." },
  'KOB-433': { title: 'Configurable daily spending limit', impact: 'A customer could spend above their limit: fraud and losses.', change: 'New calculation logic over concurrent payments.', finding: 'Serious bug! Two simultaneous payments exceed the daily limit. Reported as critical.' },
  'KOB-434': { title: 'Transaction history with filters', impact: 'A filter that does not show some transaction.', change: 'New filters over an existing query.', finding: 'No issues.' },
  'KOB-435': { title: 'Push notification for every payment (mandatory by regulation)', impact: 'Regulatory non-compliance: the regulator requires notifying every payment.', change: 'New notifications service.', finding: 'Notifications for dollar payments do not arrive. Reported as high.' },
  'KOB-436': { title: 'Card alias', impact: 'An alias that is not saved.', change: 'A text field.', finding: 'No issues.' },
  'KOB-438': { title: 'Card color', impact: 'A color that does not look right.', change: 'UI only.', finding: 'No issues.' },
}

const AGREEMENT_EN: Record<string, Pick<Agreement, 'text' | 'why'>> = {
  hire: { text: 'Ask management for another QA for the squad.', why: 'Without changing the flow, another QA only lengthens the queue. And headcount is not decided by the team in a retro.' },
  ac_first: { text: 'QA reviews the acceptance criteria of each story before development starts.', why: 'Defects are found earlier and QA prepares the tests while it is developed (shift-left).' },
  happy_path: { text: 'To make the close, QA tests only the happy path of each story.', why: 'It hides the problem and shifts the risk to production.' },
  wip: { text: 'Work-in-progress limit: if there are 2 stories in “Ready for QA”, nobody starts another; whoever is free helps test.', why: 'It makes the team finish stories instead of starting them and spreads the testing.' },
  extend: { text: 'Extend the sprint by two days so QA can finish.', why: 'It turns the sprint into a mini-waterfall: development and then QA. The queue stays the same.' },
  small: { text: 'Split big stories so they reach QA throughout the sprint, not all at the end.', why: 'Small batches: work flows and defects appear early.' },
  weekend: { text: 'QA works the weekend before each close.', why: 'Unsustainable pace: the problem comes back next sprint, and you are more tired.' },
  pair: { text: "Each dev tests their story with QA's cases (in pairs) before moving it to “Ready for QA”.", why: 'Quality belongs to the team: fewer back-and-forths and a shorter queue.' },
}

/** Historias del tablero en el idioma pedido (mismos ids y números). */
export function storiesFor(lang: AcademyLang = 'es'): Story[] {
  return lang === 'en' ? STORIES.map((s) => ({ ...s, ...STORY_EN[s.id] })) : STORIES
}

/** Acuerdos de la retro en el idioma pedido. */
export function agreementsFor(lang: AcademyLang = 'es'): Agreement[] {
  return lang === 'en' ? AGREEMENTS.map((a) => ({ ...a, ...AGREEMENT_EN[a.id] })) : AGREEMENTS
}

export interface FlowFacts {
  lateEntries: number
  total: number
  acReviewed: number
  bigStories: number
  queue: number
  /** Días del sprint (1–9) en que no llegó ninguna historia a QA. */
  daysWithoutArrivals: number
}

export interface SprintState {
  analyzed: boolean
  /** Historias elegidas para probar hoy. */
  plan: string[]
  tested: boolean
  agreements: string[]
  proposed: boolean
}

export const INITIAL_SPRINT: SprintState = { analyzed: false, plan: [], tested: false, agreements: [], proposed: false }

export function flowFacts(): FlowFacts {
  const counted = STORIES
  const queue = STORIES.filter((s) => s.column === 'qa_ready')
  // Hoy es el día 9 del sprint.
  const arrivals = new Set(STORIES.map((s) => s.qaDay))
  const daysWithoutArrivals = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !arrivals.has(d)).length
  return {
    lateEntries: counted.filter((s) => s.qaDay >= 8).length,
    total: counted.length,
    acReviewed: counted.filter((s) => s.acReviewed).length,
    bigStories: counted.filter((s) => s.points >= 5).length,
    queue: queue.length,
    daysWithoutArrivals,
  }
}

const APP = 'kobalto-sprint'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `sprint.${action}`, status: 'ok', bugs: [], cost, flags }
}

export function analyzeFlow(state: SprintState, lang: AcademyLang = 'es'): { state: SprintState; event: AppEvent } {
  if (state.analyzed) return { state, event: event('noop', tr(lang, 'El flujo ya está analizado.', 'The flow is already analyzed.'), 0) }
  const f = flowFacts()
  return {
    state: { ...state, analyzed: true },
    event: event('analyze', tr(lang, `Análisis del flujo: ${f.lateEntries} de ${f.total} historias llegaron a QA los días 8–9; ${f.acReviewed} de ${f.total} con criterios revisados antes de desarrollar.`, `Flow analysis: ${f.lateEntries} of ${f.total} stories reached QA on days 8–9; ${f.acReviewed} of ${f.total} had criteria reviewed before development.`), 20, ['flow.analyzed']),
  }
}

export function togglePlan(state: SprintState, storyId: string, lang: AcademyLang = 'es'): { state: SprintState; event: AppEvent } {
  if (state.tested || !QUEUE.includes(storyId)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  const has = state.plan.includes(storyId)
  if (!has && state.plan.length >= DAY_CAPACITY) return { state, event: event('noop', tr(lang, `Hoy solo te da tiempo a ${DAY_CAPACITY} historias.`, `Today you only have time for ${DAY_CAPACITY} stories.`), 0) }
  const plan = has ? state.plan.filter((id) => id !== storyId) : [...state.plan, storyId]
  return { state: { ...state, plan }, event: event('plan', tr(lang, `Plan del día: ${plan.join(', ') || '—'}.`, `Plan for the day: ${plan.join(', ') || '—'}.`), 0) }
}

export function isRiskPlan(plan: string[]): boolean {
  return plan.length === RISK_TOP.length && RISK_TOP.every((id) => plan.includes(id))
}

export function testPlan(state: SprintState, lang: AcademyLang = 'es'): { state: SprintState; event: AppEvent } {
  if (state.tested || state.plan.length === 0) return { state, event: event('noop', tr(lang, 'Elige antes qué historias pruebas hoy.', 'First choose which stories you test today.'), 0) }
  const flags = ['test.done']
  if (isRiskPlan(state.plan)) flags.push('test.risk')
  if (state.plan.includes('KOB-433')) flags.push('test.limits')
  if (state.plan.includes('KOB-435')) flags.push('test.notif')
  if (state.plan.includes('KOB-438')) flags.push('test.color')
  return {
    state: { ...state, tested: true },
    event: event('test', tr(lang, `Probadas hoy: ${state.plan.join(', ')}.`, `Tested today: ${state.plan.join(', ')}.`), 180, flags),
  }
}

export function toggleAgreement(state: SprintState, id: string, lang: AcademyLang = 'es'): { state: SprintState; event: AppEvent } {
  if (state.proposed || !AGREEMENTS.some((a) => a.id === id)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  const has = state.agreements.includes(id)
  if (!has && state.agreements.length >= MAX_AGREEMENTS) return { state, event: event('noop', tr(lang, `Como mucho ${MAX_AGREEMENTS} acuerdos: los equipos no cambian diez cosas a la vez.`, `At most ${MAX_AGREEMENTS} agreements: teams don't change ten things at once.`), 0) }
  const agreements = has ? state.agreements.filter((a) => a !== id) : [...state.agreements, id]
  return { state: { ...state, agreements }, event: event('agreement', tr(lang, `Propuestas para la retro: ${agreements.length}.`, `Proposals for the retro: ${agreements.length}.`), 0) }
}

export function proposalQuality(agreements: string[]): { good: number; bad: number } {
  const chosen = AGREEMENTS.filter((a) => agreements.includes(a.id))
  return { good: chosen.filter((a) => a.good).length, bad: chosen.filter((a) => !a.good).length }
}

export function propose(state: SprintState, lang: AcademyLang = 'es'): { state: SprintState; event: AppEvent } {
  if (state.proposed || state.agreements.length === 0) return { state, event: event('noop', tr(lang, 'Elige antes tus propuestas.', 'First choose your proposals.'), 0) }
  const q = proposalQuality(state.agreements)
  const flags = ['retro.proposal']
  if (q.good === MAX_AGREEMENTS) flags.push('retro.good')
  if (q.bad > 0) flags.push('retro.bad')
  return {
    state: { ...state, proposed: true },
    event: event('propose', tr(lang, `Propuestas preparadas para la retro: ${q.good} sobre el flujo del equipo, ${q.bad} que no atacan la causa.`, `Proposals prepared for the retro: ${q.good} about the team flow, ${q.bad} that don't tackle the cause.`), 15, flags),
  }
}
