import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

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

const TIMELINE_EN: { when: string; what: string }[] = [
  { when: 'Tuesday', what: 'Pablo (Payments QA) opens PAG-412: “If the payment network retries an order, the transfer could be duplicated. There is no environment to test it”. Medium priority.' },
  { when: 'Thursday', what: 'Product asks to ship the release on Friday for the campaign. Pablo signs “with known risk, see PAG-412”. Nobody else reviews the ticket.' },
  { when: 'Friday 6:00 PM', what: 'Full release of instant transfers, without gradual rollout.' },
  { when: 'Saturday 2:00 AM', what: 'Due to latency, the payment network retries orders: 3,200 duplicated transfers. No alert fires.' },
  { when: 'Sunday 10:00 AM', what: 'Customers talk about it on social media. The platform on-call detects it from social media, not from the systems.' },
  { when: 'Monday', what: 'Business press and a regulator request: preliminary report within 72 hours.' },
]

const CAUSES_EN: Record<string, [string, string]> = {
  gate: ['QA is the only gate: signing “with known risk” does not oblige anyone with authority to decide on that risk.', 'The root cause: the risk was known and nobody who could accept it decided.'],
  env: ['There is no environment that simulates the payment network retries.', 'The risk could not be tested.'],
  monitor: ['There is no alert for duplicated transfers in production.', 'It took eight hours to find out, and through social media.'],
  deploy: ['Full release on a Friday afternoon, without gradual rollout.', 'All the impact at once and with the weekend ahead.'],
  idempotency: ['The API design does not guarantee idempotency on retries.', 'The original technical failure.'],
  pablo: ['Pablo signed the release.', 'It points at a person who did what the system asked of him, and who also warned.'],
  marta: ['Product pushed to ship on Friday.', 'Pushing for a date is their job; the problem is that there was no mechanism to decide the risk.'],
  dev: ['The developer did not program it well.', 'It blames a person instead of asking why the design allowed it.'],
}

const ACTIONS_EN: Record<string, [string, string]> = {
  risk_owner: ["The known risks of a release are accepted in writing by their business owner, not QA. QA informs; the business decides.", 'QA stops being the only gate.'],
  retry_env: ['Payment network simulator with retries and latency in the test environment.', 'What could not be tested can now be.'],
  alert: ['Production alert for duplicated transfers, with on-call.', 'Detect in minutes, not through social media.'],
  canary: ['Mandatory gradual rollout in payments and no full releases on Fridays.', 'It limits the impact if something fails.'],
  idem: ['Mandatory idempotency in the payments APIs, as an architecture standard.', 'It tackles the original technical failure.'],
  double_signoff: ['Two QAs must sign each payments release.', 'It reinforces the gate instead of sharing responsibility.'],
  sanction: ['Disciplinary sanction for whoever signed.', 'It teaches everyone not to warn.'],
  freeze: ['Freeze payments releases for three months.', 'It slows the business without changing the system that failed.'],
}

export function timelineFor(lang: AcademyLang = 'es') {
  return lang === 'en' ? TIMELINE_EN : TIMELINE
}
export function causesFor(lang: AcademyLang = 'es'): Item[] {
  return lang === 'en' ? CAUSES.map((c) => ({ ...c, text: CAUSES_EN[c.id][0], why: CAUSES_EN[c.id][1] })) : CAUSES
}
export function actionsFor(lang: AcademyLang = 'es'): Item[] {
  return lang === 'en' ? ACTIONS.map((a) => ({ ...a, text: ACTIONS_EN[a.id][0], why: ACTIONS_EN[a.id][1] })) : ACTIONS
}

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

export function toggleCause(state: PostmortemState, id: string, lang: AcademyLang = 'es'): { state: PostmortemState; event: AppEvent } {
  if (state.saved || !CAUSES.some((c) => c.id === id)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  const causes = toggle(state.causes, id)
  return { state: { ...state, causes }, event: event('cause', tr(lang, `Causas: ${causes.length}.`, `Causes: ${causes.length}.`), 0) }
}

export function toggleAction(state: PostmortemState, id: string, lang: AcademyLang = 'es'): { state: PostmortemState; event: AppEvent } {
  if (state.saved || !ACTIONS.some((a) => a.id === id)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  const actions = toggle(state.actions, id)
  return { state: { ...state, actions }, event: event('action', tr(lang, `Acciones: ${actions.length}.`, `Actions: ${actions.length}.`), 0) }
}

const allGood = (items: Item[], chosen: string[]) => items.filter((i) => i.good).every((i) => chosen.includes(i.id)) && items.filter((i) => chosen.includes(i.id)).every((i) => i.good)

export function evaluatePostmortem(state: PostmortemState) {
  const blame = CAUSES.some((c) => !c.good && state.causes.includes(c.id))
  return { complete: state.causes.length > 0 && state.actions.length > 0, causesOk: allGood(CAUSES, state.causes), actionsOk: allGood(ACTIONS, state.actions), blame }
}

export function savePostmortem(state: PostmortemState, lang: AcademyLang = 'es'): { state: PostmortemState; event: AppEvent } {
  const r = evaluatePostmortem(state)
  if (state.saved || !r.complete) return { state, event: event('noop', tr(lang, 'Elige causas y acciones.', 'Choose causes and actions.'), 0) }
  const flags = ['pm.saved']
  if (r.causesOk) flags.push('pm.causes')
  if (r.actionsOk) flags.push('pm.actions')
  if (r.blame) flags.push('pm.blame')
  if (r.causesOk && r.actionsOk) flags.push('pm.ok')
  return { state: { ...state, saved: true }, event: event('save', tr(lang, `Borrador del postmortem: ${state.causes.length} causas y ${state.actions.length} acciones.`, `Postmortem draft: ${state.causes.length} causes and ${state.actions.length} actions.`), 30, flags) }
}
