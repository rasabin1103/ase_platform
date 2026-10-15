import type { Mission } from '../../../../engine/types'
import { m00EquipoEn } from './m00-equipo'
import { m01InspeccionEn } from './m01-inspeccion'
import { m02GherkinEn } from './m02-gherkin'
import { m03CoberturaEn } from './m03-cobertura'

// Lote de misiones traducidas (m00–m03).
export const MISSIONS: Mission[] = [m00EquipoEn, m01InspeccionEn, m02GherkinEn, m03CoberturaEn]
