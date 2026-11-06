import type { LearnLang, LessonModule } from './types'
import { MODULES_PYB } from '../content/courses/python-desde-cero'
import { MODULES_EN as PYB_EN } from '../content/courses/python-desde-cero/en'

/** Módulos de los cursos instructivos. Añadir un módulo = exportarlo en el index de su curso. */
export const MODULES_ES: LessonModule[] = [...MODULES_PYB]
export const MODULES_EN: LessonModule[] = [...PYB_EN]

/** Módulo en el idioma pedido; si aún no está traducido, el español. */
export function getModule(courseKey: string, moduleId: string, lang: LearnLang = 'es'): LessonModule | undefined {
  const match = (m: LessonModule) => m.courseKey === courseKey && m.id === moduleId
  return (lang === 'en' ? MODULES_EN.find(match) : undefined) ?? MODULES_ES.find(match)
}
