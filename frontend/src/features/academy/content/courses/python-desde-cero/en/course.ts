import type { CourseDef } from '../../../../engine/types'

/** Course 9: Python from scratch. English version of ../course.ts. */
export const pythonDesdeCeroCourseEn: CourseDef = {
  key: 'python-desde-cero',
  title: 'Python from scratch',
  track: 'Programming · Python',
  level: 'beginner',
  format: 'lessons',
  description:
    'Learn to program in Python from the very first line, with real Python in your browser: short lessons, examples you can run and exercises that grade themselves. Module by module you build your own expense tracker.',
  estimatedHours: 9,
  missions: [
    { id: 'm01-primer-programa', title: 'Your first program', available: true },
    { id: 'm02-decidir', title: 'Making decisions', available: true },
    { id: 'm03-repetir', title: 'Repeating', available: true },
    { id: 'm04-colecciones', title: 'Collections', available: true },
    { id: 'm05-funciones', title: 'Functions', available: true },
    { id: 'm06-textos-errores', title: 'Text and errors', available: true },
    { id: 'm07-ficheros', title: 'Files', available: true },
    { id: 'm08-ordenar-codigo', title: 'Organising your code', available: true },
    { id: 'm09-proyecto-final', title: 'Practical exam', available: true },
  ],
}
