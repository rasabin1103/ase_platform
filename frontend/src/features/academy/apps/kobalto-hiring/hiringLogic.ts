import type { AppEvent } from '../../engine/types'
import { tr, type AcademyLang } from '../../i18n'

/**
 * App «Contratación» del curso 4, misión 8 (Contratar): perfil según las
 * necesidades del equipo, formato de entrevista y proceso, tarjeta de
 * evaluación de cinco candidatos y decisión para tres vacantes.
 * Evaluación determinista.
 */

/** Lo que le falta al área (pestaña «Perfil y proceso»). */
export const NEEDS = [
  'Nadie del área sabe hacer pruebas de rendimiento, y el año que viene llegan las campañas de Banca diaria.',
  'La automatización de APIs no está en el pipeline en tres de los seis squads.',
  'Hay cuatro QA junior y los leads no tienen tiempo de acompañarlos.',
  'Los QA tienen que explicar riesgos a negocio y a veces no se les entiende.',
  'El proceso actual tarda siete semanas: el mes pasado se perdieron dos candidatos.',
]

export interface Item {
  id: string
  text: string
  good: boolean
  why: string
}

export const REQUIREMENTS: Item[] = [
  { id: 'api_ci', text: 'Automatiza pruebas de API y las integra en el pipeline', good: true, why: 'Cubre el hueco de automatización en tres squads.' },
  { id: 'perf', text: 'Sabe hacer pruebas de rendimiento (al menos una de las tres vacantes)', good: true, why: 'Nadie del área sabe y llegan las campañas.' },
  { id: 'comm', text: 'Explica riesgos a negocio con claridad', good: true, why: 'Es una carencia real del área.' },
  { id: 'mentor', text: 'Quiere acompañar a QA junior', good: true, why: 'Hay cuatro junior y los leads no llegan.' },
  { id: 'degree', text: 'Título de Ingeniería obligatorio', good: false, why: 'No predice el desempeño y excluye perfiles válidos.' },
  { id: 'years', text: 'Diez años de experiencia como mínimo', good: false, why: 'Infla el perfil y deja fuera a gente que ya hace el trabajo.' },
  { id: 'tool', text: 'Conoce exactamente nuestra herramienta', good: false, why: 'Se aprende en semanas: no es un criterio de entrada.' },
  { id: 'fit', text: 'Que «encaje» con el equipo', good: false, why: 'Sin definir, «encajar» acaba siendo «se parece a nosotros»: es la puerta del sesgo.' },
]

export interface Step {
  id: 'format' | 'process'
  title: string
  options: Item[]
}

export const STEPS: Step[] = [
  {
    id: 'format',
    title: 'Formato de la entrevista',
    options: [
      { id: 'structured', text: 'Estructurada: las mismas preguntas para todos, un ejercicio realista (revisar y ampliar una suite de API) y una tarjeta con los criterios del perfil y una escala de 1 a 4. Cada entrevistador puntúa por separado antes del debate.', good: true, why: 'Compara a todos con lo mismo y reduce el sesgo de la primera impresión.' },
      { id: 'chat', text: 'Conversación libre: cada entrevistador pregunta lo que le parece y se decide por la impresión.', good: false, why: 'Cada uno mide una cosa distinta: gana quien cae mejor.' },
      { id: 'puzzles', text: 'Acertijos de lógica y algoritmos en pizarra.', good: false, why: 'No se parecen al trabajo que harán.' },
    ],
  },
  {
    id: 'process',
    title: 'Proceso',
    options: [
      { id: 'fast', text: 'Dos entrevistas en una misma semana (técnica con ejercicio y con el equipo), respuesta en 48 horas.', good: true, why: 'Rápido y suficiente: no se pierden candidatos.' },
      { id: 'long', text: 'Cinco rondas, con alguien de cada área.', good: false, why: 'Siete semanas otra vez: los buenos aceptan otra oferta.' },
      { id: 'wait', text: 'Esperar a tener veinte candidatos y entrevistarlos a la vez.', good: false, why: 'Los primeros se van mientras esperas.' },
    ],
  },
]

export type CriterionId = 'api_ci' | 'perf' | 'comm' | 'mentor'
export const CRITERIA: { id: CriterionId; label: string }[] = [
  { id: 'api_ci', label: 'API y pipeline' },
  { id: 'perf', label: 'Rendimiento' },
  { id: 'comm', label: 'Explicar riesgos' },
  { id: 'mentor', label: 'Acompañar a junior' },
]

