import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'

/**
 * App del curso 2, misión 6: panel de métricas del sprint (CTFL 5.3 y 1.4).
 * Elegir qué métricas reportar, detectar las lecturas engañosas, redactar
 * el informe de progreso para cada audiencia, decidir acciones de control
 * y cerrar las pruebas del sprint.
 */

const APP = 'kobalto-metrics'

// ------------------------------------------------------- Datos del sprint
/** Lo que muestra el panel a mitad del sprint (día 5 de 10). */
export const SPRINT = {
  day: 5,
  days: 10,
  plannedCases: 120,
  executedCases: 48,
  expectedExecuted: 60,
  passedCases: 48,
  requirements: 20,
  coveredRequirements: 8,
  highRisks: 5,
  highRisksTested: 2,
  defectsOpen: { critical: 1, high: 3, medium: 6, low: 4 },
  defectsClosed: 12,
  closedNotReproducible: 5,
  cardsCasesExecuted: 0,
}

export const PANEL: { id: string; label: string; value: string; hint?: string }[] = [
  { id: 'exec', label: 'Casos ejecutados', value: `${SPRINT.executedCases} de ${SPRINT.plannedCases}`, hint: `Previsto a día ${SPRINT.day}: ${SPRINT.expectedExecuted}` },
  { id: 'pass', label: 'Casos pasados', value: `${SPRINT.passedCases} de ${SPRINT.executedCases} (100 %)` },
  { id: 'req', label: 'Requisitos con pruebas', value: `${SPRINT.coveredRequirements} de ${SPRINT.requirements}` },
  { id: 'risk', label: 'Riesgos altos probados', value: `${SPRINT.highRisksTested} de ${SPRINT.highRisks}`, hint: 'Sin probar: tarjetas congeladas, límites de tarjeta, firma' },
  { id: 'open', label: 'Defectos abiertos', value: `${SPRINT.defectsOpen.critical} crítico · ${SPRINT.defectsOpen.high} altos · ${SPRINT.defectsOpen.medium} medios · ${SPRINT.defectsOpen.low} bajos` },
  { id: 'closed', label: 'Defectos cerrados', value: `${SPRINT.defectsClosed}`, hint: `${SPRINT.closedNotReproducible} cerrados como «no reproducible» sin verificar` },
  { id: 'cards', label: 'Defectos en tarjetas', value: '0', hint: `Casos de tarjetas ejecutados: ${SPRINT.cardsCasesExecuted}` },
]

const PANEL_EN: Record<string, { label: string; value: string; hint?: string }> = {
  exec: { label: 'Cases executed', value: `${SPRINT.executedCases} of ${SPRINT.plannedCases}`, hint: `Planned by day ${SPRINT.day}: ${SPRINT.expectedExecuted}` },
  pass: { label: 'Cases passed', value: `${SPRINT.passedCases} of ${SPRINT.executedCases} (100%)` },
  req: { label: 'Requirements with tests', value: `${SPRINT.coveredRequirements} of ${SPRINT.requirements}` },
  risk: { label: 'High risks tested', value: `${SPRINT.highRisksTested} of ${SPRINT.highRisks}`, hint: 'Untested: frozen cards, card limits, e-signature' },
  open: { label: 'Open defects', value: `${SPRINT.defectsOpen.critical} critical · ${SPRINT.defectsOpen.high} high · ${SPRINT.defectsOpen.medium} medium · ${SPRINT.defectsOpen.low} low` },
  closed: { label: 'Closed defects', value: `${SPRINT.defectsClosed}`, hint: `${SPRINT.closedNotReproducible} closed as "not reproducible" without verification` },
  cards: { label: 'Defects in cards', value: '0', hint: `Card cases executed: ${SPRINT.cardsCasesExecuted}` },
}

/** Indicadores del panel en el idioma de la misión (mismos ids que PANEL). */
export function panelFor(lang: AcademyLang = 'es'): typeof PANEL {
  return lang === 'en' ? PANEL.map((k) => ({ ...k, ...PANEL_EN[k.id] })) : PANEL
}

