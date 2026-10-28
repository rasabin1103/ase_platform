import type { CourseDef } from '../../../../engine/types'

export const sqlIntermedioCourseEn: CourseDef = {
  key: 'sql-intermedio',
  title: 'Intermediate SQL: queries that answer business questions',
  track: 'Data · SQL',
  level: 'intermediate',
  description:
    'Your second month at Kobalto: they no longer ask you for lists, they ask for answers. Subqueries, CTEs, dates, rankings, trends and data quality with real PostgreSQL, in multi-step tasks checked by their result.',
  estimatedHours: 12,
  missions: [
    { id: 'm00-subconsultas', title: 'The query inside the query', available: true },
    { id: 'm01-cte', title: 'Step by step', available: true },
    { id: 'm02-fechas-textos', title: 'Dates and text', available: true },
    { id: 'm03-conjuntos', title: 'Combining results', available: true },
    { id: 'm04-informes', title: 'Reports in one query', available: true },
    { id: 'm05-ranking', title: 'The ranking', available: true },
    { id: 'm06-tendencias', title: 'Trends', available: true },
    { id: 'm07-cruces', title: 'Complex joins', available: true },
    { id: 'm08-calidad', title: 'Data that does not add up', available: true },
    { id: 'm09-vistas', title: 'Your reusable report', available: true },
    { id: 'm10-examen', title: 'Practical exam', available: true },
  ],
}
