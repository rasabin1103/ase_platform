import type { Mission } from '../../../engine/types'
import { m00LoQueHizo } from './m00-lo-que-hizo'
import { m01Bordes } from './m01-bordes'
import { m02DatosPrueba } from './m02-datos-prueba'
import { m03CeroFilas } from './m03-cero-filas'
import { m04Conciliar } from './m04-conciliar'
import { m05Migracion } from './m05-migracion'
import { m06Informe } from './m06-informe'
import { m07Estados } from './m07-estados'
import { m08Reglas } from './m08-reglas'
import { m09Rendimiento } from './m09-rendimiento'
import { m10Examen } from './m10-examen'

/** Misiones del curso «SQL para QA», en orden (las registra content/registry.ts). */
export const MISSIONS_SQQ: Mission[] = [m00LoQueHizo, m01Bordes, m02DatosPrueba, m03CeroFilas, m04Conciliar, m05Migracion, m06Informe, m07Estados, m08Reglas, m09Rendimiento, m10Examen]
