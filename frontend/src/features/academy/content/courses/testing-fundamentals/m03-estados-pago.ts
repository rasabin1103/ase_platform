import type { Mission } from '../../../engine/types'
import { PAY_BUG_SLOTS } from '../../../apps/kobalto-payments/paymentLogic'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m03Design } from './m03-design'
import { m03Lessons } from './m03-lessons'
import { m03Quiz } from './m03-quiz'
import { m03Risk } from './m03-risk'

/**
 * Curso: Fundamentos de Testing · Misión 3 — Estados de un pago.
 * Guion legible: docs/academy/missions/m03-estados-pago.md
 *
 * Jueves. Kobalto Pay (cobros con tarjeta para comercios) estrena consola de
 * operaciones: autorizar, liquidar, anular, devolver y gestionar disputas.
 * Técnicas: transición de estados (válidas, inválidas y secuencias) y tabla
 * de decisión (comisión por devolución).
 */
export const m03EstadosPago: Mission = {
  id: 'm03-estados-pago',
  courseKey: 'testing-fundamentals',
  number: 3,
  title: 'Estados de un pago',
  subtitle: 'Transición de estados, transiciones inválidas y tablas de decisión.',
  world: kobaltoWorld,
  playerRole: 'QA Junior',
  dayStart: 9 * 60,
  dayLabel: 'Jueves',
  duration: 480,
  appActionCost: 3,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-payments',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  testDesign: m03Design,
  riskModel: m03Risk,
  lessons: m03Lessons,
  mentor: 'laura',
  quiz: m03Quiz,
  bugSlots: PAY_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'Jueves sin fugas',
      body: 'Operaciones activa las devoluciones con tranquilidad: has probado lo que el sistema debe hacer y, sobre todo, lo que no debe permitir. Carmen te pide la tabla de estados para auditoría.',
    },
    ok: {
      title: 'Jueves superado',
      body: 'Has encontrado bugs, pero quedaron transiciones o reglas sin probar. Revisa el debrief: cada bug tiene un estado de partida y una acción concretos.',
    },
    bad: {
      title: 'Jueves arriesgado',
      body: 'Sin el diagrama de estados es fácil quedarse en el camino feliz, y ahí no estaban los bugs caros. Repite la misión empezando por el Diseño.',
    },
  },

  briefing: {
    title: 'Jueves: estados de un pago',
    paragraphs: [
      'Kobalto Pay, el servicio de cobros con tarjeta para comercios, estrena su consola de operaciones (KOB-170): autorizar, liquidar, anular, devolver y gestionar disputas.',
      'Diego ha probado el camino feliz y funciona. Pero un cobro puede estar en ocho estados distintos y la consola muestra todas las acciones siempre: es la API la que debe impedir las que no tocan.',
      'Además, Finanzas ha definido una tabla de comisiones por devolución con varias condiciones. A las 16:00, Carmen (Riesgos) y Marta preguntarán si la consola puede devolver dinero que no debe.',
    ],
    goals: [
      'Dibuja (mentalmente o en el Diseño) los estados y sus transiciones a partir de la wiki.',
      'Prueba las transiciones válidas y, sobre todo, las inválidas que mueven dinero.',
      'Prueba secuencias: varias devoluciones seguidas sobre el mismo cobro.',
      'Cubre cada regla de la tabla de comisiones y su límite de 30 días.',
      'Reporta y verifica los bugs; a las 16:00, explica qué habéis cubierto.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'design' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Jueves: estados de un pago 🔁',
      body: '¡Buenos días!\n\nHoy toca la consola de operaciones de Kobalto Pay (KOB-170). Es otro tipo de prueba: aquí lo importante no es un campo, sino **en qué estado está cada cobro y qué se puede hacer desde él**.\n\nMi consejo:\n- Lee el **ciclo de vida de un cobro** en la wiki y dibuja los estados y sus flechas.\n- Cada flecha es un caso. Y cada **flecha que no existe** también: el sistema debe responder 409 sin tocar nada.\n- Para la comisión, Finanzas nos ha dado una **tabla de decisión**: cada regla, al menos un caso.\n- Usa el **generador de datos de prueba** para crear cobros en el estado que necesites.\n\nLaura',
    },
    {
      id: 'mail_marta',
      channel: 'email',
      from: 'marta',
      at: 0,
      subject: 'KOB-170 en staging',
      body: 'Hola:\n\nLa consola de operaciones ya está en staging. Operaciones la necesita para dejar de hacer devoluciones a mano el lunes.\n\nFinanzas ha publicado en la wiki la **comisión por devolución al comercio**. Cualquier duda sobre la tabla, me decís.\n\nMarta',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Equipo de Pagos',
      body: '**Diego:** Ayer probé el flujo completo: crear cobro, autorizar, liquidar y devolver. Todo OK ✅ La consola enseña todos los botones, pero la API valida las transiciones.\n\n**Marta:** ¡Genial! ¿Lo damos por bueno para el lunes?\n\n**Laura:** ¿Tú qué opinas?',
      choices: [
        {
          id: 'model',
          text: 'Ese camino es solo una parte. Voy a sacar todos los estados y transiciones de la wiki y probar las válidas y las inválidas: donde se pierde dinero es devolviendo lo que no toca.',
          cost: 15,
          reply: 'Bien visto. Empieza por las inválidas que mueven dinero.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'state_transition' },
            { kind: 'unlock', conceptId: 'invalid_transitions' },
            { kind: 'note', tone: 'good', text: 'Explicaste que el camino feliz no cubre las transiciones inválidas, donde se pierde dinero.' },
          ],
        },
        {
          id: 'trust_api',
          text: 'Si la API valida las transiciones, no hace falta probar las inválidas.',
          cost: 15,
          reply: '😎 Te lo dije.',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Diste por hecho que la API rechazaba las transiciones inválidas sin comprobarlo.' },
          ],
        },
        {
          id: 'all64',
          text: 'Pruebo las 64 combinaciones de estado × acción, una a una.',
          cost: 15,
          reply: 'Tener la tabla completa está muy bien, pero no te dará tiempo a todo con calma: prioriza las celdas que mueven dinero.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'unlock', conceptId: 'invalid_transitions' },
            { kind: 'note', tone: 'neutral', text: 'Planteaste la tabla de estados completa; Laura te pidió priorizar por riesgo.' },
          ],
        },
      ],
    },
    {
      id: 'carmen_incident',
      channel: 'chat',
      from: 'carmen',
      at: 120,
      body: 'Hola. Un dato por si os sirve: el mes pasado, con el sistema antiguo, un comercio devolvió un cobro **mientras el cliente tenía una disputa abierta** con su banco. Luego perdimos la disputa y pagamos dos veces. ¿La consola nueva lo impide?',
      choices: [
        {
          id: 'case',
          text: 'Lo convierto en caso: devolver un cobro «En disputa» debe rechazarse (409). Te cuento el resultado.',
          cost: 3,
          reply: 'Gracias. Es justo lo que quiero ver cubierto.',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'flag', key: 'carmen.case' },
            { kind: 'unlock', conceptId: 'incident_learning' },
            { kind: 'note', tone: 'good', text: 'Convertiste una incidencia de producción en un caso de prueba.' },
          ],
        },
        {
          id: 'old',
          text: 'Eso era el sistema antiguo; la consola nueva es otra cosa.',
          cost: 1,
          reply: 'Los requisitos son los mismos… Yo lo comprobaría.',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Descartaste una incidencia real como fuente de casos.' },
          ],
        },
      ],
    },
    {
      id: 'marta_fee',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'any', of: [{ kind: 'bugTriggered', bugId: 'F1' }, { kind: 'bugTriggered', bugId: 'F1b' }, { kind: 'bugTriggered', bugId: 'F2' }] },
      body: 'Diego dice que lo de la comisión que estás viendo es «interpretación de la tabla». ¿Seguro que es un bug?',
      choices: [
        {
          id: 'oracle',
          text: 'La tabla de Finanzas es el oráculo: indico la regla exacta (columna) que se incumple, con plan, tipo de devolución y días. Si la tabla es ambigua, la aclaramos con Finanzas.',
          cost: 3,
          reply: 'Perfecto, así no hay discusión. Mándaselo.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'decision_table' },
            { kind: 'note', tone: 'good', text: 'Defendiste el bug de comisión citando la regla concreta de la tabla de decisión.' },
          ],
        },
        {
          id: 'drop',
          text: 'Puede ser interpretación, lo dejo estar.',
          cost: 1,
          reply: 'Vale…',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Dejaste pasar un error de comisión sin contrastarlo con la tabla.' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 300,
      when: { kind: 'reportsLt', value: 1 },
      body: '¿Cómo vas? Pista: con el **generador** crea un cobro «Anulado», otro «Autorizado» y otro «En disputa», e intenta **devolver** en cada uno. Después, dos devoluciones seguidas sobre el mismo cobro.',
      onDeliver: [{ kind: 'unlock', conceptId: 'invalid_transitions' }],
    },
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'Buen bug 🐞 En transiciones, el report necesita: **estado de partida**, **acción**, **resultado esperado** (409 o el estado de llegada) y **lo que pasó**. Y el cobro concreto (KP-…) para que Diego lo vea.',
      onDeliver: [{ kind: 'unlock', conceptId: 'state_transition' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Diego ha subido un fix 🔧 Re-test en el build nuevo y repite también las secuencias de devoluciones: cambiar una validación de importes puede romper el caso del borde.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
        { kind: 'unlock', conceptId: 'switch_coverage' },
      ],
    },
    {
      id: 'go_live',
      channel: 'meeting',
      from: 'marta',
      with: ['carmen', 'laura'],
      at: 420,
      subject: '16:00 · ¿Activamos las devoluciones el lunes?',
      body: '**Marta:** Operaciones quiere usar la consola el lunes.\n\n**Carmen:** Mi pregunta es una: ¿puede la consola devolver dinero que no debe?',
      choices: [
        {
          id: 'coverage',
          text: 'Hemos probado las transiciones válidas, las inválidas que mueven dinero y las devoluciones sucesivas, además de cada regla de la tabla de comisiones. Los bugs abiertos están en el tablero con el estado y la acción; recomiendo no activar las devoluciones hasta verificar los fixes críticos.',
          requires: { kind: 'designCoverageGte', value: 0.6 },
          cost: 20,
          reply: 'Esto es lo que necesitaba. Firmo en cuanto estén verificados.',
          replyFrom: 'carmen',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'Respondiste a Riesgos con cobertura de estados y una recomendación clara.' },
          ],
        },
        {
          id: 'bugs_only',
          text: 'Hemos encontrado varios bugs, pero no sé decir qué transiciones hemos cubierto.',
          requires: { kind: 'reportsGte', value: 1 },
          cost: 20,
          reply: 'Entonces no sé qué NO puede pasar. Necesito la cobertura antes de firmar.',
          replyFrom: 'carmen',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Tenías bugs, pero no una cobertura de estados que enseñar.' }],
        },
        {
          id: 'happy',
          text: 'Diego probó el flujo completo y funciona.',
          cost: 20,
          reply: '¿Y devolver un cobro anulado? ¿O en disputa? Así no puedo firmar.',
          replyFrom: 'carmen',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'note', tone: 'bad', text: 'Respondiste a Riesgos con el camino feliz.' },
          ],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Charla con Laura',
      body: '**Laura:** ¿Qué te llevas de hoy?',
      choices: [
        {
          id: 'lesson',
          text: 'Que en un sistema con estados lo caro está en lo que no debería poder pasar: transiciones inválidas, estados finales y secuencias que acumulan. Y que una tabla de decisión se prueba regla a regla, con sus límites.',
          requires: { kind: 'designCoverageGte', value: 0.5 },
          reply: 'Exacto. Has probado como piensa un auditor, no como un usuario con prisa.',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'happy',
          text: 'Que si el camino principal funciona, lo demás son casos raros.',
          reply: 'Hmm, repasa el debrief: los bugs más caros estaban en esos «casos raros».',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Te quedaste con el camino feliz como criterio de calidad.' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Sinceramente, no he llegado a mucho.',
          reply: 'Con ocho estados es normal perderse. Mañana dibujamos el diagrama juntos antes de empezar.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'ciclo',
      title: 'Ciclo de vida de un cobro con tarjeta (KOB-170)',
      updatedLabel: 'Actualizado el lunes por Marta Sanz',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'state_transition' },
        { kind: 'flag', key: 'states.read' },
      ],
      body: `## Estados
- **Pendiente**: el cliente ha pagado en el comercio; falta la respuesta del banco emisor.
- **Autorizado**: el banco reserva el dinero, pero aún no se ha cobrado.
- **Rechazado**: el banco no lo autoriza. Estado final.
- **Anulado**: se cancela antes de cobrarse. Estado final.
- **Liquidado**: el dinero se ha cobrado y abonado al comercio.
- **Devuelto parcialmente**: se ha devuelto una parte al cliente.
- **Devuelto**: se ha devuelto todo. Estado final.
- **En disputa**: el cliente ha reclamado el cargo a su banco.

## Transiciones permitidas
- Pendiente → **Autorizar** → Autorizado · **Rechazar** → Rechazado · **Anular** → Anulado.
- Autorizado → **Liquidar** → Liquidado · **Anular** → Anulado.
- Liquidado → **Devolver** → Devuelto parcialmente (o Devuelto si se devuelve todo) · **Abrir disputa** → En disputa.
- Devuelto parcialmente → **Devolver** → Devuelto parcialmente (o Devuelto al completar el importe) · **Abrir disputa** → En disputa.
- En disputa → **Disputa ganada** → vuelve al estado anterior a la disputa · **Disputa perdida** → Devuelto (contracargo de lo pendiente).

## Reglas
- Cualquier otra acción responde **409 Transición no permitida** y **no cambia el cobro**.
- Una devolución debe ser mayor que 0 €, con 2 decimales como máximo, y **no superar lo pendiente de devolver** (importe − ya devuelto).
- Mientras hay una disputa abierta **no se puede devolver**: el banco del cliente ya puede estar devolviéndole el dinero.`,
    },
    {
      id: 'comisiones',
      title: 'Finanzas · Comisión por devolución al comercio',
      updatedLabel: 'Aprobada por Finanzas el martes',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'decision_table' },
        { kind: 'flag', key: 'fees.read' },
      ],
      body: `## Condiciones
- **Plan del comercio**: Pro o Estándar.
- **Tipo de devolución**: «total» si devuelve el importe íntegro del cobro en una sola operación; cualquier otra es «parcial».
- **Plazo**: dentro de plazo si se devuelve **hasta 30 días naturales** después del cobro, **día 30 incluido**.

## Reglas
- **R1** · Plan Pro (cualquier tipo y plazo) → **0,00 €**.
- **R2** · Estándar · total · dentro de plazo → **0,00 €**.
- **R3** · Estándar · total · fuera de plazo → **1,50 €**.
- **R4** · Estándar · parcial · dentro de plazo → **0,75 €**.
- **R5** · Estándar · parcial · fuera de plazo → **1,50 €**.

La comisión se cobra al comercio en cada devolución y se ve en el detalle del cobro.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-170',
      title: 'Como agente de operaciones quiero gestionar devoluciones y disputas de cobros desde una consola',
      status: 'En QA',
      type: 'story',
      description: 'Consola interna de Kobalto Pay. Sigue el ciclo de vida de un cobro (wiki) y la tabla de comisiones de Finanzas. La consola muestra todas las acciones; la API valida las transiciones.',
      acceptanceCriteria: [
        'Dado un cobro en cualquier estado, cuando ejecuto una acción permitida por el ciclo de vida, entonces el cobro pasa al estado indicado y se registra en el historial.',
        'Dada una acción no permitida en el estado actual, entonces la API responde 409 y el cobro no cambia.',
        'Dada una devolución, entonces su importe es > 0 € y no supera lo pendiente de devolver; al completar el importe el cobro queda «Devuelto».',
        'Dada una disputa ganada, entonces el cobro vuelve al estado anterior; perdida, queda «Devuelto».',
        'Cada devolución aplica la comisión de la tabla de Finanzas.',
      ],
      comments: [
        { author: 'diego', body: 'Probado el flujo crear → autorizar → liquidar → devolver ✅' },
        { author: 'marta', body: 'Operaciones lo necesita el lunes 🙏' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'S1', title: 'Se puede devolver un cobro anulado', severity: 'critical', explanation: 'La API no comprueba el estado antes de devolver: se devuelve dinero de un cobro que nunca se llegó a cobrar.', technique: 'Transición inválida: Anulado → Devolver.', fix: { delay: 40 } },
    { id: 'S1b', title: 'Se puede devolver un cobro solo autorizado (sin liquidar)', severity: 'critical', explanation: 'La devolución se permite desde «Autorizado»: el dinero aún no se ha cobrado y se abona igualmente al cliente.', technique: 'Transición inválida: Autorizado → Devolver.', fix: { delay: 40 } },
    { id: 'S2', title: 'Se puede anular un cobro ya liquidado', severity: 'high', explanation: 'La anulación no comprueba el estado: el cobro queda «Anulado» con el dinero ya abonado al comercio y sin devolución al cliente.', technique: 'Transición inválida: Liquidado → Anular.', fix: { delay: 40 } },
    { id: 'S2b', title: 'Se puede liquidar un cobro anulado', severity: 'critical', explanation: 'Un estado final no es final: se cobra al cliente un pago que se había anulado.', technique: 'Transición inválida desde un estado final: Anulado → Liquidar.', fix: { delay: 40 } },
    {
      id: 'S3',
      title: 'Las devoluciones sucesivas pueden superar el importe del cobro',
      severity: 'critical',
      explanation: 'Cada devolución se valida contra el importe original y no contra lo pendiente: con dos devoluciones parciales se devuelve más de lo cobrado.',
      technique: 'Secuencia de transiciones con valores límite: 60 € + 41 € sobre 100 €.',
      fix: { delay: 50, regression: 'S-R1', note: 'He cambiado la validación para usar lo pendiente de devolver.' },
    },
    { id: 'S4', title: 'Se puede devolver un cobro en disputa', severity: 'critical', explanation: 'Mientras hay una disputa abierta se permite devolver: si se pierde la disputa, se paga dos veces (la incidencia que contó Carmen).', technique: 'Transición inválida sacada de una incidencia: En disputa → Devolver.', fix: { delay: 45 } },
    { id: 'S4b', title: 'No se puede abrir una disputa en un cobro devuelto parcialmente', severity: 'medium', explanation: 'Una transición válida responde 409: Operaciones no puede registrar las disputas de esos cobros y tendría que hacerlo a mano.', technique: 'Transición válida: Devuelto parcialmente → Abrir disputa.', fix: { delay: 40 } },
    { id: 'S5', title: 'Al devolver el importe completo, el cobro queda «Devuelto parcialmente»', severity: 'high', explanation: 'El cambio a «Devuelto» usa «mayor que» en lugar de «mayor o igual»: el cobro queda abierto con 0 € pendientes y los informes lo cuentan mal.', technique: 'Valor límite y estado de llegada: devolver exactamente 100,00 € de 100,00 €.', fix: { delay: 40 } },
    { id: 'S5b', title: 'Se puede autorizar un cobro rechazado', severity: 'high', explanation: 'El estado final «Rechazado» admite «Autorizar»: el comercio vería como bueno un pago que el banco denegó.', technique: 'Transición inválida desde un estado final: Rechazado → Autorizar.', fix: { delay: 40 } },
    {
      id: 'F1',
      title: 'A los comercios Pro se les cobra comisión en devoluciones parciales',
      severity: 'medium',
      requiresFlag: 'fees.read',
      disputeReply: '¿Dónde pone que los Pro no pagan en parciales? Pásame la regla.',
      explanation: 'La regla de las parciales se evalúa antes que la del plan Pro: la R1 tiene un «–» en el tipo y el código no lo respeta.',
      technique: 'Tabla de decisión: más de una combinación en una regla con «indiferente» (Pro · parcial).',
      fix: { delay: 40 },
    },
    {
      id: 'F1b',
      title: 'Las devoluciones totales fuera de plazo no cobran comisión (Estándar)',
      severity: 'medium',
      requiresFlag: 'fees.read',
      disputeReply: '¿Seguro? Que yo sepa, las totales son gratis. ¿Qué regla dice lo contrario?',
      explanation: 'Para devoluciones totales no se comprueba el plazo: la R3 (1,50 €) nunca se aplica.',
      technique: 'Tabla de decisión: una prueba por regla (R3 · Estándar · total · fuera de plazo).',
      fix: { delay: 40 },
    },
    {
      id: 'F2',
      title: 'Una devolución el día 30 se cobra como fuera de plazo',
      severity: 'low',
      requiresFlag: 'fees.read',
      disputeReply: '30 días son 30 días… ¿el día 30 entra o no? Enséñame dónde lo pone.',
      explanation: 'El plazo usa «menor que 30» en lugar de «hasta 30 incluido»: el último día de plazo se cobra comisión.',
      technique: 'Valores límite dentro de una condición de la tabla: día 30 y día 31.',
      fix: { delay: 35 },
    },
    {
      id: 'S-R1',
      title: 'Regresión: devolver exactamente lo pendiente se rechaza',
      severity: 'high',
      regression: true,
      explanation: 'Al corregir la validación acumulada se usó «menor que» lo pendiente: ya no se puede completar la devolución de un cobro.',
      technique: 'Regresión en el borde de la secuencia: 60 € + 40 € sobre 100 €.',
    },
  ],

  concepts: [
    { id: 'state_transition', title: 'Transición de estados', summary: 'Modela el sistema como estados y flechas; cada transición válida es al menos un caso y se comprueba el estado de llegada.' },
    { id: 'invalid_transitions', title: 'Transiciones inválidas', summary: 'Cada celda vacía de la tabla de estados debe rechazarse sin efectos. Prioriza las que mueven dinero y las que salen de estados finales.' },
    { id: 'switch_coverage', title: 'Secuencias (1-switch)', summary: 'Muchos bugs aparecen al encadenar transiciones: acumulados, ciclos y vuelta al estado anterior.' },
    { id: 'decision_table', title: 'Tabla de decisión', summary: 'Condiciones en filas, reglas en columnas: al menos un caso por regla, varias combinaciones si hay «–» y límites en las condiciones numéricas.' },
    { id: 'test_data', title: 'Datos de prueba', summary: 'Los generadores crean el objeto en el estado necesario; aceleran la preparación, pero recorre el camino real alguna vez y anota los datos.' },
    { id: 'incident_learning', title: 'Incidencias como fuente de casos', summary: 'Lo que ya falló en producción vuelve: convierte cada incidencia en un caso de regresión, también al migrar de sistema.' },
    { id: 'boundary_values', title: 'Valores límite', summary: 'Justo dentro y justo fuera: también en importes acumulados y en los plazos de una tabla de decisión.' },
    { id: 'confirmation_testing', title: 'Re-test (pruebas de confirmación)', summary: 'Volver a probar en el build nuevo el caso que falló antes de cerrar.' },
    { id: 'regression', title: 'Pruebas de regresión', summary: 'Tras un fix, repite los casos relacionados que antes pasaban, sobre todo los del borde.' },
  ],
  debriefConcepts: ['state_transition', 'invalid_transitions', 'switch_coverage', 'decision_table', 'incident_learning'],
  seniorTips: [
    'Antes de tocar la consola, saca de la wiki la tabla de estados × acciones: 11 celdas válidas, el resto deben dar 409.',
    'Prioriza las transiciones inválidas que mueven dinero: devolver desde Anulado, Autorizado o En disputa; liquidar lo anulado.',
    'Trata los estados finales como finales: prueba al menos una acción desde Rechazado, Anulado y Devuelto.',
    'Prueba secuencias de devoluciones en su borde: 60 + 40 (exacto) y 60 + 41 (se pasa), y comprueba el estado de llegada.',
    'En la tabla de comisiones, un caso por regla, una combinación extra en la regla con «–» y el día 30 frente al 31.',
    'Usa las incidencias de producción como casos: «devolver en disputa» ya costó dinero una vez.',
  ],
}
