import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m10Lessons } from './m10-lessons'
import { m10Quiz } from './m10-quiz'
import { m10Scenes } from './m10-scenes'
import { FICHA_HEAD_OF_QA } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 10 — El gran incidente (rol: Head of QA).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m10-incidente.md
 *
 * Año 7. 3.200 transferencias duplicadas llegan a prensa y al regulador. En
 * el comité de crisis preguntan «¿dónde estaba QA?». App «Postmortem»:
 * cronología, causas y acciones. Eco de las misiones 0 y 6: la cultura de
 * «QA es la puerta» es la causa de fondo.
 */
export const m10Incidente: Mission = {
  id: 'm10-incidente',
  courseKey: 'gestion-equipos-qa',
  number: 10,
  title: 'El gran incidente',
  subtitle: 'Head of QA: crisis con Compliance, postmortem sin culpables, proteger a las personas sin esconder los fallos y convertirlo en cambios de organización.',
  world: kobaltoTeamsWorld({
    irene: 'CEO',
    carmen: 'Directora de Riesgos y Compliance',
    raul: 'CTO',
    marta: 'Head of Product',
    laura: 'VP Engineering · tu mentora',
    pablo: 'QA · Pagos',
    ivan: 'Head of Platform',
  }),
  playerRole: 'Head of QA',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · año 7',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'INC',
  appId: 'kobalto-postmortem',
  appLabel: 'Postmortem',
  hideBugList: true,
  wikiLabel: 'Wiki · Calidad',
  initialMetrics: {},
  lessons: m10Lessons,
  mentor: 'laura',
  quiz: m10Quiz,
  verdicts: {
    good: {
      title: 'Una crisis que cambia la empresa',
      body: 'El regulador cierra el expediente con las acciones en marcha, Pablo sigue avisando de los riesgos y, tres meses después, los riesgos conocidos los decide su dueño. QA ha dejado de ser la única puerta.',
    },
    ok: {
      title: 'Crisis contenida, lección a medias',
      body: 'Se apagó el fuego, pero algo de lo que lo causó sigue ahí. Mira en el debrief qué.',
    },
    bad: {
      title: 'Buscar culpables',
      body: 'Hubo un culpable y nada cambió: el próximo riesgo conocido saldrá igual, y nadie avisará. Repite la misión empezando por el comité de crisis.',
    },
  },

  briefing: {
    title: 'Año 7 · Head of QA',
    paragraphs: [
      'Eres Head of QA de un banco digital con 40 squads y 70 QA.',
      'El fin de semana se duplicaron 3.200 transferencias instantáneas. Hoy sale en prensa y el regulador pide un informe en 72 horas.',
      'A las 10:00, comité de crisis. Alguien va a preguntar dónde estaba QA.',
    ],
    goals: [
      'Lee la ficha del rol de Head of QA.',
      'Da a Compliance los hechos, pronto y sin adornos.',
      'En el comité de crisis, asume la parte de QA sin buscar culpables.',
      'Prepara el postmortem en la app «Postmortem»: causas de sistema y acciones.',
      'Protege a quien avisó del riesgo.',
      'Convierte el incidente en cambios de organización y corrige el informe al regulador.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m10Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_HEAD_OF_QA,
    {
      id: 'pm_guide',
      title: 'Postmortems sin culpables',
      updatedLabel: 'Calidad',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'blameless_culture' }, { kind: 'flag', key: 'guide.read' }],
      body: `## Principio
- Las personas hicieron lo razonable con lo que sabían y el sistema que tenían.

## Cómo
- Cronología con hechos.
- Por cada «alguien hizo X»: ¿por qué el sistema lo permitió o no lo detectó?
- Cada causa, una acción con dueño y fecha.

## Lo que no hacemos
- Buscar culpables ni sanciones.
- Acciones que solo añaden control (más firmas) sin cambiar el sistema.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-REGULADOR', title: 'El regulador abre expediente por falta de transparencia', severity: 'critical', explanation: 'Minimizar o retrasar los hechos ante Compliance y el regulador empeora la sanción.', technique: 'Hechos pronto, con lo que se sabe y lo que no.', preventedBy: 'compliance.ok' },
    { id: 'C-REPITE', title: 'Tres meses después, otro riesgo conocido llega a producción', severity: 'critical', explanation: 'Sin cambios de organización, QA sigue siendo la única puerta y el siguiente aviso tampoco lo decide nadie.', technique: 'Riesgos aceptados por su dueño y calidad dentro del sistema.', preventedBy: 'org.change' },
    { id: 'C-CHIVO', title: 'Pablo se va y el equipo aprende a no avisar', severity: 'high', explanation: 'Señalar a quien avisó, o dejarle solo, enseña a todos a callar.', technique: 'Proteger a las personas sin esconder el fallo.', preventedBy: 'pablo.supported' },
    { id: 'C-CULPA', title: 'El postmortem acaba en culpables y nadie cuenta lo que sabe', severity: 'high', explanation: 'Sin un análisis sin culpables, las causas de sistema no salen.', technique: 'Postmortem sin culpables, con causas de sistema y acciones con dueño.', preventedBy: 'pm.shared' },
    { id: 'C-INFORME', title: 'El informe culpa a un QA y el regulador pide medidas que no atacan la causa', severity: 'high', explanation: 'Un informe con «error humano» desvía las medidas hacia una persona.', technique: 'Causas de sistema con sus acciones en el informe.', preventedBy: 'report.accurate' },
    { id: 'C-GUERRA', title: 'QA y Producto se pasan meses culpándose', severity: 'medium', explanation: 'Si el comité de crisis se convierte en buscar culpables entre áreas, la colaboración se rompe.', technique: 'Asumir la parte propia y llevar la conversación al sistema.', preventedBy: 'crisis.ok' },
  ],

  prevention: {
    title: 'Tres meses después',
    intro: 'Un gran incidente se mide por lo que la empresa aprende de él.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'compliance.ok', label: 'Transparencia', explanation: 'Hechos a Compliance el primer día.' },
      { flag: 'crisis.ok', label: 'Comité sin culpables', explanation: 'Parte propia asumida y foco en clientes y sistema.' },
      { flag: 'pablo.supported', label: 'Quien avisó, protegido', explanation: 'Pablo sigue y sigue avisando.' },
      { flag: 'pm.shared', label: 'Postmortem sin culpables', explanation: 'Cinco causas de sistema, cinco acciones con dueño.' },
      { flag: 'org.change', label: 'Cambio de organización', explanation: 'Los riesgos los decide su dueño; la calidad, dentro del sistema.' },
      { flag: 'report.accurate', label: 'Informe veraz', explanation: 'Causas y acciones, no «error humano».' },
    ],
  },

  concepts: [
    { id: 'role_head_of_qa', title: 'Responsabilidades del Head of QA', summary: 'Estrategia, modelo y cultura de calidad. Escala al comité los riesgos de negocio y regulatorios; se le mide por el coste de la no calidad y la confianza de dirección.' },
    { id: 'crisis_transparency', title: 'Transparencia en una crisis', summary: 'Clientes primero; hechos pronto a Compliance y al regulador, con lo que se sabe y lo que no; nada de minimizar.' },
    { id: 'blameless_culture', title: 'Cultura sin culpables', summary: 'La pregunta es por qué el sistema lo permitió, no quién. Si se busca culpable, el próximo aviso no llega.' },
    { id: 'system_causes', title: 'Causas de sistema', summary: 'Entornos, gobierno del riesgo, monitorización, despliegue y diseño; cada causa con una acción con dueño y fecha.' },
    { id: 'protect_people', title: 'Proteger a las personas', summary: 'Asumir la parte propia, no señalar a nadie, hablar pronto con los afectados y corregir los informes que culpan a una persona.' },
    { id: 'org_change', title: 'Del incidente al cambio de organización', summary: 'QA deja de ser la única puerta: los riesgos los acepta su dueño y la calidad se mete en el sistema.' },
  ],
  debriefConcepts: ['crisis_transparency', 'blameless_culture', 'system_causes', 'protect_people', 'org_change'],
  seniorTips: [
    'A Carmen: la cronología hoy, con lo que sabemos y lo que no, incluido PAG-412.',
    'En el comité: asumo la parte de QA; la pregunta útil es por qué el sistema lo permitió. Clientes hoy, postmortem esta tarde.',
    'A Pablo: nadie te va a señalar; lo que cambia es el sistema.',
    'Postmortem: las cinco causas de sistema, ninguna persona, y las cinco acciones (riesgos aceptados por su dueño, simulador de reintentos, alerta, despliegue gradual e idempotencia).',
    'A Irene: más firmas no lo habrían evitado; QA deja de ser la única puerta.',
    'A Carmen: fuera «error humano»; causas y acciones con dueño y fecha.',
  ],
}
