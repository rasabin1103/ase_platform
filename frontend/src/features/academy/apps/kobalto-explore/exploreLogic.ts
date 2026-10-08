import type { AppEvent } from '../../engine/types'

/**
 * App del curso 2, misión 4: sesiones exploratorias con charter y ataques de
 * predicción de errores sobre el panel de «Tarjetas de equipo» (CTFL 4.4).
 * Cada ataque es una combinación área × ataque; algunas destapan bugs.
 */

export type AreaId = 'alta' | 'limites' | 'congelar' | 'invitar' | 'exportar'
export type AttackId = 'empty' | 'bounds' | 'special' | 'double' | 'back' | 'session' | 'concurrency' | 'duplicate'

export const AREAS: { id: AreaId; label: string; note: string; isNew?: boolean }[] = [
  { id: 'alta', label: 'Alta de tarjeta', note: 'Formulario: empleado, email y límite mensual.' },
  { id: 'limites', label: 'Cambio de límite', note: 'Subir o bajar el límite de una tarjeta.' },
  { id: 'congelar', label: 'Congelar / descongelar', note: 'Nuevo en el panel: antes solo desde la app móvil.', isNew: true },
  { id: 'invitar', label: 'Invitar empleado por email', note: 'Nuevo: el empleado activa su tarjeta desde el email.', isNew: true },
  { id: 'exportar', label: 'Exportar gastos (CSV)', note: 'Nuevo: descarga de los gastos del mes.', isNew: true },
]

export const ATTACKS: { id: AttackId; label: string; how: string }[] = [
  { id: 'empty', label: 'Campos vacíos', how: 'Dejar campos obligatorios en blanco o con espacios.' },
  { id: 'bounds', label: 'Valores límite y fuera de rango', how: '0, negativos, decimales raros, importes enormes.' },
  { id: 'special', label: 'Caracteres especiales', how: 'Tildes, ñ, emojis, comillas, punto y coma.' },
  { id: 'double', label: 'Doble clic / envío repetido', how: 'Pulsar dos veces el botón de confirmar.' },
  { id: 'back', label: 'Volver atrás / recargar', how: 'Navegar hacia atrás o recargar a mitad de una operación.' },
  { id: 'session', label: 'Sesión caducada', how: 'Dejar caducar la sesión y confirmar la operación después.' },
  { id: 'concurrency', label: 'Dos administradores a la vez', how: 'La misma operación desde dos navegadores.' },
  { id: 'duplicate', label: 'Datos duplicados', how: 'Repetir el mismo email o el mismo empleado.' },
]

interface Finding {
  bug?: string
  text: string
}

/** Resultado de cada combinación área × ataque. Lo que no está aquí se comporta bien. */
const FINDINGS: Partial<Record<`${AreaId}:${AttackId}`, Finding>> = {
  'alta:double': { bug: 'X-DOBLE', text: 'Doble clic en «Crear tarjeta»: aparecen DOS tarjetas para la misma empleada, ambas activas.' },
  'alta:special': { bug: 'X-TILDE', text: 'Empleada «Begoña Muñoz»: la tarjeta virtual muestra «Bego�a Mu�oz».' },
  'alta:empty': { text: 'Sin nombre o sin email, el formulario no deja continuar y marca el campo. Correcto.' },
  'alta:bounds': { text: 'Límite 0 € o mayor de 10.000 €: mensaje «Límite entre 1 y 10.000 €». Correcto.' },
  'limites:bounds': { bug: 'X-NEG', text: 'Límite de −100 € aceptado. La tarjeta queda con «Límite: sin límite» y deja pagar 2.500 €.' },
  'limites:empty': { text: 'Límite en blanco: no deja guardar. Correcto.' },
  'limites:concurrency': { text: 'Dos admins cambian el límite: gana el último y queda en el historial. Aceptable.' },
  'congelar:session': { bug: 'X-SESION', text: 'Con la sesión caducada, «Congelar» muestra «Tarjeta congelada ✓»… pero la tarjeta sigue aceptando pagos.' },
  'congelar:double': { text: 'Doble clic en «Congelar»: la tarjeta queda congelada una vez. Correcto.' },
  'congelar:back': { text: 'Volver atrás tras congelar: el estado se mantiene. Correcto.' },
  'invitar:duplicate': { bug: 'X-INVITA', text: 'Invitar dos veces a «ana@pyme.es»: se crean dos empleadas «Ana» con dos tarjetas.' },
  'invitar:empty': { text: 'Email vacío: «Introduce un email válido». Correcto.' },
  'invitar:special': { text: 'Email con mayúsculas y tildes en el nombre: la invitación llega bien. Correcto.' },
  'exportar:special': { bug: 'X-CSV', text: 'Un gasto con concepto «Comida; equipo» rompe las columnas del CSV: el importe aparece en la columna de fecha.' },
  'exportar:empty': { text: 'Mes sin gastos: el CSV sale solo con la cabecera. Correcto.' },
}