export type Decision = 'hire' | 'no'

export interface Candidate {
  id: string
  name: string
  background: string
  /** Lo que se comenta de él o ella fuera de la tarjeta. */
  impression: string
  /** Media del panel por criterio (1–4). */
  scores: Record<CriterionId, number>
  evidence: string
  best: Decision
}

export const CANDIDATES: Candidate[] = [
  {
    id: 'marcos',
    name: 'Marcos Ibarra',
    background: '8 años en consultoría. Trabajó con Raúl en su anterior empresa.',
    impression: 'Recomendado por el CTO. Muy buena conversación, todo el panel salió de buen humor.',
    scores: { api_ci: 1, perf: 1, comm: 4, mentor: 2 },
    evidence: 'En el ejercicio no llegó a ejecutar la suite en el pipeline; reconoció no haber automatizado en los últimos tres años. Explicó muy bien un riesgo a negocio.',
    best: 'no',
  },
  {
    id: 'ana',
    name: 'Ana Ferrer',
    background: '5 años de QA en una aseguradora.',
    impression: 'Algo seca en la entrevista con el equipo.',
    scores: { api_ci: 4, perf: 2, comm: 3, mentor: 4 },
    evidence: 'Amplió la suite y la integró en el pipeline en el tiempo del ejercicio. Mentoriza a dos junior en su empresa actual.',
    best: 'hire',
  },
  {
    id: 'javier',
    name: 'Javier Molina',
    background: '6 años; los dos últimos, pruebas de rendimiento en un comercio electrónico.',
    impression: 'Le cuesta hablar en público.',
    scores: { api_ci: 3, perf: 4, comm: 2, mentor: 3 },
    evidence: 'Diseñó una prueba de carga razonable para la API de transferencias y explicó cómo interpretar los resultados.',
    best: 'hire',
  },
  {
    id: 'rocio',
    name: 'Rocío Pardo',
    background: 'Sin título universitario. 3 años en atención al cliente y 2 como QA tras un bootcamp.',
    impression: 'Nerviosa al principio. «No es el perfil de siempre».',
    scores: { api_ci: 3, perf: 1, comm: 4, mentor: 3 },
    evidence: 'Resolvió bien el ejercicio de API. Explicó un riesgo desde el punto de vista del cliente mejor que nadie. Ya acompaña a una junior.',
    best: 'hire',
  },
  {
    id: 'luis',
    name: 'Luis Rey',
    background: '12 años, ingeniero, conoce nuestra herramienta.',
    impression: 'Cumple todo lo del anuncio antiguo.',
    scores: { api_ci: 2, perf: 2, comm: 1, mentor: 1 },
    evidence: 'Sus tests del ejercicio no comprobaban la respuesta. Fue despectivo con la entrevistadora junior del panel.',
    best: 'no',
  },
]
export const VACANCIES = 3

const NEEDS_EN = [
  'Nobody in the area knows how to do performance testing, and next year the Daily Banking campaigns arrive.',
  'API automation is not in the pipeline in three of the six squads.',
  'There are four junior QAs and the leads have no time to mentor them.',
  'QAs have to explain risks to the business and sometimes they are not understood.',
  'The current process takes seven weeks: last month two candidates were lost.',
]

const REQ_EN: Record<string, [string, string]> = {
  api_ci: ['Automates API tests and integrates them into the pipeline', 'It covers the automation gap in three squads.'],
  perf: ['Can do performance testing (at least one of the three vacancies)', 'Nobody in the area can and the campaigns are coming.'],
  comm: ['Explains risks to the business clearly', 'It is a real gap in the area.'],
  mentor: ['Wants to mentor junior QAs', 'There are four juniors and the leads cannot cope.'],
  degree: ['Engineering degree mandatory', 'It does not predict performance and excludes valid profiles.'],
  years: ['Ten years of experience minimum', 'It inflates the profile and leaves out people who already do the job.'],
  tool: ['Knows exactly our tool', 'It is learned in weeks: it is not an entry criterion.'],
  fit: ['That they “fit” the team', 'Undefined, “fit” ends up meaning “is like us”: it is the door to bias.'],
}

