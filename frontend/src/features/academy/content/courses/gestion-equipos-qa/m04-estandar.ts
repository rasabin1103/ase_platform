import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m04Lessons } from './m04-lessons'
import { m04Quiz } from './m04-quiz'
import { m04Scenes } from './m04-scenes'
import { FICHA_QA_ARCHITECT } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 4 — Cinco squads, cinco frameworks (rol: QA Architect).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m04-estandar.md
 *
 * Año 3. Dirección quiere un framework único y obligatorio en un mes. La
 * jugadora no tiene autoridad sobre los squads: app «RFC» con el mapa de
 * squads, la propuesta por secciones, los comentarios y el ADR.
 */
export const m04Estandar: Mission = {
  id: 'm04-estandar',
  courseKey: 'gestion-equipos-qa',
  number: 4,
  title: 'Cinco squads, cinco frameworks',
  subtitle: 'QA Architect: influir sin autoridad, estándar mínimo, RFC y ADR, migración incremental y excepciones gobernadas.',
  world: kobaltoTeamsWorld({
    raul: 'Head of Engineering',
    laura: 'QA Lead · Pagos',
    hector: 'QA · Pagos',
    sergio: 'QA Automation · Pagos',
    diego: 'Tech Lead · Tarjetas',
    nerea: 'QA · Cuentas',
  }),
  playerRole: 'QA Architect · Plataforma',
  dayStart: 9 * 60,
  dayLabel: 'Martes · año 3',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'PLT',
  appId: 'kobalto-rfc',
  appLabel: 'RFC',
  hideBugList: true,
  wikiLabel: 'Wiki · Plataforma',
  initialMetrics: {},
  lessons: m04Lessons,
  mentor: 'laura',
  quiz: m04Quiz,
  verdicts: {
    good: {
      title: 'Un estándar que se usa',
      body: 'Tres squads se apuntan al piloto, Pagos migra lo crítico sin parar sus releases y Raúl ve qué está probado en un trimestre.',
    },
    ok: {
      title: 'Estándar publicado, adopción a medias',
      body: 'El estándar existe, pero no todos los squads lo van a seguir. Mira en el debrief dónde se rompe.',
    },
    bad: {
      title: 'Un estándar de papel',
      body: 'Obligatorio en el documento, ignorado en la práctica. Repite la misión empezando por escuchar a los squads.',
    },
  },

  briefing: {
    title: 'Año 3 · QA Architect de Plataforma',
    paragraphs: [
      'Kobalto tiene ya 16 squads. Te han nombrado QA Architect: tu trabajo son las decisiones técnicas de pruebas comunes a todos.',
      'Cinco squads automatizan con cinco herramientas distintas. Raúl quiere un framework único y obligatorio el mes que viene.',
      'El matiz: los squads no te reportan. Lo que decidas solo funcionará si lo adoptan.',
    ],
    goals: [
      'Lee la ficha del rol de QA Architect.',
      'Reconduce la orden de Raúl hacia su objetivo real, con un enfoque que se pueda adoptar.',
      'Estudia el mapa de squads y escribe un RFC: alcance, cómo se elige la herramienta, migración y excepciones.',
      'Responde a los comentarios de los squads y publica el ADR.',
      'Presenta el estándar en la guild como una decisión compartida.',
      'Da a Raúl fechas realistas.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m04Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_ARCHITECT,
    {
      id: 'rfc_adr',
      title: 'RFC y ADR: cómo decidimos en Plataforma',
      updatedLabel: 'Plataforma',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'rfc_adr' }, { kind: 'flag', key: 'rfc.read' }],
      body: `## RFC (petición de comentarios)
- Una propuesta escrita: problema, opciones, propuesta y qué queda fuera de alcance.
- Se comparte con los afectados antes de decidir. Los comentarios se responden todos.

## ADR (registro de decisión de arquitectura)
- La decisión final: contexto, decisión, consecuencias y excepciones.
- Queda en el repositorio: cualquiera puede ver por qué se decidió.

## Buenas prácticas
- Resolver el problema real con el mínimo necesario.
- Criterios explícitos y un piloto antes de generalizar.
- Migración incremental: no parar la entrega.
- Excepciones visibles y revisadas en grupo, no aprobadas por una persona.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-PAPEL', title: 'A los tres meses, el estándar solo se cumple en el papel', severity: 'high', explanation: 'Sin escuchar a los squads, resolver su contexto y gobernar las excepciones, cada uno vuelve a lo suyo.', technique: 'RFC con los afectados, comentarios respondidos con criterio y piloto.', preventedBy: 'adoption.ok' },
    { id: 'C-PAGOS', title: 'Pagos congela sus 1.200 tests y deja de probar mientras «migra»', severity: 'critical', explanation: 'Una migración inmediata para el squad más grande y con releases semanales le obliga a elegir entre probar y cumplir.', technique: 'Migración incremental con ayuda para lo crítico.', preventedBy: 'pagos.ok' },
    { id: 'C-CUELLO', title: 'Cada excepción espera tu aprobación: te conviertes en el cuello de botella', severity: 'medium', explanation: 'Si todas las excepciones pasan por una persona, el estándar avanza a su ritmo.', technique: 'Excepciones en el ADR, revisadas en la guild.', preventedBy: 'governance.ok' },
    { id: 'C-PROMESA', title: 'Raúl anunció «todo migrado en un mes» y pierdes credibilidad ante el comité', severity: 'medium', explanation: 'Prometer lo que no depende de ti, o sin un plan de migración realista.', technique: 'Fechas realistas centradas en el objetivo de Dirección.', preventedBy: 'expectations.ok' },
    { id: 'C-UI', title: 'Onboarding monta su propio «estándar» para la interfaz web', severity: 'medium', explanation: 'La UI quedó fuera sin decirlo ni abrir otra vía.', technique: 'Dejar explícito qué queda fuera de alcance y cómo se abordará.', preventedBy: 'ui.scoped' },
  ],

  prevention: {
    title: 'Tres meses después',
    intro: 'Un estándar se mide por su adopción, no por el documento.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'adoption.ok', label: 'Adopción real', explanation: 'RFC bien planteado y los tres comentarios incorporados con criterio.' },
      { flag: 'pagos.ok', label: 'Pagos migra sin parar', explanation: 'Informes y pipeline ya; los 1.200 tests al tocarlos; ayuda con los 50 críticos.' },
      { flag: 'governance.ok', label: 'Excepciones gobernadas', explanation: 'ADR y guild mensual, no tu aprobación una a una.' },
      { flag: 'expectations.ok', label: 'Expectativas realistas', explanation: 'Visibilidad en un trimestre, lo crítico en dos y adopción medida cada mes.' },
      { flag: 'ui.scoped', label: 'Alcance explícito', explanation: 'La UI fuera de esta versión, con su propio RFC.' },
    ],
  },

  concepts: [
    { id: 'role_qa_architect', title: 'Responsabilidades del QA Architect', summary: 'Posee los estándares y decisiones técnicas de pruebas comunes. No tiene autoridad sobre los squads ni presupuesto: se mide por la adopción real.' },
    { id: 'influence', title: 'Influir sin autoridad', summary: 'Entender el objetivo de quien pide, escuchar a los afectados, decidir con datos y pilotos, y no prometer lo que no depende de ti.' },
    { id: 'minimum_standard', title: 'Estándar mínimo', summary: 'Resolver el problema real (informes, datos, pipeline) con lo mínimo común y dejar margen al contexto de cada squad.' },
    { id: 'rfc_adr', title: 'RFC y ADR', summary: 'Proponer por escrito a los afectados, responder todos los comentarios y documentar la decisión con su contexto y excepciones.' },
    { id: 'incremental_migration', title: 'Migración incremental', summary: 'Lo nuevo con el estándar, lo existente al tocarlo y fecha solo para lo crítico: sin parar la entrega.' },
    { id: 'governance_guild', title: 'Excepciones gobernadas', summary: 'Excepciones documentadas y revisadas en grupo (la guild), no aprobadas una a una por una persona ni prohibidas.' },
  ],
  debriefConcepts: ['role_qa_architect', 'influence', 'minimum_standard', 'rfc_adr', 'incremental_migration', 'governance_guild'],
  seniorTips: [
    'A Raúl: su objetivo es saber qué está probado. RFC, mínimo común y piloto de seis semanas.',
    'A Héctor: nada sin hablarlo; que Pagos comente el RFC el primero.',
    'RFC: estándar mínimo, criterios y piloto, migración incremental y excepciones en la guild.',
    'Comentarios: Pagos aplica informes y pipeline ya y migra al tocar, con ayuda para los 50 críticos; Notificaciones, excepción si cumple el mínimo; la UI, fuera de alcance con su propio RFC.',
    'En la guild: es una decisión compartida y está en el ADR.',
    'A Raúl: visibilidad en un trimestre, lo crítico en dos y adopción mensual.',
  ],
}
