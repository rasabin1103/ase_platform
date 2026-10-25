import type { AppEvent } from '../../engine/types'

/**
 * App «Postmortem» del curso 4, misión 10 (El gran incidente): cronología
 * del incidente de transferencias duplicadas, causas que contribuyeron y
 * acciones. Un postmortem sin culpables busca causas de sistema, no personas.
 * Evaluación determinista.
 */

export const TIMELINE: { when: string; what: string }[] = [
  { when: 'Martes', what: 'Pablo (QA de Pagos) abre PAG-412: «Si la red de pagos reintenta una orden, la transferencia podría duplicarse. No hay entorno para probarlo». Prioridad media.' },
  { when: 'Jueves', what: 'Producto pide sacar el release el viernes por la campaña. Pablo firma «con riesgo conocido, ver PAG-412». Nadie más revisa el ticket.' },
  { when: 'Viernes 18:00', what: 'Release completo de transferencias instantáneas, sin despliegue gradual.' },
  { when: 'Sábado 02:00', what: 'Por latencia, la red de pagos reintenta órdenes: 3.200 transferencias duplicadas. No salta ninguna alerta.' },
  { when: 'Domingo 10:00', what: 'Los clientes lo cuentan en redes. Guardia de plataforma lo detecta por las redes, no por los sistemas.' },
  { when: 'Lunes', what: 'Prensa económica y requerimiento del regulador: informe preliminar en 72 horas.' },
]

export interface Item {
  id: string
  text: string
  good: boolean
  why: string
}

export const CAUSES: Item[] = [
  { id: 'gate', text: 'QA es la única puerta: firmar «con riesgo conocido» no obliga a nadie con autoridad a decidir sobre ese riesgo.', good: true, why: 'La causa de fondo: el riesgo se conocía y nadie que pudiera aceptarlo lo decidió.' },
  { id: 'env', text: 'No hay entorno que simule los reintentos de la red de pagos.', good: true, why: 'El riesgo no se podía probar.' },
  { id: 'monitor', text: 'No hay alerta de transferencias duplicadas en producción.', good: true, why: 'Se tardó ocho horas en saberlo, y por las redes.' },
  { id: 'deploy', text: 'Release completo un viernes por la tarde, sin despliegue gradual.', good: true, why: 'Todo el impacto de golpe y con el fin de semana por delante.' },
  { id: 'idempotency', text: 'El diseño de la API no garantiza la idempotencia ante reintentos.', good: true, why: 'El fallo técnico de origen.' },
  { id: 'pablo', text: 'Pablo firmó el release.', good: false, why: 'Señala a una persona que hizo lo que el sistema le pedía, y que además avisó.' },
  { id: 'marta', text: 'Producto presionó para salir el viernes.', good: false, why: 'Presionar por una fecha es su trabajo; el problema es que no había un mecanismo para decidir el riesgo.' },
  { id: 'dev', text: 'El desarrollador no lo programó bien.', good: false, why: 'Culpa a una persona en vez de preguntar por qué el diseño lo permitía.' },
]

export const ACTIONS: Item[] = [
  { id: 'risk_owner', text: 'Los riesgos conocidos de un release los acepta por escrito su dueño de negocio, no QA. QA informa; el negocio decide.', good: true, why: 'QA deja de ser la única puerta.' },
  { id: 'retry_env', text: 'Simulador de la red de pagos con reintentos y latencia en el entorno de pruebas.', good: true, why: 'Lo que no se podía probar, ahora se puede.' },
  { id: 'alert', text: 'Alerta en producción de transferencias duplicadas, con guardia.', good: true, why: 'Detectar en minutos, no por las redes.' },
  { id: 'canary', text: 'Despliegue gradual obligatorio en pagos y nada de releases completos en viernes.', good: true, why: 'Limita el impacto si algo falla.' },
  { id: 'idem', text: 'Idempotencia obligatoria en las APIs de pagos, como estándar de arquitectura.', good: true, why: 'Ataca el fallo técnico de origen.' },
  { id: 'double_signoff', text: 'Dos QA deben firmar cada release de pagos.', good: false, why: 'Refuerza la puerta en vez de repartir la responsabilidad.' },
  { id: 'sanction', text: 'Sanción disciplinaria para quien firmó.', good: false, why: 'Enseña a todo el mundo a no avisar.' },
  { id: 'freeze', text: 'Congelar los releases de pagos tres meses.', good: false, why: 'Frena el negocio sin cambiar el sistema que falló.' },
]

export interface PostmortemState {
  causes: string[]
  actions: string[]
  saved: boolean
}

export const INITIAL_PM: PostmortemState = { causes: [], actions: [], saved: false }

const APP = 'kobalto-postmortem'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `postmortem.${action}`, status: 'ok', bugs: [], cost, flags }
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

export function toggleCause(state: PostmortemState, id: string): { state: PostmortemState; event: AppEvent } {
  if (state.saved || !CAUSES.some((c) => c.id === id)) return { state, event: event('noop', 'Sin cambios.', 0) }
  const causes = toggle(state.causes, id)
  return { state: { ...state, causes }, event: event('cause', `Causas: ${causes.length}.`, 0) }
}

export function toggleAction(state: PostmortemState, id: string): { state: PostmortemState; event: AppEvent } {
  if (state.saved || !ACTIONS.some((a) => a.id === id)) return { state, event: event('noop', 'Sin cambios.', 0) }
  const actions = toggle(state.actions, id)
  return { state: { ...state, actions }, event: event('action', `Acciones: ${actions.length}.`, 0) }
}

const allGood = (items: Item[], chosen: string[]) => items.filter((i) => i.good).every((i) => chosen.includes(i.id)) && items.filter((i) => chosen.includes(i.id)).every((i) => i.good)

export function evaluatePostmortem(state: PostmortemState) {
  const blame = CAUSES.some((c) => !c.good && state.causes.includes(c.id))
  return { complete: state.causes.length > 0 && state.actions.length > 0, causesOk: allGood(CAUSES, state.causes), actionsOk: allGood(ACTIONS, state.actions), blame }
}

export function savePostmortem(state: PostmortemState): { state: PostmortemState; event: AppEvent } {
  const r = evaluatePostmortem(state)
  if (state.saved || !r.complete) return { state, event: event('noop', 'Elige causas y acciones.', 0) }
  const flags = ['pm.saved']
  if (r.causesOk) flags.push('pm.causes')
  if (r.actionsOk) flags.push('pm.actions')
  if (r.blame) flags.push('pm.blame')
  if (r.causesOk && r.actionsOk) flags.push('pm.ok')
  return { state: { ...state, saved: true }, event: event('save', `Borrador del postmortem: ${state.causes.length} causas y ${state.actions.length} acciones.`, 30, flags) }
}