const STEPS_EN: Record<string, { title: string; o: Record<string, [string, string]> }> = {
  format: {
    title: 'Interview format',
    o: {
      structured: ['Structured: the same questions for everyone, a realistic exercise (review and extend an API suite) and a scorecard with the profile criteria and a scale from 1 to 4. Each interviewer scores separately before the discussion.', 'It compares everyone against the same thing and reduces first-impression bias.'],
      chat: ['Free conversation: each interviewer asks whatever they like and the decision is made on impression.', 'Each one measures something different: the best-liked wins.'],
      puzzles: ['Logic and algorithm puzzles on a whiteboard.', 'They do not resemble the work they will do.'],
    },
  },
  process: {
    title: 'Process',
    o: {
      fast: ['Two interviews in the same week (technical with the exercise and with the team), answer within 48 hours.', 'Fast and enough: candidates are not lost.'],
      long: ['Five rounds, with someone from each area.', 'Seven weeks again: the good ones accept another offer.'],
      wait: ['Wait until you have twenty candidates and interview them all at once.', 'The first ones leave while you wait.'],
    },
  },
}

const CRITERIA_EN: Record<CriterionId, string> = { api_ci: 'API and pipeline', perf: 'Performance', comm: 'Explaining risks', mentor: 'Mentoring juniors' }

const CAND_EN: Record<string, Pick<Candidate, 'background' | 'impression' | 'evidence'>> = {
  marcos: { background: '8 years in consulting. Worked with Raúl at his previous company.', impression: 'Recommended by the CTO. A very good conversation, the whole panel left in a good mood.', evidence: 'In the exercise he did not manage to run the suite in the pipeline; he admitted not having automated in the last three years. He explained a business risk very well.' },
  ana: { background: '5 years of QA at an insurer.', impression: 'A bit dry in the interview with the team.', evidence: 'She extended the suite and integrated it into the pipeline within the exercise time. She mentors two juniors at her current company.' },
  javier: { background: '6 years; the last two, performance testing at an e-commerce company.', impression: 'He struggles to speak in public.', evidence: 'He designed a reasonable load test for the transfers API and explained how to interpret the results.' },
  rocio: { background: 'No university degree. 3 years in customer service and 2 as QA after a bootcamp.', impression: 'Nervous at first. “Not the usual profile”.', evidence: 'She solved the API exercise well. She explained a risk from the customer’s point of view better than anyone. She already mentors a junior.' },
  luis: { background: '12 years, engineer, knows our tool.', impression: 'Meets everything in the old job ad.', evidence: "His exercise tests did not check the response. He was dismissive toward the junior interviewer on the panel." },
}

export function needsFor(lang: AcademyLang = 'es'): string[] {
  return lang === 'en' ? NEEDS_EN : NEEDS
}
export function requirementsFor(lang: AcademyLang = 'es'): Item[] {
  return lang === 'en' ? REQUIREMENTS.map((r) => ({ ...r, text: REQ_EN[r.id][0], why: REQ_EN[r.id][1] })) : REQUIREMENTS
}
export function stepsFor(lang: AcademyLang = 'es'): Step[] {
  if (lang !== 'en') return STEPS
  return STEPS.map((st) => ({ ...st, title: STEPS_EN[st.id].title, options: st.options.map((o) => ({ ...o, text: STEPS_EN[st.id].o[o.id][0], why: STEPS_EN[st.id].o[o.id][1] })) }))
}
export function criteriaFor(lang: AcademyLang = 'es'): { id: CriterionId; label: string }[] {
  return lang === 'en' ? CRITERIA.map((c) => ({ ...c, label: CRITERIA_EN[c.id] })) : CRITERIA
}
export function candidatesFor(lang: AcademyLang = 'es'): Candidate[] {
  return lang === 'en' ? CANDIDATES.map((c) => ({ ...c, ...CAND_EN[c.id] })) : CANDIDATES
}

export interface HiringState {
  requirements: string[]
  steps: Partial<Record<Step['id'], string>>
  profileSaved: boolean
  decisions: Record<string, Decision | ''>
  decided: boolean
}

export const INITIAL_HIRING: HiringState = { requirements: [], steps: {}, profileSaved: false, decisions: Object.fromEntries(CANDIDATES.map((c) => [c.id, ''])) as Record<string, Decision | ''>, decided: false }

const APP = 'kobalto-hiring'

