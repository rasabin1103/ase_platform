import type { AppEvent } from '../../engine/types'

/**
 * App «Estrategia» del curso 4, misión 11 (La estrategia): la estrategia de
 * calidad a tres años para el comité de dirección. Métricas que entiende
 * dirección, modelo organizativo, inversión, hoja de ruta y personas.
 * Evaluación determinista.
 */

/** Lo que sabes hoy (pestaña «Situación»). */
export const FACTS = [
  'La no calidad costó 2,1 M€ el año pasado: compensaciones, incidentes, retrabajo y la multa del incidente de transferencias.',
  'Cuatro incidentes graves al año. El 60 % eran riesgos conocidos antes de salir.',
  'Del código a producción pasan 12 días de media; 5 de ellos esperando a QA al final.',
  '70 QA en 40 squads: la mitad en un equipo central que prueba al final, la otra mitad embebidos sin estándares comunes.',
  '22 QA hacen sobre todo pruebas manuales.',
  'Tenéis 14.000 tests automatizados y una cobertura de código del 78 %.',
]

export interface Option {
  id: string
  text: string
  good: boolean
  why: string
}

export const METRICS: Option[] = [
  { id: 'copq', text: 'Coste de la no calidad (2,1 M€/año)', good: true, why: 'Es dinero: lo entiende cualquier comité.' },
  { id: 'incidents', text: 'Incidentes graves por trimestre', good: true, why: 'Impacto en clientes y en el regulador.' },
  { id: 'lead_time', text: 'Tiempo del código a producción (12 días, 5 esperando a QA)', good: true, why: 'Calidad que acelera la entrega, no que la frena.' },
  { id: 'escaped', text: 'Defectos que llegan a producción', good: true, why: 'Mide la calidad que nota el cliente.' },
  { id: 'tests', text: 'Número de tests automatizados (14.000)', good: false, why: 'Actividad, no resultado: a dirección no le dice nada.' },
  { id: 'coverage', text: 'Cobertura de código (78 %)', good: false, why: 'Métrica técnica que no conecta con el negocio.' },
  { id: 'bugs_found', text: 'Bugs encontrados por QA', good: false, why: 'Premia encontrar tarde, no evitar.' },
  { id: 'ratio', text: 'Ratio de QA por desarrollador', good: false, why: 'Mide plantilla, no calidad.' },
]

export interface Section {
  id: 'model' | 'invest' | 'roadmap' | 'people'
  title: string
  options: Option[]
}

export const SECTIONS: Section[] = [
  {
    id: 'model',
    title: 'Modelo organizativo',
    options: [
      { id: 'hybrid', text: 'Híbrido: QA embebidos en los squads, una plataforma de calidad común (entornos, datos y herramientas) y un equipo pequeño de estándares. Los riesgos los acepta su dueño de negocio.', good: true, why: 'Calidad dentro de los equipos, con lo común compartido: QA deja de ser la puerta.' },
      { id: 'central', text: 'Centralizado: un gran equipo de QA que prueba todo antes de cada release.', good: false, why: 'Es la puerta que causó el incidente, y los 5 días de espera.' },
      { id: 'embedded', text: 'Todos los QA en los squads, sin nada común.', good: false, why: 'Cada squad reinventa entornos y estándares.' },
      { id: 'none', text: 'Sin QA: los desarrolladores prueban todo.', good: false, why: 'Se pierde el criterio de riesgo y la especialización.' },
    ],
  },
  {
    id: 'invest',
    title: 'Inversión',
    options: [
      { id: 'phased', text: 'Por fases: plataforma y formación el primer año; cada fase siguiente se libera si las métricas mejoran. Revisión cada semestre.', good: true, why: 'Dirección arriesga poco y decide con datos.' },
      { id: 'big', text: 'Toda la inversión el primer año.', good: false, why: 'Mucho riesgo de golpe, sin poder corregir.' },
      { id: 'zero', text: 'Sin inversión: reorganizar lo que hay.', good: false, why: 'La plataforma y la formación no salen gratis.' },
    ],
  },
  {
    id: 'roadmap',
    title: 'Hoja de ruta',
    options: [
      { id: 'pilot', text: 'Año 1: piloto en los squads de pagos y política de riesgos para toda la empresa. Año 2: Banca diaria. Año 3: el resto.', good: true, why: 'Se aprende en pequeño y se escala con pruebas.' },
      { id: 'big_bang', text: 'Toda la empresa a la vez, en el primer trimestre.', good: false, why: 'Cuarenta squads cambiando a la vez: nadie puede acompañarlos.' },
      { id: 'no_dates', text: 'Sin fechas: cada área cuando pueda.', good: false, why: 'Sin plan, no pasa.' },
    ],
  },
  {
    id: 'people',
    title: 'Personas',
    options: [
      { id: 'transition', text: 'Plan de transición: formación en automatización y calidad para los QA manuales, carrera técnica y de gestión, y nadie se queda atrás.', good: true, why: 'El cambio se hace con las personas, no contra ellas.' },
      { id: 'replace', text: 'Sustituir a los QA manuales por perfiles de automatización.', good: false, why: 'Pierdes conocimiento del negocio y la confianza de todo el área.' },
      { id: 'silent', text: 'No mencionarlo: ya se verá.', good: false, why: 'El miedo llena el silencio, y se van los mejores.' },
    ],
  },
]

