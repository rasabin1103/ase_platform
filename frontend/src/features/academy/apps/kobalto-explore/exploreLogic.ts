import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'

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

const AREAS_EN: Record<AreaId, { label: string; note: string }> = {
  alta: { label: 'Card creation', note: 'Form: employee, email and monthly limit.' },
  limites: { label: 'Limit change', note: "Raise or lower a card's limit." },
  congelar: { label: 'Freeze / unfreeze', note: 'New in the panel: previously only from the mobile app.' },
  invitar: { label: 'Invite employee by email', note: 'New: the employee activates their card from the email.' },
  exportar: { label: 'Export expenses (CSV)', note: "New: download of the month's expenses." },
}

const ATTACKS_EN: Record<AttackId, { label: string; how: string }> = {
  empty: { label: 'Empty fields', how: 'Leave required fields blank or filled with spaces.' },
  bounds: { label: 'Boundary and out-of-range values', how: '0, negatives, odd decimals, huge amounts.' },
  special: { label: 'Special characters', how: 'Accents, ñ, emojis, quotes, semicolons.' },
  double: { label: 'Double click / repeated submission', how: 'Press the confirm button twice.' },
  back: { label: 'Go back / reload', how: 'Navigate back or reload in the middle of an operation.' },
  session: { label: 'Expired session', how: 'Let the session expire and confirm the operation afterwards.' },
  concurrency: { label: 'Two admins at once', how: 'The same operation from two browsers.' },
  duplicate: { label: 'Duplicate data', how: 'Repeat the same email or the same employee.' },
}

/** Áreas en el idioma de la misión (mismos ids y orden que AREAS). */
export function areasFor(lang: AcademyLang = 'es'): typeof AREAS {
  return lang === 'en' ? AREAS.map((a) => ({ ...a, ...AREAS_EN[a.id] })) : AREAS
}

/** Ataques en el idioma de la misión (mismos ids y orden que ATTACKS). */
export function attacksFor(lang: AcademyLang = 'es'): typeof ATTACKS {
  return lang === 'en' ? ATTACKS.map((a) => ({ ...a, ...ATTACKS_EN[a.id] })) : ATTACKS
}

const areaLabel = (id: AreaId, lang: AcademyLang) => areasFor(lang).find((a) => a.id === id)!.label
const attackLabel = (id: AttackId, lang: AcademyLang) => attacksFor(lang).find((a) => a.id === id)!.label

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

const FINDINGS_EN: Partial<Record<`${AreaId}:${AttackId}`, string>> = {
  'alta:double': 'Double click on "Create card": TWO cards appear for the same employee, both active.',
  'alta:special': 'Employee "Begoña Muñoz": the virtual card shows "Bego�a Mu�oz".',
  'alta:empty': "Without a name or an email, the form won't let you continue and highlights the field. Correct.",
  'alta:bounds': 'Limit of €0 or above €10,000: message "Limit must be between €1 and €10,000". Correct.',
  'limites:bounds': 'A limit of −€100 is accepted. The card ends up with "Limit: no limit" and allows a €2,500 payment.',
  'limites:empty': "Blank limit: it won't let you save. Correct.",
  'limites:concurrency': 'Two admins change the limit: the last one wins and it is recorded in the history. Acceptable.',
  'congelar:session': 'With the session expired, "Freeze" shows "Card frozen ✓"… but the card keeps accepting payments.',
  'congelar:double': 'Double click on "Freeze": the card is frozen once. Correct.',
  'congelar:back': 'Going back after freezing: the state is kept. Correct.',
  'invitar:duplicate': 'Inviting "ana@pyme.es" twice: two employees named "Ana" are created, with two cards.',
  'invitar:empty': 'Empty email: "Enter a valid email". Correct.',
  'invitar:special': 'Email with uppercase letters and accents in the name: the invitation arrives fine. Correct.',
  'exportar:special': 'An expense with the description "Lunch; team" breaks the CSV columns: the amount shows up in the date column.',
  'exportar:empty': 'Month with no expenses: the CSV only has the header row. Correct.',
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

const FOCUS_OPTIONS_EN = [
  "Discover failures that lose control over money (cards that pay when they shouldn't)",
  'Discover corrupt or duplicate data',
  'Check that the interface looks nice',
]

/** Opciones de objetivo en el idioma de la misión. El valor guardado sigue siendo FOCUS_OPTIONS[i]. */
export function focusOptionsFor(lang: AcademyLang = 'es'): string[] {
  return lang === 'en' ? FOCUS_OPTIONS_EN : FOCUS_OPTIONS
}

/** Texto visible de un objetivo guardado (valor de FOCUS_OPTIONS). */
export function focusLabel(focus: string, lang: AcademyLang = 'es'): string {
  const i = FOCUS_OPTIONS.indexOf(focus)
  return i >= 0 ? focusOptionsFor(lang)[i] : focus
}

export const openSession = (s: ExploreState): Session | undefined => {
  const last = s.sessions[s.sessions.length - 1]
  return last && !last.closed ? last : undefined
}

function finding(area: AreaId, attack: AttackId, lang: AcademyLang = 'es'): Finding {
  const key = `${area}:${attack}` as const
  const f = FINDINGS[key]
  if (lang === 'en') {
    return f ? { ...f, text: FINDINGS_EN[key] ?? f.text } : { text: `${attackLabel(attack, lang)} on "${areaLabel(area, lang)}": nothing unusual.` }
  }
  return f ?? { text: `${ATTACKS.find((a) => a.id === attack)!.label} en «${AREAS.find((a) => a.id === area)!.label}»: nada raro.` }
}

export function startSession(state: ExploreState, charter: Charter, lang: AcademyLang = 'es'): { state: ExploreState; event: AppEvent } {
  const areas = charter.areas.slice(0, 2)
  const c: Charter = { areas, focus: charter.focus, timebox: TIMEBOXES.includes(charter.timebox) ? charter.timebox : 60 }
  const flags = ['charter.used']
  if (areas.length > 0 && areas.every((a) => AREAS.find((x) => x.id === a)?.isNew)) flags.push('charter.risk')
  if (c.focus === FOCUS_OPTIONS[0]) flags.push('charter.focus')
  const names = areas.map((a) => areaLabel(a, lang)).join(lang === 'en' ? ' and ' : ' y ')
  return {
    state: { ...state, sessions: [...state.sessions, { charter: c, started: -1, used: 0, closed: false, reported: false }] },
    event: {
      app: 'kobalto-explore',
      action: 'start_session',
      summary:
        lang === 'en'
          ? `Charter: explore ${names} with error guessing attacks to "${focusLabel(c.focus, lang)}". Timebox: ${c.timebox} min.`
          : `Charter: explorar ${names} con ataques de predicción de errores para «${c.focus}». Duración: ${c.timebox} min.`,
      technical: `explore.charter ${JSON.stringify(c)}`,
      status: 'ok',
      bugs: [],
      cost: 5,
      flags,
    },
  }
}

export function attack(state: ExploreState, area: AreaId, atk: AttackId, clock: number, lang: AcademyLang = 'es'): { state: ExploreState; event: AppEvent } {
  const session = openSession(state)
  const inSession = !!session && session.charter.areas.includes(area) && session.used + ATTACK_COST <= session.charter.timebox
  const f = finding(area, atk, lang)
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
      summary: `${areaLabel(area, lang)} · ${attackLabel(atk, lang)}: ${f.text}`,
      technical: `explore.attack ${area}:${atk}`,
      status: f.bug ? 'error' : 'ok',
      bugs: f.bug ? [f.bug] : [],
      cost: inSession ? ATTACK_COST : FREE_ATTACK_COST,
      flags,
    },
  }
}

