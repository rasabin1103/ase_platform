import type { Mission } from '../../../../engine/types'
import { m00LaFirmaEn } from './m00'
import { m01CuelloBotellaEn } from './m01'
import { m02SuiteEn } from './m02'
import { m03JuniorEn } from './m03'
import { m04EstandarEn } from './m04'
import { m05ComprarEn } from './m05'
import { m06PrimerEquipoEn } from './m06'
import { m07ConversacionEn } from './m07'
import { m08ContratarEn } from './m08'
import { m09RecortesEn } from './m09'
import { m10IncidenteEn } from './m10'
import { m11EstrategiaEn } from './m11'

/**
 * Misiones en inglés del curso «Gestión de equipos QA». Cada fichero de en/ es
 * la versión inglesa del homónimo en español: parte de la misión española y
 * sustituye solo los textos (ver content/overlay.ts y i18nParity.test.ts).
 */
export const MISSIONS_EN: Mission[] = [m00LaFirmaEn, m01CuelloBotellaEn, m02SuiteEn, m03JuniorEn, m04EstandarEn, m05ComprarEn, m06PrimerEquipoEn, m07ConversacionEn, m08ContratarEn, m09RecortesEn, m10IncidenteEn, m11EstrategiaEn]
