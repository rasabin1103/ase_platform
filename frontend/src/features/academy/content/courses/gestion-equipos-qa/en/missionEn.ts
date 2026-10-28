import type { Mission, World } from '../../../../engine/types'
import { overlay, type Patch } from '../../../overlay'

/**
 * English version of a Spanish mission: same structure, ids, flags, effects and
 * SQL (see ../../../overlay.ts); only the player-facing text is replaced.
 * Ids, flags, effects and conditions are inherited from the Spanish original.
 */
export function missionEn(es: Mission, patch: Record<string, Patch>, world: World): Mission {
  return { ...overlay(es, { ...patch, lang: 'en' }), world }
}