export const CHECKLIST: { area: AreaId; attack: AttackId }[] = [
  { area: 'alta', attack: 'empty' },
  { area: 'alta', attack: 'bounds' },
  { area: 'limites', attack: 'empty' },
]

export interface Charter {
  areas: AreaId[]
  focus: string
  timebox: number
}

export interface Observation {
  at: number
  area: AreaId
  attack: AttackId
  text: string
  bug?: string
  inSession: boolean
}

export interface Session {
  charter: Charter
  started: number
  used: number
  closed: boolean
  reported: boolean
}

export interface ExploreState {
  sessions: Session[]
  observations: Observation[]
  checklistRun: boolean
  checklistAdded: AttackId[]
}

export const INITIAL_EXPLORE: ExploreState = { sessions: [], observations: [], checklistRun: false, checklistAdded: [] }

export const ATTACK_COST = 10
export const FREE_ATTACK_COST = 15
export const TIMEBOXES = [30, 60, 90]
export const FOCUS_OPTIONS = [
  'Descubrir fallos de pérdida de control sobre el dinero (tarjetas que pagan cuando no deberían)',
  'Descubrir datos corruptos o duplicados',
  'Comprobar que la interfaz es bonita',
]

export const openSession = (s: ExploreState): Session | undefined => {
  const last = s.sessions[s.sessions.length - 1]
  return last && !last.closed ? last : undefined
}

function finding(area: AreaId, attack: AttackId): Finding {
  return FINDINGS[`${area}:${attack}`] ?? { text: `${ATTACKS.find((a) => a.id === attack)!.label} en «${AREAS.find((a) => a.id === area)!.label}»: nada raro.` }
}

export function startSession(state: ExploreState, charter: Charter): { state: ExploreState; event: AppEvent } {
  const areas = charter.areas.slice(0, 2)
  const c: Charter = { areas, focus: charter.focus, timebox: TIMEBOXES.includes(charter.timebox) ? charter.timebox : 60 }
  const flags = ['charter.used']
  if (areas.length > 0 && areas.every((a) => AREAS.find((x) => x.id === a)?.isNew)) flags.push('charter.risk')
  if (c.focus === FOCUS_OPTIONS[0]) flags.push('charter.focus')
  const names = areas.map((a) => AREAS.find((x) => x.id === a)!.label).join(' y ')
  return {
    state: { ...state, sessions: [...state.sessions, { charter: c, started: -1, used: 0, closed: false, reported: false }] },
    event: {
      app: 'kobalto-explore',
      action: 'start_session',
      summary: `Charter: explorar ${names} con ataques de predicción de errores para «${c.focus}». Duración: ${c.timebox} min.`,
      technical: `explore.charter ${JSON.stringify(c)}`,
      status: 'ok',
      bugs: [],
      cost: 5,
      flags,
    },
  }
}

