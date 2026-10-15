import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'

/**
 * App del curso 2, misión 1: sala de revisión. El jugador planifica la
 * revisión de una especificación (tipo de revisión y roles) y, tras la
 * reunión, hace el seguimiento de las correcciones. La revisión en sí (marcar
 * defectos y celebrar la reunión) usa la herramienta «Revisión» del motor.
 */

export type ReviewType = 'informal' | 'walkthrough' | 'technical' | 'inspection'
export type Role = 'moderator' | 'scribe' | 'reviewer' | 'none'

export const REVIEW_TYPES: { id: ReviewType; label: string; summary: string }[] = [
  { id: 'informal', label: 'Revisión informal', summary: 'Sin proceso definido ni registro formal. Rápida y barata.' },
  { id: 'walkthrough', label: 'Walkthrough (recorrido)', summary: 'La autora guía la lectura. Útil para formar y crear consenso; los revisores suelen no preparar.' },
  { id: 'technical', label: 'Revisión técnica', summary: 'Revisores técnicos con preparación, para lograr consenso y decidir sobre problemas técnicos.' },
  { id: 'inspection', label: 'Inspección', summary: 'La más formal: preparación individual, moderador, escriba, registro de defectos y métricas. Pensada para encontrar el máximo de defectos y dejar evidencia.' },
]

export const ROLE_LABEL: Record<Role, string> = {
  moderator: 'Moderación (facilita)',
  scribe: 'Escriba (registra)',
  reviewer: 'Revisor/a',
  none: 'No participa',
}

export const REVIEW_TYPES_EN: { id: ReviewType; label: string; summary: string }[] = [
  { id: 'informal', label: 'Informal review', summary: 'No defined process and no formal documented output. Quick and cheap.' },
  {
    id: 'walkthrough',
    label: 'Walkthrough',
    summary: 'Led by the author. Useful for educating reviewers and building consensus; reviewers often do not prepare individually.',
  },
  { id: 'technical', label: 'Technical review', summary: 'Technically qualified reviewers who prepare, to reach consensus and make decisions on technical problems.' },
  {
    id: 'inspection',
    label: 'Inspection',
    summary: 'The most formal: individual preparation, moderator, scribe, defect logging and metrics. Aimed at finding the maximum number of defects and leaving evidence.',
  },
]

export const ROLE_LABEL_EN: Record<Role, string> = {
  moderator: 'Moderator (facilitator)',
  scribe: 'Scribe (recorder)',
  reviewer: 'Reviewer',
  none: 'Not participating',
}

/** Tipos de revisión en el idioma pedido (mismos ids). */
export function reviewTypesFor(lang: AcademyLang = 'es'): typeof REVIEW_TYPES {
  return lang === 'en' ? REVIEW_TYPES_EN : REVIEW_TYPES
}

/** Etiquetas de los roles en el idioma pedido. */
export function roleLabelFor(lang: AcademyLang = 'es'): Record<Role, string> {
  return lang === 'en' ? ROLE_LABEL_EN : ROLE_LABEL
}

export const PEOPLE: { id: string; name: string; note: string }[] = [
  { id: 'player', name: 'Tú (QA del squad)', note: 'Organizas la revisión' },
  { id: 'tomas', name: 'Tomás Ferrer', note: 'Desarrollador senior: implementará la funcionalidad' },
  { id: 'sofia', name: 'Sofía Reyes', note: 'Desarrolladora junior' },
  { id: 'carmen', name: 'Carmen López', note: 'Riesgos y Compliance: conoce la normativa de facturación' },
  { id: 'laura', name: 'Laura Méndez', note: 'QA Lead, con experiencia en moderar inspecciones' },
  { id: 'raul', name: 'Raúl Ortega', note: 'Engineering Manager: jefe de casi todos los asistentes' },
]

export const AUTHOR = { id: 'elena', name: 'Elena Prieto', note: 'Product Owner · autora del documento' }

const PEOPLE_EN: Record<string, { name?: string; note: string }> = {
  player: { name: 'You (squad QA)', note: 'You organize the review' },
  tomas: { note: 'Senior developer: will implement the feature' },
  sofia: { note: 'Junior developer' },
  carmen: { note: 'Risk and Compliance: knows the billing regulations' },
  laura: { note: 'QA Lead, experienced in moderating inspections' },
  raul: { note: 'Engineering Manager: the boss of almost every attendee' },
}

/** Personas en el idioma pedido (mismos ids). */
export function peopleFor(lang: AcademyLang = 'es'): typeof PEOPLE {
  return lang === 'en' ? PEOPLE.map((p) => ({ ...p, ...PEOPLE_EN[p.id] })) : PEOPLE
}

/** Autora del documento en el idioma pedido. */
export function authorFor(lang: AcademyLang = 'es'): typeof AUTHOR {
  return lang === 'en' ? { ...AUTHOR, note: 'Product Owner · author of the document' } : AUTHOR
}

