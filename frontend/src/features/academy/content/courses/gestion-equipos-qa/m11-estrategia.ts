import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m11Lessons } from './m11-lessons'
import { m11Quiz } from './m11-quiz'
import { m11Scenes } from './m11-scenes'
import { FICHA_HEAD_OF_QA } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 11 — La estrategia (rol: Head of QA).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m11-estrategia.md
 *
 * Año 8, última misión. Estrategia de calidad a tres años para el comité:
 * métricas de negocio, modelo organizativo, inversión, hoja de ruta y
 * personas. Hay que ganarse a los QA Managers y al CTO antes del ensayo.
 */
export const m11Estrategia: Mission = {
  id: 'm11-estrategia',
  courseKey: 'gestion-equipos-qa',
  number: 11,
  title: 'La estrategia',
  subtitle: 'Head of QA: métricas que entiende dirección, modelo organizativo, inversión por fases, alinear a los QA Managers y ganarse a los escépticos.',
  world: kobaltoTeamsWorld({
    irene: 'CEO',
    raul: 'CTO',
    laura: 'VP Engineering · tu mentora',
    hector: 'QA Manager · Tarjetas',
    sergio: 'QA Manager · Pagos',
  }),
  playerRole: 'Head of QA',
  dayStart: 9 * 60,
  dayLabel: 'Martes · año 8',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'QA',
  appId: 'kobalto-strategy',
  appLabel: 'Estrategia',
  hideBugList: true,
  wikiLabel: 'Wiki · Calidad',
  initialMetrics: {},
  lessons: m11Lessons,
  mentor: 'laura',
  quiz: m11Quiz,
  verdicts: {
    good: {
      title: 'La calidad, cosa de todos',
      body: 'El comité aprueba la primera fase. Un año después, el piloto de pagos ha reducido a la mitad los incidentes y el tiempo a producción, y los QA Managers presentan los resultados. Ocho años después de tu primera firma, QA ya no es la puerta.',
    },
    ok: {
      title: 'Estrategia aprobada a medias',
      body: 'El comité ve valor, pero algo frena el cambio: las métricas, el modelo, las personas o los aliados. Mira en el debrief qué.',
    },
    bad: {
      title: 'Un plan que nadie compra',
      body: 'El comité aplaza la decisión y el área sigue como estaba. Repite la misión empezando por las métricas.',
    },
  },

  briefing: {
    title: 'Año 8 · La estrategia',
    paragraphs: [
      'Después del incidente de transferencias, el consejo quiere un plan de calidad a tres años, no un parche.',
      'El jueves lo presentas al comité de dirección. Hoy a las 16:00 lo ensayas con Irene.',
      'Para que salga, tus QA Managers y el CTO tienen que salir contigo de esa sala.',
    ],
    goals: [
      'Lee la ficha del rol de Head of QA.',
      'Alinea a tus QA Managers con el cambio.',
      'Gánate al CTO, que cree que la calidad es cosa de QA.',
      'Prepara la estrategia: métricas, modelo, inversión, hoja de ruta y personas.',
      'Ensaya con Irene y responde qué pasa si no se hace nada.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m11Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_HEAD_OF_QA,
    {
      id: 'committee_guide',
      title: 'Cómo presentar al comité de dirección',
      updatedLabel: 'Irene Sáez · CEO',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'exec_pitch' }, { kind: 'flag', key: 'guide.read' }],
      body: `## Lo que el comité quiere saber
- Qué problema hay, en dinero, clientes y velocidad.
- Qué propones y cuánto cuesta.
- Qué tiene que decidir hoy.
- Cómo sabrá si funciona.

## Formato
- Diez minutos. El detalle, en un anexo.
- Una petición concreta al final.
- Lo que pasa si no se hace nada, sin exagerar.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-METRICAS', title: 'El comité no ve el valor: le hablaste de tests y cobertura', severity: 'high', explanation: 'Las métricas internas de QA no ayudan a decidir a dirección.', technique: 'Coste de la no calidad, incidentes, tiempo a producción y defectos escapados.', preventedBy: 'strat.metrics' },
    { id: 'C-MODELO', title: 'El nuevo modelo vuelve a hacer de QA la puerta (o lo elimina)', severity: 'critical', explanation: 'Centralizar más, dispersar sin nada común o eliminar QA repite o empeora los problemas.', technique: 'Modelo híbrido con plataforma común y riesgos aceptados por su dueño.', preventedBy: 'strat.model' },
    { id: 'C-PERSONAS', title: 'Los QA manuales temen por su puesto y se van los mejores', severity: 'high', explanation: 'Sustituir o callar sobre las personas rompe la confianza del área.', technique: 'Plan de transición con formación y carrera.', preventedBy: 'strat.people' },
    { id: 'C-MANAGERS', title: 'Los QA Managers frenan el cambio en sus áreas', severity: 'high', explanation: 'Un cambio impuesto a quien lo tiene que llevar a cabo se cumple en el papel.', technique: 'Involucrarlos y darles una pieza que liderar.', preventedBy: 'managers.aligned' },
    { id: 'C-CTO', title: 'Desarrollo no asume su parte de la calidad', severity: 'medium', explanation: 'Sin el CTO, la calidad sigue siendo «cosa de QA».', technique: 'Su métrica y un piloto medible.', preventedBy: 'cto.won' },
    { id: 'C-COMITE', title: 'El comité aplaza la decisión', severity: 'high', explanation: 'Sin una presentación clara, una petición concreta y el coste de no actuar, no hay decisión.', technique: 'Problema en su idioma, propuesta, petición y coste de no hacer nada.', preventedBy: 'committee.ok' },
  ],

  prevention: {
    title: 'Un año después',
    intro: 'Una estrategia se mide por lo que cambia en la empresa.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'strat.metrics', label: 'Métricas de negocio', explanation: 'Coste, incidentes, tiempo a producción y defectos escapados.' },
      { flag: 'strat.model', label: 'Modelo híbrido', explanation: 'QA en los squads, plataforma común y riesgos aceptados por su dueño.' },
      { flag: 'strat.people', label: 'Plan para las personas', explanation: 'Formación y carrera para los QA manuales.' },
      { flag: 'managers.aligned', label: 'QA Managers dentro', explanation: 'Héctor lidera la política de riesgos; Sergio, la plataforma.' },
      { flag: 'cto.won', label: 'CTO a favor', explanation: 'Piloto medido con su métrica.' },
      { flag: 'committee.ok', label: 'Comité convencido', explanation: 'Primera fase aprobada, con el coste de no actuar sobre la mesa.' },
    ],
  },

  concepts: [
    { id: 'role_head_of_qa', title: 'Responsabilidades del Head of QA', summary: 'Estrategia, modelo y cultura de calidad; inversión y políticas; se le mide por el coste de la no calidad y la confianza de dirección.' },
    { id: 'quality_metrics', title: 'Métricas para dirección', summary: 'Coste de la no calidad, incidentes, tiempo a producción y defectos escapados; no tests ni cobertura.' },
    { id: 'quality_model', title: 'Modelo organizativo de QA', summary: 'Centralizado, embebido o híbrido con plataforma común; y un plan para las personas en la transición.' },
    { id: 'exec_pitch', title: 'Presentar al comité', summary: 'El problema en su idioma, la propuesta, inversión por fases, una petición concreta y el coste de no actuar.' },
    { id: 'lead_change', title: 'Liderar el cambio', summary: 'Escuchar el riesgo que ven los escépticos, darles una pieza y usar pilotos medibles.' },
  ],
  debriefConcepts: ['quality_metrics', 'quality_model', 'exec_pitch', 'lead_change'],
  seniorTips: [
    'A los QA Managers: vuestro riesgo es real; Héctor lidera la política de riesgos y Sergio la plataforma.',
    'Al CTO: cinco de doce días esperando a QA; piloto medido con el tiempo a producción.',
    'Métricas: coste de la no calidad, incidentes, tiempo a producción y defectos escapados.',
    'Estrategia: modelo híbrido, inversión por fases, piloto en pagos y plan de transición para los QA manuales.',
    'A Irene: problema, causa, propuesta y «aprobad la primera fase»; si no se hace nada, unos 2 M€ al año y otro incidente.',
  ],
}
