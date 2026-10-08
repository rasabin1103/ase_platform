import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m04Lessons } from './m04-lessons'
import { m04Quiz } from './m04-quiz'
import { m04Scenes } from './m04-scenes'

/**
 * Curso 2: QA Profesional · Misión 4 — Intuición experta (CTFL 4.4).
 * Guion legible: docs/academy/qa-profesional/missions/m04-exploratoria.md
 *
 * Tarjetas de equipo v2 llega a staging con poca documentación y hay go/no-go
 * a las 13:00. El jugador organiza sesiones exploratorias con charter, aplica
 * ataques de predicción de errores, pasa (y mejora) la checklist del equipo y
 * reporta lo que encuentra.
 */
export const m04Exploratoria: Mission = {
  id: 'm04-exploratoria',
  courseKey: 'qa-profesional',
  number: 4,
  title: 'Intuición experta',
  subtitle: 'Técnicas basadas en la experiencia: exploratoria con charter, predicción de errores y checklists.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Jueves',
  duration: 480,
  appActionCost: 10,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-explore',
  appLabel: 'Exploración',
  initialMetrics: {},
  lessons: m04Lessons,
  mentor: 'laura',
  quiz: m04Quiz,
  verdicts: {
    good: {
      title: 'Intuición con método',
      body: 'Encontraste lo que la checklist no veía, frenaste a tiempo lo peligroso y el equipo se queda con una checklist mejor.',
    },
    ok: {
      title: 'Buenos hallazgos, poco método',
      body: 'Encontraste cosas, pero algo del charter, del informe o de la decisión de las 13:00 falló. Mira el debrief.',
    },
    bad: {
      title: 'La checklist decía verde',
      body: 'Lo nuevo salió sin explorar. Repite la misión empezando por un charter centrado en las novedades.',
    },
  },

  briefing: {
    title: 'Jueves: intuición experta',
    paragraphs: [
      'El nuevo panel de «Tarjetas de equipo» llega a staging con poca documentación: solo las notas de versión de Elena. Raúl decide a las 13:00 si sale el viernes.',
      'No hay tiempo para diseñar casos formales de todo. Tienes la checklist del equipo, tu experiencia sobre dónde suele fallar el software y sesiones exploratorias con charter y tiempo.',
      'En la app «Exploración» eliges dónde atacar y cómo. Lo que encuentres se reporta en el Tablero con la nota como evidencia.',
    ],
    goals: [
      'Organiza la exploración en sesiones con charter: qué áreas, para descubrir qué y cuánto tiempo.',
      'Céntrate primero en lo nuevo y lo que más riesgo tiene.',
      'Usa ataques de predicción de errores y reporta cada bug con su evidencia.',
      'A las 13:00, da a Raúl una recomendación de go/no-go basada en riesgos.',
      'Mejora la checklist del equipo con lo que hoy ha funcionado.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m04Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'notas_v2',
      title: 'Notas de versión · Tarjetas de equipo v2',
      updatedLabel: 'Elena Prieto',
      readCost: 3,
      onRead: [{ kind: 'flag', key: 'notes.read' }],
      body: `## Novedades
- **Congelar y descongelar** tarjetas desde el panel (antes solo desde la app móvil).
- **Invitar a empleados por email**: activan su tarjeta desde el enlace.
- **Exportar los gastos del mes** en CSV para la gestoría.

## Sin cambios
- Alta de tarjeta y cambio de límite (salvo retoques visuales).`,
    },
    {
      id: 'guia_exploratoria',
      title: 'Guía de pruebas exploratorias y predicción de errores',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'exploratory' },
        { kind: 'unlock', conceptId: 'error_guessing' },
      ],
      body: `## Sesión exploratoria
- **Charter**: «Explorar [área] con [recursos] para descubrir [información]».
- **Timebox**: 30, 60 o 90 minutos.
- Durante la sesión se aprende, se diseña y se ejecuta a la vez, tomando notas.
- Al cerrar: **informe de sesión** (qué se cubrió, qué se encontró, qué queda).

## Predicción de errores: ataques típicos
Campos vacíos, valores límite y fuera de rango, caracteres especiales, doble clic, volver atrás o recargar, sesión caducada, operaciones concurrentes y datos duplicados.

## Cuándo encaja
Especificación pobre, poco tiempo, o para complementar técnicas más formales.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-40',
      title: 'Tarjetas de equipo v2 · validación antes del viernes',
      status: 'En pruebas',
      type: 'story',
      description: 'Novedades: congelar desde el panel, invitación por email y exportación CSV. Documentación mínima. Decisión de go/no-go a las 13:00.',
      acceptanceCriteria: ['Recomendación de go/no-go basada en riesgos.', 'Bugs reportados con evidencia.'],
      comments: [{ author: 'tomas', body: 'Checklist del equipo pasada ayer: todo OK.' }],
      actions: [],
    },
  ],

  bugs: [
    { id: 'X-SESION', title: 'Con la sesión caducada, «Congelar» muestra éxito pero la tarjeta sigue pagando', severity: 'critical', explanation: 'La llamada falla por la sesión caducada, pero la interfaz muestra el éxito sin comprobar la respuesta.', technique: 'Predicción de errores: sesión caducada en una operación crítica y nueva.', fix: { delay: 60, note: 'Ahora, si la sesión caducó, se pide volver a entrar y no se muestra éxito.' } },
    { id: 'X-DOBLE', title: 'Doble clic en «Crear tarjeta» crea dos tarjetas', severity: 'high', explanation: 'El botón no se desactiva tras el primer envío y el servidor no evita duplicados.', technique: 'Predicción de errores: doble clic / envío repetido.', fix: { delay: 45 } },
    { id: 'X-NEG', title: 'Se acepta un límite negativo y la tarjeta queda sin límite', severity: 'high', explanation: 'La validación de rango solo existía en el alta; en el cambio de límite no.', technique: 'Valores fuera de rango en una pantalla que la checklist no cubría.', fix: { delay: 45 } },
    { id: 'X-INVITA', title: 'Invitar dos veces el mismo email crea dos empleados', severity: 'medium', explanation: 'La invitación no comprueba si el email ya existe.', technique: 'Predicción de errores: datos duplicados.', fix: { delay: 60 } },
    { id: 'X-CSV', title: 'Un concepto con «;» descoloca las columnas del CSV', severity: 'medium', explanation: 'El exportador no escapa el separador.', technique: 'Predicción de errores: caracteres especiales en una exportación.', fix: { delay: 60 } },
    { id: 'X-TILDE', title: 'Los nombres con ñ o tildes salen corruptos en la tarjeta virtual', severity: 'medium', explanation: 'La tarjeta virtual usa una codificación distinta de UTF-8.', technique: 'Predicción de errores: caracteres especiales.', fix: { delay: 60 } },
  ],

  prevention: {
    title: 'Tu forma de explorar',
    intro: 'Las técnicas basadas en la experiencia funcionan mejor con un poco de método.',
    preventedLabel: '',
    appearedLabel: '',
    rules: [
      { flag: 'charter.used', label: 'Exploraste con charter y timebox', explanation: 'Áreas, objetivo y tiempo definidos antes de empezar.' },
      { flag: 'charter.risk', label: 'El charter se centró en lo nuevo', explanation: 'Congelar, invitar y exportar: donde está el riesgo y donde la checklist no llega.' },
      { flag: 'charter.focus', label: 'Objetivo orientado al riesgo de negocio', explanation: 'Tarjetas que pagan cuando no deberían, no «que la interfaz sea bonita».' },
      { flag: 'session.report', label: 'Cerraste las sesiones con informe', explanation: 'Qué se cubrió, qué se encontró y qué queda pendiente.' },
      { flag: 'gonogo.right', label: 'Go/no-go basado en riesgo', explanation: 'No-go por el bug crítico de congelar, con el resto planificado.' },
      { flag: 'checklist.improved', label: 'Checklist mejorada', explanation: 'Con los ataques que de verdad encontraron fallos.' },
    ],
  },

  concepts: [
    { id: 'error_guessing', title: 'Predicción de errores', summary: 'Anticipar errores, defectos y fallos a partir del conocimiento de cómo ha fallado el software antes. Se aplica con «ataques» metódicos. (CTFL 4.4.1)' },
    { id: 'exploratory', title: 'Pruebas exploratorias', summary: 'Diseñar, ejecutar y evaluar a la vez mientras se aprende del objeto de prueba. En sesiones con charter y tiempo. Útiles con especificaciones pobres o poco tiempo. (CTFL 4.4.2)' },
    { id: 'checklist_based', title: 'Pruebas basadas en listas de comprobación', summary: 'Una checklist recoge la experiencia del equipo, pero hay que mantenerla viva: lo que no sabe, no lo ve. (CTFL 4.4.3)' },
    { id: 'experience_based', title: 'Técnicas basadas en la experiencia', summary: 'Aprovechan el conocimiento de testers, desarrolladores y usuarios. Complementan a las técnicas de caja negra y blanca. (CTFL 4.4)' },
  ],
  debriefConcepts: ['experience_based', 'error_guessing', 'exploratory', 'checklist_based'],
  seniorTips: [
    'Primera sesión: «Congelar» e «Invitar», objetivo «tarjetas que pagan cuando no deberían», 60 min.',
    'Congelar × sesión caducada es el bug crítico: repórtalo antes de las 13:00 y recomienda no-go.',
    'Segunda sesión: «Exportar» y «Cambio de límite» (caracteres especiales y valores negativos).',
    'La checklist del equipo sale verde: no ve lo nuevo ni el cambio de límite con negativos.',
    'Cierra cada sesión con informe y añade a la checklist los ataques que funcionaron (doble clic, sesión caducada, caracteres especiales, duplicados).',
  ],
}