/** En inglés, sustituye los textos de cada elemento (por id) conservando el resto de campos. */
function localize<T extends { id: string }>(list: T[], en: Record<string, Partial<T>>, lang: AcademyLang): T[] {
  return lang === 'en' ? list.map((x) => ({ ...x, ...en[x.id] })) : list
}

// --------------------------------------------------------------- Métricas
export const METRICS: { id: string; label: string; useful: boolean; why: string }[] = [
  { id: 'progress', label: 'Avance de ejecución frente a lo planificado', useful: true, why: 'Dice si llegamos a tiempo.' },
  { id: 'reqcov', label: 'Cobertura de requisitos', useful: true, why: 'Dice qué parte del producto tiene pruebas.' },
  { id: 'defects', label: 'Defectos abiertos por severidad y estado', useful: true, why: 'Dice cuánta calidad falta y dónde.' },
  { id: 'residual', label: 'Riesgo residual: riesgos altos sin probar', useful: true, why: 'Es lo que dirección asume si sale hoy.' },
  { id: 'volume', label: 'Número total de casos ejecutados', useful: false, why: 'Es volumen: sin compararlo con el plan no dice nada.' },
  { id: 'passrate', label: 'Porcentaje de casos pasados, sin más contexto', useful: false, why: 'Un 100 % sobre la mitad de los requisitos engaña.' },
  { id: 'loc', label: 'Líneas de código escritas por desarrollo', useful: false, why: 'No mide la calidad ni el avance de las pruebas.' },
  { id: 'perperson', label: 'Defectos encontrados por persona del equipo', useful: false, why: 'Fomenta la competición y el reproche, no la calidad.' },
]

const METRICS_EN: Record<string, { label: string; why: string }> = {
  progress: { label: 'Execution progress against the plan', why: "Tells us whether we'll make it on time." },
  reqcov: { label: 'Requirements coverage', why: 'Tells us which part of the product has tests.' },
  defects: { label: 'Open defects by severity and status', why: 'Tells us how much quality is missing and where.' },
  residual: { label: 'Residual risk: untested high risks', why: 'It is what management accepts if we ship today.' },
  volume: { label: 'Total number of cases executed', why: "It's volume: without comparing it to the plan, it says nothing." },
  passrate: { label: 'Percentage of cases passed, with no other context', why: '100% over half of the requirements is misleading.' },
  loc: { label: 'Lines of code written by development', why: 'It measures neither quality nor test progress.' },
  perperson: { label: 'Defects found per team member', why: 'It encourages competition and blame, not quality.' },
}

/** Métricas en el idioma de la misión (mismos ids y utilidad que METRICS). */
export const metricsFor = (lang: AcademyLang = 'es'): typeof METRICS => localize(METRICS, METRICS_EN, lang)

// ------------------------------------------------------------- Engañosas
export type Reading = 'reliable' | 'misleading'
export const READINGS: { id: string; text: string; kind: Reading; why: string }[] = [
  { id: 'L1', text: '«El 100 % de los casos ejecutados ha pasado.»', kind: 'misleading', why: 'Solo cubren 8 de los 20 requisitos.' },
  { id: 'L2', text: '«Esta semana se han cerrado 12 defectos.»', kind: 'misleading', why: '5 se cerraron como «no reproducible» sin verificar.' },
  { id: 'L3', text: '«Llevamos el 40 % de los casos con el 50 % del sprint consumido.»', kind: 'reliable', why: 'Compara el avance real con el plan.' },
  { id: 'L4', text: '«Hay 1 defecto crítico abierto en las facturas recurrentes.»', kind: 'reliable', why: 'Dato concreto ligado al riesgo.' },
  { id: 'L5', text: '«Tarjetas es el módulo más estable: 0 defectos.»', kind: 'misleading', why: 'No se ha ejecutado ningún caso de tarjetas.' },
]

