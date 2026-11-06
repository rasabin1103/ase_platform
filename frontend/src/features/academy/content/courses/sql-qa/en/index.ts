import type { Mission } from '../../../../engine/types'
import { m00LoQueHizoEn } from './m00'
import { m01BordesEn } from './m01'
import { m02DatosPruebaEn } from './m02'
import { m03CeroFilasEn } from './m03'
import { m04ConciliarEn } from './m04'
import { m05MigracionEn } from './m05'
import { m06InformeEn } from './m06'
import { m07EstadosEn } from './m07'
import { m08ReglasEn } from './m08'
import { m09RendimientoEn } from './m09'
import { m10ExamenEn } from './m10'

/**
 * Misiones en inglés del curso «SQL para QA». Cada fichero de en/ es la
 * versión inglesa del homónimo en español: parte de la misión española y
 * sustituye solo los textos (ver content/overlay.ts y parity.test.ts).
 */
export const MISSIONS_EN: Mission[] = [m00LoQueHizoEn, m01BordesEn, m02DatosPruebaEn, m03CeroFilasEn, m04ConciliarEn, m05MigracionEn, m06InformeEn, m07EstadosEn, m08ReglasEn, m09RendimientoEn, m10ExamenEn]
