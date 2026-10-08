import type { AppEvent } from '../../engine/types'

/**
 * App de la misión 6: planificador de pruebas de KOB-190 «Dividir un gasto».
 * Cada comprobación se coloca en un nivel (unitaria, API, E2E, manual o
 * rendimiento). El nivel decide cuánto cuesta, cuánto tarda la suite y,
 * sobre todo, qué bugs puede ver: un mock esconde un fallo de contrato y un
 * E2E con 3 amigos no ve un problema de rendimiento con 20.
 */

export type Level = 'unit' | 'api' | 'e2e' | 'manual' | 'perf'

export const LEVEL_LABEL: Record<Level, string> = {
  unit: 'Unitaria',
  api: 'API / integración',
  e2e: 'E2E (interfaz)',
  manual: 'Manual / exploratoria',
  perf: 'Rendimiento',
}

/** Minutos de la jornada para escribirla (o ejecutarla, si es manual). */
export const EFFORT: Record<Level, number> = { unit: 8, api: 15, e2e: 30, manual: 10, perf: 25 }
/** Segundos que añade a cada ejecución de la suite en CI. */
export const CI_SECONDS: Record<Level, number> = { unit: 1, api: 20, e2e: 180, manual: 0, perf: 0 }
/** Probabilidad de fallo intermitente por ejecución. */
export const FLAKY: Record<Level, number> = { unit: 0, api: 0.002, e2e: 0.02, manual: 0, perf: 0 }

export const PYRAMID_BUGS = {
  centLost: 'P1',
  remainderToLast: 'P1b',
  cancelOthers: 'P2',
  listLeak: 'P2b',
  contractEuros: 'P3',
  slowWith20: 'P4',
  dailyReminder: 'P5',
} as const

export const PYRAMID_BUG_SLOTS: { slot: string; options: string[] }[] = [
  { slot: 'calc', options: ['P1', 'P1b'] },
  { slot: 'security', options: ['P2', 'P2b'] },
  { slot: 'contract', options: ['P3'] },
  { slot: 'perf', options: ['P4'] },
  { slot: 'time', options: ['P5'] },
]

export interface Check {
  id: string
  title: string
  /** Niveles recomendados (el primero es el ideal). */
  ideal: Level[]
  /** Bug que puede revelar y en qué niveles lo ve, con el fallo observado. */
  detects?: { bugs: string[]; levels: Level[]; actual: Record<string, string> }
  /** Lo que «pasa» cuando el nivel no puede ver el problema. */
  blind?: Partial<Record<Level, string>>
}

