import type { Mission } from '../engine/types'
import { m00PrimerDia } from './courses/testing-fundamentals/m00-primer-dia'
import { m01HistoriaAmbigua } from './courses/testing-fundamentals/m01-historia-ambigua'
import { m02SimuladorPrestamos } from './courses/testing-fundamentals/m02-simulador-prestamos'
import { m03EstadosPago } from './courses/testing-fundamentals/m03-estados-pago'
import { m04Reportar } from './courses/testing-fundamentals/m04-reportar'
import { m05Release } from './courses/testing-fundamentals/m05-release'
import { m06Piramide } from './courses/testing-fundamentals/m06-piramide'
import { m07Incidente } from './courses/testing-fundamentals/m07-incidente'
import { m00Equipo } from './courses/qa-profesional/m00-equipo'
import { m03Cobertura } from './courses/qa-profesional/m03-cobertura'
import { m04Exploratoria } from './courses/qa-profesional/m04-exploratoria'
import { m05Plan } from './courses/qa-profesional/m05-plan'
import { m01Inspeccion } from './courses/qa-profesional/m01-inspeccion'
import { m02Gherkin } from './courses/qa-profesional/m02-gherkin'

export { ACADEMY_COURSES as COURSES, LEVEL_LABEL, getCourse, isFreeMission } from './courseList'

/** Misiones jugables. Añadir una misión = importarla aquí. */
const MISSIONS: Mission[] = [m00PrimerDia, m01HistoriaAmbigua, m02SimuladorPrestamos, m03EstadosPago, m04Reportar, m05Release, m06Piramide, m07Incidente, m00Equipo, m01Inspeccion, m02Gherkin, m03Cobertura, m04Exploratoria, m05Plan]

export function getMission(courseKey: string, missionId: string): Mission | undefined {
  return MISSIONS.find((m) => m.courseKey === courseKey && m.id === missionId)
}
