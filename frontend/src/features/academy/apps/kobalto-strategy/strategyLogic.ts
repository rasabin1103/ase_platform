import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

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

const FACTS_EN = [
  'Non-quality cost 2.1 M€ last year: compensation, incidents, rework and the fine for the transfers incident.',
  'Four serious incidents a year. 60 % were risks known before shipping.',
  'From code to production takes 12 days on average; 5 of them waiting for QA at the end.',
  '70 QAs in 40 squads: half in a central team that tests at the end, the other half embedded without common standards.',
  '22 QAs mostly do manual testing.',
  'You have 14,000 automated tests and 78 % code coverage.',
]

const METRICS_EN: Record<string, [string, string]> = {
  copq: ['Cost of non-quality (2.1 M€/year)', 'It is money: any committee understands it.'],
  incidents: ['Serious incidents per quarter', 'Impact on customers and on the regulator.'],
  lead_time: ['Time from code to production (12 days, 5 waiting for QA)', 'Quality that speeds up delivery, not slows it down.'],
  escaped: ['Defects reaching production', 'It measures the quality the customer notices.'],
  tests: ['Number of automated tests (14,000)', 'Activity, not outcome: it tells Management nothing.'],
  coverage: ['Code coverage (78 %)', 'A technical metric that does not connect with the business.'],
  bugs_found: ['Bugs found by QA', 'It rewards finding late, not preventing.'],
  ratio: ['QA-to-developer ratio', 'It measures headcount, not quality.'],
}

const SECTIONS_EN: Record<string, { title: string; o: Record<string, [string, string]> }> = {
  model: {
    title: 'Organizational model',
    o: {
      hybrid: ['Hybrid: QAs embedded in the squads, a common quality platform (environments, data and tools) and a small standards team. Risks are accepted by their business owner.', 'Quality inside the teams, with what is common shared: QA stops being the gate.'],
      central: ['Centralized: one big QA team that tests everything before each release.', 'It is the gate that caused the incident, and the 5 days of waiting.'],
      embedded: ['All QAs in the squads, with nothing common.', 'Each squad reinvents environments and standards.'],
      none: ['No QA: developers test everything.', 'You lose risk judgment and specialization.'],
    },
  },
  invest: {
    title: 'Investment',
    o: {
      phased: ['In phases: platform and training in the first year; each following phase is released if the metrics improve. Review every semester.', 'Management risks little and decides with data.'],
      big: ['All the investment in the first year.', 'A lot of risk at once, with no way to correct.'],
      zero: ['No investment: reorganize what exists.', 'The platform and training are not free.'],
    },
  },
  roadmap: {
    title: 'Roadmap',
    o: {
      pilot: ['Year 1: pilot in the payments squads and a risk policy for the whole company. Year 2: Daily Banking. Year 3: the rest.', 'You learn small and scale with evidence.'],
      big_bang: ['The whole company at once, in the first quarter.', 'Forty squads changing at once: nobody can support them.'],
      no_dates: ['No dates: each area when it can.', 'Without a plan, it does not happen.'],
    },
  },
  people: {
    title: 'People',
    o: {
      transition: ['Transition plan: training in automation and quality for manual QAs, technical and management careers, and nobody left behind.', 'Change is made with people, not against them.'],
      replace: ['Replace manual QAs with automation profiles.', 'You lose business knowledge and the trust of the whole area.'],
      silent: ["Don't mention it: we'll see.", 'Fear fills the silence, and the best leave.'],
    },
  },
}

export function factsFor(lang: AcademyLang = 'es'): string[] {
  return lang === 'en' ? FACTS_EN : FACTS
}
export function metricsFor(lang: AcademyLang = 'es'): Option[] {
  return lang === 'en' ? METRICS.map((m) => ({ ...m, text: METRICS_EN[m.id][0], why: METRICS_EN[m.id][1] })) : METRICS
}
export function sectionsFor(lang: AcademyLang = 'es'): Section[] {
  if (lang !== 'en') return SECTIONS
  return SECTIONS.map((sec) => ({ ...sec, title: SECTIONS_EN[sec.id].title, options: sec.options.map((o) => ({ ...o, text: SECTIONS_EN[sec.id].o[o.id][0], why: SECTIONS_EN[sec.id].o[o.id][1] })) }))
}

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

export function toggleMetric(state: StrategyState, id: string, lang: AcademyLang = 'es'): { state: StrategyState; event: AppEvent } {
  if (state.saved || !METRICS.some((m) => m.id === id)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  const has = state.metrics.includes(id)
  if (!has && state.metrics.length >= MAX_METRICS) return noop(state, tr(lang, `Como mucho ${MAX_METRICS} métricas: el comité recordará pocas.`, `At most ${MAX_METRICS} metrics: the committee will remember few.`))
  const metrics = has ? state.metrics.filter((m) => m !== id) : [...state.metrics, id]
  return { state: { ...state, metrics }, event: event('metric', tr(lang, `Métricas: ${metrics.length}.`, `Metrics: ${metrics.length}.`), 0) }
}

export function chooseSection(state: StrategyState, sectionId: Section['id'], optionId: string, lang: AcademyLang = 'es'): { state: StrategyState; event: AppEvent } {
  if (state.saved || !SECTIONS.find((s) => s.id === sectionId)?.options.some((o) => o.id === optionId)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, choices: { ...state.choices, [sectionId]: optionId } }, event: event('choose', tr(lang, `Estrategia · ${sectionId}: ${optionId}.`, `Strategy · ${sectionId}: ${optionId}.`), 0) }
}

export function evaluateStrategy(state: StrategyState) {
  const picked = METRICS.filter((m) => state.metrics.includes(m.id))
  const metricsOk = picked.length === MAX_METRICS && picked.every((m) => m.good)
  const options = SECTIONS.map((s) => s.options.find((o) => o.id === state.choices[s.id]))
  return { complete: picked.length > 0 && options.every(Boolean), metricsOk, good: options.filter((o) => o?.good).length, ok: metricsOk && options.every((o) => o?.good) }
}

export function saveStrategy(state: StrategyState, lang: AcademyLang = 'es'): { state: StrategyState; event: AppEvent } {
  const r = evaluateStrategy(state)
  if (state.saved || !r.complete) return noop(state, tr(lang, 'Elige las métricas y completa las cuatro secciones.', 'Choose the metrics and complete the four sections.'))
  const flags = ['strat.saved']
  if (r.metricsOk) flags.push('strat.metrics')
  for (const s of SECTIONS) if (s.options.find((o) => o.id === state.choices[s.id])?.good) flags.push(`strat.${s.id}`)
  if (r.ok) flags.push('strat.ok')
  return { state: { ...state, saved: true }, event: event('save', tr(lang, `Estrategia guardada: ${state.metrics.length} métricas y ${r.good} de ${SECTIONS.length} secciones bien planteadas.`, `Strategy saved: ${state.metrics.length} metrics and ${r.good} of ${SECTIONS.length} sections well framed.`), 30, flags) }
}
