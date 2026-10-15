import type { Mission } from '../../../../engine/types'
import { m03EstadosPagoEn } from './m03-estados-pago'
import { m04ReportarEn } from './m04-reportar'
import { m05ReleaseEn } from './m05-release'
import { m06PiramideEn } from './m06-piramide'
import { m07IncidenteEn } from './m07-incidente'

// Lote de misiones traducidas (lo rellena quien traduce este lote).
export const MISSIONS: Mission[] = [m03EstadosPagoEn, m04ReportarEn, m05ReleaseEn, m06PiramideEn, m07IncidenteEn]
