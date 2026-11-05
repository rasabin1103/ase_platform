import type { CourseDef } from '../../../../engine/types'

export const sqlAvanzadoCourseEn: CourseDef = {
  key: 'sql-avanzado',
  title: 'Advanced SQL: PostgreSQL in depth',
  track: 'Data · SQL',
  level: 'advanced',
  description:
    'Your third month at Kobalto: recursive hierarchies, window frames, streaks, subtotals, JSON, safe data changes, rules, functions, triggers, indexes and performance, with real PostgreSQL in the browser.',
  estimatedHours: 14,
  missions: [
    { id: 'm00-jerarquias', title: 'Who reports to whom', available: true },
    { id: 'm01-ventanas', title: 'Windows in depth', available: true },
    { id: 'm02-rachas', title: 'Streaks and percentiles', available: true },
    { id: 'm03-subtotales', title: 'Totals and subtotals', available: true },
    { id: 'm04-json', title: 'JSON and arrays', available: true },
    { id: 'm05-modificar', title: 'Changing data carefully', available: true },
    { id: 'm06-reglas', title: 'Rules in the database', available: true },
    { id: 'm07-funciones', title: 'Functions and triggers', available: true },
    { id: 'm08-indices', title: 'Indexes and plans', available: true },
    { id: 'm09-rendimiento', title: 'Performance', available: true },
    { id: 'm10-examen', title: 'Practical exam', available: true },
  ],
}
