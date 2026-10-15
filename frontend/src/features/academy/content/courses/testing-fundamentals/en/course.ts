import type { CourseDef } from '../../../../engine/types'

export const testingFundamentalsCourseEn: CourseDef = {
  key: 'testing-fundamentals',
  title: 'Testing Fundamentals',
  track: 'Quality Engineering',
  level: 'beginner',
  description:
    'Live your first weeks as a Junior QA at Kobalto, a neobank racing towards its investor demo. Every decision counts.',
  estimatedHours: 6,
  missions: [
    { id: 'm00-primer-dia', title: 'First day', available: true },
    { id: 'm01-historia-ambigua', title: 'The ambiguous story', available: true },
    { id: 'm02-simulador-prestamos', title: 'The loan simulator', available: true },
    { id: 'm03-estados-pago', title: 'Payment states', available: true },
    { id: 'm04-reportar', title: 'Reporting like a pro', available: true },
    { id: 'm05-release', title: 'Release Friday', available: true },
    { id: 'm06-piramide', title: 'The pyramid', available: true },
    { id: 'm07-incidente', title: 'Production incident', available: true },
  ],
}
