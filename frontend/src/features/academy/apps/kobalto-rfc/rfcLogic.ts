import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

/**
 * App «RFC» del curso 4, misión 4 (Cinco squads, cinco frameworks): el mapa de
 * cómo automatiza cada squad, una propuesta de estándar por secciones, los
 * comentarios de los squads y la publicación del ADR. Evaluación determinista.
 */

export interface Squad {
  id: string
  name: string
  tool: string
  tests: number
  context: string
}

export const SQUADS: Squad[] = [
  { id: 'tarjetas', name: 'Tarjetas', tool: 'Karate', tests: 420, context: 'Suite estable desde el año pasado. Devs y QA escriben tests.' },
  { id: 'pagos', name: 'Pagos', tool: 'Postman + Newman', tests: 1200, context: 'El volumen más grande. Releases cada viernes; no pueden parar.' },
  { id: 'cuentas', name: 'Cuentas', tool: 'REST Assured (Java)', tests: 310, context: 'Equipo muy Java. Contentos con lo suyo.' },
  { id: 'onboarding', name: 'Onboarding', tool: 'Cypress (API y UI)', tests: 260, context: 'Mucha prueba de interfaz web, además de API.' },
  { id: 'notificaciones', name: 'Notificaciones', tool: 'pytest', tests: 140, context: 'Equipo de Python. Pocos tests, pero bien hechos.' },
]

/** Problemas que ves hoy (por qué Dirección quiere «un estándar»). */
export const PAINS = [
  'Nadie puede reutilizar datos de prueba ni utilidades entre squads.',
  'Cinco formatos de informe: Dirección no sabe qué está probado.',
  'Cuando alguien cambia de squad, tiene que aprender otra herramienta.',
  'Cada squad ejecuta sus tests a su manera en el pipeline.',
]

export interface Option {
  id: string
  text: string
  good: boolean
  why: string
}

export interface Section {
  id: 'scope' | 'choice' | 'migration' | 'governance'
  title: string
  options: Option[]
}

export const SECTIONS: Section[] = [
  {
    id: 'scope',
    title: 'Alcance del estándar',
    options: [
      { id: 'one_tool', text: 'Una única herramienta obligatoria para todo lo que se automatice.', good: false, why: 'Imponer una herramienta para todo choca con contextos distintos (UI, Python, volumen de Pagos) y genera rechazo.' },
      { id: 'minimum', text: 'Un estándar mínimo común (formato de informes, datos de prueba, ejecución en el pipeline) y una herramienta recomendada para APIs nuevas.', good: true, why: 'Ataca los problemas reales (informes, datos, pipeline) y deja margen a cada contexto.' },
      { id: 'nothing', text: 'Que cada squad siga como quiera y publicar una guía de buenas prácticas.', good: false, why: 'No resuelve ninguno de los problemas que motivaron el cambio.' },
    ],
  },
  {
    id: 'choice',
    title: 'Cómo se elige la herramienta recomendada',
    options: [
      { id: 'mine', text: 'La que uso yo: la conozco bien.', good: false, why: 'Una preferencia personal no convence a cinco squads.' },
      { id: 'criteria', text: 'Con una matriz de criterios acordada con los squads y un piloto de seis semanas en dos de ellos.', good: true, why: 'Criterios explícitos y datos del piloto: la decisión se puede defender y revisar.' },
      { id: 'vote', text: 'Por votación entre los squads.', good: false, why: 'Gana la más popular, no la que mejor encaja: y quien pierde no se siente escuchado.' },
    ],
  },
  {
    id: 'migration',
    title: 'Migración',
    options: [
      { id: 'big_bang', text: 'Todos migran este trimestre.', good: false, why: 'Imposible para Pagos (1.200 tests y releases semanales): pararía la entrega o dejarían de probar.' },
      { id: 'incremental', text: 'Lo nuevo, con el estándar; lo existente se migra cuando se toca, con fecha límite solo para lo crítico.', good: true, why: 'Migración incremental: sin parar la entrega y con el riesgo bajo control.' },
      { id: 'none', text: 'Sin plan de migración: ya se verá.', good: false, why: 'Sin plan, el estándar convive para siempre con lo viejo.' },
    ],
  },
  {
    id: 'governance',
    title: 'Excepciones y gobierno',
    options: [
      { id: 'me', text: 'Yo apruebo cada excepción.', good: false, why: 'Te conviertes en el cuello de botella de cinco squads.' },
      { id: 'adr_guild', text: 'Excepciones documentadas en un ADR y revisadas una vez al mes en la guild de QA.', good: true, why: 'Decisiones visibles, con criterio compartido y sin depender de una persona.' },
      { id: 'no_exceptions', text: 'Sin excepciones.', good: false, why: 'Un estándar sin excepciones se rompe en el primer caso que no encaja.' },
    ],
  },
]

