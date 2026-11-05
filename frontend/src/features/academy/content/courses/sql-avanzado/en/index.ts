import type { Mission } from '../../../../engine/types'
import { m00JerarquiasEn } from './m00'
import { m01VentanasEn } from './m01'
import { m02RachasEn } from './m02'
import { m03SubtotalesEn } from './m03'
import { m04JsonEn } from './m04'
import { m05ModificarEn } from './m05'
import { m06ReglasEn } from './m06'
import { m07FuncionesEn } from './m07'
import { m08IndicesEn } from './m08'
import { m09RendimientoEn } from './m09'
import { m10ExamenEn } from './m10'

/**
 * Misiones en inglés del curso «SQL avanzado». Cada fichero de en/ es la
 * versión inglesa del homónimo en español: parte de la misión española y
 * sustituye solo los textos (ver content/overlay.ts y parity.test.ts).
 */
export const MISSIONS_EN: Mission[] = [m00JerarquiasEn, m01VentanasEn, m02RachasEn, m03SubtotalesEn, m04JsonEn, m05ModificarEn, m06ReglasEn, m07FuncionesEn, m08IndicesEn, m09RendimientoEn, m10ExamenEn]
