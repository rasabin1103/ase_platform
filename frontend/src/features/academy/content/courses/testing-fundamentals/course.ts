import type { CourseDef } from '../../../engine/types'

export const testingFundamentalsCourse: CourseDef = {
  key: 'testing-fundamentals',
  title: 'Fundamentos de Testing',
  track: 'Quality Engineering',
  level: 'beginner',
  description:
    'Vive tus primeras semanas como QA Junior en Kobalto, un neobanco en plena carrera hacia su demo con inversores. Cada decisión cuenta.',
  estimatedHours: 6,
  missions: [
    { id: 'm00-primer-dia', title: 'Primer día', available: true },
    { id: 'm01-historia-ambigua', title: 'La historia ambigua', available: true },
    { id: 'm02-simulador-prestamos', title: 'El simulador de préstamos', available: true },
    { id: 'm03-estados-pago', title: 'Estados de un pago', available: true },
    { id: 'm04-reportar', title: 'Reportar como un profesional', available: true },
    { id: 'm05-release', title: 'Viernes de release', available: true },
    { id: 'm06-piramide', title: 'La pirámide', available: true },
    { id: 'm07-incidente', title: 'Incidente en producción', available: true },
  ],
}