const READINGS_EN: Record<string, { text: string; why: string }> = {
  L1: { text: '"100% of the executed cases have passed."', why: 'They only cover 8 of the 20 requirements.' },
  L2: { text: '"12 defects were closed this week."', why: '5 were closed as "not reproducible" without verification.' },
  L3: { text: '"We are at 40% of the cases with 50% of the sprint used up."', why: 'It compares actual progress with the plan.' },
  L4: { text: '"There is 1 critical defect open in recurring invoices."', why: 'A concrete figure tied to risk.' },
  L5: { text: '"Cards is the most stable module: 0 defects."', why: 'Not a single card case has been executed.' },
}

/** Lecturas en el idioma de la misión (mismos ids y tipo que READINGS). */
export const readingsFor = (lang: AcademyLang = 'es'): typeof READINGS => localize(READINGS, READINGS_EN, lang)

// ---------------------------------------------------------------- Informes
export const MGMT_DRAFTS: { id: string; text: string; kind: 'good' | 'detail' | 'makeup' }[] = [
  {
    id: 'detail',
    kind: 'detail',
    text: 'Adjunto la tabla de los 48 casos ejecutados con su resultado, los logs de cada ejecución y la lista completa de defectos.',
  },
  {
    id: 'makeup',
    kind: 'makeup',
    text: 'Estado: verde. El 100 % de los casos ejecutados ha pasado y esta semana hemos cerrado 12 defectos.',
  },
  {
    id: 'good',
    kind: 'good',
    text: 'Estado: ámbar. Llevamos el 40 % de la ejecución frente al 50 % previsto y 8 de 20 requisitos tienen pruebas. Hay 1 defecto crítico abierto en facturas y 3 de 5 riesgos altos sin probar (tarjetas y firma). Si no cambiamos nada, no llegamos al criterio de salida: propongo repriorizar y necesito una decisión sobre el alcance.',
  },
]

export const TEAM_DRAFTS: { id: string; text: string; ok: boolean }[] = [
  { id: 'light', text: 'Vamos en ámbar. Ánimo, equipo.', ok: false },
  {
    id: 'detail',
    text: 'Casos pendientes por módulo y responsable, defectos abiertos asignados con su severidad, bloqueo del entorno de staging y prioridades de mañana: primero tarjetas.',
    ok: true,
  },
  { id: 'rank', text: 'Ranking de defectos encontrados por cada persona del equipo.', ok: false },
]

const MGMT_DRAFTS_EN: Record<string, { text: string }> = {
  detail: { text: 'Attached is the table of the 48 executed cases with their results, the logs of each run and the full list of defects.' },
  makeup: { text: 'Status: green. 100% of the executed cases have passed and we closed 12 defects this week.' },
  good: {
    text: "Status: amber. We are at 40% of execution against the planned 50%, and 8 of 20 requirements have tests. There is 1 critical defect open in invoices and 3 of 5 high risks are untested (cards and e-signature). If nothing changes, we won't meet the exit criteria: I propose reprioritizing and I need a decision on scope.",
  },
}

const TEAM_DRAFTS_EN: Record<string, { text: string }> = {
  light: { text: "We're at amber. Keep it up, team." },
  detail: { text: "Pending cases by module and owner, open defects assigned with their severity, the staging environment blocker, and tomorrow's priorities: cards first." },
  rank: { text: 'Ranking of defects found by each team member.' },
}

/** Borradores de informe en el idioma de la misión (mismos ids y tipo). */
export const mgmtDraftsFor = (lang: AcademyLang = 'es'): typeof MGMT_DRAFTS => localize(MGMT_DRAFTS, MGMT_DRAFTS_EN, lang)
export const teamDraftsFor = (lang: AcademyLang = 'es'): typeof TEAM_DRAFTS => localize(TEAM_DRAFTS, TEAM_DRAFTS_EN, lang)

