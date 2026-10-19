import type { CourseDef } from '../../../../engine/types'

export const karateFrameworkCourseEn: CourseDef = {
  key: 'karate-framework',
  title: 'Karate Framework: API test automation',
  track: 'Test Automation · API',
  level: 'intermediate',
  description:
    'You join the squad that opens Kobalto’s API to other fintechs. You write real Karate in an in-browser IDE, run it against a simulated API with real bugs, and take the suite from the first smoke test all the way to the pipeline.',
  estimatedHours: 10,
  missions: [
    { id: 'm00-hola-karate', title: 'Hello, Karate', available: true },
    { id: 'm01-match', title: 'Match, your superpower', available: true },
    { id: 'm02-config', title: 'One test, three environments', available: true },
    { id: 'm03-payloads', title: 'POST and chaining', available: true },
    { id: 'm04-datos', title: 'Data-driven', available: true },
    { id: 'm05-auth', title: 'Tokens and reuse', available: true },
    { id: 'm06-errores', title: 'When everything fails', available: true },
    { id: 'm07-mocks', title: 'The third party that doesn’t answer', available: true },
    { id: 'm08-pipeline', title: 'Green in the pipeline', available: true },
    { id: 'm09-framework', title: 'Your framework', available: true },
    { id: 'm10-examen', title: 'Practical exam', available: true },
  ],
}