function event(action: string, summary: string, cost: number, flags: string[] = []): AppEvent {
  return { app: APP, action, summary, technical: `hiring.${action}`, status: 'ok', bugs: [], cost, flags }
}
const noop = (state: HiringState, summary = 'Sin cambios.') => ({ state, event: event('noop', summary, 0) })

export function toggleRequirement(state: HiringState, id: string, lang: AcademyLang = 'es'): { state: HiringState; event: AppEvent } {
  if (state.profileSaved || !REQUIREMENTS.some((r) => r.id === id)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  const requirements = state.requirements.includes(id) ? state.requirements.filter((r) => r !== id) : [...state.requirements, id]
  return { state: { ...state, requirements }, event: event('requirement', tr(lang, `Perfil: ${requirements.length} requisitos.`, `Profile: ${requirements.length} requirements.`), 0) }
}

export function chooseStep(state: HiringState, stepId: Step['id'], optionId: string, lang: AcademyLang = 'es'): { state: HiringState; event: AppEvent } {
  if (state.profileSaved || !STEPS.find((s) => s.id === stepId)?.options.some((o) => o.id === optionId)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, steps: { ...state.steps, [stepId]: optionId } }, event: event('step', tr(lang, `Proceso · ${stepId}: ${optionId}.`, `Process · ${stepId}: ${optionId}.`), 0) }
}

export function evaluateProfile(state: HiringState) {
  const chosen = REQUIREMENTS.filter((r) => state.requirements.includes(r.id))
  const profileOk = REQUIREMENTS.filter((r) => r.good).every((r) => state.requirements.includes(r.id)) && chosen.every((r) => r.good)
  const steps = STEPS.map((s) => s.options.find((o) => o.id === state.steps[s.id]))
  return { complete: chosen.length >= 2 && steps.every(Boolean), profileOk, ready: profileOk && steps.every((o) => o?.good) }
}

export function saveProfile(state: HiringState, lang: AcademyLang = 'es'): { state: HiringState; event: AppEvent } {
  const r = evaluateProfile(state)
  if (state.profileSaved || !r.complete) return noop(state, tr(lang, 'Elige los requisitos, el formato y el proceso.', 'Choose the requirements, the format and the process.'))
  const flags = ['profile.saved']
  if (r.profileOk) flags.push('profile.ok')
  if (state.steps.format === 'structured') flags.push('interview.structured')
  if (r.ready) flags.push('process.ready')
  return { state: { ...state, profileSaved: true }, event: event('profile', tr(lang, 'Perfil y proceso publicados para el panel.', 'Profile and process published for the panel.'), 10, flags) }
}

export function decide(state: HiringState, candidateId: string, decision: Decision | '', lang: AcademyLang = 'es'): { state: HiringState; event: AppEvent } {
  if (state.decided || !CANDIDATES.some((c) => c.id === candidateId)) return noop(state, tr(lang, 'Sin cambios.', 'No changes.'))
  return { state: { ...state, decisions: { ...state.decisions, [candidateId]: decision } }, event: event('decide', `${candidateId}: ${decision || '—'}.`, 0) }
}

export function evaluateDecisions(decisions: HiringState['decisions']) {
  const hires = CANDIDATES.filter((c) => decisions[c.id] === 'hire').length
  return {
    complete: CANDIDATES.every((c) => !!decisions[c.id]),
    hires,
    right: CANDIDATES.filter((c) => decisions[c.id] === c.best).length,
  }
}

export function submitDecisions(state: HiringState, lang: AcademyLang = 'es'): { state: HiringState; event: AppEvent } {
  const r = evaluateDecisions(state.decisions)
  if (state.decided || !state.profileSaved || !r.complete || r.hires === 0 || r.hires > VACANCIES)
    return noop(state, tr(lang, `Publica antes el perfil y decide sobre todos (como mucho ${VACANCIES} contrataciones).`, `First publish the profile and decide on everyone (at most ${VACANCIES} hires).`))
  const flags = ['hiring.decided']
  if (r.right === CANDIDATES.length) flags.push('hiring.ok')
  for (const c of CANDIDATES) flags.push(`${state.decisions[c.id] === 'hire' ? 'hire' : 'reject'}.${c.id}`)
  return { state: { ...state, decided: true }, event: event('decide_all', tr(lang, `Decisión del panel enviada: ${r.hires} contrataciones.`, `Panel decision sent: ${r.hires} hires.`), 15, flags) }
}
