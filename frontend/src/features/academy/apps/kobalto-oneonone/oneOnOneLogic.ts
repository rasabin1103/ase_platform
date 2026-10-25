import type { AppEvent } from '../../engine/types'

/**
 * App «1:1» del curso 4, misión 7 (La conversación difícil): preparación de
 * la conversación con Lucía sobre su rendimiento. Lo que se espera de ella y
 * los datos, los ejemplos que llevas y el guion (apertura, cómo buscas la
 * causa, el plan y cómo lo documentas). Evaluación determinista.
 */

/** Lo que se espera y lo que ves (pestaña «Lucía»). */
export const EXPECTED = [
  'QA con un año y medio: prueba sola las historias de su squad y avisa pronto cuando se atasca.',
  'Planes de prueba listos antes de que la historia llegue a QA.',
  'Pide ayuda cuando lleva más de un día bloqueada.',
]

export const CONTEXT = [
  'Hace tres meses pasó a Tarjetas para descargar a Pablo. Dominio nuevo para ella.',
  'Desde entonces cierra menos historias por sprint que el resto del equipo.',
  'Nerea se ha quejado de que tiene que rehacer pruebas suyas.',
  'Personas pregunta si hay que abrir un plan de mejora formal.',
]

export interface Item {
  id: string
  text: string
  good: boolean
  why: string
}

/** Observaciones posibles. Las buenas son hechos concretos con su impacto. */
export const EXAMPLES: Item[] = [
  { id: 'sprint', text: 'Sprint 14: de 5 historias de Tarjetas, 3 llegaron al cierre sin probar y el release se movió dos días.', good: true, why: 'Situación, comportamiento e impacto concretos y comprobables.' },
  { id: 'plan', text: 'Martes 12: el plan de pruebas de la pantalla de límites llegó dos días tarde, sin avisar antes; el squad esperó sin saberlo.', good: true, why: 'Un hecho con fecha y su efecto en el squad.' },
  { id: 'daily', text: 'En las cuatro últimas dailies dijo «sigo con lo mismo» y no pidió ayuda; la historia estuvo bloqueada una semana.', good: true, why: 'Comportamiento observable, sin interpretar intenciones.' },
  { id: 'hearsay', text: 'Nerea dice que Lucía «no se entera de nada».', good: false, why: 'Es una opinión de otra persona: además de vaga, expone a Nerea.' },
  { id: 'judgment', text: 'Es lenta y no tiene interés.', good: false, why: 'Un juicio sobre la persona, no un hecho. Provoca que se defienda.' },
  { id: 'vague', text: 'Creo que algunos días llega tarde.', good: false, why: 'Sin comprobar ni relación con el problema.' },
]
export const MAX_EXAMPLES = 3

export interface Step {
  id: 'opening' | 'explore' | 'plan' | 'record'
  title: string
  options: Item[]
}

