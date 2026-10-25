import type { CourseDef } from '../../../engine/types'

/**
 * Curso 4: Gestión de equipos QA. Una carrera en Kobalto de QA manual a Head
 * of QA, dos misiones por rol. Plan: docs/academy/gestion-equipos-qa/PLAN.md
 */
export const gestionEquiposQaCourse: CourseDef = {
  key: 'gestion-equipos-qa',
  title: 'Gestión de equipos QA: de QA manual a Head of QA',
  track: 'Quality Engineering · Liderazgo',
  level: 'expert',
  description:
    'Ocho años de carrera en Kobalto: empiezas como QA manual y terminas como Head of QA. En cada rol vives las situaciones que le tocan (presión para firmar, un junior que se equivoca, un equipo que heredas, contratar, recortar, una crisis) y descubres qué responsabilidades tiene cada puesto.',
  estimatedHours: 12,
  missions: [
    { id: 'm00-la-firma', title: 'QA manual · La firma', available: true },
    { id: 'm01-cuello-botella', title: 'QA manual · El cuello de botella', available: true },
    { id: 'm02-suite', title: 'QA Engineer · La suite que nadie mira', available: true },
    { id: 'm03-junior', title: 'QA Engineer · El junior', available: true },
    { id: 'm04-estandar', title: 'QA Architect · Cinco squads, cinco frameworks', available: true },
    { id: 'm05-comprar', title: 'QA Architect · Construir o comprar', available: true },
    { id: 'm06-primer-equipo', title: 'QA Lead · Tu primer equipo', available: true },
    { id: 'm07-conversacion', title: 'QA Lead · La conversación difícil', available: true },
    { id: 'm08-contratar', title: 'QA Manager · Contratar', available: true },
    { id: 'm09-recortes', title: 'QA Manager · Recortes', available: true },
    { id: 'm10-incidente', title: 'Head of QA · El gran incidente', available: true },
    { id: 'm11-estrategia', title: 'Head of QA · La estrategia', available: true },
  ],
}
