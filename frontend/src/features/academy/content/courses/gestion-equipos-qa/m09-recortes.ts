import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m09Lessons } from './m09-lessons'
import { m09Quiz } from './m09-quiz'
import { m09Scenes } from './m09-scenes'
import { FICHA_QA_MANAGER } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 9 — Recortes (rol: QA Manager).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m09-recortes.md
 *
 * Año 6. El presupuesto de QA baja un 20 % (400 k€). App «Capacidad»: plan
 * con palancas de ahorro, cada una con su riesgo y su impacto en las
 * personas. Luego hay que acordarlo con negocio, presentarlo, comunicarlo al
 * equipo y retener a una persona clave.
 */
export const m09Recortes: Mission = {
  id: 'm09-recortes',
  courseKey: 'gestion-equipos-qa',
  number: 9,
  title: 'Recortes',
  subtitle: 'QA Manager: priorizar por riesgo, plan de capacidad, proteger a las personas clave, acordar el alcance con negocio y comunicar con honestidad.',
  world: kobaltoTeamsWorld({
    laura: 'VP Engineering · tu responsable',
    raul: 'CTO',
    marta: 'Head of Product',
    sergio: 'QA Lead · Pagos · tu equipo',
    hector: 'QA Lead · Tarjetas · tu equipo',
    nerea: 'QA · tu área',
    pablo: 'QA · tu área',
    lucia: 'QA · tu área',
  }),
  playerRole: 'QA Manager · Banca diaria',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · año 6',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'BD',
  appId: 'kobalto-capacity',
  appLabel: 'Capacidad',
  hideBugList: true,
  wikiLabel: 'Wiki · QA de Banca diaria',
  initialMetrics: {},
  lessons: m09Lessons,
  mentor: 'laura',
  quiz: m09Quiz,
  verdicts: {
    good: {
      title: 'Un recorte que no rompe nada',
      body: 'El área ahorra lo pedido sin despidos, lo crítico sigue cubierto, Héctor se queda liderando la automatización y el equipo confía en ti porque se lo contaste de frente.',
    },
    ok: {
      title: 'Números cuadrados, daños colaterales',
      body: 'Llegaste al ahorro, pero algo se rompió por el camino: riesgo, personas o confianza. Mira en el debrief qué.',
    },
    bad: {
      title: 'Recortar sin criterio',
      body: 'Se ahorró donde más dolía y se contó mal. Repite la misión empezando por el plan de capacidad.',
    },
  },

  briefing: {
    title: 'Año 6 · Un 20 % menos',
    paragraphs: [
      'El comité ha cerrado el presupuesto: QA de Banca diaria tiene 400 k€ menos el año que viene.',
      'El rumor ya corre por el equipo, el CTO tiene su propia idea y alguien clave está recibiendo ofertas.',
      'A las 15:00 Laura necesita tu plan para el comité. A las 16:00 se lo cuentas al equipo.',
    ],
    goals: [
      'Lee la ficha del rol de QA Manager.',
      'Responde al rumor sin negar ni adelantar decisiones.',
      'Construye un plan de capacidad que llegue a 400 k€ sin tocar lo crítico ni a las personas clave.',
      'Acuerda con negocio lo que se deja de probar.',
      'Presenta el plan a Laura y comunícalo al equipo.',
      'Retén a la persona clave que tiene otra oferta.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m09Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_MANAGER,
    {
      id: 'cuts_guide',
      title: 'Ajustes de presupuesto: cómo los gestionamos',
      updatedLabel: 'Laura Méndez · VP Engineering',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'capacity_plan' }, { kind: 'flag', key: 'guide.read' }],
      body: `## El plan
- Cada palanca con su ahorro, el riesgo que deja sin cubrir y a quién afecta.
- Lo crítico y las personas clave, lo último.
- Bajas que no se reponen antes que despidos.

## Con negocio
- Lo que se deja de probar lo acepta su dueño, por escrito.

## Con el equipo
- Pronto, completo y sin adornos. Qué cambia, por qué y qué no cambia.
- 1:1 con sus leads esa misma semana.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-CRITICO', title: 'Un fallo en pagos llega a producción: la regresión externalizada no lo cubría', severity: 'critical', explanation: 'Externalizar lo crítico a quien no conoce el dominio ahorra menos de lo que cuesta un fallo.', technique: 'Externalizar solo lo de bajo riesgo.', preventedBy: 'plan.critical' },
    { id: 'C-PERSONAS', title: 'Se pierde a quien sostenía pagos o el rendimiento de las campañas', severity: 'high', explanation: 'Recortar en las personas clave deja sin cubrir lo que más importa.', technique: 'Proteger a las personas clave y ahorrar en otras palancas.', preventedBy: 'plan.keypeople' },
    { id: 'C-FUGA', title: 'Héctor acepta la otra oferta', severity: 'high', explanation: 'En un recorte, las personas clave son las primeras en recibir ofertas.', technique: 'Un reto real y un compromiso que puedas cumplir.', preventedBy: 'retention.ok' },
    { id: 'C-RUMOR', title: 'El rumor corre más rápido que la información', severity: 'medium', explanation: 'Negar o adelantar decisiones alimenta la incertidumbre.', technique: 'Decir lo que se sabe y cuándo se contará el resto.', preventedBy: 'rumor.handled' },
    { id: 'C-ALCANCE', title: 'Falla una app interna y negocio no sabía que ya no se probaba', severity: 'medium', explanation: 'Reducir alcance sin que el dueño del riesgo lo acepte traslada la culpa a QA.', technique: 'Explicar qué se deja de probar y que negocio lo acepte por escrito.', preventedBy: 'scope.agreed' },
    { id: 'C-MORAL', title: 'El equipo se siente engañado y baja la moral', severity: 'medium', explanation: 'Un anuncio vago o maquillado rompe la confianza.', technique: 'Comunicar pronto, completo y sin adornos, con espacio para preguntas.', preventedBy: 'comm.ok' },
  ],

  prevention: {
    title: 'Seis meses después',
    intro: 'Un recorte se mide por lo que sigue funcionando después.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'plan.critical', label: 'Lo crítico, intacto', explanation: 'Pagos y tarjetas siguen en manos de quien conoce el dominio.' },
      { flag: 'plan.keypeople', label: 'Personas clave dentro', explanation: 'Ni los senior de pagos ni rendimiento antes de las campañas.' },
      { flag: 'retention.ok', label: 'Héctor se queda', explanation: 'Lidera la automatización de tarjetas.' },
      { flag: 'rumor.handled', label: 'Rumor gestionado', explanation: 'La verdad y una fecha, sin negar ni adelantar.' },
      { flag: 'scope.agreed', label: 'Alcance aceptado', explanation: 'Negocio firmó lo que se deja de probar.' },
      { flag: 'comm.ok', label: 'Comunicado de frente', explanation: 'Qué cambia, por qué y qué no, con preguntas y 1:1.' },
    ],
  },

  concepts: [
    { id: 'role_qa_manager', title: 'Responsabilidades del QA Manager', summary: 'Capacidad, presupuesto y personas de varios equipos. Escala a su VP los recortes que afectan a la cobertura de riesgo.' },
    { id: 'risk_priority', title: 'Recortar por riesgo', summary: 'Primero duplicidades y lo de bajo riesgo; lo crítico y quien lo sostiene, lo último.' },
    { id: 'capacity_plan', title: 'Plan de capacidad', summary: 'Cada palanca con su ahorro, su riesgo y a quién afecta; con su coste explicado y fecha de revisión.' },
    { id: 'key_people', title: 'Personas clave', summary: 'Quienes sostienen el riesgo crítico o una capacidad única. Retenerlas con retos y compromisos cumplibles.' },
    { id: 'honest_comms', title: 'Comunicar con honestidad', summary: 'Pronto, completo, sin adornos y con espacio para preguntas. Ni negar ni adelantar.' },
    { id: 'scope_acceptance', title: 'Alcance aceptado por negocio', summary: 'Lo que se deja de probar lo acepta su dueño por escrito.' },
  ],
  debriefConcepts: ['risk_priority', 'capacity_plan', 'key_people', 'honest_comms', 'scope_acceptance'],
  seniorTips: [
    'A Sergio: hay un ajuste, aún no hay decisiones y a las 16:00 lo contamos todo.',
    'A Raúl: el back-office sí, pagos no, y por qué.',
    'Plan: no reponer bajas, externalizar el back-office, reducir alcance de bajo riesgo, una sola herramienta y automatizar tarjetas. Nada de pagos, senior, rendimiento ni formación.',
    'A Marta: qué se deja de probar, qué podría fallar y que lo firme.',
    'Al equipo: qué cambia, por qué, qué no cambia (nadie pierde el empleo), preguntas y 1:1.',
    'A Héctor: liderar la automatización y revisar su salario en la próxima ventana, sin prometer dinero.',
  ],
}
