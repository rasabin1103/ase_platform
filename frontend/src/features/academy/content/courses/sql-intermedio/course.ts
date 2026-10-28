import type { CourseDef } from '../../../engine/types'

/**
 * Curso 6: SQL intermedio. Segundo curso de la ruta SQL (serie de pago tras
 * «SQL desde cero», que es gratis con registro). Plan: docs/academy/sql-intermedio/PLAN.md
 */
export const sqlIntermedioCourse: CourseDef = {
  key: 'sql-intermedio',
  title: 'SQL intermedio: consultas que responden preguntas de negocio',
  track: 'Datos · SQL',
  level: 'intermediate',
  description:
    'Tu segundo mes en Kobalto: ya no te piden listas, te piden respuestas. Subconsultas, CTE, fechas, rankings, tendencias y calidad de datos con PostgreSQL de verdad, en encargos de varios pasos que se comprueban por su resultado.',
  estimatedHours: 12,
  missions: [
    { id: 'm00-subconsultas', title: 'La consulta dentro de la consulta', available: true },
    { id: 'm01-cte', title: 'Paso a paso', available: true },
    { id: 'm02-fechas-textos', title: 'Fechas y textos', available: true },
    { id: 'm03-conjuntos', title: 'Juntar resultados', available: true },
    { id: 'm04-informes', title: 'Informes en una consulta', available: true },
    { id: 'm05-ranking', title: 'El ranking', available: true },
    { id: 'm06-tendencias', title: 'Tendencias', available: true },
    { id: 'm07-cruces', title: 'Cruces complicados', available: true },
    { id: 'm08-calidad', title: 'Datos que no cuadran', available: true },
    { id: 'm09-vistas', title: 'Tu informe reutilizable', available: true },
    { id: 'm10-examen', title: 'Examen práctico', available: true },
  ],
}
