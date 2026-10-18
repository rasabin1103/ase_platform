import type { CourseDef } from '../../../engine/types'

export const karateFrameworkCourse: CourseDef = {
  key: 'karate-framework',
  title: 'Karate Framework: automatización de APIs',
  track: 'Test Automation · API',
  level: 'intermediate',
  description:
    'Te incorporas al squad que abre la API de Kobalto a otras fintechs. Escribes Karate de verdad en un IDE dentro del navegador, lo ejecutas contra una API simulada con bugs reales y llevas la suite desde el primer smoke hasta el pipeline.',
  estimatedHours: 10,
  missions: [
    { id: 'm00-hola-karate', title: 'Hola, Karate', available: true },
    { id: 'm01-match', title: 'Match, tu superpoder', available: true },
    { id: 'm02-config', title: 'Un test, tres entornos', available: true },
    { id: 'm03-payloads', title: 'POST y encadenar', available: true },
    { id: 'm04-datos', title: 'Dirigido por datos', available: true },
    { id: 'm05-auth', title: 'Tokens y reutilización', available: true },
    { id: 'm06-errores', title: 'Cuando todo falla', available: true },
    { id: 'm07-mocks', title: 'El tercero que no responde', available: true },
    { id: 'm08-pipeline', title: 'Verde en el pipeline', available: true },
    { id: 'm09-framework', title: 'Tu framework', available: true },
    { id: 'm10-examen', title: 'Examen práctico', available: true },
  ],
}