export interface InspectionPlan {
  type: ReviewType
  roles: Record<string, Role>
  checklist: boolean
}

export interface InspectionState {
  plan?: InspectionPlan
  followUp: boolean
}
export const INITIAL_INSPECTION: InspectionState = { followUp: false }

export function evaluatePlan(plan: InspectionPlan, lang: AcademyLang = 'es'): { flags: string[]; notes: string[] } {
  const en = lang === 'en'
  const flags = ['review.convened', `review.type.${plan.type}`]
  const notes: string[] = []
  const r = plan.roles
  const moderators = Object.entries(r).filter(([, v]) => v === 'moderator').map(([k]) => k)
  const scribes = Object.entries(r).filter(([, v]) => v === 'scribe').map(([k]) => k)
  for (const id of ['tomas', 'sofia', 'carmen', 'laura']) if (r[id] === 'reviewer' || r[id] === 'moderator' || r[id] === 'scribe') flags.push(`role.in.${id}`)
  for (const id of ['tomas', 'sofia', 'carmen']) if (r[id] === 'reviewer') flags.push(`role.reviewer.${id}`)
  if (r.raul && r.raul !== 'none') {
    flags.push('role.manager.in')
    notes.push(
      en
        ? 'Raúl (the boss) is in the meeting: people tend to keep quiet about defects in front of whoever evaluates them.'
        : 'Raúl (el jefe) está en la reunión: la gente tiende a callarse defectos delante de quien les evalúa.',
    )
  }
  if (moderators.length !== 1) {
    flags.push('role.moderator.bad')
    notes.push(
      moderators.length === 0
        ? en
          ? 'Nobody is moderating the meeting.'
          : 'Nadie modera la reunión.'
        : en
          ? 'More than one person is moderating.'
          : 'Hay más de una persona moderando.',
    )
  }
  if (scribes.length === 0) {
    flags.push('role.no_scribe')
    notes.push(
      en ? 'Nobody is logging the defects: without a review log there is no evidence and no follow-up.' : 'Nadie registra los defectos: sin acta no hay evidencia ni seguimiento.',
    )
  }
  if (plan.checklist) flags.push('review.checklist')
  const formalOk = plan.type === 'inspection' && moderators.length === 1 && scribes.length > 0 && r.carmen === 'reviewer' && (!r.raul || r.raul === 'none')
  if (formalOk) flags.push('review.roles.ok')
  return { flags, notes }
}

export function convene(state: InspectionState, plan: InspectionPlan, lang: AcademyLang = 'es'): { state: InspectionState; event: AppEvent } {
  const en = lang === 'en'
  const { flags, notes } = evaluatePlan(plan, lang)
  const type = reviewTypesFor(lang).find((t) => t.id === plan.type)!.label
  const roleLabel = roleLabelFor(lang)
  const who = peopleFor(lang)
    .filter((p) => plan.roles[p.id] && plan.roles[p.id] !== 'none')
    .map((p) => `${p.id === 'player' && en ? 'You' : p.name.split(' ')[0]} (${roleLabel[plan.roles[p.id]].toLowerCase()})`)
  return {
    state: { ...state, plan },
    event: {
      app: 'kobalto-inspection',
      action: 'convene',
      summary: en
        ? `Review convened: ${type}. Participants: Elena (author), ${who.join(', ')}.${plan.checklist ? ' With the specification checklist.' : ''}${notes.length ? ` Warnings: ${notes.join(' ')}` : ''}`
        : `Revisión convocada: ${type}. Participantes: Elena (autora), ${who.join(', ')}.${plan.checklist ? ' Con checklist de especificaciones.' : ''}${notes.length ? ` Avisos: ${notes.join(' ')}` : ''}`,
      technical: `review.plan ${JSON.stringify(plan)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}

/** Seguimiento: comprobar que las correcciones de la autora cierran de verdad los defectos. */
export function followUp(state: InspectionState, ivaFound: boolean, lang: AcademyLang = 'es'): { state: InspectionState; event: AppEvent } {
  const en = lang === 'en'
  return {
    state: { ...state, followUp: true },
    event: {
      app: 'kobalto-inspection',
      action: 'follow_up',
      summary: ivaFound
        ? en
          ? 'Follow-up: all fixes closed except one. For VAT, Elena wrote "per line", but the example still calculates on the total. It is reopened and fixed before handing over to development.'
          : 'Seguimiento: todas las correcciones cerradas salvo una. En el IVA, Elena puso «por línea», pero el ejemplo sigue calculando sobre el total. Se reabre y se corrige antes del paso a desarrollo.'
        : en
          ? 'Follow-up: the fixes recorded in the review log are closed and verified.'
          : 'Seguimiento: las correcciones registradas en el acta están cerradas y verificadas.',
      technical: 'review.follow_up',
      status: 'ok',
      bugs: [],
      cost: 15,
      flags: ['review.followup', 'fu.safe'],
    },
  }
}
