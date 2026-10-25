import type { Mission } from '../../../engine/types'
import { kobaltoTeamsWorld } from '../../worlds/kobaltoTeams'
import { m02Lessons } from './m02-lessons'
import { m02Quiz } from './m02-quiz'
import { m02Scenes } from './m02-scenes'
import { FICHA_QA_ENGINEER } from './shared'

/**
 * Curso 4: Gestión de equipos QA · Misión 2 — La suite que nadie mira (rol: QA Engineer).
 * Guion legible: docs/academy/gestion-equipos-qa/missions/m02-suite.md
 *
 * Año 2. El pipeline de regresión está en rojo el 40 % de las veces y los
 * devs ya no lo miran. App «Suite»: investigar los ocho tests que causan los
 * rojos y decidir (arreglar, cuarentena, borrar o reportar un bug), y
 * publicar un informe con el squad dueño de cada test.
 */
export const m02Suite: Mission = {
  id: 'm02-suite',
  courseKey: 'gestion-equipos-qa',
  number: 2,
  title: 'La suite que nadie mira',
  subtitle: 'QA Engineer: entender antes de decidir, cuarentena con dueño, pedir tiempo con datos y que cada squad cuide sus tests.',
  world: kobaltoTeamsWorld({ laura: 'QA Lead · tu responsable', marta: 'Product Owner · Pagos', diego: 'Backend developer · Tarjetas', sergio: 'QA Automation · Pagos' }),
  playerRole: 'QA Engineer · squad Tarjetas',
  dayStart: 9 * 60,
  dayLabel: 'Martes · año 2',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'KOB',
  appId: 'kobalto-suite',
  appLabel: 'Suite',
  hideBugList: true,
  wikiLabel: 'Wiki · Squad Tarjetas',
  initialMetrics: {},
  lessons: m02Lessons,
  mentor: 'laura',
  quiz: m02Quiz,
  verdicts: {
    good: {
      title: 'El rojo vuelve a significar algo',
      body: 'El pipeline pasa del 60 % al 95 % en verde, el bug intermitente del límite se arregla antes de producción y cada squad cuida sus tests.',
    },
    ok: {
      title: 'Mejor que ayer',
      body: 'La suite ha mejorado, pero algo de lo que la hacía poco fiable sigue ahí. Mira en el debrief qué.',
    },
    bad: {
      title: 'Verde de mentira',
      body: 'El pipeline puede verse mejor, pero esconde problemas y sigue dependiendo de ti. Repite la misión investigando antes de decidir.',
    },
  },

  briefing: {
    title: 'Año 2 · QA Engineer en Tarjetas',
    paragraphs: [
      'Un año después de tus primeros releases, te has pasado a la automatización: ahora eres QA Engineer del squad Tarjetas.',
      'Tu primer encargo: el pipeline de regresión está en rojo el 40 % de las veces, los devs mergean en rojo sin mirar y alguno ya desactiva tests a escondidas.',
      'Tu rol ya no es solo probar: es que el equipo pueda fiarse de su red de seguridad.',
    ],
    goals: [
      'Lee la ficha del rol de QA Engineer.',
      'Investiga en la app «Suite» por qué falla cada uno de los ocho tests antes de decidir.',
      'Decide con criterio: arreglar, cuarentena con dueño, borrar o reportar un bug.',
      'Pide tiempo a Marta y Raúl con datos y un objetivo medible.',
      'No escondas los problemas: ni «skip» sueltos ni reintentos a ciegas.',
      'Consigue que cada squad sea dueño de sus tests.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m02Scenes,
  endSceneId: 'closing',

  docs: [
    FICHA_QA_ENGINEER,
    {
      id: 'flaky',
      title: 'Tests inestables: causas típicas y qué hacer',
      updatedLabel: 'Comunidad de QA de Kobalto',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'flaky_triage' }, { kind: 'flag', key: 'flaky.read' }],
      body: `## Causas típicas
- **Esperas fijas** (sleep): dependen de lo rápido que vaya el entorno.
- **Datos compartidos** entre tests que se pisan.
- **Dependencias externas** (proveedores, sandboxes) que se caen.
- **Fechas y zonas horarias.**
- **Tests obsoletos** de funcionalidades que ya no existen.
- **Un bug intermitente real** del producto: carreras, concurrencia, cachés. Es el caso que nunca hay que esconder.

## Qué hacer
- **Arreglar** si el test aporta y la causa es del test.
- **Cuarentena** si aporta pero arreglarlo cuesta: fuera del pipeline que bloquea, pero ejecutándose, con ticket, dueño y fecha.
- **Borrar** si prueba algo que ya no existe o duplica a otros sin aportar.
- **Reportar un bug** si lo que falla es el producto.

## Qué no hacer
- Desactivar en silencio («skip» sin ticket).
- Reintentos automáticos generales: el verde deja de significar nada.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'C-CARRERA', title: 'La carrera en el límite de las tarjetas llega a producción: el test que la detectaba se silenció', severity: 'critical', explanation: 'El test «inestable» del límite concurrente estaba cazando un bug real intermitente. Con cuarentena, borrado, reintentos o «arreglando el test», se escondió.', technique: 'Investigar la causa antes de decidir; un fallo intermitente puede ser del producto.', preventedBy: 'race.caught' },
    { id: 'C-ROJO', title: 'El pipeline sigue sin ser fiable y los devs siguen mergeando sin mirarlo', severity: 'high', explanation: 'Decisiones que no atacan la causa de cada test, o reintentos que lo tapan todo.', technique: 'Arreglar, poner en cuarentena, borrar o reportar según la causa de cada test.', preventedBy: 'pipeline.trusted' },
    { id: 'C-SKIP', title: 'Los «skip» de Diego se olvidan: tres tests muertos durante meses', severity: 'high', explanation: 'Un test desactivado sin ticket ni dueño no vuelve nunca.', technique: 'Cuarentena con ticket, dueño y fecha.', preventedBy: 'skip.handled' },
    { id: 'C-INVISIBLE', title: 'Te pasas el sprint arreglando tests sin que nadie lo planifique ni lo vea', severity: 'medium', explanation: 'Sin tiempo acordado y un objetivo, el trabajo de calidad se hace a escondidas o no se hace.', technique: 'Pedir tiempo con datos y un objetivo medible.', preventedBy: 'capacity.agreed' },
    { id: 'C-DUENOS', title: 'Cada test que se rompe vuelve a caer en ti', severity: 'medium', explanation: 'Si QA es el dueño de todos los tests, los squads dejan de cuidarlos.', technique: 'Cada squad es dueño de sus tests; el QA Engineer pone reglas y ayuda.', preventedBy: 'owners.ok' },
  ],

  prevention: {
    title: 'Dos sprints después',
    intro: 'Lo que decidiste hoy sobre la suite decide si el equipo vuelve a fiarse del pipeline.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'race.caught', label: 'Bug intermitente cazado', explanation: 'El test del límite concurrente no era inestable: el producto fallaba. Se reportó y no se taparon los fallos con reintentos.' },
      { flag: 'pipeline.trusted', label: 'Pipeline fiable', explanation: 'Cada test con la decisión adecuada a su causa y sin reintentos generales.' },
      { flag: 'skip.handled', label: 'Nada desactivado en silencio', explanation: 'Los «skip» pasaron a cuarentena con ticket, dueño y fecha.' },
      { flag: 'capacity.agreed', label: 'Tiempo acordado con datos', explanation: '20 % durante dos sprints y un objetivo: más del 95 % en verde.' },
      { flag: 'owners.ok', label: 'Cada squad cuida sus tests', explanation: 'Quien rompe un test lo arregla; tú pones las reglas y ayudas.' },
    ],
  },

  concepts: [
    { id: 'role_qa_engineer', title: 'Responsabilidades del QA Engineer', summary: 'Posee la automatización del squad, sus herramientas, datos y entornos. Decide qué automatizar y qué hacer con un test. No decide el tiempo del sprint (lo negocia) ni arregla él solo los tests de todos.' },
    { id: 'flaky_triage', title: 'Triaje de tests inestables', summary: 'Primero la causa, luego la decisión: arreglar (si aporta y falla el test), cuarentena (si aporta y es caro), borrar (si no aporta) o reportar un bug (si falla el producto).' },
    { id: 'quarantine', title: 'Cuarentena, no «skip»', summary: 'Un test que sale del pipeline que bloquea sigue ejecutándose, con ticket, dueño y fecha. Desactivarlo en silencio es enterrarlo.' },
    { id: 'retries_hide', title: 'Los reintentos esconden problemas', summary: 'Reintentar todos los tests da un verde que ya no distingue un test inestable de un bug intermitente real.' },
    { id: 'negotiate_capacity', title: 'Pedir tiempo con datos', summary: 'Qué causa el problema, cuánto tiempo, para qué y con qué objetivo medible. Ni «reescribirlo todo» ni «en mis ratos libres».' },
    { id: 'test_ownership', title: 'Cada squad es dueño de sus tests', summary: 'Quien rompe un test lo arregla antes de mergear. El QA Engineer pone las reglas, enseña patrones y ayuda, pero no es el dueño de todo.' },
  ],
  debriefConcepts: ['role_qa_engineer', 'flaky_triage', 'quarantine', 'retries_hide', 'negotiate_capacity', 'test_ownership'],
  seniorTips: [
    'A Diego: gracias por contarlo; sus «skip» pasan a cuarentena con ticket, dueño y fecha.',
    'Investiga los ocho tests antes de decidir nada.',
    'T1, T3, T4 y T6: arreglar (esperas, simular el proveedor, datos propios, zona horaria). T2: reportar un bug (¡falla el producto!). T5 y T8: borrar. T7: cuarentena.',
    'A Sergio: nada de reintentos generales.',
    'A Marta y Raúl: 8 tests, el 90 % de los rojos, 20 % durante dos sprints y objetivo de más del 95 % en verde.',
    'Publica el informe con el squad dueño de cada test y propón «quien lo rompe, lo arregla».',
  ],
}
