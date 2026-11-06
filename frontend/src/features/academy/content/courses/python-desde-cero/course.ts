import type { CourseDef } from '../../../engine/types'

/**
 * Curso 9: Python desde cero. Primer curso de la ruta Python, en formato
 * instructivo (módulos con lecciones, no simulación). Gratis con registro; el
 * módulo 1 está abierto sin cuenta. Plan: docs/academy/python-desde-cero/PLAN.md
 */
export const pythonDesdeCeroCourse: CourseDef = {
  key: 'python-desde-cero',
  title: 'Python desde cero',
  track: 'Programación · Python',
  level: 'beginner',
  format: 'lessons',
  description:
    'Aprende a programar en Python desde la primera línea, con Python de verdad en el navegador: lecciones cortas, ejemplos que puedes ejecutar y ejercicios que se corrigen solos. Módulo a módulo construyes tu propio gestor de gastos.',
  estimatedHours: 9,
  missions: [
    { id: 'm01-primer-programa', title: 'Tu primer programa', available: true },
    { id: 'm02-decidir', title: 'Decidir', available: true },
    { id: 'm03-repetir', title: 'Repetir', available: true },
    { id: 'm04-colecciones', title: 'Colecciones', available: true },
    { id: 'm05-funciones', title: 'Funciones', available: true },
    { id: 'm06-textos-errores', title: 'Textos y errores', available: true },
    { id: 'm07-ficheros', title: 'Ficheros', available: true },
    { id: 'm08-ordenar-codigo', title: 'Ordenar tu código', available: true },
    { id: 'm09-proyecto-final', title: 'Examen práctico', available: true },
  ],
}
