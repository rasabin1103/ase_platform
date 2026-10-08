import type { AppEvent } from '../../engine/types'

/**
 * App del curso 2, misión 5: planificador de pruebas (CTFL 5.1 y 5.2).
 * Plan por secciones, clasificación de riesgos, estimación (ratio y tres
 * puntos), priorización con dependencias y cuadrantes de testing.
 */

// ------------------------------------------------------------- Secciones
export type SectionId = 'scope' | 'approach' | 'entry' | 'exit'
export const SECTIONS: { id: SectionId; label: string; options: string[]; correct: number }[] = [
  {
    id: 'scope',
    label: 'Alcance',
    options: [
      'Probar todo lo que haya en la release.',
      'Dentro: cuentas de empresa, tarjetas de equipo y facturas recurrentes. Fuera: la app móvil (la prueba su squad) y la migración de datos históricos.',
      'Lo que dé tiempo antes de la fecha.',
    ],
    correct: 1,
  },
  {
    id: 'approach',
    label: 'Enfoque',
    options: [
      'Pruebas manuales de todo al final de la release.',
      'Automatizar el 100 % de las pruebas por la interfaz.',
      'Basado en riesgos: componentes y API automatizados en CI, aceptación con escenarios BDD, exploratorias en lo nuevo, y rendimiento y seguridad antes de salir.',
    ],
    correct: 2,
  },
  {
    id: 'entry',
    label: 'Criterios de entrada',
    options: [
      'Build desplegada en staging, historias con criterios de aceptación y datos de prueba disponibles.',
      'Cuando desarrollo diga que está listo.',
      'Ninguno: empezamos a probar ya.',
    ],
    correct: 0,
  },
  {
    id: 'exit',
    label: 'Criterios de salida',
    options: [
      'Cuando se acabe el tiempo.',
      'Cuando no encontremos más bugs.',
      'Todas las pruebas de riesgo alto ejecutadas, ningún defecto crítico abierto y cobertura de ramas de al menos el 80 % en los cálculos.',
    ],
    correct: 2,
  },
]

// --------------------------------------------------------------- Riesgos
export type RiskKind = 'product' | 'project'
export const RISKS: { id: string; text: string; kind: RiskKind }[] = [
  { id: 'R1', text: 'El proveedor de firma electrónica entrega su API dos semanas tarde.', kind: 'project' },
  { id: 'R2', text: 'Las facturas recurrentes calculan mal el IVA.', kind: 'product' },
  { id: 'R3', text: 'Sofía está de vacaciones la tercera semana.', kind: 'project' },
  { id: 'R4', text: 'El panel tarda más de 3 s con 500 tarjetas.', kind: 'product' },
  { id: 'R5', text: 'Staging se comparte con otro squad y se pisan los datos.', kind: 'project' },
  { id: 'R6', text: 'Una tarjeta congelada sigue aceptando pagos.', kind: 'product' },
]

// ------------------------------------------------------------ Estimación
export const DEV_EFFORT = 50
export const HIST_RATIO = 0.4
export const THREE_POINT = { a: 12, m: 18, b: 36 }
export const threePoint = () => {
  const { a, m, b } = THREE_POINT
  return { e: (a + 4 * m + b) / 6, sd: (b - a) / 6 }
}

// ---------------------------------------------------------- Priorización
export type Risk = 'alto' | 'medio' | 'bajo'
export const CASES: { id: string; label: string; risk: Risk; dependsOn?: string }[] = [
  { id: 'C1', label: 'Alta de cuenta de empresa', risk: 'medio' },
  { id: 'C2', label: 'Firma electrónica del contrato', risk: 'alto', dependsOn: 'C1' },
  { id: 'C3', label: 'Congelar una tarjeta de equipo', risk: 'alto' },
  { id: 'C4', label: 'Exportar gastos a CSV', risk: 'bajo' },
  { id: 'C5', label: 'Factura recurrente con IVA', risk: 'alto', dependsOn: 'C1' },
  { id: 'C6', label: 'Cambiar el idioma del panel', risk: 'bajo' },
]
const RISK_RANK: Record<Risk, number> = { alto: 3, medio: 2, bajo: 1 }

