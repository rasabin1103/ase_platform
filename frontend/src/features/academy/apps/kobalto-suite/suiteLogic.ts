import type { AppEvent } from '../../engine/types'

/**
 * App «Suite» del curso 4, misión 2 (La suite que nadie mira): los ocho tests
 * que ponen en rojo el pipeline de Tarjetas. Hay que investigar por qué falla
 * cada uno antes de decidir qué hacer con él, y publicar un informe con el
 * squad dueño de cada test. Evaluación determinista.
 */

export type Decision = 'fix' | 'quarantine' | 'delete' | 'report_bug' | 'leave'

export interface FlakyTest {
  id: string
  name: string
  squad: string
  /** % de ejecuciones en rojo en los últimos 30 días. */
  failRate: number
  durationMin: number
  /** Bugs reales que ha detectado en el último año. */
  bugsFound: number
  /** Causa que aparece al investigar. */
  cause: string
  correct: Decision
  why: string
  /** Minutos que cuesta arreglarlo (si la decisión es arreglar). */
  fixCost: number
}

export const TESTS: FlakyTest[] = [
  { id: 'T1', name: 'transferencia_e2e_checkout', squad: 'Pagos', failRate: 18, durationMin: 3, bugsFound: 4, cause: 'Usa esperas fijas (sleep de 2 s). Cuando staging va lento, el botón aún no está y el test falla.', correct: 'fix', why: 'Fallo del test, no del producto: se arregla esperando a la condición en vez de a un tiempo fijo. Detecta bugs reales, merece la pena.', fixCost: 30 },
  { id: 'T2', name: 'tarjetas_limite_concurrente', squad: 'Tarjetas', failRate: 12, durationMin: 2, bugsFound: 1, cause: 'Al revisar los fallos, el producto deja superar el límite cuando dos pagos llegan a la vez. No falla el test: falla la app, de vez en cuando.', correct: 'report_bug', why: 'No es un test inestable: es un bug intermitente real (condición de carrera). Silenciarlo o reintentarlo lo escondería.', fixCost: 0 },
  { id: 'T3', name: 'login_otp_sms', squad: 'Onboarding', failRate: 25, durationMin: 4, bugsFound: 2, cause: 'Depende del sandbox del proveedor de SMS, que se cae a menudo.', correct: 'fix', why: 'Una dependencia externa no debe tumbar el pipeline: se simula el proveedor y se deja una prueba real aparte, fuera del camino crítico.', fixCost: 45 },
  { id: 'T4', name: 'extractos_pdf', squad: 'Cuentas', failRate: 8, durationMin: 2, bugsFound: 3, cause: 'Comparte la cuenta de prueba con otro test que la borra al terminar. Si se ejecutan a la vez, falla.', correct: 'fix', why: 'Datos de prueba compartidos: cada test crea y limpia sus propios datos.', fixCost: 30 },
  { id: 'T5', name: 'banner_promo_verano', squad: 'Marketing', failRate: 30, durationMin: 1, bugsFound: 0, cause: 'Busca un banner de una promoción que se retiró hace seis meses.', correct: 'delete', why: 'Prueba una funcionalidad que ya no existe: se borra.', fixCost: 0 },
  { id: 'T6', name: 'tipos_cambio_diarios', squad: 'Pagos', failRate: 10, durationMin: 1, bugsFound: 2, cause: 'Falla cuando se ejecuta entre las 00:00 y la 01:00: compara la fecha en hora local con la del servidor en UTC.', correct: 'fix', why: 'Fallo del test por zona horaria: se arregla fijando la fecha y la zona en el test.', fixCost: 20 },
  { id: 'T7', name: 'onboarding_kyc_completo', squad: 'Onboarding', failRate: 15, durationMin: 14, bugsFound: 5, cause: 'El servicio de verificación de identidad de staging tarda a veces más de 10 minutos. Arreglarlo bien (un doble del servicio) lleva una semana.', correct: 'quarantine', why: 'Muy valioso y caro de arreglar ahora: fuera del pipeline que bloquea, pero ejecutándose cada noche, con ticket, dueño y fecha.', fixCost: 0 },
  { id: 'T8', name: 'notificaciones_push_todas', squad: 'Notificaciones', failRate: 5, durationMin: 6, bugsFound: 0, cause: 'Repite lo que ya cubren otros tres tests más rápidos y no ha encontrado ningún bug en un año.', correct: 'delete', why: 'Duplicado y sin valor: cuesta tiempo y ruido, se borra.', fixCost: 0 },
]