// ----------------------------------------------------------------- Control
export const ACTIONS: { id: string; label: string; good: boolean }[] = [
  { id: 'reprio', label: 'Repriorizar: tarjetas (riesgo alto) antes que la exportación CSV y el idioma.', good: true },
  { id: 'reopen', label: 'Reabrir los 5 «no reproducible» y pedir pasos y entorno para reproducirlos.', good: true },
  { id: 'renegotiate', label: 'Renegociar con Raúl y Elena el alcance o el criterio de salida si no se llega.', good: true },
  { id: 'resources', label: 'Pedir a Iván un entorno de staging propio y que Sofía apoye en la ejecución.', good: true },
  { id: 'hidelow', label: 'Dejar de registrar los defectos de severidad baja para que el gráfico mejore.', good: false },
  { id: 'overtime', label: 'Alargar la jornada del equipo sin cambiar nada más.', good: false },
  { id: 'markpass', label: 'Marcar como pasados los casos bloqueados para cumplir el avance.', good: false },
]

const ACTIONS_EN: Record<string, { label: string }> = {
  reprio: { label: 'Reprioritize: cards (high risk) before the CSV export and the language setting.' },
  reopen: { label: 'Reopen the 5 "not reproducible" defects and ask for steps and environment to reproduce them.' },
  renegotiate: { label: "Renegotiate the scope or the exit criteria with Raúl and Elena if we can't make it." },
  resources: { label: 'Ask Iván for a dedicated staging environment and for Sofía to help with execution.' },
  hidelow: { label: 'Stop logging low-severity defects so the chart looks better.' },
  overtime: { label: "Extend the team's working day without changing anything else." },
  markpass: { label: 'Mark blocked cases as passed to hit the progress target.' },
}

/** Acciones de control en el idioma de la misión (mismos ids). */
export const actionsFor = (lang: AcademyLang = 'es'): typeof ACTIONS => localize(ACTIONS, ACTIONS_EN, lang)

// ------------------------------------------------------------------ Cierre
export const CLOSURE: { id: string; label: string; good: boolean }[] = [
  { id: 'exit', label: 'Comprobar los criterios de salida y documentar las desviaciones.', good: true },
  { id: 'open', label: 'Registrar los defectos sin resolver con responsable y prioridad para el siguiente sprint.', good: true },
  { id: 'archive', label: 'Archivar el testware (casos, datos y scripts) para reutilizarlo.', good: true },
  { id: 'lessons', label: 'Recoger las lecciones aprendidas en la retrospectiva.', good: true },
  { id: 'delete', label: 'Borrar los casos fallidos para que el informe salga limpio.', good: false },
  { id: 'silent', label: 'Dar el sprint por cerrado sin mencionar los riesgos altos sin probar.', good: false },
]

const CLOSURE_EN: Record<string, { label: string }> = {
  exit: { label: 'Check the exit criteria and document the deviations.' },
  open: { label: 'Log the unresolved defects with an owner and a priority for the next sprint.' },
  archive: { label: 'Archive the testware (cases, data and scripts) for reuse.' },
  lessons: { label: 'Gather the lessons learned in the retrospective.' },
  delete: { label: 'Delete the failed cases so the report comes out clean.' },
  silent: { label: 'Declare the sprint closed without mentioning the untested high risks.' },
}

/** Actividades de cierre en el idioma de la misión (mismos ids). */
export const closureFor = (lang: AcademyLang = 'es'): typeof CLOSURE => localize(CLOSURE, CLOSURE_EN, lang)

// ------------------------------------------------------------------ Estado
export interface MetricsState {
  metrics: string[]
  readings: Record<string, Reading | ''>
  mgmt: string
  team: string
  actions: string[]
  closure: string[]
  progress?: ProgressResult
  closed?: ClosureResult
  feedback?: string[]
}

export interface ProgressResult {
  metrics: boolean
  readings: number
  mgmt: 'good' | 'detail' | 'makeup' | ''
  team: boolean
  control: boolean
}

export interface ClosureResult {
  ok: boolean
  good: number
  bad: number
}

