import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m05Lessons } from './m05-lessons'
import { m05Quiz } from './m05-quiz'
import { m05Scenes } from './m05-scenes'
import { FICHA_QA_ARCHITECT } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 5 — Construir o comprar (rol: QA Architect).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m05-comprar.md
 *
 * Año 3. Hay que elegir plataforma de entornos efímeros y datos de prueba: un
 * proveedor presiona con un descuento, Plataforma quiere construirla y Raúl
 * pide el coste a tres años. App «Evaluación»: criterios, opciones, coste
 * total y recomendación.
 */
export const m05Comprar: Mission = {
  id: 'm05-comprar',
  courseKey: 'gestion-equipos-qa',
  number: 5,
  title: 'Construir o comprar',
  subtitle: 'QA Architect: criterios de evaluación, coste total a tres años, piloto con criterios de éxito, salida del proveedor y datos de prueba seguros.',
  world: kobaltoTeamsWorld({
    raul: 'Head of Engineering',
    laura: 'QA Lead · Pagos',
    ivan: 'Lead de Plataforma',
    carmen: 'Riesgos y Compliance',
  }),
  playerRole: 'QA Architect · Plataforma',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · año 3',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'PLT',
  appId: 'kobalto-vendor',
  appLabel: 'Evaluación',
  hideBugList: true,
  wikiLabel: 'Wiki · Plataforma',
  initialMetrics: {},
  lessons: m05Lessons,
  mentor: 'laura',
  quiz: m05Quiz,
  verdicts: {
    good: {
      title: 'Una decisión que se sostiene',
      body: 'El piloto cumple los criterios, Riesgos da el visto bueno, Plataforma integra la herramienta y el comité aprueba con el coste real.',
    },
    ok: {
      title: 'Buena herramienta, decisión frágil',
      body: 'La plataforma funciona, pero algo quedó sin cubrir. Mira en el debrief qué te costó.',
    },
    bad: {
      title: 'Decidido por la demo y la factura',
      body: 'Sin criterios ni coste total, la decisión se deshace en cuanto llega la realidad. Repite la misión empezando por los criterios.',
    },
  },

  briefing: {
    title: 'Año 3 · Construir o comprar',
    paragraphs: [
      'Montar un entorno de pruebas tarda tres días y varios squads copian datos de producción para probar.',
      'Hay que elegir una plataforma de entornos efímeros y datos de prueba. Un proveedor presiona con un descuento, Plataforma quiere construirla y Raúl pide el coste a tres años para el comité.',
      'Tu trabajo no es elegir la herramienta que más te gusta: es una recomendación que Dirección pueda defender.',
    ],
    goals: [
      'Define los criterios de evaluación antes de comparar.',
      'Responde al proveedor sin dejar que su fecha decida por ti.',
      'Incluye a Plataforma en la evaluación con los mismos criterios.',
      'Compara el coste total a tres años de las tres opciones.',
      'Acuerda con Riesgos cómo se protegen los datos.',
      'Envía tu recomendación con piloto y condiciones, y prepárala con Raúl para el comité.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m05Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_ARCHITECT,
    {
      id: 'eval_guide',
      title: 'Cómo evaluamos herramientas en Plataforma',
      updatedLabel: 'Plataforma',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'eval_criteria' }, { kind: 'flag', key: 'guide.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Antes de mirar opciones
- Escribe el problema y los criterios. Lo imprescindible primero.

## Comparar
- Las mismas preguntas para todas las opciones, también la de construir.
- Coste total a tres años: licencias, puesta en marcha, personas, infraestructura y salida.

## Decidir
- Piloto acotado con criterios de éxito medibles.
- Con proveedor: cláusula de salida, exportación de datos y contrato de tratamiento si hay datos personales.
- Fecha para revisar la decisión.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-SORPRESA', title: 'El primer año cuesta el doble de lo presupuestado: nadie contó las personas', severity: 'high', explanation: 'Comparar solo licencias esconde el coste de mantener y operar la plataforma.', technique: 'Coste total a tres años con todas las partidas.', preventedBy: 'tco.ok' },
    { id: 'C-ATADOS', title: 'Al renovar, el proveedor sube un 40 % y no podéis salir', severity: 'high', explanation: 'Sin cláusula de salida ni exportación de datos, o con un contrato cerrado, pierdes capacidad de negociar.', technique: 'Cláusula de salida, exportación en formato abierto y nada de contratos largos antes del piloto.', preventedBy: 'exit.ok' },
    { id: 'C-DATOS', title: 'Datos reales de clientes acaban en la plataforma de pruebas', severity: 'critical', explanation: 'Los datos copiados de producción son datos personales: sin anonimizar ni contrato, es un incumplimiento.', technique: 'Datos sintéticos o anonimizados, contrato de tratamiento y comprobación en el piloto.', preventedBy: 'privacy.ok' },
    { id: 'C-DEMO', title: 'La herramienta no encaja con vuestro pipeline: la demo no lo enseñaba', severity: 'medium', explanation: 'Sin piloto con criterios de éxito, decides con lo que el proveedor eligió enseñar.', technique: 'Piloto acotado con tu pipeline, tus datos anonimizados y criterios medibles.', preventedBy: 'pilot.ok' },
    { id: 'C-SOMBRA', title: 'Plataforma construye su propia herramienta en paralelo', severity: 'medium', explanation: 'Un equipo que no participa en la decisión no la adopta y acaba duplicando el trabajo.', technique: 'Incluir su opción en la evaluación con los mismos criterios.', preventedBy: 'build.fair' },
    { id: 'C-COMITE', title: 'El comité devuelve la propuesta: no se sostiene', severity: 'medium', explanation: 'Sin criterios, coste total, riesgos y plan, Dirección no puede aprobar.', technique: 'Recomendación clara con criterios, coste total, riesgos, piloto y revisión.', preventedBy: 'committee.ok' },
  ],

  prevention: {
    title: 'Un año después',
    intro: 'Una decisión de compra se mide cuando llega la factura, la renovación y la primera auditoría.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'tco.ok', label: 'Coste total', explanation: 'Licencias, puesta en marcha, personas, infraestructura y salida.' },
      { flag: 'exit.ok', label: 'Salida del proveedor', explanation: 'Cláusula de salida y exportación de datos, sin contrato cerrado antes del piloto.' },
      { flag: 'privacy.ok', label: 'Datos protegidos', explanation: 'Anonimización, contrato de tratamiento y comprobación con Riesgos.' },
      { flag: 'pilot.ok', label: 'Piloto con criterios', explanation: '4 semanas, dos squads, criterios medibles y firma solo si se cumplen.' },
      { flag: 'build.fair', label: 'Plataforma dentro', explanation: 'Su opción evaluada con los mismos criterios y su propia estimación.' },
      { flag: 'committee.ok', label: 'Comité convencido', explanation: 'Recomendación con criterios, coste, riesgos, piloto y revisión.' },
    ],
  },

  concepts: [
    { id: 'role_qa_architect', title: 'Responsabilidades del QA Architect', summary: 'Posee las decisiones técnicas de pruebas comunes. No tiene presupuesto: propone con su coste y riesgos, y decide Dirección.' },
    { id: 'eval_criteria', title: 'Criterios de evaluación', summary: 'Salen del problema y de las restricciones, y se fijan antes de mirar opciones.' },
    { id: 'tco', title: 'Coste total a tres años', summary: 'Licencias, puesta en marcha, personas, infraestructura y salida. «Sin licencias» no es «gratis».' },
    { id: 'build_vs_buy', title: 'Construir o comprar', summary: 'Construir lo que diferencia; comprar lo común. Con capacidad real y evaluando ambas opciones con los mismos criterios.' },
    { id: 'pilot_success', title: 'Piloto con criterios de éxito', summary: 'Acotado, con tu pipeline y tus datos anonimizados, criterios medibles definidos antes y decisión al final.' },
    { id: 'vendor_lockin', title: 'Dependencia del proveedor', summary: 'Cláusula de salida, exportación de datos, nada de contratos largos antes del piloto y fecha de revisión.' },
    { id: 'test_data_privacy', title: 'Datos de prueba y privacidad', summary: 'Copiados de producción, son datos de clientes: sintéticos o anonimizados, con contrato de tratamiento.' },
  ],
  debriefConcepts: ['eval_criteria', 'tco', 'build_vs_buy', 'pilot_success', 'vendor_lockin', 'test_data_privacy'],
  seniorTips: [
    'Criterios: anonimización, plazo de un trimestre, pipeline, coste total, salida y mantenimiento. Nada de demos, descuentos ni modas.',
    'A Olga: piloto con vuestro pipeline y datos anonimizados, y cláusula de salida antes de hablar de fechas.',
    'A Iván: su opción entra con los mismos criterios y una estimación con mantenimiento.',
    'Coste: todas las partidas. Comprar sale lo más barato a tres años y es lo único que llega en un trimestre.',
    'A Carmen: datos sintéticos o anonimizados, contrato de tratamiento y comprobación en el piloto.',
    'Recomendación: comprar, piloto de 4 semanas con criterios, cláusula de salida, firmar solo si el piloto cumple y revisión a los 12 meses.',
  ],
}
