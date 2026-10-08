import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m02Lessons } from './m02-lessons'
import { m02Quiz } from './m02-quiz'
import { m02Scenes } from './m02-scenes'

/**
 * Curso 2: QA Profesional · Misión 2 — Dado, cuando, entonces (CTFL 2.1.3 y 4.5).
 * Guion legible: docs/academy/qa-profesional/missions/m02-gherkin.md
 *
 * Sesión de tres amigos para «Cobro por enlace de pago». El jugador convierte
 * las reglas en escenarios Gherkin (ATDD/BDD) y hace TDD con Sofía. A las
 * 15:00 Tomás programa a partir de lo acordado: lo que no está en un escenario
 * correcto se implementa mal.
 */
export const m02Gherkin: Mission = {
  id: 'm02-gherkin',
  courseKey: 'qa-profesional',
  number: 2,
  title: 'Dado, cuando, entonces',
  subtitle: 'Test-first: historias, criterios de aceptación, ATDD, BDD y TDD.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Martes',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-gherkin',
  appLabel: 'Escenarios',
  hideBugList: true,
  initialMetrics: {},
  lessons: m02Lessons,
  mentor: 'laura',
  quiz: m02Quiz,
  verdicts: {
    good: {
      title: 'Especificación por ejemplos',
      body: 'Tus escenarios son a la vez la especificación, los criterios de aceptación y los tests automatizados. Tomás no tuvo que adivinar nada.',
    },
    ok: {
      title: 'Escenarios con huecos',
      body: 'Lo que estaba en un escenario se programó bien; lo que no, lo decidió Tomás. Revisa qué reglas o qué bordes faltaron.',
    },
    bad: {
      title: 'Test-last disfrazado',
      body: 'Sin conversación ni escenarios acordados, el desarrollo adivinó las reglas. Repite la misión empezando por la sesión de tres amigos.',
    },
  },

  briefing: {
    title: 'Martes: tres amigos',
    paragraphs: [
      'Kobalto Empresas quiere que los autónomos cobren con un enlace de pago: lo crean, se lo mandan a su cliente y este paga con tarjeta.',
      'Hoy os juntáis los tres amigos: Elena (PO), Tomás (desarrollo) y tú (QA). Lo que acordéis como escenarios Dado/Cuando/Entonces será la especificación, el criterio de aceptación y el test automatizado.',
      'A las 15:00 Tomás empieza a programar. Lo que no esté en un escenario correcto lo decidirá él… y no siempre acertará. Y Sofía quiere probar TDD contigo con la comisión.',
    ],
    goals: [
      'En la sesión de tres amigos, saca las reglas con ejemplos y no te quedes en el caso feliz.',
      'Escribe escenarios: un comportamiento por escenario, sin pantallas y con resultados verificables.',
      'Usa un esquema de escenario con ejemplos en los bordes del importe.',
      'Acuerda los escenarios con Elena y Tomás antes de las 15:00.',
      'Haz con Sofía un ciclo TDD completo: rojo, verde, refactor.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'wiki' },
    {
      tool: 'app',
      enabledWhen: { kind: 'flag', key: 'amigos.done' },
      lockedMessage: 'Primero, la sesión de tres amigos de las 09:10.',
    },
    { tool: 'tickets' },
  ],

  scenes: m02Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_bdd',
      title: 'Guía BDD del equipo (Gherkin en español)',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'bdd' },
        { kind: 'unlock', conceptId: 'acceptance_criteria' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Palabras clave
- **Característica**: la funcionalidad.
- **Escenario**: un ejemplo concreto de comportamiento.
- **Dado** (contexto) · **Cuando** (una acción) · **Entonces** (resultado observable). **Y** repite la palabra anterior.
- **Esquema del escenario** + **Ejemplos**: el mismo escenario con una tabla de valores.

## Buenas prácticas
- Un comportamiento por escenario: **un solo Cuando**.
- Describe **qué pasa**, no **cómo se pulsa**: nada de pantallas, botones ni clics.
- El Entonces debe ser **verificable**: «todo funciona» no comprueba nada.
- Un contexto claro en el Dado; no mezcles varios.
- En los límites, usa ejemplos **justo a cada lado de cada borde** (análisis de valores límite).

## Tres amigos y mapeo de ejemplos
PO, desarrollo y QA juntos antes de programar: por cada **regla**, **ejemplos** concretos y las **preguntas** que nadie sabe responder todavía.`,
    },
    {
      id: 'guia_tdd',
      title: 'TDD en dos minutos',
      updatedLabel: 'Equipo de desarrollo',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'tdd' }],
      body: `## Ciclo
1. **Rojo**: escribe un test pequeño de la siguiente regla y comprueba que falla.
2. **Verde**: escribe el código mínimo para que pase.
3. **Refactor**: mejora el código con todos los tests en verde y vuelve a ejecutarlos.

## Ojo
- Si el test pasa sin código nuevo, no prueba nada nuevo.
- Las reglas especiales (mínimos, máximos, redondeos) necesitan su propio test.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-21',
      title: 'Cobro por enlace de pago',
      status: 'Refinamiento',
      type: 'story',
      description: 'Como autónomo cliente de Kobalto Empresas, quiero enviar un enlace de pago a mi cliente para cobrar sin datáfono. Se trabaja con ATDD: los escenarios acordados en la app «Escenarios» son los criterios de aceptación.',
      acceptanceCriteria: ['El enlace puede ser de 1 a 5.000 €.', 'El cliente paga con tarjeta.'],
      comments: [
        { author: 'elena', body: 'Creo que con esto está todo 🙂' },
        { author: 'tomas', body: 'A las 15:00 me pongo. Lo que no esté claro lo decido sobre la marcha.' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'G-MIN', title: 'Se pueden crear enlaces de 0,50 €', severity: 'medium', explanation: 'Sin ejemplos en el borde inferior, Tomás validó «mayor que cero».', technique: 'Esquema de escenario con ejemplos a cada lado del borde: 0,99 € y 1,00 €.', preventedBy: 'gk.r1min' },
    { id: 'G-MAX', title: 'Un enlace de 5.000,00 € justos se rechaza', severity: 'high', explanation: 'Tomás programó «menor que 5.000»; ningún ejemplo decía que 5.000,00 € se acepta.', technique: 'Ejemplos en el borde superior: 5.000,00 € y 5.000,01 €.', preventedBy: 'gk.r1max' },
    { id: 'G-CAD', title: 'Los enlaces caducados se pueden pagar', severity: 'high', explanation: 'La caducidad de 7 días no estaba en ningún escenario y no se programó.', technique: 'Mapeo de ejemplos: preguntar por el ciclo de vida del enlace.', preventedBy: 'gk.r2' },
    { id: 'G-DOBLE', title: 'Un mismo enlace se puede pagar dos veces', severity: 'critical', explanation: 'Nadie escribió el escenario del segundo pago: el prototipo cobra cada vez que se abre el enlace.', technique: 'Escenario negativo: Dado un enlace pagado, Cuando el cliente lo paga, Entonces se rechaza.', preventedBy: 'gk.r3' },
    { id: 'G-ANUL', title: 'Un enlace anulado se puede seguir pagando', severity: 'high', explanation: 'La anulación cambiaba el estado, pero el pago no lo comprobaba.', technique: 'Un escenario por estado del enlace (pendiente, pagado, anulado, caducado).', preventedBy: 'gk.r4' },
    { id: 'G-ANUL-PAG', title: 'Se puede anular un enlace ya pagado y el cobro queda sin conciliar', severity: 'high', explanation: 'La regla «mientras no esté pagado» se quedó en la conversación.', technique: 'Escenario negativo de la anulación: Dado un enlace pagado, Cuando el emisor lo anula, Entonces se rechaza.', preventedBy: 'gk.r5' },
    { id: 'G-COM', title: 'La comisión mínima no se aplica: un enlace de 5 € paga 0,07 €', severity: 'medium', explanation: 'Sin un test del mínimo, el código solo calculaba el 1,4 %.', technique: 'TDD: un test por regla, incluido el mínimo, antes del código.', preventedBy: 'tdd.min' },
    { id: 'G-UI', title: 'La suite de aceptación es frágil y no documenta el comportamiento', severity: 'medium', explanation: 'Escenarios con pantallas y clics, varios Cuando o resultados no verificables (o demasiado pocos escenarios claros): se rompen con cada cambio de interfaz y no explican la regla.', technique: 'Buenas prácticas BDD: un comportamiento por escenario, declarativo y verificable.', preventedBy: 'gk.style' },
  ],

  prevention: {
    title: 'Tus escenarios y tus tests',
    intro: 'A las 15:00 Tomás programó a partir de lo acordado. Lo que estaba en un escenario correcto se programó bien; lo que no, lo decidió él.',
    preventedLabel: 'Bugs que no llegaron a existir',
    appearedLabel: 'Bugs que nacieron de lo que no se especificó',
    rules: [
      { flag: 'gk.happy', label: 'Caso feliz: pagar un enlace pendiente', explanation: 'Dado un enlace pendiente, Cuando el cliente lo paga, Entonces el pago se acepta y el enlace queda «pagado».' },
      { flag: 'gk.r1min', label: 'Borde inferior del importe (0,99 € / 1,00 €)', explanation: 'Esquema del escenario con ejemplos a cada lado del borde.' },
      { flag: 'gk.r1max', label: 'Borde superior del importe (5.000,00 € / 5.000,01 €)', explanation: '«Hasta 5.000 €» no dice si 5.000 entra: el ejemplo lo decide.' },
      { flag: 'gk.r2', label: 'Un enlace caducado no se puede pagar', explanation: 'Regla que solo salió en el mapeo de ejemplos.' },
      { flag: 'gk.r3', label: 'Un enlace pagado no admite un segundo pago', explanation: 'El escenario negativo más importante: evita cobrar dos veces.' },
      { flag: 'gk.r4', label: 'Un enlace anulado no se puede pagar', explanation: 'Un escenario por estado del enlace.' },
      { flag: 'gk.r5', label: 'Un enlace pagado no se puede anular', explanation: 'La regla «mientras no esté pagado», convertida en ejemplo.' },
      { flag: 'gk.style', label: 'Escenarios declarativos, de un solo Cuando y verificables', explanation: 'Sin pantallas ni clics, sin «todo funciona correctamente» y con al menos tres escenarios claros.' },
      { flag: 'tdd.min', label: 'Comisión mínima cubierta por un test', explanation: 'comision(5,00) = 0,25 €, escrito antes del código.' },
      { flag: 'tdd.cycle', label: 'Ciclo TDD completo con Sofía', explanation: 'Rojo antes del código, verde con el código mínimo y refactor con los tests en verde.' },
    ],
  },

  concepts: [
    { id: 'test_first', title: 'Enfoques test-first', summary: 'TDD, ATDD y BDD definen las pruebas antes del código: aplican el principio de testing temprano y shift-left. (CTFL 2.1.3)' },
    { id: 'user_story', title: 'Historias de usuario y las 3C', summary: 'Tarjeta (recordatorio), conversación (los detalles, en equipo) y confirmación (criterios de aceptación). Se escriben en colaboración. (CTFL 4.5.1)' },
    { id: 'acceptance_criteria', title: 'Criterios de aceptación', summary: 'Condiciones que la historia debe cumplir para aceptarse. Formatos: orientados a escenario (Dado/Cuando/Entonces) u orientados a reglas. (CTFL 4.5.2)' },
    { id: 'atdd', title: 'ATDD', summary: 'Desarrollo guiado por pruebas de aceptación: el equipo escribe los casos de aceptación antes de programar, a partir de los criterios, primero los positivos y después los negativos. (CTFL 4.5.3)' },
    { id: 'bdd', title: 'BDD y Gherkin', summary: 'Comportamiento expresado como escenarios Dado/Cuando/Entonces, comprensibles por negocio y automatizables. Un comportamiento por escenario, declarativo y verificable. (CTFL 2.1.3)' },
    { id: 'tdd', title: 'TDD', summary: 'Desarrollo guiado por pruebas: test que falla, código mínimo que lo pasa y refactor con los tests en verde. Guía el diseño del código. (CTFL 2.1.3)' },
  ],
  debriefConcepts: ['test_first', 'user_story', 'acceptance_criteria', 'atdd', 'bdd', 'tdd'],
  seniorTips: [
    'En los tres amigos, pide ejemplos por regla y pregunta por el ciclo de vida: caducar, pagar dos veces, anular.',
    'Un escenario por comportamiento: caso feliz, caducado, pagado, anulado y anular un pagado.',
    'Para el importe, un esquema con 0,99 / 1,00 / 5.000,00 / 5.000,01 y su resultado.',
    'Nada de «hago clic en Pagar» ni «todo funciona correctamente».',
    'Pide a Laura una revisión antes de acordar: cuesta 10 minutos y ahorra bugs.',
    'TDD con Sofía: test de 100 € → ejecutar (rojo) → código mínimo → ejecutar (verde) → test del mínimo → rojo → código → verde → refactor → verde.',
    'En la demo, explica qué cubren los escenarios en verde y qué no.',
  ],
}