export const INITIAL_METRICS: MetricsState = { metrics: [], readings: {}, mgmt: '', team: '', actions: [], closure: [] }

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))
const usefulIds = METRICS.filter((m) => m.useful).map((m) => m.id)
const goodActions = ACTIONS.filter((a) => a.good).map((a) => a.id)
const goodClosure = CLOSURE.filter((c) => c.good).map((c) => c.id)

export function evaluateProgress(p: MetricsState): ProgressResult {
  return {
    metrics: sameSet(p.metrics, usefulIds),
    readings: READINGS.filter((r) => p.readings[r.id] === r.kind).length,
    mgmt: MGMT_DRAFTS.find((d) => d.id === p.mgmt)?.kind ?? '',
    team: TEAM_DRAFTS.find((d) => d.id === p.team)?.ok ?? false,
    control: sameSet(p.actions, goodActions),
  }
}

export function evaluateClosure(p: MetricsState): ClosureResult {
  const good = p.closure.filter((id) => goodClosure.includes(id)).length
  const bad = p.closure.length - good
  return { ok: good === goodClosure.length && bad === 0, good, bad }
}

export function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

// ---------------------------------------------------------------- Acciones
export function edit(state: MetricsState, patch: Partial<MetricsState>, summary: string): { state: MetricsState; event: AppEvent } {
  return { state: { ...state, ...patch }, event: { app: APP, action: 'edit', summary, technical: 'metrics.edit', status: 'ok', bugs: [], cost: 0 } }
}

export function askLaura(state: MetricsState, lang: AcademyLang = 'es'): { state: MetricsState; event: AppEvent } {
  const fb: string[] = []
  if (lang === 'en') {
    if (!state.progress) {
      const r = evaluateProgress(state)
      if (!r.metrics) fb.push('For the metrics, ask yourself whether each one helps make a decision or just adds volume. Look for progress against the plan, coverage, defects and risk.')
      if (r.readings < READINGS.length) fb.push("Some readings on the dashboard aren't what they seem: cross-check each figure against what hasn't been tested.")
      if (r.mgmt === 'detail') fb.push("Management won't read 48 cases: they need the status, the risk and the decision you're asking them for.")
      if (r.mgmt === 'makeup') fb.push('That report dresses up the numbers. If a critical defect shows up tomorrow, nobody will trust the dashboard again.')
      if (!r.mgmt) fb.push('You still need to choose the report for management.')
      if (!r.team) fb.push("The team report has to help us work tomorrow: who does what and what's blocking.")
      if (!r.control) fb.push('Review the control actions: they should correct course without hiding data or burning out the team.')
      if (fb.length === 0) fb.push('Useful metrics, readings well interpreted and a report for each audience. Send it to Raúl.')
    } else {
      const c = evaluateClosure(state)
      if (c.bad > 0) fb.push("Some closure actions hide information: the closure report also has to tell what didn't go well.")
      if (c.good < goodClosure.length) fb.push('The closure is missing activities: exit criteria, pending defects, testware and lessons learned.')
      if (fb.length === 0) fb.push('Complete closure. Send the report.')
    }
    return {
      state: { ...state, feedback: fb },
      event: { app: APP, action: 'ask_laura', summary: `Laura reviews the dashboard: ${fb.join(' ')}`, technical: 'metrics.review', status: 'ok', bugs: [], cost: 10 },
    }
  }
  if (!state.progress) {
    const r = evaluateProgress(state)
    if (!r.metrics) fb.push('En las métricas, pregúntate si cada una ayuda a decidir o solo suma volumen. Busca avance frente al plan, cobertura, defectos y riesgo.')
    if (r.readings < READINGS.length) fb.push('Alguna lectura del panel no es lo que parece: cruza cada cifra con lo que no se ha probado.')
    if (r.mgmt === 'detail') fb.push('Dirección no va a leer 48 casos: necesita estado, riesgo y qué decisión le pides.')
    if (r.mgmt === 'makeup') fb.push('Ese informe maquilla los números. Si mañana sale un crítico, nadie volverá a fiarse del panel.')
    if (!r.mgmt) fb.push('Falta elegir el informe para dirección.')
    if (!r.team) fb.push('El informe del equipo tiene que servir para trabajar mañana: quién hace qué y qué bloquea.')
    if (!r.control) fb.push('Revisa las acciones de control: corrigen el rumbo sin esconder datos ni quemar al equipo.')
    if (fb.length === 0) fb.push('Métricas útiles, lecturas bien interpretadas y un informe para cada audiencia. Envíaselo a Raúl.')
  } else {
    const c = evaluateClosure(state)
    if (c.bad > 0) fb.push('Hay acciones de cierre que esconden información: el informe de cierre tiene que contar también lo que no salió.')
    if (c.good < goodClosure.length) fb.push('Al cierre le faltan actividades: criterios de salida, defectos pendientes, testware y lecciones aprendidas.')
    if (fb.length === 0) fb.push('Cierre completo. Envía el informe.')
  }
  return {
    state: { ...state, feedback: fb },
    event: { app: APP, action: 'ask_laura', summary: `Laura revisa el panel: ${fb.join(' ')}`, technical: 'metrics.review', status: 'ok', bugs: [], cost: 10 },
  }
}