/** Prioridad correcta: se respetan las dependencias y, entre casos sin relación de dependencia, el de más riesgo va antes. */
export function evaluateOrder(order: Record<string, number | null>): { ok: boolean; issues: string[] } {
  const issues: string[] = []
  const pos = (id: string) => order[id]
  if (CASES.some((c) => pos(c.id) == null)) return { ok: false, issues: ['Hay casos sin posición.'] }
  if (new Set(CASES.map((c) => pos(c.id))).size !== CASES.length) return { ok: false, issues: ['Dos casos ocupan la misma posición.'] }
  for (const c of CASES) {
    if (c.dependsOn && (pos(c.dependsOn) as number) > (pos(c.id) as number)) issues.push(`«${c.label}» depende de «${CASES.find((x) => x.id === c.dependsOn)!.label}»: no se puede ejecutar antes.`)
  }
  const related = (x: string, y: string) => CASES.find((c) => c.id === x)?.dependsOn === y || CASES.find((c) => c.id === y)?.dependsOn === x
  for (const x of CASES)
    for (const y of CASES) {
      if (x.id === y.id || related(x.id, y.id)) continue
      if (RISK_RANK[x.risk] > RISK_RANK[y.risk] && (pos(x.id) as number) > (pos(y.id) as number)) {
        // Un caso de riesgo medio que es requisito de uno alto puede ir antes que otros.
        const yIsPrereqOfHigher = CASES.some((c) => c.dependsOn === y.id && RISK_RANK[c.risk] >= RISK_RANK[x.risk])
        if (!yIsPrereqOfHigher) {
          issues.push(`«${x.label}» (riesgo ${x.risk}) va después de «${y.label}» (riesgo ${y.risk}).`)
        }
      }
    }
  return { ok: issues.length === 0, issues: Array.from(new Set(issues)) }
}

// ------------------------------------------------------------ Cuadrantes
export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export const QUADRANT_LABEL: Record<Quadrant, string> = {
  Q1: 'Q1 · Tecnología · apoyan al equipo',
  Q2: 'Q2 · Negocio · apoyan al equipo',
  Q3: 'Q3 · Negocio · critican el producto',
  Q4: 'Q4 · Tecnología · critican el producto',
}
export const QUAD_ITEMS: { id: string; label: string; q: Quadrant }[] = [
  { id: 'unit', label: 'Pruebas unitarias', q: 'Q1' },
  { id: 'integ', label: 'Pruebas de integración de componentes', q: 'Q1' },
  { id: 'bdd', label: 'Escenarios BDD de aceptación', q: 'Q2' },
  { id: 'proto', label: 'Prototipos revisados con negocio', q: 'Q2' },
  { id: 'explore', label: 'Pruebas exploratorias', q: 'Q3' },
  { id: 'uat', label: 'Usabilidad y aceptación de usuario', q: 'Q3' },
  { id: 'perf', label: 'Rendimiento y carga', q: 'Q4' },
  { id: 'sec', label: 'Seguridad', q: 'Q4' },
]

// ----------------------------------------------------------------- Estado
export interface PlanState {
  sections: Partial<Record<SectionId, number>>
  risks: Record<string, RiskKind | ''>
  ratio: string
  threeE: string
  threeSD: string
  order: Record<string, number | null>
  quadrants: Record<string, Quadrant | ''>
  submitted?: PlanResult
  feedback?: string[]
}

export interface PlanResult {
  sections: Record<SectionId, boolean>
  risks: number
  ratio: boolean
  three: boolean
  prio: boolean
  quad: number
}

export const INITIAL_PLAN: PlanState = { sections: {}, risks: {}, ratio: '', threeE: '', threeSD: '', order: {}, quadrants: {} }

export function parseNum(raw: string): number {
  const t = raw.trim().replace(',', '.')
  return t && /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN
}