export interface SquadComment {
  id: string
  squad: string
  author: string
  text: string
  responses: Option[]
}

export const COMMENTS: SquadComment[] = [
  {
    id: 'c_pagos',
    squad: 'Pagos',
    author: 'Héctor Bravo',
    text: 'Tenemos 1.200 tests en Postman y release cada viernes. Si nos obligáis a migrar ya, dejamos de probar.',
    responses: [
      { id: 'adapt', text: 'Tiene sentido. Pagos aplica ya el formato de informes y la ejecución en el pipeline; los 1.200 tests se migran al tocarlos, y te ayudo a migrar los 50 críticos este semestre.', good: true, why: 'Escuchas, aplicas lo que aporta ya y das ayuda concreta para lo crítico.' },
      { id: 'rule', text: 'Es el estándar. No hay excepciones.', good: false, why: 'Sin autoridad sobre los squads, imponer solo consigue cumplimiento en el papel.' },
      { id: 'exempt', text: 'Vale, Pagos queda fuera del estándar.', good: false, why: 'Dejar fuera al squad más grande vacía el estándar.' },
    ],
  },
  {
    id: 'c_notif',
    squad: 'Notificaciones',
    author: 'Squad Notificaciones',
    text: 'Somos un equipo de Python. ¿Tenemos que aprender otra herramienta para 140 tests que funcionan bien?',
    responses: [
      { id: 'adapt', text: 'El mínimo (informes, datos, pipeline) os aplica. Si pytest lo cumple, lo dejamos como excepción documentada en el ADR.', good: true, why: 'El estándar busca resultados comunes, no uniformidad por sí misma.' },
      { id: 'rule', text: 'Sí: el estándar es igual para todos.', good: false, why: 'Obligar a cambiar algo que funciona, sin beneficio claro, solo genera rechazo.' },
      { id: 'ignore', text: '(No respondes.)', good: false, why: 'Un comentario sin respuesta en un RFC es un squad que se desengancha.' },
    ],
  },
  {
    id: 'c_ui',
    squad: 'Onboarding',
    author: 'Squad Onboarding',
    text: 'El RFC solo habla de APIs. ¿Y las pruebas de interfaz web?',
    responses: [
      { id: 'adapt', text: 'Buen punto: lo dejo fuera de alcance en esta versión, escrito en el RFC, y abrimos un RFC aparte para la UI con vosotros.', good: true, why: 'Dejar claro qué está fuera de alcance evita malentendidos y abre una vía.' },
      { id: 'rule', text: 'Usad también la herramienta de APIs para la UI.', good: false, why: 'Una herramienta de APIs no sirve para probar interfaces web.' },
      { id: 'ignore', text: '(No respondes.)', good: false, why: 'Sin respuesta, Onboarding acabará con su propio «estándar».' },
    ],
  },
]

const SQUAD_CONTEXT_EN: Record<string, string> = {
  tarjetas: 'Stable suite since last year. Devs and QA write tests.',
  pagos: 'The largest volume. Releases every Friday; they cannot stop.',
  cuentas: 'A very Java team. Happy with what they have.',
  onboarding: 'Lots of web UI testing, besides API.',
  notificaciones: 'A Python team. Few tests, but well made.',
}

const PAINS_EN = [
  'Nobody can reuse test data or utilities across squads.',
  'Five report formats: Management does not know what is tested.',
  'When someone changes squad, they have to learn another tool.',
  'Each squad runs its tests its own way in the pipeline.',
]