export function submitProgress(state: MetricsState, lang: AcademyLang = 'es'): { state: MetricsState; event: AppEvent } {
  const r = evaluateProgress(state)
  const flags = ['progress.sent']
  if (r.metrics) flags.push('metrics.ok')
  if (r.readings === READINGS.length) flags.push('misleading.ok')
  if (r.mgmt === 'good') flags.push('report.mgmt')
  if (r.mgmt === 'makeup') flags.push('report.makeup')
  if (r.team) flags.push('report.team')
  if (r.mgmt === 'good' && r.team) flags.push('report.audience')
  if (r.control) flags.push('control.ok')
  const mgmtLabel = { good: 'claro y con riesgo', detail: 'demasiado detallado', makeup: 'maquillado', '': 'sin elegir' }[r.mgmt]
  return {
    state: { ...state, progress: r, feedback: undefined },
    event: {
      app: APP,
      action: 'submit_progress',
      summary:
        lang === 'en'
          ? `Progress report sent to Raúl: metrics ${r.metrics ? 'useful' : 'could be better'}, readings ${r.readings}/${READINGS.length}, management report ${{ good: 'clear and risk-aware', detail: 'too detailed', makeup: 'dressed up', '': 'not chosen' }[r.mgmt]}, team report ${r.team ? 'actionable' : 'not very useful'}, control actions ${r.control ? 'consistent' : 'with gaps'}.`
          : `Informe de progreso enviado a Raúl: métricas ${r.metrics ? 'útiles' : 'mejorables'}, lecturas ${r.readings}/${READINGS.length}, informe para dirección ${mgmtLabel}, informe del equipo ${r.team ? 'accionable' : 'poco útil'}, acciones de control ${r.control ? 'coherentes' : 'con huecos'}.`,
      technical: `metrics.progress ${JSON.stringify(r)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}

export function submitClosure(state: MetricsState, lang: AcademyLang = 'es'): { state: MetricsState; event: AppEvent } {
  const c = evaluateClosure(state)
  const flags = ['closure.sent']
  if (c.ok) flags.push('closure.ok')
  return {
    state: { ...state, closed: c, feedback: undefined },
    event: {
      app: APP,
      action: 'submit_closure',
      summary:
        lang === 'en'
          ? `Sprint test completion report sent: ${c.good}/${goodClosure.length} closure activities${c.bad ? `, ${c.bad} that hide information` : ''}.`
          : `Informe de cierre del sprint enviado: ${c.good}/${goodClosure.length} actividades de cierre${c.bad ? `, ${c.bad} que esconden información` : ''}.`,
      technical: `metrics.closure ${JSON.stringify(c)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}
