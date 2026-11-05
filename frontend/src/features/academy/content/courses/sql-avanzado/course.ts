import type { CourseDef } from '../../../engine/types'

/**
 * Curso 7: SQL avanzado. Tercer curso de la ruta SQL (de pago, misión 0 como
 * demo abierta). Plan: docs/academy/sql-avanzado/PLAN.md
 */
export const sqlAvanzadoCourse: CourseDef = {
  key: 'sql-avanzado',
  title: 'SQL avanzado: PostgreSQL a fondo',
  track: 'Datos · SQL',
  level: 'advanced',
  description:
    'Tu tercer mes en Kobalto: jerarquías recursivas, ventanas con marcos, rachas, subtotales, JSON, cambios de datos seguros, reglas, funciones, triggers, índices y rendimiento, con PostgreSQL de verdad en el navegador.',
  estimatedHours: 14,
  missions: [
    { id: 'm00-jerarquias', title: 'Quién depende de quién', available: true },
    { id: 'm01-ventanas', title: 'Ventanas a fondo', available: true },
    { id: 'm02-rachas', title: 'Rachas y percentiles', available: true },
    { id: 'm03-subtotales', title: 'Totales y subtotales', available: true },
    { id: 'm04-json', title: 'JSON y arrays', available: true },
    { id: 'm05-modificar', title: 'Modificar con cabeza', available: true },
    { id: 'm06-reglas', title: 'Reglas en la base de datos', available: true },
    { id: 'm07-funciones', title: 'Funciones y triggers', available: true },
    { id: 'm08-indices', title: 'Índices y planes', available: true },
    { id: 'm09-rendimiento', title: 'Rendimiento', available: true },
    { id: 'm10-examen', title: 'Examen práctico', available: true },
  ],
}
