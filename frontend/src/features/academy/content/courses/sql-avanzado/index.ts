import type { Mission } from '../../../engine/types'
import { m00Jerarquias } from './m00-jerarquias'
import { m01Ventanas } from './m01-ventanas'
import { m02Rachas } from './m02-rachas'
import { m03Subtotales } from './m03-subtotales'
import { m04Json } from './m04-json'
import { m05Modificar } from './m05-modificar'
import { m06Reglas } from './m06-reglas'
import { m07Funciones } from './m07-funciones'
import { m08Indices } from './m08-indices'
import { m09Rendimiento } from './m09-rendimiento'
import { m10Examen } from './m10-examen'

/** Misiones del curso «SQL avanzado», en orden (las registra content/registry.ts). */
export const MISSIONS_SQA: Mission[] = [m00Jerarquias, m01Ventanas, m02Rachas, m03Subtotales, m04Json, m05Modificar, m06Reglas, m07Funciones, m08Indices, m09Rendimiento, m10Examen]