export const STEPS: Step[] = [
  {
    id: 'opening',
    title: 'Cómo abres la conversación',
    options: [
      { id: 'sbi', text: 'Directa y respetuosa: «Quiero hablar de cómo van las cosas en Tarjetas. Te traigo situaciones concretas y su impacto, y quiero entender tu punto de vista».', good: true, why: 'Dice a qué viene, con hechos, y abre espacio para ella.' },
      { id: 'sandwich', text: 'Un elogio, la crítica escondida en medio y otro elogio al final.', good: false, why: 'El mensaje se pierde: sale pensando que todo va bien.' },
      { id: 'threat', text: '«Tu rendimiento no es aceptable y Personas va a abrir un plan de mejora».', good: false, why: 'Empieza por la consecuencia: se cierra antes de hablar.' },
      { id: 'soft', text: '«Nada grave, solo un repaso rápido».', good: false, why: 'Le quitas importancia a algo que la tiene.' },
    ],
  },
  {
    id: 'explore',
    title: 'Cómo buscas la causa',
    options: [
      { id: 'ask', text: 'Preguntas abiertas y escuchar: «¿Qué está pasando? ¿Qué te está costando más? ¿Qué necesitarías?».', good: true, why: 'Sin la causa, cualquier plan ataca el síntoma.' },
      { id: 'assume', text: 'Dar por hecho que es falta de interés y decírselo.', good: false, why: 'Juzgas sin saber, y lo más probable es que te equivoques.' },
      { id: 'skip', text: 'No entrar en causas: ir directamente a lo que tiene que cambiar.', good: false, why: 'Si la causa es otra (formación, carga, algo personal), el plan no servirá.' },
    ],
  },
  {
    id: 'plan',
    title: 'Qué plan propones',
    options: [
      { id: 'smart', text: 'Objetivos medibles para 6 semanas, apoyo concreto (pareja con Pablo en Tarjetas, 1:1 semanal) y fecha de revisión.', good: true, why: 'Sabe qué se espera, con qué ayuda y cuándo se revisa.' },
      { id: 'effort', text: '«Tienes que esforzarte más».', good: false, why: 'No dice qué cambiar ni cómo saber si lo ha conseguido.' },
      { id: 'pip', text: 'Plan de mejora formal con Personas desde hoy.', good: false, why: 'Es la primera conversación clara: el plan formal llega si esto no funciona.' },
    ],
  },
  {
    id: 'record',
    title: 'Cómo lo documentas',
    options: [
      { id: 'shared', text: 'Resumen por escrito el mismo día, compartido con ella: hechos, acuerdos, objetivos y fecha de revisión.', good: true, why: 'Las dos partes recuerdan lo mismo, y queda constancia justa.' },
      { id: 'private', text: 'Notas solo para ti.', good: false, why: 'Si ella no las ve, no son un acuerdo.' },
      { id: 'none', text: 'Nada: ya os acordaréis.', good: false, why: 'En seis semanas nadie recuerda lo mismo.' },
    ],
  },
]

export interface PrepState {
  examples: string[]
  script: Partial<Record<Step['id'], string>>
  saved: boolean
}

export const INITIAL_PREP: PrepState = { examples: [], script: {}, saved: false }

const APP = 'kobalto-oneonone'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `oneonone.${action}`, status: 'ok', bugs: [], cost, flags }
}
const noop = (state: PrepState, summary = 'Sin cambios.') => ({ state, event: event('noop', summary, 0) })

export function toggleExample(state: PrepState, id: string): { state: PrepState; event: AppEvent } {
  if (!EXAMPLES.some((e) => e.id === id)) return noop(state)
  const has = state.examples.includes(id)
  if (!has && state.examples.length >= MAX_EXAMPLES) return noop(state, `Como mucho ${MAX_EXAMPLES} ejemplos: los más claros.`)
  const examples = has ? state.examples.filter((e) => e !== id) : [...state.examples, id]
  return { state: { ...state, examples }, event: event('example', `Ejemplos: ${examples.length}.`, 0) }
}

export function chooseStep(state: PrepState, stepId: Step['id'], optionId: string): { state: PrepState; event: AppEvent } {
  if (!STEPS.find((s) => s.id === stepId)?.options.some((o) => o.id === optionId)) return noop(state)
  return { state: { ...state, script: { ...state.script, [stepId]: optionId } }, event: event('step', `Guion · ${stepId}: ${optionId}.`, 0) }
}

export function evaluatePrep(state: PrepState) {
  const chosen = EXAMPLES.filter((e) => state.examples.includes(e.id))
  const examplesOk = chosen.length === MAX_EXAMPLES && chosen.every((e) => e.good)
  const steps = STEPS.map((s) => s.options.find((o) => o.id === state.script[s.id]))
  return {
    complete: state.examples.length > 0 && steps.every(Boolean),
    examplesOk,
    goodSteps: steps.filter((o) => o?.good).length,
    ready: examplesOk && steps.every((o) => o?.good),
  }
}

/** Guardar la preparación. Se puede rehacer: la conversación usa la última versión guardada. */
export function savePrep(state: PrepState): { state: PrepState; event: AppEvent } {
  const r = evaluatePrep(state)
  if (!r.complete) return noop(state, 'Elige ejemplos y completa el guion.')
  const flags = ['prep.saved']
  if (r.examplesOk) flags.push('prep.examples')
  if (state.script.plan === 'smart') flags.push('prep.plan')
  if (state.script.record === 'shared') flags.push('prep.record')
  if (r.ready) flags.push('prep.ready')
  return { state: { ...state, saved: true }, event: event('save', `Preparación guardada: ${state.examples.length} ejemplos, ${r.goodSteps} de ${STEPS.length} pasos del guion bien planteados.`, 20, flags) }
}