export const CHECKS: Check[] = [
  {
    id: 'C01',
    title: 'Reparto equitativo: 10,00 € entre 3 (el céntimo sobrante, al pagador)',
    ideal: ['unit'],
    detects: {
      bugs: ['P1', 'P1b'],
      levels: ['unit', 'api', 'e2e'],
      actual: { P1: 'se reparten 3,33 € × 3 = 9,99 €: se pierde un céntimo', P1b: 'el céntimo sobrante se asigna al último amigo, no al pagador' },
    },
  },
  { id: 'C02', title: 'Importes personalizados que no suman el total → error', ideal: ['unit'] },
  { id: 'C03', title: 'Límites de participantes: 1 y 20 amigos', ideal: ['unit'] },
  { id: 'C04', title: 'Validación del importe: 0, negativo y más de 2 decimales', ideal: ['unit'] },
  {
    id: 'C05',
    title: 'Recordatorio automático a los 3 días si no se ha pagado',
    ideal: ['unit', 'api'],
    detects: { bugs: ['P5'], levels: ['unit', 'api'], actual: { P5: 'con el reloj simulado, el recordatorio se envía cada día desde el día 1' } },
    blind: { e2e: 'no se puede esperar 3 días en un E2E: el test solo comprueba que se crea el reparto', manual: 'no se puede esperar 3 días: se comprueba solo el texto del recordatorio' },
  },
  { id: 'C06', title: 'POST /splits crea una solicitud para cada amigo', ideal: ['api'] },
  {
    id: 'C07',
    title: 'Un usuario no puede cancelar el reparto de otro (autorización)',
    ideal: ['api'],
    detects: { bugs: ['P2'], levels: ['api'], actual: { P2: 'DELETE /splits/{id} con el token de otro usuario responde 200 y cancela el reparto' } },
    blind: { e2e: 'la app no muestra el botón «Cancelar» en repartos ajenos: el test pasa', manual: 'la app no muestra el botón «Cancelar» en repartos ajenos', unit: 'la comprobación de permisos está en la API, no en el módulo de cálculo' },
  },
  {
    id: 'C08',
    title: 'El listado solo devuelve los repartos del usuario (privacidad)',
    ideal: ['api'],
    detects: { bugs: ['P2b'], levels: ['api'], actual: { P2b: 'GET /splits?userId=otro devuelve los repartos de otro usuario' } },
    blind: { e2e: 'la app siempre pide los repartos del usuario conectado: el test pasa', manual: 'la app siempre pide los repartos del usuario conectado', unit: 'el filtro de seguridad está en la API' },
  },
  {
    id: 'C09',
    title: 'Contrato app ↔ API: el importe viaja en céntimos',
    ideal: ['api'],
    detects: { bugs: ['P3'], levels: ['api', 'e2e'], actual: { P3: 'la app envía 10.5 (euros) y la API lo interpreta como 10,5 céntimos' } },
    blind: { unit: 'con datos simulados (mocks) a ambos lados, cada parte cumple su propia idea del contrato: pasa' },
  },
  { id: 'C10', title: 'Invitar a un amigo que no es cliente (enlace de pago)', ideal: ['api'] },
  {
    id: 'C11',
    title: 'Flujo completo: dividir un movimiento desde la app y verlo en «Pendientes»',
    ideal: ['e2e'],
    detects: { bugs: ['P3'], levels: ['e2e'], actual: { P3: 'en «Pendientes» aparece 0,11 € en lugar de 10,50 €' } },
  },
  { id: 'C12', title: 'El botón «Dividir» aparece en el detalle de un movimiento', ideal: ['e2e', 'unit'] },
  { id: 'C13', title: 'Textos y diseño de la pantalla de reparto', ideal: ['manual'] },
  { id: 'C14', title: 'Usabilidad: ¿se entiende quién debe cuánto a quién?', ideal: ['manual'] },
  {
    id: 'C15',
    title: 'Rendimiento: crear un reparto con 20 amigos en menos de 2 s',
    ideal: ['perf'],
    detects: { bugs: ['P4'], levels: ['perf'], actual: { P4: 'con 20 amigos tarda 8,4 s (una consulta por amigo)' } },
    blind: { e2e: 'el E2E usa 3 amigos de prueba: 0,9 s, pasa', api: 'la prueba funcional usa 3 amigos: 0,6 s, pasa', unit: 'el módulo de cálculo no toca la base de datos: pasa', manual: 'con 3 amigos va rápido' },
  },
  { id: 'C16', title: 'Accesibilidad con lector de pantalla', ideal: ['manual'] },
]

export interface PlanEntry {
  level: Level
  result: 'pass' | 'fail'
  build: number
}
export interface PlanState {
  entries: Record<string, PlanEntry>
  submissions: number
}
export const INITIAL_PLAN: PlanState = { entries: {}, submissions: 0 }

export interface PlanBuild {
  active?: string[]
  fixed?: string[]
}

function live(build: PlanBuild): (b: string) => boolean {
  const active = new Set(build.active ?? PYRAMID_BUG_SLOTS.map((s) => s.options[0]))
  const fixed = new Set(build.fixed ?? [])
  return (b) => active.has(b) && !fixed.has(b)
}

