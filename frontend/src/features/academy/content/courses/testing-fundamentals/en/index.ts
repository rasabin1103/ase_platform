import type { Mission } from '../../../../engine/types'
import { MISSIONS as A } from './missions-a'
import { MISSIONS as B } from './missions-b'

/**
 * Misiones en inglés de este curso. Cada fichero de en/ es la traducción del
 * homónimo en español, con la misma estructura e ids (ver i18nParity.test.ts).
 */
export const MISSIONS_EN: Mission[] = [...A, ...B]
