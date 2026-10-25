import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m01Lessons } from './m01-lessons'
import { m01Quiz } from './m01-quiz'
import { m01Scenes } from './m01-scenes'
import { FICHA_QA_MANUAL } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 1 — El cuello de botella (rol: QA manual).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m01-cuello-botella.md
 *
 * Penúltimo día del sprint 14: seis historias esperan en «Listo para QA»,
 * Raúl pregunta si QA es el cuello de botella y en la retro llega el
 * feedback duro de Diego. App «Sprint»: tablero, análisis del flujo, plan del
 * día por riesgo y propuestas para la retro.
 */
export const m01CuelloBotella: Mission = {
  id: 'm01-cuello-botella',
  courseKey: 'gestion-equipos-qa',
  number: 1,
  title: 'El cuello de botella',
  subtitle: 'QA manual: hacer visible el flujo, priorizar la cola por riesgo, proponer acuerdos y recibir feedback.',
  world: kobaltoTeamsWorld({ laura: 'QA Lead · tu responsable', sergio: 'QA Automation · Tarjetas', marta: 'Product Owner · Pagos', diego: 'Backend developer · Tarjetas' }),
  playerRole: 'QA manual · squad Tarjetas',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles · año 1',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'KOB',
  appId: 'kobalto-sprint',
  appLabel: 'Sprint',
  hideBugList: true,
  wikiLabel: 'Wiki · Squad Tarjetas',
  initialMetrics: {},
  lessons: m01Lessons,
  mentor: 'laura',
  quiz: m01Quiz,
  verdicts: {
    good: {
      title: 'El cuello de botella era el flujo',
      body: 'El equipo sale de la retro con tres acuerdos, el bug crítico del límite no llega a producción y Raúl deja de hablar de «QA es lento».',
    },
    ok: {
      title: 'Sprint cerrado, causa sin tocar',
      body: 'Sacaste el día adelante, pero algo de la causa sigue ahí. Mira en el debrief qué volverá en el sprint 15.',
    },
    bad: {
      title: 'La cola tiene tu nombre',
      body: 'Sin datos ni acuerdos, «QA es el cuello de botella» se queda como verdad. Repite la misión empezando por el flujo del sprint.',
    },
  },

  briefing: {
    title: 'Año 1 · El cuello de botella',
    paragraphs: [
      'Unos meses después de tu primer release. Es el día 9 del sprint 14 y en «Listo para QA» hay seis historias. Hoy solo te da tiempo a probar tres.',
      'Es el tercer sprint seguido así. Raúl pregunta si QA es el cuello de botella y a las 16:00 es la retro.',
      'Tu rol sigue siendo QA manual, pero hoy toca algo más que probar: hacer visible por qué pasa esto y proponer cómo cambiarlo.',
    ],
    goals: [
      'En la daily, haz visible la cola y pide ayuda al equipo para probar.',
      'Prioriza la cola por riesgo: elige en la app «Sprint» las tres historias que pruebas hoy.',
      'Analiza el flujo del sprint para llevar datos, no sensaciones.',
      'Responde a Raúl con datos, sin culpar a nadie y sin pedir lo que no te toca.',
      'Prepara hasta tres acuerdos de equipo que ataquen la causa.',
      'En la retro, recibe el feedback de Diego sin ponerte a la defensiva.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m01Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_MANUAL,
    {
      id: 'flujo',
      title: 'Cómo trabajamos en Tarjetas',
      updatedLabel: 'Laura Méndez · QA Lead',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'flow_visibility' }, { kind: 'flag', key: 'flow.read' }],
      body: `## El sprint
- Sprints de 10 días. Review y retro el último día.
- Una historia está «Hecha» cuando está desarrollada, probada y desplegada en staging.

## Señales de que el flujo se atasca
- Muchas historias llegan a QA a la vez, al final del sprint.
- QA no tiene nada que probar los primeros días.
- Historias grandes que solo se pueden probar enteras.
- Criterios de aceptación que se descubren al probar.

## La retro
- Se habla de hechos, no de personas.
- Se acuerdan como mucho dos o tres cambios que dependan del propio equipo.
- Se revisan en la siguiente retro.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-LIMITE', title: 'El límite diario se puede superar con dos pagos a la vez y llega a producción', severity: 'critical', explanation: 'KOB-433 era la historia de más riesgo de la cola y se quedó sin probar.', technique: 'Priorizar la cola de pruebas por riesgo (impacto × probabilidad).', preventedBy: 'test.limits' },
    { id: 'C-NORMATIVA', title: 'Los pagos en dólares no notifican al cliente: incumplimiento normativo', severity: 'high', explanation: 'La notificación obligatoria (KOB-435) se quedó sin probar mientras se probaba algo menos crítico.', technique: 'El riesgo regulatorio cuenta como impacto alto.', preventedBy: 'test.notif' },
    { id: 'C-COLA', title: 'El sprint 15 vuelve a cerrar con seis historias en «Listo para QA»', severity: 'high', explanation: 'Sin acuerdos de equipo sobre el flujo (criterios antes, WIP, historias pequeñas, devs que prueban), la cola se repite.', technique: 'Acuerdos de equipo que atacan la causa.', preventedBy: 'retro.agreed' },
    { id: 'C-CULPA', title: 'En dirección se queda la idea de que «QA es lento» y se pide otro QA sin cambiar nada', severity: 'medium', explanation: 'Sin datos, la explicación más fácil es una persona.', technique: 'Hacer visible el flujo con datos, sin culpables.', preventedBy: 'raul.data' },
    { id: 'C-RITMO', title: 'Trabajas hasta las once dos noches y el sprint siguiente rindes la mitad', severity: 'medium', explanation: 'Las horas extra esconden el problema y lo hacen crónico.', technique: 'Ritmo sostenible: el equipo ajusta el compromiso, no tus noches.', preventedBy: 'pace.ok' },
    { id: 'C-RELACION', title: 'La relación con Diego se enfría y los bugs se discuten el doble', severity: 'medium', explanation: 'Responder a la defensiva al feedback cierra la conversación.', technique: 'Recibir feedback: agradecer, preguntar, contrastar con hechos.', preventedBy: 'feedback.ok' },
  ],

  prevention: {
    title: 'El sprint 15',
    intro: 'Lo que hiciste hoy decide cómo va el siguiente sprint.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'test.limits', label: 'Límite diario probado a tiempo', explanation: 'La historia de más riesgo de la cola, probada primero.' },
      { flag: 'test.notif', label: 'Notificación obligatoria probada', explanation: 'El riesgo regulatorio va por delante de lo vistoso.' },
      { flag: 'retro.agreed', label: 'Acuerdos de equipo sobre el flujo', explanation: 'Criterios antes de desarrollar, límite de WIP, historias pequeñas y devs que prueban: cambios que el equipo puede hacer.' },
      { flag: 'raul.data', label: 'Datos en vez de culpables', explanation: '6 de 8 historias llegaron los dos últimos días: el problema era el flujo, no una persona.' },
      { flag: 'pace.ok', label: 'Ritmo sostenible', explanation: 'No te comprometiste a sacarlo todo a base de horas extra.' },
      { flag: 'feedback.ok', label: 'Feedback recibido', explanation: 'Escuchaste a Diego antes de responder.' },
    ],
  },

  concepts: [
    { id: 'role_qa_manual', title: 'Responsabilidades del QA manual', summary: 'Posee sus pruebas, sus bug reports y su estado. Decide cómo probar y cuándo pedir ayuda. No decide si se asume un riesgo de negocio: lo informa.' },
    { id: 'risk_ownership', title: 'Quién decide el riesgo', summary: 'QA informa y recomienda; el dueño del negocio decide salir, recortar alcance o retrasar.' },
    { id: 'risk_queue', title: 'Priorizar la cola por riesgo', summary: 'Cuando no da tiempo a todo, primero lo que más daño hace si falla y más probabilidad tiene de fallar: dinero, regulación y cambios grandes antes que lo vistoso.' },
    { id: 'flow_visibility', title: 'Hacer visible el flujo', summary: 'Cuándo llega el trabajo a QA, cuánto espera, de qué tamaño es y si tenía los criterios claros. Con datos, la conversación deja de ir de personas.' },
    { id: 'team_agreements', title: 'Acuerdos de equipo', summary: 'Dos o tres cambios que ataquen la causa y dependan del equipo: criterios revisados antes de desarrollar, límite de WIP, historias pequeñas, devs que prueban.' },
    { id: 'data_not_blame', title: 'Datos, no culpables', summary: 'Ante «QA es el cuello de botella», ni culpar a desarrollo ni aceptar la culpa: enseñar cómo fluye el trabajo.' },
    { id: 'receive_feedback', title: 'Recibir feedback', summary: 'Agradecer, preguntar para entender y contrastar con hechos. Ni defenderse ni darle la razón a todo.' },
    { id: 'sustainable_pace', title: 'Ritmo sostenible', summary: 'Las horas extra para llegar al cierre esconden el problema y lo hacen crónico.' },
  ],
  debriefConcepts: ['risk_queue', 'flow_visibility', 'team_agreements', 'data_not_blame', 'receive_feedback', 'sustainable_pace'],
  seniorTips: [
    'En la daily: 6 historias, hoy 3, las de más riesgo; pide al equipo que pruebe las otras con tus casos.',
    'Plan del día: KOB-431 (pagos), KOB-433 (límite diario) y KOB-435 (notificación obligatoria).',
    'A Marta: el color después; si no da tiempo, lo enseña avisando de que está sin probar.',
    'Analiza el flujo antes de las 13:00: así llegas a Raúl con datos.',
    'Acuerdos: criterios revisados antes, límite de WIP, historias pequeñas o devs que prueban. Nada de más gente, más días, fines de semana ni «solo el camino feliz».',
    'En la retro: gracias, pregunta qué historia notó parada, enseña los datos y propone.',
  ],
}
