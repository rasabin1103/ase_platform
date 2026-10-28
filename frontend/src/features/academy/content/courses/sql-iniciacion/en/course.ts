import type { CourseDef } from '../../../../engine/types'

export const sqlIniciacionCourseEn: CourseDef = {
  key: 'sql-iniciacion',
  title: 'SQL from scratch: query the real data',
  track: 'Data · SQL',
  level: 'beginner',
  description:
    'Your first month at Kobalto: you get access to the database and requests start coming in from the whole team. You write real SQL against PostgreSQL, right in the browser, and each task is done when your query returns the right result.',
  estimatedHours: 10,
  missions: [
    { id: 'm00-primera-consulta', title: 'Your first query', available: true },
    { id: 'm01-filtrar', title: 'Only what matters', available: true },
    { id: 'm02-ordenar', title: 'Sort and search', available: true },
    { id: 'm03-nulos', title: 'The gaps', available: true },
    { id: 'm04-contar', title: 'Counting', available: true },
    { id: 'm05-agrupar', title: 'Grouping', available: true },
    { id: 'm06-join', title: 'Joining tables', available: true },
    { id: 'm07-left-join', title: 'What is missing', available: true },
    { id: 'm08-modificar', title: 'Changing data carefully', available: true },
    { id: 'm09-crear-tabla', title: 'Your own table', available: true },
    { id: 'm10-examen', title: 'Practical exam', available: true },
  ],
}
