import type { Mission } from '../../../../engine/types'
import { m00PrimeraConsultaEn } from './m00'
import { m01FiltrarEn } from './m01'
import { m02OrdenarEn } from './m02'
import { m03NulosEn } from './m03'
import { m04ContarEn } from './m04'
import { m05AgruparEn } from './m05'
import { m06JoinEn } from './m06'
import { m07LeftJoinEn } from './m07'
import { m08ModificarEn } from './m08'
import { m09CrearTablaEn } from './m09'
import { m10ExamenEn } from './m10'

/**
 * Misiones en inglés del curso «SQL desde cero». Cada fichero de en/ es la
 * versión inglesa del homónimo en español: parte de la misión española y
 * sustituye solo los textos (ver content/overlay.ts y i18nParity.test.ts).
 */
export const MISSIONS_EN: Mission[] = [m00PrimeraConsultaEn, m01FiltrarEn, m02OrdenarEn, m03NulosEn, m04ContarEn, m05AgruparEn, m06JoinEn, m07LeftJoinEn, m08ModificarEn, m09CrearTablaEn, m10ExamenEn]
