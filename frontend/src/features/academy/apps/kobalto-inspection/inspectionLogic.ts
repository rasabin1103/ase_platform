import type { AppEvent } from '../../engine/types'

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

export const PEOPLE: { id: string; name: string; note: string }[] = [
  { id: 'player', name: 'Tú (QA del squad)', note: 'Organizas la revisión' },
  { id: 'tomas', name: 'Tomás Ferrer', note: 'Desarrollador senior: implementará la funcionalidad' },
  { id: 'sofia', name: 'Sofía Reyes', note: 'Desarrolladora junior' },
  { id: 'carmen', name: 'Carmen López', note: 'Riesgos y Compliance: conoce la normativa de facturación' },
  { id: 'laura', name: 'Laura Méndez', note: 'QA Lead, con experiencia en moderar inspecciones' },
  { id: 'raul', name: 'Raúl Ortega', note: 'Engineering Manager: jefe de casi todos los asistentes' },
]

export const AUTHOR = { id: 'elena', name: 'Elena Prieto', note: 'Product Owner · autora del documento' }

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

export function evaluatePlan(plan: InspectionPlan): { flags: string[]; notes: string[] } {
  const flags = ['review.convened', `review.type.${plan.type}`]
  const notes: string[] = []
  const r = plan.roles
  const moderators = Object.entries(r).filter(([, v]) => v === 'moderator').map(([k]) => k)
  const scribes = Object.entries(r).filter(([, v]) => v === 'scribe').map(([k]) => k)
  for (const id of ['tomas', 'sofia', 'carmen', 'laura']) if (r[id] === 'reviewer' || r[id] === 'moderator' || r[id] === 'scribe') flags.push(`role.in.${id}`)
  for (const id of ['tomas', 'sofia', 'carmen']) if (r[id] === 'reviewer') flags.push(`role.reviewer.${id}`)
  if (r.raul && r.raul !== 'none') {
    flags.push('role.manager.in')
    notes.push('Raúl (el jefe) está en la reunión: la gente tiende a callarse defectos delante de quien les evalúa.')
  }
  if (moderators.length !== 1) {
    flags.push('role.moderator.bad')
    notes.push(moderators.length === 0 ? 'Nadie modera la reunión.' : 'Hay más de una persona moderando.')
  }
  if (scribes.length === 0) {
    flags.push('role.no_scribe')
    notes.push('Nadie registra los defectos: sin acta no hay evidencia ni seguimiento.')
  }
  if (plan.checklist) flags.push('review.checklist')
  const formalOk = plan.type === 'inspection' && moderators.length === 1 && scribes.length > 0 && r.carmen === 'reviewer' && (!r.raul || r.raul === 'none')
  if (formalOk) flags.push('review.roles.ok')
  return { flags, notes }
}

export function convene(state: InspectionState, plan: InspectionPlan): { state: InspectionState; event: AppEvent } {
  const { flags, notes } = evaluatePlan(plan)
  const type = REVIEW_TYPES.find((t) => t.id === plan.type)!.label
  const who = PEOPLE.filter((p) => plan.roles[p.id] && plan.roles[p.id] !== 'none').map((p) => `${p.name.split(' ')[0]} (${ROLE_LABEL[plan.roles[p.id]].toLowerCase()})`)
  return {
    state: { ...state, plan },
    event: {
      app: 'kobalto-inspection',
      action: 'convene',
      summary: `Revisión convocada: ${type}. Participantes: Elena (autora), ${who.join(', ')}.${plan.checklist ? ' Con checklist de especificaciones.' : ''}${notes.length ? ` Avisos: ${notes.join(' ')}` : ''}`,
      technical: `review.plan ${JSON.stringify(plan)}`,
      status: 'ok',
      bugs: [],
      cost: 15,
      flags,
    },
  }
}

/** Seguimiento: comprobar que las correcciones de la autora cierran de verdad los defectos. */
export function followUp(state: InspectionState, ivaFound: boolean): { state: InspectionState; event: AppEvent } {
  return {
    state: { ...state, followUp: true },
    event: {
      app: 'kobalto-inspection',
      action: 'follow_up',
      summary: ivaFound
        ? 'Seguimiento: todas las correcciones cerradas salvo una. En el IVA, Elena puso «por línea», pero el ejemplo sigue calculando sobre el total. Se reabre y se corrige antes del paso a desarrollo.'
        : 'Seguimiento: las correcciones registradas en el acta están cerradas y verificadas.',
      technical: 'review.follow_up',
      status: 'ok',
      bugs: [],
      cost: 15,
      flags: ['review.followup', 'fu.safe'],
    },
  }
}
