import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m07Lessons } from './m07-lessons'
import { m07Quiz } from './m07-quiz'
import { m07Scenes } from './m07-scenes'
import { FICHA_QA_LEAD } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 7 — La conversación difícil (rol: QA Lead).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m07-conversacion.md
 *
 * Año 4, tres meses después de la misión 6. Lucía rinde por debajo de lo
 * esperado desde que pasó a Tarjetas, Nerea se queja y Personas pregunta si
 * abre un plan de mejora. App «1:1»: ejemplos y guion de la conversación,
 * que se ramifica según cómo la plantees.
 */
export const m07Conversacion: Mission = {
  id: 'm07-conversacion',
  courseKey: 'gestion-equipos-qa',
  number: 7,
  title: 'La conversación difícil',
  subtitle: 'QA Lead: feedback con hechos, buscar la causa, plan con objetivos medibles, documentar, mediar y cuidar la confidencialidad.',
  world: kobaltoTeamsWorld({
    laura: 'QA Manager · tu responsable',
    andrea: 'People Partner · Personas',
    hector: 'QA · Pagos · tu equipo',
    lucia: 'QA · Tarjetas · tu equipo',
    nerea: 'QA · Tarjetas · tu equipo',
    pablo: 'QA · Tarjetas · tu equipo',
  }),
  playerRole: 'QA Lead · Pagos y Tarjetas',
  dayStart: 9 * 60,
  dayLabel: 'Jueves · año 4',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'PAG',
  appId: 'kobalto-oneonone',
  appLabel: '1:1',
  hideBugList: true,
  wikiLabel: 'Wiki · QA de Pagos',
  initialMetrics: {},
  lessons: m07Lessons,
  mentor: 'laura',
  quiz: m07Quiz,
  verdicts: {
    good: {
      title: 'Una conversación que cambia las cosas',
      body: 'Lucía sabe qué tiene que cambiar y tiene ayuda para hacerlo; en seis semanas cierra sus historias y pide ayuda a tiempo. El equipo no se ha enterado de nada que no le tocara.',
    },
    ok: {
      title: 'Conversación hecha, cambio a medias',
      body: 'Has dado el paso, pero algo quedó cojo: la causa, el plan, el registro o el equipo. Mira en el debrief qué falló.',
    },
    bad: {
      title: 'Una conversación que empeora las cosas',
      body: 'Lucía no sabe qué cambiar, el equipo comenta su caso y Personas tiene un plan que no se sostiene. Repite la misión empezando por la preparación.',
    },
  },

  briefing: {
    title: 'Año 4 · La conversación difícil',
    paragraphs: [
      'Hace tres meses pasaste a Lucía a Tarjetas para descargar a Pablo. Desde entonces rinde por debajo de lo esperado.',
      'Nerea se queja de que rehace sus pruebas, en el equipo se empieza a comentar y Andrea, de Personas, pregunta si abre un plan de mejora.',
      'Hoy a las 12:00 tienes el 1:1 con Lucía. Lo que prepares antes decide cómo irá.',
    ],
    goals: [
      'Lee la ficha del rol de QA Lead.',
      'Atiende la queja de Nerea sin exponer a Lucía.',
      'Prepara el 1:1 en la app «1:1»: ejemplos concretos y guion. Antes de las 12:00.',
      'En la conversación, busca la causa y acuerda un plan medible y por escrito.',
      'Responde a Personas sobre el plan de mejora.',
      'Media entre Nerea y Lucía.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m07Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_LEAD,
    {
      id: 'feedback_guide',
      title: 'Feedback difícil y planes de mejora',
      updatedLabel: 'Andrea Gil · Personas',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'sbi_feedback' }, { kind: 'flag', key: 'guide.read' }],
      body: `## Antes de la conversación
- Ejemplos concretos: situación, comportamiento e impacto. Nada de juicios ni de opiniones de terceros.

## En la conversación
- Di a qué vienes, con hechos.
- Pregunta y escucha: busca la causa.
- Acordad objetivos medibles, el apoyo y la fecha de revisión.

## Después
- Resumen por escrito el mismo día, compartido con la persona.
- El plan de mejora formal llega solo si, con feedback claro y apoyo, no hay cambio.
- Confidencialidad: no se comenta con el resto del equipo.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-INJUSTO', title: 'Personas abre un plan formal sin feedback previo y hay que retirarlo', severity: 'high', explanation: 'Un plan formal sin conversación clara, causa ni apoyo previos es injusto y no se sostiene.', technique: 'Primero feedback claro y plan con apoyo; el formal, solo si no funciona.', preventedBy: 'pip.right' },
    { id: 'C-CAUSA', title: 'Lucía sigue atascada en Tarjetas: nadie atacó la causa', severity: 'high', explanation: 'Sin formación en el dominio nuevo, ningún «esfuérzate más» cambia nada.', technique: 'Preguntar, escuchar y dar apoyo concreto para la causa.', preventedBy: 'cause.found' },
    { id: 'C-VAGO', title: 'Lucía no sabe qué tiene que cambiar', severity: 'medium', explanation: 'Sin hechos concretos, el feedback suena a juicio y no se puede actuar.', technique: 'Situación, comportamiento e impacto.', preventedBy: 'feedback.ok' },
    { id: 'C-RUMOR', title: 'Todo el equipo comenta la situación de Lucía', severity: 'high', explanation: 'Lo que el Lead comparte «entre nosotros» circula, y la persona pierde la confianza en su Lead y en el equipo.', technique: 'Confidencialidad sin mentir.', preventedBy: 'confidential.ok' },
    { id: 'C-CONFLICTO', title: 'Nerea y Lucía dejan de hablarse', severity: 'medium', explanation: 'El roce sin mediar crece hasta que el trabajo de Tarjetas se resiente.', technique: 'Mediar sobre cómo trabajan juntas, con un acuerdo concreto.', preventedBy: 'conflict.ok' },
    { id: 'C-PAPEL', title: 'A las seis semanas nadie recuerda lo mismo de lo acordado', severity: 'medium', explanation: 'Sin un resumen compartido, la revisión se convierte en «yo entendí otra cosa».', technique: 'Resumen escrito el mismo día, compartido con la persona.', preventedBy: 'documented' },
  ],

  prevention: {
    title: 'Seis semanas después',
    intro: 'Una conversación difícil se mide por lo que cambia después.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'feedback.ok', label: 'Feedback concreto', explanation: 'Tres hechos con su impacto, sin juicios.' },
      { flag: 'cause.found', label: 'Causa atacada', explanation: 'Dos semanas en pareja con Pablo para aprender Tarjetas.' },
      { flag: 'documented', label: 'Por escrito', explanation: 'Resumen compartido con objetivos y fecha de revisión.' },
      { flag: 'pip.right', label: 'Plan formal en su momento', explanation: 'Solo si con feedback y apoyo no hay cambio.' },
      { flag: 'confidential.ok', label: 'Confidencialidad', explanation: 'Ni Nerea ni Héctor supieron más de lo que les tocaba.' },
      { flag: 'conflict.ok', label: 'Conflicto mediado', explanation: 'Nerea revisa antes en vez de rehacer después.' },
    ],
  },

  concepts: [
    { id: 'role_qa_lead', title: 'Responsabilidades del QA Lead', summary: 'Las personas de su equipo: que sepan qué se espera, que crezcan y que puedan trabajar. Escala a su Manager el bajo rendimiento que no mejora con feedback y apoyo.' },
    { id: 'sbi_feedback', title: 'Feedback con hechos', summary: 'Situación, comportamiento e impacto. Sin juicios, sin opiniones de terceros y sin sándwich.' },
    { id: 'root_cause', title: 'Buscar la causa', summary: 'Expectativas, conocimiento, capacidad o algo personal: preguntar y escuchar antes de proponer.' },
    { id: 'improvement_plan', title: 'Plan con objetivos medibles', summary: 'Objetivos comprobables, apoyo concreto y fecha de revisión. El plan formal, después y solo si hace falta.' },
    { id: 'documentation', title: 'Documentar la conversación', summary: 'Resumen escrito el mismo día, compartido con la persona: hechos, acuerdos, objetivos y fecha.' },
    { id: 'mediation', title: 'Mediar en un conflicto', summary: 'Hacerse cargo, hablar de cómo trabajan y no de quién tiene razón, y cerrar un acuerdo concreto.' },
    { id: 'confidentiality', title: 'Confidencialidad', summary: 'La situación de una persona no se comenta con el resto, sin mentir.' },
  ],
  debriefConcepts: ['sbi_feedback', 'root_cause', 'improvement_plan', 'documentation', 'mediation', 'confidentiality'],
  seniorTips: [
    'A Nerea: gracias por decírmelo a mí; me ocupo yo y esta tarde vemos cómo os coordináis.',
    'A Héctor: no hablo de la situación de nadie del equipo, igual que no hablaría de la tuya.',
    'Preparación: los tres hechos (sprint 14, plan de límites, dailies), apertura directa, preguntas abiertas, objetivos a seis semanas y resumen compartido.',
    'A Lucía: hechos, pregunta y escucha; dos semanas con Pablo, objetivos medibles y 1:1 semanal.',
    'A Andrea: todavía no; si con este plan no mejora, abrimos el formal.',
    'Con Nerea y Lucía: cómo trabajáis, no quién tiene razón; revisar antes en vez de rehacer.',
  ],
}
