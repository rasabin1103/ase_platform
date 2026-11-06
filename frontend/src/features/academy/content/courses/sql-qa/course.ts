import type { CourseDef } from '../../../engine/types'

/**
 * Curso 8: SQL para QA. Cuarto y último curso de la ruta SQL (de pago, misión 0
 * como demo abierta). Plan: docs/academy/sql-qa/PLAN.md
 */
export const sqlQaCourse: CourseDef = {
  key: 'sql-qa',
  title: 'SQL para QA: probar con la base de datos',
  track: 'Datos · SQL',
  level: 'advanced',
  description:
    'Tu cuarto mes en Kobalto, ahora en el equipo de QA: verificar en la base de datos lo que hizo la app, encontrar los bordes, preparar datos de prueba, escribir aserciones, conciliar fuentes, validar migraciones, probar informes, estados, reglas y rendimiento, con PostgreSQL de verdad en el navegador.',
  estimatedHours: 14,
  missions: [
    { id: 'm00-lo-que-hizo', title: 'Lo que hizo la app', available: true },
    { id: 'm01-bordes', title: 'Los bordes', available: true },
    { id: 'm02-datos-prueba', title: 'Datos de prueba', available: true },
    { id: 'm03-cero-filas', title: 'Consultas que deben dar cero', available: true },
    { id: 'm04-conciliar', title: 'Conciliar dos fuentes', available: true },
    { id: 'm05-migracion', title: 'Validar una migración', available: true },
    { id: 'm06-informe', title: 'Probar un informe', available: true },
    { id: 'm07-estados', title: 'Estados y transiciones', available: true },
    { id: 'm08-reglas', title: 'Probar las reglas', available: true },
    { id: 'm09-rendimiento', title: 'Regresiones de rendimiento', available: true },
    { id: 'm10-examen', title: 'Examen práctico', available: true },
  ],
}
