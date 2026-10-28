import type { CourseDef } from '../engine/types'
import { testingFundamentalsCourse } from './courses/testing-fundamentals/course'
import { qaProfesionalCourse } from './courses/qa-profesional/course'
import { testingFundamentalsCourseEn } from './courses/testing-fundamentals/en/course'
import { qaProfesionalCourseEn } from './courses/qa-profesional/en/course'
import { karateFrameworkCourse } from './courses/karate-framework/course'
import { karateFrameworkCourseEn } from './courses/karate-framework/en/course'
import { gestionEquiposQaCourse } from './courses/gestion-equipos-qa/course'
import { sqlIniciacionCourse } from './courses/sql-iniciacion/course'
import { sqlIntermedioCourse } from './courses/sql-intermedio/course'
import { sqlIniciacionCourseEn } from './courses/sql-iniciacion/en/course'
import { sqlIntermedioCourseEn } from './courses/sql-intermedio/en/course'
import { gestionEquiposQaCourseEn } from './courses/gestion-equipos-qa/en/course'

/**
 * Lista ligera de cursos del simulador (sin el contenido de las misiones).
 * La usa también el panel de admin del catálogo para el selector
 * «Curso interactivo», así que no debe importar misiones.
 *
 * Añadir un curso nuevo: crear su carpeta en content/courses/<clave>/,
 * añadir su CourseDef aquí y sus misiones en registry.ts.
 */
export const ACADEMY_COURSES: CourseDef[] = [testingFundamentalsCourse, qaProfesionalCourse, karateFrameworkCourse, gestionEquiposQaCourse, sqlIniciacionCourse, sqlIntermedioCourse]
export const ACADEMY_COURSES_EN: CourseDef[] = [testingFundamentalsCourseEn, qaProfesionalCourseEn, karateFrameworkCourseEn, gestionEquiposQaCourseEn, sqlIniciacionCourseEn, sqlIntermedioCourseEn]

/** Cursos que aún no tienen versión en inglés (en inglés se muestran en español). */
export const PENDING_TRANSLATION = new Set<string>([])

export function academyCourses(lang: 'es' | 'en' = 'es'): CourseDef[] {
  if (lang !== 'en') return ACADEMY_COURSES
  return ACADEMY_COURSES.map((c) => ACADEMY_COURSES_EN.find((e) => e.key === c.key) ?? c)
}

export const LEVEL_LABEL: Record<CourseDef['level'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Gestión',
}

export const LEVEL_LABEL_EN: Record<CourseDef['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Management',
}

/** Curso por clave; en inglés si existe la traducción. */
export function getCourse(key: string, lang: 'es' | 'en' = 'es'): CourseDef | undefined {
  return academyCourses(lang).find((c) => c.key === key) ?? ACADEMY_COURSES.find((c) => c.key === key)
}

/** La primera misión de cada curso es siempre la demo gratuita. */
export function isFreeMission(course: CourseDef | undefined, missionId: string): boolean {
  return !!course && course.missions[0]?.id === missionId
}