const OPT_EN: Record<string, Record<string, [string, string]>> = {
  scope: {
    one_tool: ['A single mandatory tool for everything that gets automated.', 'Imposing one tool for everything clashes with different contexts (UI, Python, the volume of Payments) and creates rejection.'],
    minimum: ['A common minimum standard (report format, test data, pipeline execution) and a recommended tool for new APIs.', 'It tackles the real problems (reports, data, pipeline) and leaves room for each context.'],
    nothing: ['Let each squad carry on as they wish and publish a best-practices guide.', 'It solves none of the problems that motivated the change.'],
  },
  choice: {
    mine: ['The one I use: I know it well.', "A personal preference won't convince five squads."],
    criteria: ['With a criteria matrix agreed with the squads and a six-week pilot in two of them.', 'Explicit criteria and pilot data: the decision can be defended and reviewed.'],
    vote: ['By vote among the squads.', 'The most popular wins, not the best fit: and whoever loses does not feel heard.'],
  },
  migration: {
    big_bang: ['Everyone migrates this quarter.', 'Impossible for Payments (1,200 tests and weekly releases): it would stop delivery or they would stop testing.'],
    incremental: ['New work follows the standard; existing work is migrated when touched, with a deadline only for what is critical.', 'Incremental migration: without stopping delivery and with the risk under control.'],
    none: ["No migration plan: we'll see.", 'Without a plan, the standard coexists forever with the old.'],
  },
  governance: {
    me: ['I approve every exception.', 'You become the bottleneck of five squads.'],
    adr_guild: ['Exceptions documented in an ADR and reviewed once a month in the QA guild.', 'Visible decisions, with shared criteria and not dependent on one person.'],
    no_exceptions: ['No exceptions.', 'A standard without exceptions breaks on the first case that does not fit.'],
  },
}

const SECTION_TITLE_EN: Record<string, string> = {
  scope: 'Scope of the standard',
  choice: 'How the recommended tool is chosen',
  migration: 'Migration',
  governance: 'Exceptions and governance',
}

const COMMENT_EN: Record<string, { squad?: string; author: string; text: string; r: Record<string, [string, string]> }> = {
  c_pagos: {
    author: 'Héctor Bravo',
    text: 'We have 1,200 tests in Postman and a release every Friday. If you force us to migrate now, we stop testing.',
    r: {
      adapt: ["Makes sense. Payments applies the report format and pipeline execution now; the 1,200 tests are migrated when touched, and I'll help you migrate the 50 critical ones this semester.", 'You listen, apply what adds value now and give concrete help for what is critical.'],
      rule: ["It's the standard. No exceptions.", 'Without authority over the squads, imposing only gets compliance on paper.'],
      exempt: ['Fine, Payments is outside the standard.', 'Leaving out the largest squad empties the standard.'],
    },
  },
  c_notif: {
    author: 'Notifications squad',
    text: 'We are a Python team. Do we have to learn another tool for 140 tests that work well?',
    r: {
      adapt: ['The minimum (reports, data, pipeline) applies to you. If pytest meets it, we leave it as a documented exception in the ADR.', 'The standard seeks common results, not uniformity for its own sake.'],
      rule: ['Yes: the standard is the same for everyone.', 'Forcing a change to something that works, with no clear benefit, only creates rejection.'],
      ignore: ["(You don't respond.)", 'An unanswered comment on an RFC is a squad that disengages.'],
    },
  },
  c_ui: {
    author: 'Onboarding squad',
    text: 'The RFC only talks about APIs. What about web UI tests?',
    r: {
      adapt: ['Good point: I leave it out of scope in this version, written in the RFC, and we open a separate RFC for the UI with you.', 'Making clear what is out of scope avoids misunderstandings and opens a path.'],
      rule: ['Use the API tool for the UI too.', 'An API tool is not suited to testing web interfaces.'],
      ignore: ["(You don't respond.)", 'With no answer, Onboarding will end up with its own “standard”.'],
    },
  },
}

/** Mapa de squads en el idioma pedido. */
export function squadsFor(lang: AcademyLang = 'es'): Squad[] {
  return lang === 'en' ? SQUADS.map((q) => ({ ...q, context: SQUAD_CONTEXT_EN[q.id] })) : SQUADS
}

export function painsFor(lang: AcademyLang = 'es'): string[] {
  return lang === 'en' ? PAINS_EN : PAINS
}

export function sectionsFor(lang: AcademyLang = 'es'): Section[] {
  if (lang !== 'en') return SECTIONS
  return SECTIONS.map((s) => ({
    ...s,
    title: SECTION_TITLE_EN[s.id],
    options: s.options.map((o) => ({ ...o, text: OPT_EN[s.id][o.id][0], why: OPT_EN[s.id][o.id][1] })),
  }))
}

