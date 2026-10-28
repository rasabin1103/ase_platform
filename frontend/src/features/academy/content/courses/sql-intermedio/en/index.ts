import type { Mission } from '../../../../engine/types'
import { m00SubconsultasEn } from './m00'
import { m01CteEn } from './m01'
import { m02FechasTextosEn } from './m02'
import { m03ConjuntosEn } from './m03'
import { m04InformesEn } from './m04'
import { m05RankingEn } from './m05'
import { m06TendenciasEn } from './m06'
import { m07CrucesEn } from './m07'
import { m08CalidadEn } from './m08'
import { m09VistasEn } from './m09'
import { m10ExamenEn } from './m10'

/**
 * Misiones en inglés del curso «SQL intermedio». Cada fichero de en/ es la
 * versión inglesa del homónimo en español: parte de la misión española y
 * sustituye solo los textos (ver content/overlay.ts y parity.test.ts).
 */
export const MISSIONS_EN: Mission[] = [
  m00SubconsultasEn,
  m01CteEn,
  m02FechasTextosEn,
  m03ConjuntosEn,
  m04InformesEn,
  m05RankingEn,
  m06TendenciasEn,
  m07CrucesEn,
  m08CalidadEn,
  m09VistasEn,
  m10ExamenEn,
]
