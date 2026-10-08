import type { AppEvent } from '../../engine/types'

/**
 * App del curso 2, misión 0: mapa del proceso de pruebas (actividades,
 * testware y roles, CTFL 1.4) y matriz de trazabilidad (historias,
 * condiciones, casos y defectos). Evaluación determinista.
 */

export type ActivityId = 'planning' | 'monitoring' | 'analysis' | 'design' | 'implementation' | 'execution' | 'completion'
export type RoleId = 'management' | 'tester'

export const ACTIVITIES: { id: ActivityId; label: string; summary: string }[] = [
  { id: 'analysis', label: 'Análisis de pruebas', summary: 'Estudiar la base de prueba y decidir QUÉ probar.' },
  { id: 'completion', label: 'Cierre de pruebas', summary: 'Al terminar un hito: archivar, evaluar y aprender.' },
  { id: 'design', label: 'Diseño de pruebas', summary: 'Decidir CÓMO probarlo: casos y cobertura.' },
  { id: 'execution', label: 'Ejecución de pruebas', summary: 'Ejecutar, comparar resultados y registrar.' },
  { id: 'planning', label: 'Planificación de pruebas', summary: 'Objetivos, enfoque, recursos y calendario.' },
  { id: 'implementation', label: 'Implementación de pruebas', summary: 'Preparar lo necesario para ejecutar.' },
  { id: 'monitoring', label: 'Seguimiento y control', summary: 'Comparar el avance con el plan y corregir.' },
]

export const TESTWARE: { id: string; label: string; activity: ActivityId }[] = [
  { id: 'logs', label: 'Registros de ejecución e informes de defectos', activity: 'execution' },
  { id: 'conditions', label: 'Condiciones de prueba priorizadas', activity: 'analysis' },
  { id: 'closure', label: 'Informe de cierre y lecciones aprendidas', activity: 'completion' },
  { id: 'cases', label: 'Casos de prueba', activity: 'design' },
  { id: 'plan', label: 'Plan de pruebas', activity: 'planning' },
  { id: 'procedures', label: 'Procedimientos, datos y scripts de prueba', activity: 'implementation' },
  { id: 'progress', label: 'Informes de avance', activity: 'monitoring' },
]

export const ROLE_LABEL: Record<RoleId, string> = { management: 'Gestión de pruebas', tester: 'Tester' }
const ROLE_OF: Record<ActivityId, RoleId> = {
  planning: 'management',
  monitoring: 'management',
  completion: 'management',
  analysis: 'tester',
  design: 'tester',
  implementation: 'tester',
  execution: 'tester',
}

export interface ActivityPlan {
  position: number | null
  testware: string
  role: RoleId | ''
}

// --------------------------------------------------------- Trazabilidad
export const STORIES = [
  { id: 'H1', label: 'H1 · Límite de gasto por empleado' },
  { id: 'H2', label: 'H2 · Bloquear una tarjeta de equipo' },
  { id: 'H3', label: 'H3 · Informe mensual de gastos' },
]
export const CONDITIONS = [
  { id: 'C1', label: 'C1 · Una compra por encima del límite se rechaza', story: 'H1' },
  { id: 'C2', label: 'C2 · El administrador puede cambiar el límite', story: 'H1' },
  { id: 'C3', label: 'C3 · Una tarjeta bloqueada no admite pagos', story: 'H2' },
  { id: 'C4', label: 'C4 · El informe agrupa los gastos por empleado', story: 'H3' },
]
export const CASES = [
  { id: 'T1', label: 'T1 · Límite 500 €, compra de 501 € → rechazada', condition: 'C1' },
  { id: 'T2', label: 'T2 · Cambiar el límite a 800 € y comprar 700 € → aceptada', condition: 'C2' },
  { id: 'T3', label: 'T3 · Bloquear la tarjeta y pagar al momento → rechazada', condition: 'C3' },
  { id: 'T4', label: 'T4 · Informe con dos empleados → dos grupos', condition: 'C4' },
  { id: 'T5', label: 'T5 · Límite 500 €, compra de 500 € → aceptada', condition: 'C1' },
]
export const DEFECTS = [
  { id: 'D1', label: 'D1 · Una compra de 500 € justos se rechaza', case: 'T5' },
  { id: 'D2', label: 'D2 · La tarjeta bloqueada acepta pagos durante 5 minutos', case: 'T3' },
]
export const TRACE_TOTAL = CONDITIONS.length + CASES.length + DEFECTS.length

export interface ProcessState {
  plan: Record<ActivityId, ActivityPlan>
  links: Record<string, string>
  proposed?: ProposalResult
  traceSent?: { correct: number; total: number }
  feedback?: string[]
}

export interface ProposalResult {
  order: boolean
  testware: number
  roles: number
}

const emptyPlan = (): Record<ActivityId, ActivityPlan> =>
  Object.fromEntries(ACTIVITIES.map((a) => [a.id, { position: null, testware: '', role: '' }])) as Record<ActivityId, ActivityPlan>

export const INITIAL_PROCESS: ProcessState = { plan: emptyPlan(), links: {} }

