import type { CourseDef } from '../../../engine/types'

export const qaProfesionalCourse: CourseDef = {
  key: 'qa-profesional',
  title: 'QA Profesional: del testing a la calidad del equipo',
  track: 'Quality Engineering · Preparación ISTQB® CTFL',
  level: 'intermediate',
  description:
    'Seis meses después, ya no eres junior: montas el proceso de calidad del nuevo squad de Kobalto Empresas. Revisiones, test-first, caja blanca, planificación, métricas y herramientas, con simulacro de examen CTFL.',
  estimatedHours: 8,
  missions: [
    { id: 'm00-equipo', title: 'Equipo nuevo', available: true },
    { id: 'm01-inspeccion', title: 'La inspección', available: true },
    { id: 'm02-gherkin', title: 'Dado, cuando, entonces', available: true },
    { id: 'm03-cobertura', title: 'Dentro del código', available: true },
    { id: 'm04-exploratoria', title: 'Intuición experta', available: true },
    { id: 'm05-plan', title: 'El plan', available: true },
    { id: 'm06-metricas', title: 'Números que cuentan', available: false },
    { id: 'm07-configuracion', title: '¿Qué versión es?', available: false },
    { id: 'm08-herramientas', title: 'Herramientas', available: false },
  ],
}
