import type { CourseDef } from '../../../../engine/types'

export const gestionEquiposQaCourseEn: CourseDef = {
  key: 'gestion-equipos-qa',
  title: 'QA Team Management: from manual QA to Head of QA',
  track: 'Quality Engineering · Leadership',
  level: 'expert',
  description:
    'Eight years of career at Kobalto: you start as a manual QA and end as Head of QA. In each role you live the situations that come with it (pressure to sign off, a junior who makes a mistake, a team you inherit, hiring, cutting, a crisis) and discover what responsibilities each position carries.',
  estimatedHours: 12,
  missions: [
    { id: 'm00-la-firma', title: 'Manual QA · The sign-off', available: true },
    { id: 'm01-cuello-botella', title: 'Manual QA · The bottleneck', available: true },
    { id: 'm02-suite', title: 'QA Engineer · The suite nobody looks at', available: true },
    { id: 'm03-junior', title: 'QA Engineer · The junior', available: true },
    { id: 'm04-estandar', title: 'QA Architect · Five squads, five frameworks', available: true },
    { id: 'm05-comprar', title: 'QA Architect · Build or buy', available: true },
    { id: 'm06-primer-equipo', title: 'QA Lead · Your first team', available: true },
    { id: 'm07-conversacion', title: 'QA Lead · The difficult conversation', available: true },
    { id: 'm08-contratar', title: 'QA Manager · Hiring', available: true },
    { id: 'm09-recortes', title: 'QA Manager · Cuts', available: true },
    { id: 'm10-incidente', title: 'Head of QA · The big incident', available: true },
    { id: 'm11-estrategia', title: 'Head of QA · The strategy', available: true },
  ],
}