export const DECISION_LABEL: Record<Decision, string> = {
  fix: 'Arreglar el test',
  quarantine: 'Cuarentena (fuera del pipeline, con ticket y dueño)',
  delete: 'Borrar el test',
  report_bug: 'Reportar un bug al squad',
  leave: 'Dejarlo como está',
}

/** Coste en minutos de aplicar una decisión. */
export function decisionCost(t: FlakyTest, d: Decision): number {
  if (d === 'fix') return t.fixCost || 60
  if (d === 'quarantine' || d === 'report_bug') return 10
  if (d === 'delete') return 5
  return 0
}

export const INVESTIGATE_COST = 10
export const BASELINE_GREEN = 60

export interface SuiteState {
  investigated: string[]
  decisions: Record<string, Decision | ''>
  applied: boolean
  reported: boolean
}

export const INITIAL_SUITE: SuiteState = { investigated: [], decisions: {}, applied: false, reported: false }

const APP = 'kobalto-suite'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `suite.${action}`, status: 'ok', bugs: [], cost, flags }
}

export function investigate(state: SuiteState, id: string): { state: SuiteState; event: AppEvent } {
  const t = TESTS.find((x) => x.id === id)
  if (!t || state.investigated.includes(id)) return { state, event: event('noop', 'Ya investigado.', 0) }
  const investigated = [...state.investigated, id]
  const flags = [`suite.inv.${id}`]
  if (investigated.length >= 6) flags.push('suite.analyzed')
  return { state: { ...state, investigated }, event: event('investigate', `${t.name}: ${t.cause}`, INVESTIGATE_COST, flags) }
}

export function decide(state: SuiteState, id: string, d: Decision | ''): { state: SuiteState; event: AppEvent } {
  if (state.applied || !state.investigated.includes(id)) return { state, event: event('noop', 'Investiga antes el test.', 0) }
  return { state: { ...state, decisions: { ...state.decisions, [id]: d } }, event: event('decide', `${id}: ${d ? DECISION_LABEL[d] : '—'}.`, 0) }
}

/** % estimado de ejecuciones en verde del pipeline si se aplican las decisiones. */
export function projectedGreen(decisions: Record<string, Decision | ''>): number {
  let red = 100 - BASELINE_GREEN
  const total = TESTS.reduce((n, t) => n + t.failRate, 0)
  for (const t of TESTS) {
    const d = decisions[t.id]
    // Un bug reportado se arregla en el squad; lo demás deja de poner en rojo el pipeline salvo «dejar».
    if (d && d !== 'leave') red -= (t.failRate / total) * (100 - BASELINE_GREEN)
  }
  return Math.round(Math.max(0, Math.min(100, 100 - red)) * 10) / 10
}

export function evaluateDecisions(decisions: Record<string, Decision | ''>) {
  const right = TESTS.filter((t) => decisions[t.id] === t.correct).length
  const t2 = decisions.T2
  return {
    right,
    complete: TESTS.every((t) => !!decisions[t.id]),
    bugHidden: t2 === 'quarantine' || t2 === 'delete' || t2 === 'leave' || t2 === 'fix',
    valuableDeleted: TESTS.some((t) => t.bugsFound > 0 && decisions[t.id] === 'delete'),
    left: TESTS.some((t) => decisions[t.id] === 'leave'),
  }
}

export function applyDecisions(state: SuiteState): { state: SuiteState; event: AppEvent } {
  const r = evaluateDecisions(state.decisions)
  if (state.applied || !r.complete) return { state, event: event('noop', 'Decide antes qué hacer con los ocho tests.', 0) }
  const cost = TESTS.reduce((n, t) => n + decisionCost(t, state.decisions[t.id] as Decision), 0)
  const flags = ['suite.applied']
  if (r.right === TESTS.length) flags.push('suite.ok')
  if (state.decisions.T2 === 'report_bug') flags.push('suite.bug_reported')
  if (r.bugHidden) flags.push('suite.bug_hidden')
  if (r.valuableDeleted) flags.push('suite.valuable_deleted')
  if (state.decisions.T7 === 'quarantine') flags.push('suite.quarantine_ok')
  return {
    state: { ...state, applied: true },
    event: event('apply', `Decisiones aplicadas: ${r.right} de ${TESTS.length} adecuadas. Pipeline estimado en verde: ${projectedGreen(state.decisions)} %.`, cost, flags),
  }
}

export function publishReport(state: SuiteState): { state: SuiteState; event: AppEvent } {
  if (state.reported || state.investigated.length < TESTS.length) return { state, event: event('noop', 'Investiga antes los ocho tests.', 0) }
  return { state: { ...state, reported: true }, event: event('report', 'Informe de salud de la suite publicado: causa, decisión y squad dueño de cada test.', 15, ['report.published']) }
}