export function attack(state: ExploreState, area: AreaId, atk: AttackId, clock: number): { state: ExploreState; event: AppEvent } {
  const session = openSession(state)
  const inSession = !!session && session.charter.areas.includes(area) && session.used + ATTACK_COST <= session.charter.timebox
  const f = finding(area, atk)
  const obs: Observation = { at: clock, area, attack: atk, text: f.text, bug: f.bug, inSession }
  let sessions = state.sessions
  if (inSession && session) {
    sessions = state.sessions.map((s) => (s === session ? { ...s, used: s.used + ATTACK_COST } : s))
  }
  const flags = inSession ? [] : ['explore.nocharter']
  return {
    state: { ...state, sessions, observations: [...state.observations, obs] },
    event: {
      app: 'kobalto-explore',
      action: `attack_${area}_${atk}`,
      summary: `${AREAS.find((a) => a.id === area)!.label} · ${ATTACKS.find((a) => a.id === atk)!.label}: ${f.text}`,
      technical: `explore.attack ${area}:${atk}`,
      status: f.bug ? 'error' : 'ok',
      bugs: f.bug ? [f.bug] : [],
      cost: inSession ? ATTACK_COST : FREE_ATTACK_COST,
      flags,
    },
  }
}

export function closeSession(state: ExploreState): { state: ExploreState; event: AppEvent } {
  const session = openSession(state)
  if (!session) {
    return { state, event: { app: 'kobalto-explore', action: 'noop', summary: 'No hay sesión abierta.', technical: 'explore.noop', status: 'ok', bugs: [], cost: 0 } }
  }
  const idx = state.sessions.indexOf(session)
  const fromIdx = state.sessions.slice(0, idx).length
  const obs = state.observations.filter((o) => o.inSession && session.charter.areas.includes(o.area))
  const bugs = Array.from(new Set(obs.filter((o) => o.bug).map((o) => o.bug as string)))
  const tested = Array.from(new Set(obs.map((o) => `${o.area}:${o.attack}`))).length
  return {
    state: { ...state, sessions: state.sessions.map((s, i) => (i === idx ? { ...s, closed: true, reported: true } : s)) },
    event: {
      app: 'kobalto-explore',
      action: 'close_session',
      summary: `Informe de la sesión ${fromIdx + 1}: ${session.used} de ${session.charter.timebox} min, ${tested} ataques en ${session.charter.areas.length} área(s), ${bugs.length} posible(s) bug(s) y lo que queda por explorar.`,
      technical: 'explore.session_report',
      status: 'ok',
      bugs: [],
      cost: 10,
      flags: ['session.report'],
    },
  }
}

export function runChecklist(state: ExploreState, clock: number): { state: ExploreState; event: AppEvent } {
  const obs: Observation[] = CHECKLIST.map(({ area, attack: atk }) => {
    const f = finding(area, atk)
    return { at: clock, area, attack: atk, text: f.text, bug: f.bug, inSession: false }
  })
  const bugs = Array.from(new Set(obs.filter((o) => o.bug).map((o) => o.bug as string)))
  return {
    state: { ...state, checklistRun: true, observations: [...state.observations, ...obs] },
    event: {
      app: 'kobalto-explore',
      action: 'checklist',
      summary: `Checklist del equipo (3 puntos): ${obs.map((o) => o.text).join(' ')}`,
      technical: 'explore.checklist',
      status: bugs.length ? 'error' : 'ok',
      bugs,
      cost: 20,
      flags: ['checklist.run'],
    },
  }
}

export function improveChecklist(state: ExploreState, attacks: AttackId[]): { state: ExploreState; event: AppEvent } {
  const useful = new Set(state.observations.filter((o) => o.bug).map((o) => o.attack))
  const added = attacks.filter((a) => ATTACKS.some((x) => x.id === a))
  const hits = added.filter((a) => useful.has(a)).length
  const flags = ['checklist.updated']
  if (hits >= 2) flags.push('checklist.improved')
  return {
    state: { ...state, checklistAdded: added },
    event: {
      app: 'kobalto-explore',
      action: 'improve_checklist',
      summary: `Checklist del equipo ampliada con: ${added.map((a) => ATTACKS.find((x) => x.id === a)!.label).join(', ') || 'nada'}.`,
      technical: 'explore.checklist_update',
      status: 'ok',
      bugs: [],
      cost: 10,
      flags,
    },
  }
}
