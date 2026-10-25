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
import { m06Metricas } from './courses/qa-profesional/m06-metricas'
import { m07Configuracion } from './courses/qa-profesional/m07-configuracion'
import { m08Herramientas } from './courses/qa-profesional/m08-herramientas'
import { m01Inspeccion } from './courses/qa-profesional/m01-inspeccion'
import { m02Gherkin } from './courses/qa-profesional/m02-gherkin'
import { m00HolaKarate } from './courses/karate-framework/m00-hola-karate'
import { m01Match } from './courses/karate-framework/m01-match'
import { m02Config } from './courses/karate-framework/m02-config'
import { m03Payloads } from './courses/karate-framework/m03-payloads'
import { m04Datos } from './courses/karate-framework/m04-datos'
import { m05Auth } from './courses/karate-framework/m05-auth'
import { m06Errores } from './courses/karate-framework/m06-errores'
import { m07Mocks } from './courses/karate-framework/m07-mocks'
import { m08Pipeline } from './courses/karate-framework/m08-pipeline'
import { m09Framework } from './courses/karate-framework/m09-framework'
import { m10Examen } from './courses/karate-framework/m10-examen'
import { m00LaFirma } from './courses/gestion-equipos-qa/m00-la-firma'
import { m01CuelloBotella } from './courses/gestion-equipos-qa/m01-cuello-botella'
import { m06PrimerEquipo } from './courses/gestion-equipos-qa/m06-primer-equipo'
import { m02Suite } from './courses/gestion-equipos-qa/m02-suite'
import { m03Junior } from './courses/gestion-equipos-qa/m03-junior'
import { m04Estandar } from './courses/gestion-equipos-qa/m04-estandar'
import { m05Comprar } from './courses/gestion-equipos-qa/m05-comprar'
import { m07Conversacion } from './courses/gestion-equipos-qa/m07-conversacion'
import { m08Contratar } from './courses/gestion-equipos-qa/m08-contratar'
import { m09Recortes } from './courses/gestion-equipos-qa/m09-recortes'
import { m10Incidente } from './courses/gestion-equipos-qa/m10-incidente'
import { m11Estrategia } from './courses/gestion-equipos-qa/m11-estrategia'
import { m00PrimeraConsulta } from './courses/sql-iniciacion/m00-primera-consulta'
import { m01Filtrar } from './courses/sql-iniciacion/m01-filtrar'
import { m02Ordenar } from './courses/sql-iniciacion/m02-ordenar'
import { m03Nulos } from './courses/sql-iniciacion/m03-nulos'
import { m04Contar } from './courses/sql-iniciacion/m04-contar'
import { m05Agrupar } from './courses/sql-iniciacion/m05-agrupar'
import { m06Join } from './courses/sql-iniciacion/m06-join'
import { m07LeftJoin } from './courses/sql-iniciacion/m07-left-join'
import { m08Modificar } from './courses/sql-iniciacion/m08-modificar'
import { m09CrearTabla } from './courses/sql-iniciacion/m09-crear-tabla'
import { m10Examen as m10ExamenSql } from './courses/sql-iniciacion/m10-examen'

import { MISSIONS_EN as TF_EN } from './courses/testing-fundamentals/en'
import { MISSIONS_EN as QAP_EN } from './courses/qa-profesional/en'
import { MISSIONS_EN as KAR_EN } from './courses/karate-framework/en'

export { ACADEMY_COURSES as COURSES, LEVEL_LABEL, LEVEL_LABEL_EN, academyCourses, getCourse, isFreeMission } from './courseList'

/** Misiones jugables. Añadir una misión = importarla aquí. */
const MISSIONS: Mission[] = [m00PrimerDia, m01HistoriaAmbigua, m02SimuladorPrestamos, m03EstadosPago, m04Reportar, m05Release, m06Piramide, m07Incidente, m00Equipo, m01Inspeccion, m02Gherkin, m03Cobertura, m04Exploratoria, m05Plan, m06Metricas, m07Configuracion, m08Herramientas, m00HolaKarate, m01Match, m02Config, m03Payloads, m04Datos, m05Auth, m06Errores, m07Mocks, m08Pipeline, m09Framework, m10Examen, m00LaFirma, m01CuelloBotella, m02Suite, m03Junior, m04Estandar, m05Comprar, m06PrimerEquipo, m07Conversacion, m08Contratar, m09Recortes, m10Incidente, m11Estrategia, m00PrimeraConsulta, m01Filtrar, m02Ordenar, m03Nulos, m04Contar, m05Agrupar, m06Join, m07LeftJoin, m08Modificar, m09CrearTabla, m10ExamenSql]

/** Traducciones al inglés (misma estructura e ids). */
export const MISSIONS_EN: Mission[] = [...TF_EN, ...QAP_EN, ...KAR_EN]

/** Todas las misiones en español (para tests de paridad). */
export const MISSIONS_ES: Mission[] = MISSIONS

/** Misión en el idioma pedido; si aún no está traducida, la española. */
export function getMission(courseKey: string, missionId: string, lang: 'es' | 'en' = 'es'): Mission | undefined {
  const match = (m: Mission) => m.courseKey === courseKey && m.id === missionId
  return (lang === 'en' ? MISSIONS_EN.find(match) : undefined) ?? MISSIONS.find(match)
}