export function commentsFor(lang: AcademyLang = 'es'): SquadComment[] {
  if (lang !== 'en') return COMMENTS
  return COMMENTS.map((c) => ({
    ...c,
    author: COMMENT_EN[c.id].author,
    text: COMMENT_EN[c.id].text,
    responses: c.responses.map((o) => ({ ...o, text: COMMENT_EN[c.id].r[o.id][0], why: COMMENT_EN[c.id].r[o.id][1] })),
  }))
}

export interface RfcState {
  choices: Partial<Record<Section['id'], string>>
  sent: boolean
  responses: Record<string, string>
  adr: boolean
}

export const INITIAL_RFC: RfcState = { choices: {}, sent: false, responses: {}, adr: false }

const APP = 'kobalto-rfc'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `rfc.${action}`, status: 'ok', bugs: [], cost, flags }
}

const pick = (sectionId: Section['id'], optionId: string | undefined) => SECTIONS.find((s) => s.id === sectionId)?.options.find((o) => o.id === optionId)

export function choose(state: RfcState, sectionId: Section['id'], optionId: string, lang: AcademyLang = 'es'): { state: RfcState; event: AppEvent } {
  if (state.sent || !pick(sectionId, optionId)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  return { state: { ...state, choices: { ...state.choices, [sectionId]: optionId } }, event: event('choose', `RFC · ${sectionId}: ${optionId}.`, 0) }
}

export function evaluateRfc(choices: RfcState['choices']) {
  const chosen = SECTIONS.map((s) => pick(s.id, choices[s.id]))
  return {
    complete: chosen.every(Boolean),
    good: chosen.filter((o) => o?.good).length,
    imposed: choices.scope === 'one_tool' || choices.migration === 'big_bang',
  }
}

export function sendRfc(state: RfcState, lang: AcademyLang = 'es'): { state: RfcState; event: AppEvent } {
  const r = evaluateRfc(state.choices)
  if (state.sent || !r.complete) return { state, event: event('noop', tr(lang, 'Completa antes las cuatro secciones.', 'First complete the four sections.'), 0) }
  const flags = ['rfc.sent']
  if (r.good === SECTIONS.length) flags.push('rfc.good')
  if (r.imposed) flags.push('rfc.imposed')
  if (state.choices.governance === 'adr_guild') flags.push('governance.ok')
  if (state.choices.migration === 'incremental') flags.push('migration.ok')
  return { state: { ...state, sent: true }, event: event('send', tr(lang, `RFC enviado a los cinco squads: ${r.good} de ${SECTIONS.length} secciones bien planteadas.`, `RFC sent to the five squads: ${r.good} of ${SECTIONS.length} sections well framed.`), 20, flags) }
}

export function respond(state: RfcState, commentId: string, responseId: string, lang: AcademyLang = 'es'): { state: RfcState; event: AppEvent } {
  const c = COMMENTS.find((x) => x.id === commentId)
  if (!state.sent || state.adr || !c?.responses.some((r) => r.id === responseId)) return { state, event: event('noop', tr(lang, 'Sin cambios.', 'No changes.'), 0) }
  return { state: { ...state, responses: { ...state.responses, [commentId]: responseId } }, event: event('respond', tr(lang, `Respuesta a ${c.squad}.`, `Reply to ${c.squad}.`), 5) }
}

export function evaluateResponses(responses: Record<string, string>) {
  const good = COMMENTS.filter((c) => c.responses.find((r) => r.id === responses[c.id])?.good).length
  return { complete: COMMENTS.every((c) => !!responses[c.id]), good }
}

export function publishAdr(state: RfcState, lang: AcademyLang = 'es'): { state: RfcState; event: AppEvent } {
  const r = evaluateResponses(state.responses)
  if (!state.sent || state.adr || !r.complete) return { state, event: event('noop', tr(lang, 'Responde antes a los comentarios de los squads.', 'First reply to the squads’ comments.'), 0) }
  const flags = ['adr.published']
  if (state.responses.c_pagos === 'adapt' && state.choices.migration === 'incremental') flags.push('pagos.ok')
  if (state.responses.c_ui === 'adapt') flags.push('ui.scoped')
  if (r.good === COMMENTS.length && evaluateRfc(state.choices).good === SECTIONS.length) flags.push('adoption.ok')
  return { state: { ...state, adr: true }, event: event('adr', tr(lang, `ADR publicado con ${r.good} de ${COMMENTS.length} comentarios incorporados con criterio.`, `ADR published with ${r.good} of ${COMMENTS.length} comments incorporated with judgment.`), 15, flags) }
}
