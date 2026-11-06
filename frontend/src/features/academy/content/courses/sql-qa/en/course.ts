import type { CourseDef } from '../../../../engine/types'

export const sqlQaCourseEn: CourseDef = {
  key: 'sql-qa',
  title: 'SQL for QA: testing with the database',
  track: 'Data · SQL',
  level: 'advanced',
  description:
    'Your fourth month at Kobalto, now in the QA team: verify in the database what the app did, find the edge cases, prepare test data, write assertions, reconcile sources, validate migrations, test reports, states, rules and performance, with real PostgreSQL in the browser.',
  estimatedHours: 14,
  missions: [
    { id: 'm00-lo-que-hizo', title: 'What the app did', available: true },
    { id: 'm01-bordes', title: 'The edge cases', available: true },
    { id: 'm02-datos-prueba', title: 'Test data', available: true },
    { id: 'm03-cero-filas', title: 'Queries that must return nothing', available: true },
    { id: 'm04-conciliar', title: 'Reconciling two sources', available: true },
    { id: 'm05-migracion', title: 'Validating a migration', available: true },
    { id: 'm06-informe', title: 'Testing a report', available: true },
    { id: 'm07-estados', title: 'States and transitions', available: true },
    { id: 'm08-reglas', title: 'Testing the rules', available: true },
    { id: 'm09-rendimiento', title: 'Performance regressions', available: true },
    { id: 'm10-examen', title: 'Practical exam', available: true },
  ],
}