// ----------------------------------------------------------- Evaluación
export function evaluateOrder(plan: Record<ActivityId, ActivityPlan>): { ok: boolean; issues: string[] } {
  const pos = (id: ActivityId) => plan[id].position
  const issues: string[] = []
  const all = ACTIVITIES.map((a) => pos(a.id))
  if (all.some((p) => p === null)) issues.push('Hay actividades sin posición en el proceso.')
  else if (new Set(all).size !== all.length) issues.push('Dos actividades ocupan la misma posición.')
  if (issues.length) return { ok: false, issues }
  if (pos('planning') !== 1) issues.push('La planificación debería ser lo primero: sin objetivos ni enfoque, el resto va a ciegas.')
  if (pos('completion') !== ACTIVITIES.length) issues.push('El cierre va al final del hito: archivar, evaluar y aprender.')
  const chain: ActivityId[] = ['analysis', 'design', 'implementation', 'execution']
  for (let i = 1; i < chain.length; i++) {
    if ((pos(chain[i]) ?? 0) < (pos(chain[i - 1]) ?? 0)) {
      issues.push('Análisis (qué probar), diseño (cómo), implementación (preparar) y ejecución tienen un orden lógico.')
      break
    }
  }
  return { ok: issues.length === 0, issues }
}

export function evaluatePlan(plan: Record<ActivityId, ActivityPlan>): ProposalResult & { orderIssues: string[] } {
  const order = evaluateOrder(plan)
  let testware = 0
  let roles = 0
  for (const a of ACTIVITIES) {
    const tw = TESTWARE.find((t) => t.id === plan[a.id].testware)
    if (tw?.activity === a.id) testware++
    if (plan[a.id].role === ROLE_OF[a.id]) roles++
  }
  return { order: order.ok, testware, roles, orderIssues: order.issues }
}

export function traceScore(links: Record<string, string>): number {
  let n = 0
  for (const c of CONDITIONS) if (links[c.id] === c.story) n++
  for (const t of CASES) if (links[t.id] === t.condition) n++
  for (const d of DEFECTS) if (links[d.id] === d.case) n++
  return n
}

// ---------------------------------------------------------------- Acciones
function edit(state: ProcessState, summary: string): { state: ProcessState; event: AppEvent } {
  return { state, event: { app: 'kobalto-process', action: 'edit', summary, technical: 'process.edit', status: 'ok', bugs: [], cost: 0 } }
}

export function setActivity(state: ProcessState, id: ActivityId, patch: Partial<ActivityPlan>): { state: ProcessState; event: AppEvent } {
  const position = patch.position === undefined ? state.plan[id].position : patch.position === null ? null : Math.max(1, Math.min(ACTIVITIES.length, Math.round(patch.position)))
  const next = { ...state.plan[id], ...patch, position }
  return edit({ ...state, plan: { ...state.plan, [id]: next } }, `Proceso: ${id} actualizado.`)
}

export function setLink(state: ProcessState, from: string, to: string): { state: ProcessState; event: AppEvent } {
  return edit({ ...state, links: { ...state.links, [from]: to } }, `Trazabilidad: ${from} → ${to || '—'}.`)
}

export function askLaura(state: ProcessState): { state: ProcessState; event: AppEvent } {
  const r = evaluatePlan(state.plan)
  const fb: string[] = []
  fb.push(...r.orderIssues.slice(0, 2))
  if (r.testware < ACTIVITIES.length) fb.push(`${ACTIVITIES.length - r.testware} actividad${ACTIVITIES.length - r.testware === 1 ? '' : 'es'} no tiene${ACTIVITIES.length - r.testware === 1 ? '' : 'n'} el testware que produce de verdad.`)
  if (r.roles < ACTIVITIES.length) fb.push('Revisa los roles: la gestión de pruebas planifica, sigue y cierra; el tester analiza, diseña, implementa y ejecuta.')
  if (!state.traceSent) {
    const t = traceScore(state.links)
    if (t < TRACE_TOTAL) fb.push(`En la matriz de trazabilidad hay ${TRACE_TOTAL - t} enlace${TRACE_TOTAL - t === 1 ? '' : 's'} sin hacer o mal hecho${TRACE_TOTAL - t === 1 ? '' : 's'}.`)
  }
  if (fb.length === 0) fb.push('Proceso coherente y trazabilidad completa. Adelante.')
  return {
    state: { ...state, feedback: fb },
    event: { app: 'kobalto-process', action: 'ask_laura', summary: `Laura revisa tu propuesta: ${fb.join(' ')}`, technical: 'process.review', status: 'ok', bugs: [], cost: 10 },
  }
}

export function propose(state: ProcessState): { state: ProcessState; event: AppEvent } {
  const r = evaluatePlan(state.plan)
  const flags = ['proc.submitted']
  if (r.order) flags.push('proc.order')
  if (r.testware === ACTIVITIES.length) flags.push('proc.testware')
  if (r.roles === ACTIVITIES.length) flags.push('proc.roles')
  if (r.order && r.testware === ACTIVITIES.length && r.roles === ACTIVITIES.length) flags.push('proc.all')
  return {
    state: { ...state, proposed: { order: r.order, testware: r.testware, roles: r.roles } },
    event: {
      app: 'kobalto-process',
      action: 'propose',
      summary: `Propuesta de proceso enviada a Raúl: orden ${r.order ? 'coherente' : 'con huecos'}, testware ${r.testware}/${ACTIVITIES.length}, roles ${r.roles}/${ACTIVITIES.length}.`,
      technical: `process.propose ${JSON.stringify(r)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}

export function sendTrace(state: ProcessState): { state: ProcessState; event: AppEvent } {
  const correct = traceScore(state.links)
  const flags = ['trace.sent']
  if (correct === TRACE_TOTAL) flags.push('trace.ok')
  return {
    state: { ...state, traceSent: { correct, total: TRACE_TOTAL } },
    event: {
      app: 'kobalto-process',
      action: 'send_trace',
      summary: `Matriz de trazabilidad enviada a Carmen: ${correct} de ${TRACE_TOTAL} enlaces correctos.`,
      technical: 'process.trace',
      status: correct === TRACE_TOTAL ? 'ok' : 'error',
      bugs: [],
      cost: 10,
      flags,
    },
  }
}
