import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m06Lessons } from './m06-lessons'
import { m06Quiz } from './m06-quiz'
import { m06Scenes } from './m06-scenes'

/**
 * Curso 2: QA Profesional · Misión 6 — Números que cuentan (CTFL 5.3 y 1.4).
 * Guion legible: docs/academy/qa-profesional/missions/m06-metricas.md
 *
 * Mitad del sprint: Raúl necesita un informe de progreso para dirección a
 * las 12:00 y, al final del día, el informe de cierre de las pruebas.
 */
export const m06Metricas: Mission = {
  id: 'm06-metricas',
  courseKey: 'qa-profesional',
  number: 6,
  title: 'Números que cuentan',
  subtitle: 'Métricas, informes de progreso y de cierre, comunicación del estado, control y cierre de las pruebas.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-metrics',
  appLabel: 'Métricas',
  hideBugList: true,
  initialMetrics: {},
  lessons: m06Lessons,
  mentor: 'laura',
  quiz: m06Quiz,
  verdicts: {
    good: {
      title: 'Números que cuentan',
      body: 'Dirección sabe exactamente dónde está la release, el equipo sabe qué hacer mañana y el sprint se cierra contando también lo que no salió.',
    },
    ok: {
      title: 'Bien medido, a medias contado',
      body: 'Los números estaban, pero alguna pieza del seguimiento o del cierre se va a notar. Mira el debrief.',
    },
    bad: {
      title: 'Verde de mentira',
      body: 'Con métricas de volumen y un estado maquillado, dirección decidió a ciegas. Repite la misión empezando por las lecturas del panel.',
    },
  },

  briefing: {
    title: 'Miércoles: números que cuentan',
    paragraphs: [
      'Mitad del sprint 3 de Kobalto Empresas. El comité aprobó el plan de la release y ahora toca demostrar si se cumple.',
      'Raúl necesita a las 12:00 un informe de progreso para dirección y, al final del día, el informe de cierre de las pruebas del sprint. En la app «Métricas» tienes el panel con los datos reales.',
      'Cuidado: algunos números del panel quedan muy bien… y no cuentan toda la verdad.',
    ],
    goals: [
      'Elige las métricas que ayudan a decidir: avance frente al plan, cobertura, defectos y riesgo residual.',
      'Detecta las lecturas engañosas del panel.',
      'Redacta el informe de progreso para dirección y para el equipo.',
      'Decide acciones de control: repriorizar, reabrir, añadir recursos o renegociar.',
      'Cierra las pruebas del sprint: criterios de salida, pendientes, testware y lecciones aprendidas.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: m06Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_metricas',
      title: 'Guía de métricas de pruebas',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_metrics' },
        { kind: 'unlock', conceptId: 'test_control' },
      ],
      body: `## Métricas habituales (CTFL 5.3.1)
- **Progreso del proyecto**: tareas completadas, esfuerzo y coste frente a lo planificado.
- **Progreso de las pruebas**: casos preparados y ejecutados frente al plan, pasados y fallados.
- **Calidad del producto**: disponibilidad, tiempo de respuesta, fallos en producción.
- **Defectos**: abiertos y cerrados por severidad y prioridad, densidad, porcentaje detectado.
- **Riesgo**: riesgo residual, es decir, lo que queda sin mitigar.
- **Cobertura**: de requisitos, de historias, de código.
- **Coste**: coste de las pruebas, coste de la calidad.

## Lecturas peligrosas
- Un **% de pasados** sin cobertura detrás: 100 % sobre la mitad de los requisitos.
- **Defectos cerrados** que en realidad se cerraron sin verificar («no reproducible»).
- **Cero defectos** en un módulo que nadie ha probado.
- **Volumen** (casos, horas, bugs por persona) en lugar de avance y riesgo.

## Control (CTFL 5.3)
Medir sirve para corregir: repriorizar por riesgo, reevaluar criterios de entrada y salida, ajustar el calendario, añadir recursos o renegociar el alcance.`,
    },
    {
      id: 'plantilla_informes',
      title: 'Plantillas de informes de pruebas',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'progress_report' },
        { kind: 'unlock', conceptId: 'completion_report' },
        { kind: 'unlock', conceptId: 'test_closure' },
      ],
      body: `## Informe de progreso (CTFL 5.3.2)
Se hace periódicamente (diario, semanal) durante las pruebas:
- periodo y estado general;
- avance frente al plan y desviaciones;
- impedimentos y cómo se resuelven;
- métricas relevantes;
- riesgos nuevos o que cambian;
- qué se va a probar en el siguiente periodo.

## Informe de cierre (CTFL 5.3.2)
Al terminar un hito, sprint o proyecto:
- resumen y evaluación de la calidad del producto;
- desviaciones respecto al plan y criterios de salida;
- impedimentos y defectos sin resolver;
- métricas finales y riesgo residual;
- testware archivado y lecciones aprendidas.

## Audiencias (CTFL 5.3.3)
Dirección necesita estado, riesgo y decisiones; el equipo, el detalle para trabajar. La forma (conversación, panel, correo, documento) depende de la audiencia y de si el equipo está distribuido.

## Cierre de pruebas (CTFL 1.4.1)
Comprobar criterios de salida, registrar lo pendiente, archivar el testware, entregarlo a quien corresponda y recoger lecciones aprendidas.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'P-VOLUMEN', title: 'Dirección recibe «48 casos y 26 defectos» y no sabe si salir', severity: 'medium', explanation: 'Métricas de volumen: no dicen si se llega ni qué riesgo queda.', technique: 'Avance frente al plan, cobertura, defectos por severidad y riesgo residual.', preventedBy: 'metrics.ok' },
    { id: 'P-VERDE', title: 'El 100 % de casos pasados ocultó 12 requisitos sin pruebas', severity: 'high', explanation: 'Una métrica correcta pero incompleta se leyó como «todo bien».', technique: 'Cruzar el % de pasados con la cobertura de requisitos.', preventedBy: 'misleading.ok' },
    { id: 'P-NOREPRO', title: 'Los 5 «no reproducible» vuelven a aparecer en producción', severity: 'high', explanation: 'Se cerraron sin verificar para que el gráfico quedara bien.', technique: 'Reabrir y reproducir en el entorno adecuado antes de cerrar.', preventedBy: 'control.ok' },
    { id: 'P-AUDIENCIA', title: 'Dirección recibe 30 páginas de logs y el equipo solo un semáforo', severity: 'medium', explanation: 'El mismo informe no sirve a todas las audiencias.', technique: 'Informe ejecutivo para dirección y detalle accionable para el equipo.', preventedBy: 'report.audience' },
    { id: 'P-ESTADO', title: 'Dirección decide sin un estado fiable y deja de confiar en QA', severity: 'critical', explanation: 'Un estado en verde que no era verdad se cayó en la demo.', technique: 'Comunicar el estado real con avance, cobertura, defectos y riesgo residual.', preventedBy: 'status.honest' },
    { id: 'P-TARJETAS', title: 'Las tarjetas, de riesgo alto, quedan sin probar al cerrar el sprint', severity: 'critical', explanation: 'El retraso se detectó, pero nadie corrigió el rumbo.', technique: 'Control: repriorizar por riesgo y renegociar alcance.', preventedBy: 'control.defended' },
    { id: 'P-CIERRE', title: 'Los defectos pendientes se pierden y el testware no se puede reutilizar', severity: 'medium', explanation: 'Sin actividades de cierre, el siguiente sprint empieza a ciegas.', technique: 'Cierre: criterios de salida, pendientes registrados, testware archivado y lecciones aprendidas.', preventedBy: 'closure.ok' },
  ],

  prevention: {
    title: 'Tu seguimiento',
    intro: 'Cada decisión de seguimiento, control y cierre evita un problema concreto en la release.',
    preventedLabel: 'Problemas que evitas',
    appearedLabel: 'Problemas que llegarán',
    rules: [
      { flag: 'metrics.ok', label: 'Métricas que ayudan a decidir', explanation: 'Avance frente al plan, cobertura de requisitos, defectos por severidad y riesgo residual.' },
      { flag: 'misleading.ok', label: 'Lecturas engañosas detectadas', explanation: '100 % sobre 8 de 20 requisitos, 5 cerrados sin verificar y 0 defectos en un módulo sin probar.' },
      { flag: 'report.audience', label: 'Un informe para cada audiencia', explanation: 'Estado, riesgo y decisión para dirección; detalle accionable para el equipo.' },
      { flag: 'control.ok', label: 'Acciones de control coherentes', explanation: 'Repriorizar, reabrir, añadir recursos y renegociar, sin esconder datos.' },
      { flag: 'status.honest', label: 'Estado real comunicado', explanation: 'Ámbar con plan, no verde de mentira.' },
      { flag: 'control.defended', label: 'Rumbo corregido en el seguimiento', explanation: 'Tarjetas primero y riesgo residual aceptado por escrito o alcance movido.' },
      { flag: 'closure.ok', label: 'Cierre completo', explanation: 'Criterios de salida, pendientes registrados, testware archivado y lecciones aprendidas.' },
    ],
  },

  concepts: [
    { id: 'test_metrics', title: 'Métricas de pruebas', summary: 'Progreso del proyecto y de las pruebas, calidad del producto, defectos, riesgo, cobertura y coste. Sirven si ayudan a decidir. (CTFL 5.3.1)' },
    { id: 'progress_report', title: 'Informe de progreso', summary: 'Periódico: estado, avance frente al plan, impedimentos, métricas, riesgos y siguiente periodo. (CTFL 5.3.2)' },
    { id: 'completion_report', title: 'Informe de cierre', summary: 'Al terminar: evaluación de la calidad, desviaciones, defectos sin resolver, riesgo residual y lecciones aprendidas. (CTFL 5.3.2)' },
    { id: 'status_comm', title: 'Comunicación del estado', summary: 'La forma y el detalle dependen de la audiencia: dirección decide, el equipo ejecuta. (CTFL 5.3.3)' },
    { id: 'test_control', title: 'Seguimiento y control', summary: 'Seguimiento: comparar lo real con lo planificado. Control: acciones correctoras como repriorizar, ajustar recursos o renegociar criterios. (CTFL 5.3)' },
    { id: 'test_closure', title: 'Cierre de pruebas', summary: 'Comprobar criterios de salida, registrar pendientes, archivar y entregar el testware y recoger lecciones aprendidas. (CTFL 1.4.1)' },
  ],
  debriefConcepts: ['test_metrics', 'progress_report', 'completion_report', 'status_comm', 'test_control', 'test_closure'],
  seniorTips: [
    'Métricas para el informe: avance frente al plan, cobertura de requisitos, defectos por severidad y estado, y riesgo residual.',
    'Engañosas: 100 % de pasados (solo 8 de 20 requisitos), 12 cerrados (5 sin verificar) y tarjetas con 0 defectos (0 casos). Fiables: 40 % frente al 50 % y el crítico en facturas.',
    'Dirección: estado ámbar, cifras clave, riesgo y la decisión que necesitas. Equipo: pendientes por responsable, defectos, bloqueos y prioridades.',
    'Control: repriorizar, reabrir, pedir entorno y apoyo, y renegociar. Nunca esconder datos ni marcar como pasado lo bloqueado.',
    'Cierre: criterios de salida, pendientes registrados, testware archivado y lecciones aprendidas.',
  ],
}
