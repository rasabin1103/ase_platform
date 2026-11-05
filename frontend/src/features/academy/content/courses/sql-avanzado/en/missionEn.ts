import type { Mission, World } from '../../../../engine/types'
import { overlay, type Patch } from '../../../overlay'
import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'

/**
 * English version of a Spanish mission: same structure, ids, flags, effects and
 * SQL (see ../../../overlay.ts); only the player-facing text is replaced.
 * Table and column names stay in Spanish because they belong to the database.
 */
export function missionEn(es: Mission, patch: Record<string, Patch>, world: World = kobaltoDataWorldEn(ROLES_EN)): Mission {
  return { ...overlay(es, { ...patch, lang: 'en' }), world }
}

/** Roles of the cast in the English version of the course. */
export const ROLES_EN = {
  marta: 'Product Owner · Payments',
  diego: 'Backend developer · Transfers',
  nuria: 'Customer Support',
  laura: 'QA Lead',
  ines: 'Head of Data · your mentor',
}

/** The parts every mission of the course shares in English. */
export const COMMON_EN = {
  playerRole: 'QA · Data · Kobalto',
  appLabel: 'SQL console',
  wikiLabel: 'Wiki · Data',
}
