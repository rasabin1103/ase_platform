import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

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

const EXPECTED_EN = [
  'QA with a year and a half: tests the stories of her squad alone and warns early when she gets stuck.',
  'Test plans ready before the story reaches QA.',
  'Asks for help when she has been blocked for more than a day.',
]

const CONTEXT_EN = [
  'Three months ago she moved to Cards to relieve Pablo. A new domain for her.',
  'Since then she closes fewer stories per sprint than the rest of the team.',
  'Nerea has complained that she has to redo some of her tests.',
  'People asks whether a formal improvement plan needs to be opened.',
]

const EXAMPLES_EN: Record<string, [string, string]> = {
  sprint: ['Sprint 14: of 5 Cards stories, 3 reached the close untested and the release slipped two days.', 'Concrete, verifiable situation, behavior and impact.'],
  plan: ['Tuesday the 12th: the test plan for the limits screen arrived two days late, without warning beforehand; the squad waited without knowing.', 'A dated fact and its effect on the squad.'],
  daily: ['In the last four dailies she said “still on the same thing” and did not ask for help; the story was blocked for a week.', 'Observable behavior, without interpreting intentions.'],
  hearsay: ['Nerea says Lucía “has no clue about anything”.', "It is someone else's opinion: besides being vague, it exposes Nerea."],
  judgment: ['She is slow and has no interest.', 'A judgment about the person, not a fact. It makes her defend herself.'],
  vague: ['I think some days she arrives late.', 'Unchecked and unrelated to the problem.'],
}

const STEPS_EN: Record<string, { title: string; o: Record<string, [string, string]> }> = {
  opening: {
    title: 'How you open the conversation',
    o: {
      sbi: ["Direct and respectful: “I want to talk about how things are going in Cards. I'm bringing you concrete situations and their impact, and I want to understand your point of view”.", 'It says what it is about, with facts, and opens space for her.'],
      sandwich: ['A compliment, the criticism hidden in the middle and another compliment at the end.', 'The message gets lost: she leaves thinking everything is fine.'],
      threat: ['“Your performance is not acceptable and People is going to open an improvement plan”.', 'It starts with the consequence: she shuts down before talking.'],
      soft: ['“Nothing serious, just a quick check-in”.', 'You play down something that matters.'],
    },
  },
  explore: {
    title: 'How you look for the cause',
    o: {
      ask: ['Open questions and listening: “What is going on? What is hardest for you? What would you need?”.', 'Without the cause, any plan tackles the symptom.'],
      assume: ['Assume it is lack of interest and tell her so.', "You judge without knowing, and you're most likely wrong."],
      skip: ['Not go into causes: go straight to what has to change.', 'If the cause is something else (training, workload, something personal), the plan will not work.'],
    },
  },
  plan: {
    title: 'What plan you propose',
    o: {
      smart: ['Measurable goals for 6 weeks, concrete support (pairing with Pablo in Cards, weekly 1:1) and a review date.', 'She knows what is expected, with what help and when it is reviewed.'],
      effort: ['“You have to try harder”.', 'It does not say what to change or how to know whether she has achieved it.'],
      pip: ['A formal improvement plan with People from today.', 'This is the first clear conversation: the formal plan comes if this does not work.'],
    },
  },
  record: {
    title: 'How you document it',
    o: {
      shared: ['A written summary the same day, shared with her: facts, agreements, goals and review date.', 'Both parties remember the same thing, and there is a fair record.'],
      private: ['Notes only for you.', "If she doesn't see them, they are not an agreement."],
      none: ["Nothing: you'll remember.", 'In six weeks nobody remembers the same thing.'],
    },
  },
}

export function expectedFor(lang: AcademyLang = 'es'): string[] {
  return lang === 'en' ? EXPECTED_EN : EXPECTED
}
export function contextFor(lang: AcademyLang = 'es'): string[] {
  return lang === 'en' ? CONTEXT_EN : CONTEXT
}
export function examplesFor(lang: AcademyLang = 'es'): Item[] {
  return lang === 'en' ? EXAMPLES.map((e) => ({ ...e, text: EXAMPLES_EN[e.id][0], why: EXAMPLES_EN[e.id][1] })) : EXAMPLES
}
export function stepsFor(lang: AcademyLang = 'es'): Step[] {
  if (lang !== 'en') return STEPS
  return STEPS.map((st) => ({
    ...st,
    title: STEPS_EN[st.id].title,
    options: st.options.map((o) => ({ ...o, text: STEPS_EN[st.id].o[o.id][0], why: STEPS_EN[st.id].o[o.id][1] })),
  }))
}

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

export function toggleExample(state: PrepState, id: string, lang: AcademyLang = 'es'): { state: PrepState; event: AppEvent } {
  if (!EXAMPLES.some((e) => e.id === id)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  const has = state.examples.includes(id)
  if (!has && state.examples.length >= MAX_EXAMPLES) return noop(state, tr(lang, `Como mucho ${MAX_EXAMPLES} ejemplos: los más claros.`, `At most ${MAX_EXAMPLES} examples: the clearest ones.`))
  const examples = has ? state.examples.filter((e) => e !== id) : [...state.examples, id]
  return { state: { ...state, examples }, event: event('example', tr(lang, `Ejemplos: ${examples.length}.`, `Examples: ${examples.length}.`), 0) }
}

export function chooseStep(state: PrepState, stepId: Step['id'], optionId: string, lang: AcademyLang = 'es'): { state: PrepState; event: AppEvent } {
  if (!STEPS.find((s) => s.id === stepId)?.options.some((o) => o.id === optionId)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, script: { ...state.script, [stepId]: optionId } }, event: event('step', tr(lang, `Guion · ${stepId}: ${optionId}.`, `Script · ${stepId}: ${optionId}.`), 0) }
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
export function savePrep(state: PrepState, lang: AcademyLang = 'es'): { state: PrepState; event: AppEvent } {
  const r = evaluatePrep(state)
  if (!r.complete) return noop(state, tr(lang, 'Elige ejemplos y completa el guion.', 'Choose examples and complete the script.'))
  const flags = ['prep.saved']
  if (r.examplesOk) flags.push('prep.examples')
  if (state.script.plan === 'smart') flags.push('prep.plan')
  if (state.script.record === 'shared') flags.push('prep.record')
  if (r.ready) flags.push('prep.ready')
  return { state: { ...state, saved: true }, event: event('save', tr(lang, `Preparación guardada: ${state.examples.length} ejemplos, ${r.goodSteps} de ${STEPS.length} pasos del guion bien planteados.`, `Preparation saved: ${state.examples.length} examples, ${r.goodSteps} of ${STEPS.length} script steps well framed.`), 20, flags) }
}
