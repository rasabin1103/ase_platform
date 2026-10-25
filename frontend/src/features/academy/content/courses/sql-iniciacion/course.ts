import type { CourseDef } from '../../../engine/types'

/**
 * Curso 5: SQL desde cero. Primer curso de la ruta SQL (Iniciación → Intermedio
 * → Avanzado → SQL para QA). Plan: docs/academy/sql-iniciacion/PLAN.md
 */
export const sqlIniciacionCourse: CourseDef = {
  key: 'sql-iniciacion',
  title: 'SQL desde cero: consulta los datos de verdad',
  track: 'Datos · SQL',
  level: 'beginner',
  description:
    'Tu primer mes en Kobalto: te dan acceso a la base de datos y empiezan a llegarte peticiones de todo el equipo. Escribes SQL de verdad contra PostgreSQL, dentro del navegador, y cada encargo se cumple cuando tu consulta devuelve el resultado correcto.',
  estimatedHours: 10,
  missions: [
    { id: 'm00-primera-consulta', title: 'Tu primera consulta', available: true },
    { id: 'm01-filtrar', title: 'Solo lo que importa', available: true },
    { id: 'm02-ordenar', title: 'Ordenar y buscar', available: true },
    { id: 'm03-nulos', title: 'Los huecos', available: true },
    { id: 'm04-contar', title: 'Contar', available: true },
    { id: 'm05-agrupar', title: 'Agrupar', available: true },
    { id: 'm06-join', title: 'Unir tablas', available: true },
    { id: 'm07-left-join', title: 'Lo que falta', available: true },
    { id: 'm08-modificar', title: 'Cambiar datos con cuidado', available: true },
    { id: 'm09-crear-tabla', title: 'Tu propia tabla', available: true },
    { id: 'm10-examen', title: 'Examen práctico', available: true },
  ],
}
