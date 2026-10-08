import type { CourseDef } from '../engine/types'
import { testingFundamentalsCourse } from './courses/testing-fundamentals/course'
import { qaProfesionalCourse } from './courses/qa-profesional/course'

/**
 * Lista ligera de cursos del simulador (sin el contenido de las misiones).
 * La usa también el panel de admin del catálogo para el selector
 * «Curso interactivo», así que no debe importar misiones.
 *
 * Añadir un curso nuevo: crear su carpeta en content/courses/<clave>/,
 * añadir su CourseDef aquí y sus misiones en registry.ts.
 */
export const ACADEMY_COURSES: CourseDef[] = [testingFundamentalsCourse, qaProfesionalCourse]

export const LEVEL_LABEL: Record<CourseDef['level'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Gestión',
}

export function getCourse(key: string): CourseDef | undefined {
  return ACADEMY_COURSES.find((c) => c.key === key)
}

/** La primera misión de cada curso es siempre la demo gratuita. */
export function isFreeMission(course: CourseDef | undefined, missionId: string): boolean {
  return !!course && course.missions[0]?.id === missionId
}