export const MAX_METRICS = 4

export interface StrategyState {
  metrics: string[]
  choices: Partial<Record<Section['id'], string>>
  saved: boolean
}

export const INITIAL_STRATEGY: StrategyState = { metrics: [], choices: {}, saved: false }

const APP = 'kobalto-strategy'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `strategy.${action}`, status: 'ok', bugs: [], cost, flags }
}
const noop = (state: StrategyState, summary = 'Sin cambios.') => ({ state, event: event('noop', summary, 0) })

export function toggleMetric(state: StrategyState, id: string): { state: StrategyState; event: AppEvent } {
  if (state.saved || !METRICS.some((m) => m.id === id)) return noop(state)
  const has = state.metrics.includes(id)
  if (!has && state.metrics.length >= MAX_METRICS) return noop(state, `Como mucho ${MAX_METRICS} métricas: el comité recordará pocas.`)
  const metrics = has ? state.metrics.filter((m) => m !== id) : [...state.metrics, id]
  return { state: { ...state, metrics }, event: event('metric', `Métricas: ${metrics.length}.`, 0) }
}

export function chooseSection(state: StrategyState, sectionId: Section['id'], optionId: string): { state: StrategyState; event: AppEvent } {
  if (state.saved || !SECTIONS.find((s) => s.id === sectionId)?.options.some((o) => o.id === optionId)) return noop(state)
  return { state: { ...state, choices: { ...state.choices, [sectionId]: optionId } }, event: event('choose', `Estrategia · ${sectionId}: ${optionId}.`, 0) }
}

export function evaluateStrategy(state: StrategyState) {
  const picked = METRICS.filter((m) => state.metrics.includes(m.id))
  const metricsOk = picked.length === MAX_METRICS && picked.every((m) => m.good)
  const options = SECTIONS.map((s) => s.options.find((o) => o.id === state.choices[s.id]))
  return { complete: picked.length > 0 && options.every(Boolean), metricsOk, good: options.filter((o) => o?.good).length, ok: metricsOk && options.every((o) => o?.good) }
}

export function saveStrategy(state: StrategyState): { state: StrategyState; event: AppEvent } {
  const r = evaluateStrategy(state)
  if (state.saved || !r.complete) return noop(state, 'Elige las métricas y completa las cuatro secciones.')
  const flags = ['strat.saved']
  if (r.metricsOk) flags.push('strat.metrics')
  for (const s of SECTIONS) if (s.options.find((o) => o.id === state.choices[s.id])?.good) flags.push(`strat.${s.id}`)
  if (r.ok) flags.push('strat.ok')
  return { state: { ...state, saved: true }, event: event('save', `Estrategia guardada: ${state.metrics.length} métricas y ${r.good} de ${SECTIONS.length} secciones bien planteadas.`, 30, flags) }
}
