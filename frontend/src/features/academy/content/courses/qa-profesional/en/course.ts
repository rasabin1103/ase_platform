import type { CourseDef } from '../../../../engine/types'

export const qaProfesionalCourseEn: CourseDef = {
  key: 'qa-profesional',
  title: 'Professional QA: from testing to team quality',
  track: 'Quality Engineering · ISTQB® CTFL preparation',
  level: 'intermediate',
  description:
    'Six months later, you are no longer a junior: you set up the quality process for Kobalto Business’s new squad. Reviews, test-first, white-box, planning, metrics and tools, with a CTFL mock exam.',
  estimatedHours: 8,
  missions: [
    { id: 'm00-equipo', title: 'New team', available: true },
    { id: 'm01-inspeccion', title: 'The inspection', available: true },
    { id: 'm02-gherkin', title: 'Given, when, then', available: true },
    { id: 'm03-cobertura', title: 'Inside the code', available: true },
    { id: 'm04-exploratoria', title: 'Expert intuition', available: true },
    { id: 'm05-plan', title: 'The plan', available: true },
    { id: 'm06-metricas', title: 'Numbers that count', available: true },
    { id: 'm07-configuracion', title: 'Which version is it?', available: true },
    { id: 'm08-herramientas', title: 'Tools', available: true },
  ],
}
