import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m08Lessons } from './m08-lessons'
import { m08Quiz } from './m08-quiz'
import { m08Scenes } from './m08-scenes'
import { FICHA_QA_MANAGER } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 8 — Contratar (rol: QA Manager).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m08-contratar.md
 *
 * Año 5. Tres vacantes, un proceso lento y un candidato recomendado por el
 * CTO que no cubre lo que el equipo necesita. App «Contratación»: perfil y
 * proceso, y tarjeta de evaluación de cinco finalistas.
 */
export const m08Contratar: Mission = {
  id: 'm08-contratar',
  courseKey: 'gestion-equipos-qa',
  number: 8,
  title: 'Contratar',
  subtitle: 'QA Manager: perfil según lo que falta, entrevista estructurada, sesgos, decir que no con datos, oferta rápida y onboarding.',
  world: kobaltoTeamsWorld({
    laura: 'VP Engineering · tu responsable',
    raul: 'CTO',
    andrea: 'People Partner · Personas',
    sergio: 'QA Lead · Pagos · tu equipo',
    hector: 'QA Lead · Tarjetas · tu equipo',
  }),
  playerRole: 'QA Manager · Banca diaria',
  dayStart: 9 * 60,
  dayLabel: 'Martes · año 5',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'BD',
  appId: 'kobalto-hiring',
  appLabel: 'Contratación',
  hideBugList: true,
  wikiLabel: 'Wiki · QA de Banca diaria',
  initialMetrics: {},
  lessons: m08Lessons,
  mentor: 'laura',
  quiz: m08Quiz,
  verdicts: {
    good: {
      title: 'Tres contrataciones que suman',
      body: 'Ana, Javier y Rocío aceptan, llegan con su plan y en tres meses cubren lo que le faltaba al área. Raúl entiende el «no» y el equipo confía en el proceso.',
    },
    ok: {
      title: 'Vacantes cubiertas, proceso mejorable',
      body: 'Has contratado, pero algo del proceso no fue justo, rápido o basado en evidencias. Mira en el debrief qué te costó.',
    },
    bad: {
      title: 'Contratar por impresiones',
      body: 'Sin perfil ni tarjeta, decidieron la presión y las impresiones. Repite la misión empezando por el perfil.',
    },
  },

  briefing: {
    title: 'Año 5 · QA Manager de Banca diaria',
    paragraphs: [
      'Ahora llevas tres equipos de QA y a sus leads. Tienes tres vacantes aprobadas.',
      'El proceso actual tarda siete semanas y el mes pasado se perdieron dos candidatos. Y el CTO te ha mandado a un antiguo compañero suyo.',
      'Hay cinco finalistas. A las 12:00 tenéis el debate de contratación; decide después.',
    ],
    goals: [
      'Lee la ficha del rol de QA Manager.',
      'Define el perfil desde lo que le falta al área, con un formato de entrevista y un proceso que funcionen.',
      'Que el recomendado del CTO pase el mismo proceso, y gestiona los conflictos de interés del panel.',
      'En el debate, decide con evidencias.',
      'Envía la decisión sobre los cinco finalistas y explícasela a Raúl.',
      'Cierra la oferta y el onboarding.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m08Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_MANAGER,
    {
      id: 'hiring_guide',
      title: 'Cómo contratamos en Kobalto',
      updatedLabel: 'Andrea Gil · Personas',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'structured_interview' }, { kind: 'flag', key: 'guide.read' }],
      body: `## Perfil
- Lo que necesita el equipo, en criterios observables.
- Nada que no prediga el trabajo: títulos, años o herramientas concretas.

## Entrevista
- Mismas preguntas, ejercicio realista y tarjeta con escala.
- Cada entrevistador puntúa por separado antes del debate.
- Quien tenga relación con un candidato no lo evalúa.

## Decisión y oferta
- En el debate mandan las evidencias.
- Respuesta en 48 horas como máximo.
- Onboarding: buddy, plan de 30-60-90 días y primer 1:1 con su lead.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-RUIDO', title: 'Cada entrevistador mide una cosa distinta y el proceso vuelve a tardar siete semanas', severity: 'high', explanation: 'Sin perfil claro, tarjeta ni proceso corto, el debate es de opiniones y los candidatos se van.', technique: 'Perfil desde lo que falta, entrevista estructurada y dos entrevistas en una semana.', preventedBy: 'process.ready' },
    { id: 'C-SESGO', title: 'Descartáis a la mejor candidata por no tener «el perfil de siempre»', severity: 'high', explanation: 'Una impresión de afinidad pesa más que la evidencia de la tarjeta.', technique: 'Preguntar «¿qué evidencia tenemos?» y volver a la tarjeta.', preventedBy: 'bias.checked' },
    { id: 'C-ENCAJE', title: 'Las contrataciones no cubren lo que le falta al área', severity: 'high', explanation: 'Contratar por recomendación o por currículo, y no por lo que mide la tarjeta frente al perfil.', technique: 'Decidir con la tarjeta: Ana, Javier y Rocío.', preventedBy: 'hiring.ok' },
    { id: 'C-INTERES', title: 'El equipo cree que Ana entró por ser amiga de Sergio', severity: 'medium', explanation: 'Un conflicto de interés sin gestionar mancha una buena contratación.', technique: 'Apartar al entrevistador y dejarlo registrado.', preventedBy: 'coi.ok' },
    { id: 'C-CTO', title: 'Raúl siente que su recomendación se despachó sin explicación', severity: 'medium', explanation: 'Un «no» sin datos suena a algo personal.', technique: 'Decir que no con la misma tarjeta y ofrecer una salida.', preventedBy: 'cto.handled' },
    { id: 'C-LENTO', title: 'Ana acepta otra oferta mientras esperabais', severity: 'high', explanation: 'Los buenos candidatos tienen otras ofertas y no esperan.', technique: 'Oferta el mismo día y onboarding preparado.', preventedBy: 'offer.fast' },
  ],

  prevention: {
    title: 'Tres meses después',
    intro: 'Una contratación se mide cuando la persona ya trabaja con el equipo.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'process.ready', label: 'Perfil y proceso', explanation: 'Desde lo que faltaba, con tarjeta, ejercicio realista y dos entrevistas en una semana.' },
      { flag: 'bias.checked', label: 'Evidencias, no impresiones', explanation: 'Rocío, valorada por la tarjeta y no por su currículo.' },
      { flag: 'hiring.ok', label: 'Contrataciones que encajan', explanation: 'Automatización, rendimiento y negocio con acompañamiento a junior.' },
      { flag: 'coi.ok', label: 'Conflicto de interés gestionado', explanation: 'Sergio no evaluó a su amiga y quedó registrado.' },
      { flag: 'cto.handled', label: '«No» con datos', explanation: 'Raúl entiende la decisión y Marcos recibe feedback.' },
      { flag: 'offer.fast', label: 'Oferta y onboarding', explanation: 'Respuesta el mismo día, buddy, plan de 30-60-90 y primer 1:1.' },
    ],
  },

  concepts: [
    { id: 'role_qa_manager', title: 'Responsabilidades del QA Manager', summary: 'Varios equipos y sus leads: contratación, capacidad, presupuesto y carreras. Se le mide por capacidad, retención y por cómo crecen sus leads.' },
    { id: 'hiring_profile', title: 'Perfil desde las necesidades', summary: 'Lo que le falta al equipo, en criterios observables, sin filtros que no predicen el trabajo.' },
    { id: 'structured_interview', title: 'Entrevista estructurada', summary: 'Mismas preguntas, ejercicio realista, tarjeta con escala y puntuación individual antes del debate.' },
    { id: 'interview_bias', title: 'Sesgos al contratar', summary: 'Afinidad, halo, primera impresión y conflictos de interés. Antídoto: evidencias de la tarjeta.' },
    { id: 'fair_process', title: 'Proceso justo', summary: 'Mismo proceso para todos, también para los recomendados.' },
    { id: 'say_no_with_data', title: 'Decir que no con datos', summary: 'La misma tarjeta, lo bueno reconocido, lo que faltaba frente al perfil y una salida.' },
    { id: 'onboarding_plan', title: 'Oferta y onboarding', summary: 'Respuesta rápida, buddy, plan de 30-60-90 días y primer 1:1 con su lead.' },
  ],
  debriefConcepts: ['hiring_profile', 'structured_interview', 'interview_bias', 'fair_process', 'say_no_with_data', 'onboarding_plan'],
  seniorTips: [
    'Perfil: API en el pipeline, rendimiento, explicar riesgos y acompañar a junior. Nada de títulos, años, herramienta exacta ni «encaje».',
    'Entrevista estructurada con ejercicio realista; dos entrevistas en una semana.',
    'A Andrea: Marcos, mismo proceso. A Sergio: no entrevista a su amiga y queda registrado.',
    'En el debate: «¿qué evidencia tenemos?» y volver a la tarjeta.',
    'Decisión: Ana, Javier y Rocío; Marcos y Luis, no.',
    'A Raúl: la misma tarjeta, lo bueno reconocido y una salida para Marcos. A Andrea: oferta hoy y onboarding preparado.',
  ],
}
