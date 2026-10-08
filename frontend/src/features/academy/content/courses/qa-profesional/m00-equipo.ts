import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m00Lessons } from './m00-lessons'
import { m00Quiz } from './m00-quiz'
import { m00Scenes } from './m00-scenes'

/**
 * Curso 2: QA Profesional · Misión 0 — Equipo nuevo (CTFL 1.4, 1.5 y 2.1).
 * Guion legible: docs/academy/qa-profesional/missions/m00-equipo.md
 *
 * Primer día como responsable de calidad del squad Empresas. El jugador
 * propone el proceso de pruebas (actividades, testware y roles), completa la
 * matriz de trazabilidad para Carmen y defiende el enfoque de equipo completo
 * con independencia. Lo que falte en el proceso se paga en los sprints.
 */
export const m00Equipo: Mission = {
  id: 'm00-equipo',
  courseKey: 'qa-profesional',
  number: 0,
  title: 'Equipo nuevo',
  subtitle: 'Proceso de pruebas: actividades, testware, roles, trazabilidad y equipo completo.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Lunes',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-process',
  appLabel: 'Proceso',
  hideBugList: true,
  initialMetrics: {},
  lessons: m00Lessons,
  mentor: 'laura',
  quiz: m00Quiz,
  verdicts: {
    good: {
      title: 'Un proceso con sentido',
      body: 'Raúl aprueba tu propuesta como proceso del squad, Carmen tiene su trazabilidad y Tomás y Sofía ya hablan de «nuestras» pruebas.',
    },
    ok: {
      title: 'Buen comienzo, con huecos',
      body: 'El squad ya tiene un proceso, pero alguna pieza falla. Mira en el debrief qué consecuencias tiene cada hueco.',
    },
    bad: {
      title: 'Cada uno a su manera',
      body: 'Sin un proceso claro, trazabilidad ni equipo, todo sigue como estaba. Repite la misión empezando por la guía de la wiki.',
    },
  },

  briefing: {
    title: 'Lunes: equipo nuevo',
    paragraphs: [
      'Seis meses después de tu primer día en Kobalto, ya no eres junior. Te acaban de asignar el nuevo squad de Kobalto Empresas, que hace cuentas, tarjetas y facturas para autónomos y pymes.',
      'Aquí cada uno prueba a su manera y nadie sabe qué está probado. Raúl quiere una propuesta de proceso para el comité de las 15:00 y Carmen necesita la trazabilidad de «Tarjetas de equipo» para auditoría a las 14:00.',
      'Hoy no se trata de encontrar bugs, sino de montar el sistema que hará que se encuentren.',
    ],
    goals: [
      'En la daily, defiende el papel de todo el equipo en la calidad sin renunciar a la independencia.',
      'Propón el proceso: actividades en orden, el testware de cada una y quién la lleva.',
      'Completa la matriz de trazabilidad y envíasela a Carmen antes de las 14:00.',
      'No dejes que el cierre de pruebas desaparezca del proceso.',
      'En el comité, explica en qué momento entra QA en cada historia.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m00Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_proceso',
      title: 'Guía del proceso de pruebas',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_activities' },
        { kind: 'unlock', conceptId: 'testware' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Actividades (CTFL 1.4.1)
- **Planificación**: objetivos y enfoque. Produce el **plan de pruebas**.
- **Seguimiento y control**: comparar el avance con el plan y corregir. Produce **informes de avance**. Es continuo durante todo el proceso.
- **Análisis**: estudiar la base de prueba y decidir **qué** probar. Produce **condiciones de prueba** priorizadas.
- **Diseño**: decidir **cómo** probarlo. Produce **casos de prueba**.
- **Implementación**: preparar lo necesario para ejecutar. Produce **procedimientos, datos y scripts**.
- **Ejecución**: ejecutar y comparar resultados. Produce **registros** e **informes de defectos**.
- **Cierre**: al terminar un hito, archivar, evaluar y aprender. Produce el **informe de cierre** con lecciones aprendidas.

## Roles (CTFL 1.4.5)
- **Gestión de pruebas**: planificación, seguimiento y control, y cierre.
- **Tester**: análisis, diseño, implementación y ejecución.

El proceso se adapta al contexto (riesgos, plazos, equipo), pero las actividades existen siempre, aunque a veces se solapen o sean informales.`,
    },
    {
      id: 'guia_traza',
      title: 'Trazabilidad: por qué y cómo',
      updatedLabel: 'Riesgos y Compliance',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'traceability' }],
      body: `## Para qué sirve
- Saber qué requisitos están probados (cobertura) y cuáles tienen defectos abiertos.
- Analizar el impacto de un cambio: qué pruebas hay que repetir.
- Dar evidencia en auditorías.

## Cadena
Historia → condición de prueba → caso de prueba → resultado o defecto. Cada eslabón se enlaza con el anterior.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-07',
      title: 'Tarjetas de equipo (épica)',
      status: 'En curso',
      type: 'story',
      description: 'Tarjetas para los empleados de una pyme: H1 límite de gasto por empleado, H2 bloqueo de tarjeta, H3 informe mensual de gastos. Los casos y defectos están en la herramienta de pruebas, pero sin enlazar.',
      acceptanceCriteria: ['Cada historia tiene condiciones y casos de prueba enlazados.', 'Los defectos abiertos se pueden asociar a la historia que afectan.'],
      comments: [{ author: 'carmen', body: 'Para auditoría necesito la cadena completa, no una lista suelta de casos.' }],
      actions: [],
    },
  ],

  bugs: [
    { id: 'P-ORDEN', title: 'Se diseñan casos antes de decidir qué probar: casos que no cubren ninguna condición', severity: 'medium', explanation: 'Sin el orden análisis → diseño → implementación → ejecución, el equipo escribe casos sin saber qué condiciones cubren.', technique: 'Actividades del proceso en orden lógico (CTFL 1.4.1).', preventedBy: 'proc.order' },
    { id: 'P-TESTWARE', title: 'Los datos y scripts de prueba se pierden entre sprints', severity: 'medium', explanation: 'Nadie sabía qué producto de trabajo sale de cada actividad, así que nadie lo guardaba.', technique: 'Testware de cada actividad (CTFL 1.4.3).', preventedBy: 'proc.testware' },
    { id: 'P-ROLES', title: 'Nadie decide cuándo parar de probar ni informa del avance', severity: 'high', explanation: 'Con los roles cambiados, el seguimiento y control no tenía responsable.', technique: 'Gestión de pruebas frente a tester (CTFL 1.4.5).', preventedBy: 'proc.roles' },
    { id: 'P-CIERRE', title: 'El sprint siguiente repite los mismos errores', severity: 'medium', explanation: 'Sin cierre de pruebas no hay lecciones aprendidas ni testware archivado.', technique: 'Cierre de pruebas como actividad del proceso.', preventedBy: 'proc.closure' },
    { id: 'P-TRAZA', title: 'Auditoría no puede verificar qué requisitos están probados', severity: 'high', explanation: 'Sin la cadena historia → condición → caso → defecto no hay cobertura demostrable.', technique: 'Trazabilidad (CTFL 1.4.4).', preventedBy: 'trace.ok' },
    { id: 'P-INDEP', title: 'Los defectos de integración llegan a producción', severity: 'critical', explanation: 'Cada dev probaba solo su código: nadie miraba el sistema con independencia.', technique: 'Equipo completo con independencia de las pruebas (CTFL 1.5.2 y 1.5.3).', preventedBy: 'team.indep' },
  ],

  prevention: {
    title: 'Tu proceso de pruebas',
    intro: 'Cada pieza del proceso evita un problema concreto en los próximos sprints.',
    preventedLabel: 'Problemas que el squad no tendrá',
    appearedLabel: 'Problemas que llegarán en los próximos sprints',
    rules: [
      { flag: 'team.indep', label: 'Equipo completo con independencia', explanation: 'Los devs prueban su código y QA aporta una mirada independiente a nivel de sistema.' },
      { flag: 'proc.order', label: 'Actividades en orden', explanation: 'Planificación primero, cierre al final, y análisis → diseño → implementación → ejecución. Seguimiento y control es continuo.' },
      { flag: 'proc.testware', label: 'Testware de cada actividad', explanation: 'Plan, informes de avance, condiciones, casos, procedimientos y datos, registros y defectos, e informe de cierre.' },
      { flag: 'proc.roles', label: 'Roles bien asignados', explanation: 'Gestión de pruebas: planificación, seguimiento y control, y cierre. Tester: el resto.' },
      { flag: 'proc.closure', label: 'Cierre de pruebas en el proceso', explanation: 'Treinta minutos al final del hito para archivar y aprender.' },
      { flag: 'trace.ok', label: 'Trazabilidad completa', explanation: 'Historia → condición → caso → defecto, sin huecos.' },
      { flag: 'sdlc.early', label: 'QA desde el principio del ciclo de vida', explanation: 'Cada actividad de desarrollo con su actividad de pruebas; análisis y diseño en cuanto hay historia.' },
    ],
  },

  concepts: [
    { id: 'test_activities', title: 'Actividades del proceso de pruebas', summary: 'Planificación, seguimiento y control, análisis, diseño, implementación, ejecución y cierre. Se adaptan al contexto. (CTFL 1.4.1–1.4.2)' },
    { id: 'testware', title: 'Testware', summary: 'Productos de trabajo de cada actividad: plan, informes de avance, condiciones, casos, procedimientos y datos, registros, informes de defectos e informe de cierre. (CTFL 1.4.3)' },
    { id: 'traceability', title: 'Trazabilidad', summary: 'Enlaces entre base de prueba, testware y resultados: permite medir la cobertura, analizar el impacto de cambios y dar evidencia. (CTFL 1.4.4)' },
    { id: 'test_roles', title: 'Roles en las pruebas', summary: 'Gestión de pruebas (planificación, seguimiento y control, cierre) y tester (análisis, diseño, implementación, ejecución). (CTFL 1.4.5)' },
    { id: 'whole_team', title: 'Enfoque de equipo completo', summary: 'Cualquier persona del equipo con las habilidades necesarias puede hacer cualquier tarea; la calidad es responsabilidad de todos. (CTFL 1.5.2)' },
    { id: 'independence', title: 'Independencia de las pruebas', summary: 'Un probador independiente detecta defectos distintos de los del autor, por sus sesgos diferentes. Lo mejor suele ser combinar varios niveles de independencia. (CTFL 1.5.3)' },
    { id: 'sdlc_testing', title: 'Pruebas en el ciclo de vida', summary: 'Cada actividad de desarrollo tiene su actividad de pruebas; el análisis y el diseño empiezan en cuanto hay base de prueba; los testers revisan borradores. Testing temprano. (CTFL 2.1.2 y 2.1.5)' },
  ],
  debriefConcepts: ['test_activities', 'testware', 'traceability', 'test_roles', 'whole_team', 'independence', 'sdlc_testing'],
  seniorTips: [
    'En la daily: devs con sus pruebas unitarias y QA con una mirada independiente; no es «o uno o el otro».',
    'Orden: 1 planificación · 2 seguimiento y control (es continuo) · 3 análisis · 4 diseño · 5 implementación · 6 ejecución · 7 cierre.',
    'La gestión de pruebas lleva la planificación, el seguimiento y control y el cierre; el tester, el resto.',
    'Matriz: D1 viene de T5 (borde de 500 €) → C1 → H1; D2 viene de T3 → C3 → H2.',
    'Envía la matriz antes de las 14:00 y no quites el cierre aunque Tomás lo llame papeleo.',
    'En el comité: QA entra desde el refinamiento.',
  ],
}