/** Escribe (o ejecuta, si es manual) una comprobación en un nivel. */
export function implement(state: PlanState, checkId: string, level: Level, buildNo: number, build: PlanBuild = {}): { state: PlanState; event: AppEvent } {
  const c = CHECKS.find((x) => x.id === checkId)
  if (!c) throw new Error(`Comprobación ${checkId} no encontrada`)
  const has = live(build)
  const bug = c.detects && c.detects.levels.includes(level) ? c.detects.bugs.find(has) : undefined
  const already = state.entries[c.id]
  const cost = already && already.level === level ? Math.ceil(EFFORT[level] / 4) : EFFORT[level]
  const verb = level === 'manual' ? 'Ejecutada' : already && already.level === level ? 'Relanzada' : 'Escrita'
  const note = !bug ? (c.blind?.[level] ?? 'pasa') : ''
  return {
    state: { ...state, entries: { ...state.entries, [c.id]: { level, result: bug ? 'fail' : 'pass', build: buildNo } } },
    event: {
      app: 'kobalto-pyramid',
      action: level,
      summary: bug ? `[${LEVEL_LABEL[level]}] ${c.id} ${c.title} → FALLA: ${c.detects!.actual[bug]}` : `[${LEVEL_LABEL[level]}] ${c.id} ${c.title} → PASA (${note})`,
      technical: `${verb} ${c.id} como ${level} · ${cost} min · ${bug ? 'FAILED' : 'PASSED'}`,
      status: bug ? 'error' : 'ok',
      bugs: bug ? [bug] : [],
      cost,
    },
  }
}

export interface PlanMetrics {
  counts: Record<Level, number>
  automated: number
  ciMinutes: number
  /** Probabilidad de que una ejecución de la suite falle sin motivo. */
  flakyRate: number
  shape: 'pyramid' | 'ice_cream' | 'hourglass' | 'thin'
}

export function metrics(state: PlanState): PlanMetrics {
  const counts: Record<Level, number> = { unit: 0, api: 0, e2e: 0, manual: 0, perf: 0 }
  for (const e of Object.values(state.entries)) counts[e.level]++
  const automated = counts.unit + counts.api + counts.e2e
  const ciSeconds = (Object.keys(counts) as Level[]).reduce((n, l) => n + counts[l] * CI_SECONDS[l], 0)
  const pass = (Object.keys(counts) as Level[]).reduce((p, l) => p * Math.pow(1 - FLAKY[l], counts[l]), 1)
  const shape: PlanMetrics['shape'] =
    automated < 6 ? 'thin' : counts.e2e > counts.unit ? 'ice_cream' : counts.unit >= counts.api && counts.api >= counts.e2e ? 'pyramid' : 'hourglass'
  return { counts, automated, ciMinutes: Math.round((ciSeconds / 60) * 10) / 10, flakyRate: Math.round((1 - pass) * 1000) / 10, shape }
}

const SHAPE_LABEL: Record<PlanMetrics['shape'], string> = {
  pyramid: 'pirámide',
  ice_cream: 'cono de helado (pirámide invertida)',
  hourglass: 'reloj de arena',
  thin: 'demasiado escasa',
}

/** Enviar el plan a revisión: activa flags que leen las escenas de la misión. */
export function submitPlan(state: PlanState): { state: PlanState; event: AppEvent } {
  const m = metrics(state)
  const flags = ['plan.submitted', `plan.shape.${m.shape}`]
  const perf = state.entries.C15?.level === 'perf'
  if (!perf) flags.push('plan.no_perf')
  const exploratory = ['C13', 'C14', 'C16'].some((id) => {
    const l = state.entries[id]?.level
    return l === 'unit' || l === 'api' || l === 'e2e'
  })
  if (exploratory) flags.push('plan.automated_exploratory')
  const security = ['C07', 'C08'].every((id) => state.entries[id]?.level === 'api')
  if (security) flags.push('plan.security_api')
  if (m.ciMinutes > 15) flags.push('plan.slow_ci')
  if (m.shape === 'pyramid' && perf && !exploratory && security && m.ciMinutes <= 15) flags.push('plan.good')
  return {
    state: { ...state, submissions: state.submissions + 1 },
    event: {
      app: 'kobalto-pyramid',
      action: 'submit',
      summary: `Plan enviado a revisión: ${m.counts.unit} unitarias, ${m.counts.api} de API, ${m.counts.e2e} E2E, ${m.counts.manual} manuales, ${m.counts.perf} de rendimiento · forma: ${SHAPE_LABEL[m.shape]} · CI ${m.ciMinutes} min · ${m.flakyRate} % de ejecuciones con fallo intermitente`,
      technical: `plan.submit shape=${m.shape} ci=${m.ciMinutes}min flaky=${m.flakyRate}%`,
      status: 'ok',
      bugs: [],
      cost: 5,
      flags,
    },
  }
}
