import type { Mission } from '../../../../engine/types'
import { m00HolaKarateEn } from './m00-hola-karate'
import { m01MatchEn } from './m01-match'
import { m02ConfigEn } from './m02-config'
import { m03PayloadsEn } from './m03-payloads'
import { m04DatosEn } from './m04-datos'
import { m05AuthEn } from './m05-auth'
import { m06ErroresEn } from './m06-errores'
import { m07MocksEn } from './m07-mocks'
import { m08PipelineEn } from './m08-pipeline'
import { m09FrameworkEn } from './m09-framework'
import { m10ExamenEn } from './m10-examen'

/**
 * Misiones en inglés del curso de Karate. Cada fichero de en/ es la traducción
 * del homónimo en español, con la misma estructura e ids (ver i18nParity.test.ts).
 */
export const MISSIONS_EN: Mission[] = [
  m00HolaKarateEn, m01MatchEn, m02ConfigEn, m03PayloadsEn, m04DatosEn, m05AuthEn,
  m06ErroresEn, m07MocksEn, m08PipelineEn, m09FrameworkEn, m10ExamenEn,
]