export function closeSession(state: ExploreState, lang: AcademyLang = 'es'): { state: ExploreState; event: AppEvent } {
  const session = openSession(state)
  if (!session) {
    return { state, event: { app: 'kobalto-explore', action: 'noop', summary: lang === 'en' ? 'There is no open session.' : 'No hay sesión abierta.', technical: 'explore.noop', status: 'ok', bugs: [], cost: 0 } }
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
      summary:
        lang === 'en'
          ? `Session ${fromIdx + 1} report: ${session.used} of ${session.charter.timebox} min, ${tested} attacks on ${session.charter.areas.length} area(s), ${bugs.length} possible bug(s), and what is left to explore.`
          : `Informe de la sesión ${fromIdx + 1}: ${session.used} de ${session.charter.timebox} min, ${tested} ataques en ${session.charter.areas.length} área(s), ${bugs.length} posible(s) bug(s) y lo que queda por explorar.`,
      technical: 'explore.session_report',
      status: 'ok',
      bugs: [],
      cost: 10,
      flags: ['session.report'],
    },
  }
}

export function runChecklist(state: ExploreState, clock: number, lang: AcademyLang = 'es'): { state: ExploreState; event: AppEvent } {
  const obs: Observation[] = CHECKLIST.map(({ area, attack: atk }) => {
    const f = finding(area, atk, lang)
    return { at: clock, area, attack: atk, text: f.text, bug: f.bug, inSession: false }
  })
  const bugs = Array.from(new Set(obs.filter((o) => o.bug).map((o) => o.bug as string)))
  return {
    state: { ...state, checklistRun: true, observations: [...state.observations, ...obs] },
    event: {
      app: 'kobalto-explore',
      action: 'checklist',
      summary: `${lang === 'en' ? 'Team checklist (3 items)' : 'Checklist del equipo (3 puntos)'}: ${obs.map((o) => o.text).join(' ')}`,
      technical: 'explore.checklist',
      status: bugs.length ? 'error' : 'ok',
      bugs,
      cost: 20,
      flags: ['checklist.run'],
    },
  }
}

export function improveChecklist(state: ExploreState, attacks: AttackId[], lang: AcademyLang = 'es'): { state: ExploreState; event: AppEvent } {
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
      summary:
        lang === 'en'
          ? `Team checklist extended with: ${added.map((a) => attackLabel(a, lang)).join(', ') || 'nothing'}.`
          : `Checklist del equipo ampliada con: ${added.map((a) => ATTACKS.find((x) => x.id === a)!.label).join(', ') || 'nada'}.`,
      technical: 'explore.checklist_update',
      status: 'ok',
      bugs: [],
      cost: 10,
      flags,
    },
  }
}
