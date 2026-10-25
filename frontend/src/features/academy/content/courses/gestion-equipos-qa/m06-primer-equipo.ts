import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m06Lessons } from './m06-lessons'
import { m06Quiz } from './m06-quiz'
import { m06Scenes } from './m06-scenes'
import { FICHA_QA_LEAD } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 6 — Tu primer equipo (rol: QA Lead).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m06-primer-equipo.md
 *
 * Año 4. Primer día como QA Lead de Pagos: dos de las cinco personas eran
 * compañeros. Reparto del sprint, primer 1:1 con Sergio (que optaba al
 * puesto), un QA sobrecargado y Héctor, que no firma un release con riesgo
 * mientras Marta pide «que le pares los pies». Eco de la misión 0.
 */
export const m06PrimerEquipo: Mission = {
  id: 'm06-primer-equipo',
  courseKey: 'gestion-equipos-qa',
  number: 6,
  title: 'Tu primer equipo',
  subtitle: 'QA Lead: expectativas, reparto con criterio, primer 1:1, delegar para que crezcan y respaldar los riesgos de tu equipo.',
  world: kobaltoTeamsWorld({
    laura: 'QA Manager · tu responsable',
    marta: 'Head of Product · Pagos',
    raul: 'Director de Ingeniería',
    hector: 'QA · Pagos · tu equipo',
    sergio: 'QA Automation · tu equipo',
    lucia: 'QA junior · tu equipo',
    nerea: 'QA · Pagos · tu equipo',
    pablo: 'QA · Tarjetas · tu equipo',
  }),
  playerRole: 'QA Lead · Pagos',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · año 4',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'PAG',
  appId: 'kobalto-team',
  appLabel: 'Equipo',
  hideBugList: true,
  wikiLabel: 'Wiki · QA de Pagos',
  initialMetrics: {},
  lessons: m06Lessons,
  mentor: 'laura',
  quiz: m06Quiz,
  verdicts: {
    good: {
      title: 'Un equipo, no cinco QA',
      body: 'El release sale con el riesgo controlado, Héctor sigue avisando a tiempo, Sergio tiene su reto y Lucía gana confianza. Tu equipo funciona sin que tengas que hacerlo todo.',
    },
    ok: {
      title: 'Primera semana superada',
      body: 'Sacaste el día adelante, pero alguna persona del equipo lo va a notar en las próximas semanas. Mira en el debrief quién y por qué.',
    },
    bad: {
      title: 'Jefa, no Lead',
      body: 'El equipo hace lo que dices, pero deja de avisarte de los riesgos y de crecer. Repite la misión empezando por la ficha del rol.',
    },
  },

  briefing: {
    title: 'Año 4 · QA Lead de Pagos',
    paragraphs: [
      'Han pasado cuatro años desde tu primer release. Kobalto tiene ahora 20 squads y hoy empiezas como QA Lead de Pagos, con cinco personas a tu cargo. Dos de ellas, Sergio y Héctor, eran tus compañeros.',
      'Marta, ahora Head of Product, quiere sacar el jueves las transferencias instantáneas, y Héctor no quiere firmarlas. ¿Te suena? Hace años esa presión te la ponían a ti. Hoy te llega desde arriba, y el QA que dice «no está listo» es de tu equipo.',
      'Tu trabajo ya no es probar mejor que nadie, sino que tu equipo pueda hacerlo.',
    ],
    goals: [
      'Lee la ficha del rol de QA Lead: qué es tuyo ahora y qué ya no.',
      'En la primera reunión, deja claro qué esperar de ti, sin desaparecer ni controlarlo todo.',
      'Reparte el sprint en la app «Equipo» pensando en fortalezas, crecimiento y carga de cada persona.',
      'Prepara y ten el primer 1:1 con Sergio, que optaba a tu puesto.',
      'Respalda a Héctor ante Marta y lleva el riesgo y las opciones a quien decide.',
      'Cuida a quien está sobrecargado y a quien está inseguro.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m06Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_LEAD,
    {
      id: 'primer_1a1',
      title: 'Guía: tu primer 1:1 con cada persona',
      updatedLabel: 'Laura Méndez · QA Manager',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'first_one_on_one' }, { kind: 'flag', key: 'guide.read' }],
      body: `## Para qué sirve
El 1:1 es el espacio de la otra persona, no tu reunión de seguimiento.

## En el primero
- Pregunta qué le motiva y hacia dónde quiere crecer.
- Acordad cómo os vais a dar feedback.
- Pregunta qué necesita de ti.
- Si hay algo incómodo (alguien que optaba a tu puesto, un conflicto reciente), nómbralo tú. Ignorarlo no lo hace desaparecer.

## Evita
- Repasar tareas: para eso están el tablero y la daily.
- Pedir opiniones sobre otros compañeros.
- Usar la jerarquía para cerrar una conversación difícil.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-ANTIFRAUDE', title: 'Las transferencias de más de 10.000 € salen sin antifraude: fraude en la primera semana', severity: 'critical', explanation: 'El riesgo que vio Héctor no llegó con opciones a quien decide, o se tapó para no «bloquear».', technique: 'El Lead respalda a su QA y lleva el riesgo y las opciones al dueño del negocio.', preventedBy: 'release.options' },
    { id: 'C-SILENCIO', title: 'Héctor deja de avisar de riesgos: «para qué, si no me respaldan»', severity: 'high', explanation: 'Si un QA avisa de un riesgo y su Lead no le apoya, el equipo aprende a callar.', technique: 'Respaldar a tu equipo cuando avisa a tiempo.', preventedBy: 'hector.trust' },
    { id: 'C-SERGIO', title: 'Sergio pide cambiar de equipo a los dos meses', severity: 'high', explanation: 'Un ex-compañero que optaba al puesto necesita que se hable de ello y un reto a su medida.', technique: 'Primer 1:1 preparado: nombrar lo incómodo, sus objetivos, lo que necesita.', preventedBy: 'sergio.ok' },
    { id: 'C-REPARTO', title: 'Nadie crece y el equipo depende de ti para todo', severity: 'medium', explanation: 'Tareas a la persona equivocada, a la junior lo crítico o lo difícil para ti: el equipo no aprende.', technique: 'Delegar según fortalezas, crecimiento y carga.', preventedBy: 'team.grow' },
    { id: 'C-PABLO', title: 'Pablo se quema y deja Kobalto', severity: 'medium', explanation: 'Tres squads para una persona era un problema de capacidad que nadie escaló.', technique: 'Escuchar la sobrecarga y escalar la capacidad con datos.', preventedBy: 'pablo.ok' },
    { id: 'C-LUCIA', title: 'Lucía deja de preguntar y comete errores por no atreverse', severity: 'medium', explanation: 'Delegar sin apoyo, o quitarle la tarea, la deja igual de insegura.', technique: 'Delegar con apoyo: con quién empezar, cuándo revisar y permiso para equivocarse.', preventedBy: 'lucia.supported' },
  ],

  prevention: {
    title: 'Tus primeros meses como Lead',
    intro: 'Cada decisión de hoy con una persona de tu equipo se nota en las semanas siguientes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'release.options', label: 'Riesgo llevado a quien decide', explanation: 'Héctor no bloqueaba: informaba. Opciones y recomendación, y decide negocio.' },
      { flag: 'hector.trust', label: 'Tu equipo sabe que le respaldas', explanation: 'Apoyaste a Héctor sin desautorizarle ni pedirle que firmara.' },
      { flag: 'sergio.ok', label: 'Primer 1:1 con Sergio bien llevado', explanation: 'Nombraste lo incómodo, preguntaste por sus objetivos y le diste un reto visible.' },
      { flag: 'team.grow', label: 'Reparto que hace crecer', explanation: 'Cada tarea a quien mejor encaja; ni la junior con lo crítico, ni tú con lo difícil, ni más carga a quien no llega.' },
      { flag: 'pablo.ok', label: 'Capacidad escalada', explanation: 'Protegiste a Pablo esta semana y llevaste los datos a tu QA Manager.' },
      { flag: 'lucia.supported', label: 'Delegar con apoyo', explanation: 'Lucía empieza con Héctor, revisáis juntas el jueves y puede equivocarse.' },
    ],
  },

  concepts: [
    { id: 'role_qa_lead', title: 'Responsabilidades del QA Lead', summary: 'Posee a las personas del equipo, el reparto y el feedback. Decide quién lleva qué y cómo trabaja el equipo. No decide si se asume un riesgo de negocio ni la plantilla. Ya no es el mejor QA del equipo.' },
    { id: 'delegate_grow', title: 'Delegar para que crezcan', summary: 'Cada tarea según fortalezas, crecimiento y carga. Lo crítico a quien más sabe; riesgo controlado para quien está aprendiendo; nada nuevo a quien no llega. Delegar con apoyo, no soltar.' },
    { id: 'first_one_on_one', title: 'El primer 1:1', summary: 'Es el espacio de la otra persona: motivación, objetivos, cómo dar feedback y qué necesita de ti. Lo incómodo se nombra.' },
    { id: 'back_your_team', title: 'Respaldar a tu equipo', summary: 'Cuando alguien avisa de un riesgo a tiempo, le apoyas y le das visibilidad. Si le desautorizas, el equipo aprende a callar.' },
    { id: 'risk_ownership_lead', title: 'El Lead y la decisión de riesgo', summary: 'Ni «fírmalo» ni «si QA dice que no, no sale»: llevas el riesgo, las opciones y una recomendación a quien decide.' },
    { id: 'capacity', title: 'Capacidad y sobrecarga', summary: 'La sobrecarga sostenida es un problema de capacidad, no de la persona. El Lead protege a corto plazo y escala con datos.' },
  ],
  debriefConcepts: ['role_qa_lead', 'delegate_grow', 'first_one_on_one', 'back_your_team', 'risk_ownership_lead', 'capacity'],
  seniorTips: [
    'Primera reunión: qué cambia (tu trabajo es que el equipo pueda trabajar) y 1:1 con cada uno esta semana.',
    'Reparto: transferencias → Héctor; automatización → Sergio; pantalla de ahorro → Lucía; rendimiento → Nerea; criterios de Tarjetas → Pablo. Nada para ti.',
    'Prepara el 1:1 con Sergio: lo de que optaba al puesto, sus objetivos, cómo quiere el feedback y qué necesita de ti.',
    'A Pablo: gracias por avisar, nada nuevo esta semana y le llevas los datos a Laura.',
    'A Héctor: gracias, vais juntos a Marta, cuenta él los datos y tú le respaldas.',
    'Con Marta: Héctor informa, no bloquea; opciones (límite de 10.000 € o retrasar) y decide negocio.',
    'A Lucía: riesgo bajo a propósito, empieza con Héctor y revisáis juntas.',
  ],
}