export function evaluatePlan(p: PlanState): PlanResult & { prioIssues: string[] } {
  const sections = Object.fromEntries(SECTIONS.map((s) => [s.id, p.sections[s.id] === s.correct])) as Record<SectionId, boolean>
  const risks = RISKS.filter((r) => p.risks[r.id] === r.kind).length
  const ratio = Math.abs(parseNum(p.ratio) - DEV_EFFORT * HIST_RATIO) < 0.05
  const tp = threePoint()
  const three = Math.abs(parseNum(p.threeE) - tp.e) < 0.05 && Math.abs(parseNum(p.threeSD) - tp.sd) < 0.05
  const prio = evaluateOrder(p.order)
  const quad = QUAD_ITEMS.filter((i) => p.quadrants[i.id] === i.q).length
  return { sections, risks, ratio, three, prio: prio.ok, quad, prioIssues: prio.issues }
}

// ---------------------------------------------------------------- Acciones
export function edit(state: PlanState, patch: Partial<PlanState>, summary: string): { state: PlanState; event: AppEvent } {
  return { state: { ...state, ...patch }, event: { app: 'kobalto-plan', action: 'edit', summary, technical: 'plan.edit', status: 'ok', bugs: [], cost: 0 } }
}

export function askLaura(state: PlanState): { state: PlanState; event: AppEvent } {
  const r = evaluatePlan(state)
  const fb: string[] = []
  const badSections = SECTIONS.filter((s) => state.sections[s.id] !== undefined && !r.sections[s.id]).map((s) => s.label)
  if (badSections.length) fb.push(`Revisa estas secciones: ${badSections.join(', ')}. Pregúntate si son concretas y medibles.`)
  if (SECTIONS.some((s) => state.sections[s.id] === undefined)) fb.push('Hay secciones del plan sin rellenar.')
  if (r.risks < RISKS.length) fb.push('Algún riesgo está mal clasificado: ¿afecta a lo que entregamos (producto) o a cómo lo hacemos (proyecto)?')
  if (!r.ratio || !r.three) fb.push('Repasa la estimación: ratio histórico × esfuerzo de desarrollo, y tres puntos E = (a + 4m + b) ÷ 6, DE = (b − a) ÷ 6.')
  if (!r.prio) fb.push(r.prioIssues[0] ?? 'Revisa el orden de los casos.')
  if (r.quad < QUAD_ITEMS.length) fb.push(`${QUAD_ITEMS.length - r.quad} prueba(s) no están en su cuadrante.`)
  if (fb.length === 0) fb.push('Plan sólido y estimación defendible. Envíaselo a Raúl.')
  return {
    state: { ...state, feedback: fb },
    event: { app: 'kobalto-plan', action: 'ask_laura', summary: `Laura revisa el plan: ${fb.join(' ')}`, technical: 'plan.review', status: 'ok', bugs: [], cost: 10 },
  }
}

export function submit(state: PlanState): { state: PlanState; event: AppEvent } {
  const r = evaluatePlan(state)
  const flags = ['plan.submitted']
  for (const s of SECTIONS) if (r.sections[s.id]) flags.push(`plan.${s.id}`)
  if (r.risks === RISKS.length) flags.push('plan.risks')
  if (r.ratio) flags.push('est.ratio')
  if (r.three) flags.push('est.3p')
  if (r.ratio && r.three) flags.push('est.ok')
  if (r.prio) flags.push('prio.ok')
  if (r.quad === QUAD_ITEMS.length) flags.push('quad.ok')
  const okSections = Object.values(r.sections).filter(Boolean).length
  const { prioIssues: _ignored, ...result } = r
  void _ignored
  return {
    state: { ...state, submitted: result },
    event: {
      app: 'kobalto-plan',
      action: 'submit',
      summary: `Plan de pruebas enviado a Raúl: ${okSections}/${SECTIONS.length} secciones sólidas, riesgos ${r.risks}/${RISKS.length}, estimación ${r.ratio && r.three ? 'defendible' : 'con errores'}, priorización ${r.prio ? 'coherente' : 'con huecos'}, cuadrantes ${r.quad}/${QUAD_ITEMS.length}.`,
      technical: `plan.submit ${JSON.stringify(result)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}
