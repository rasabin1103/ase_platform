import type { Mission, World } from '../../../../engine/types'
import { overlay, type Patch } from '../../../overlay'

/**
 * English version of a Spanish mission: same structure, ids, flags, effects and
 * SQL (see ../../../overlay.ts); only the player-facing text is replaced.
 * Table and column names stay in Spanish because they belong to the database.
 */
export function missionEn(es: Mission, patch: Record<string, Patch>, world: World): Mission {
  return { ...overlay(es, { ...patch, lang: 'en' }), world }
}
