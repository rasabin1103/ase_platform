import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m01Design } from './m01-design'
import { m01Lessons } from './m01-lessons'
import { m01Quiz } from './m01-quiz'
import { m01Review } from './m01-review'

/**
 * Curso: Fundamentos de Testing · Misión 1 — La historia ambigua.
 * Guion legible: docs/academy/missions/m01-historia-ambigua.md
 *
 * Martes en Kobalto. QA revisa KOB-151 (transferencias programadas) ANTES
 * de que exista el código. A las 11:30 Diego empieza a desarrollar: cada
 * duda que no se haya aclarado se convierte en un bug del prototipo que
 * llega a staging por la tarde (BugDef.preventedBy + efecto preventBugs).
 */
export const m01HistoriaAmbigua: Mission = {
  id: 'm01-historia-ambigua',
  courseKey: 'testing-fundamentals',
  number: 1,
  title: 'La historia ambigua',
  subtitle: 'Probar antes de que exista el código: revisión de requisitos y shift-left.',
  world: kobaltoWorld,
  playerRole: 'QA Junior',
  dayStart: 9 * 60,
  dayLabel: 'Martes',
  duration: 480,
  appActionCost: 4,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-scheduled',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  requirementsReview: m01Review,
  testDesign: m01Design,
  verdicts: {
    good: { title: 'Martes de QA de verdad', body: 'Marta te pide que revises también la historia de la semana que viene. Diego ha dejado de decir «está clarísimo» en los refinamientos.' },
    ok: { title: 'Martes superado', body: 'Has evitado algunos bugs y encontrado otros. Revisa el debrief: cada duda sin aclarar se convirtió en un bug que hubo que desarrollar, encontrar y arreglar.' },
    bad: { title: 'Martes complicado', body: 'La historia llegó al desarrollo casi sin revisar. Repite la misión empezando por la Revisión: verás cuántos bugs no llegan a existir.' },
  },
  lessons: m01Lessons,
  mentor: 'laura',
  quiz: m01Quiz,

  briefing: {
    title: 'Martes: la historia ambigua',
    paragraphs: [
      'Has sobrevivido a tu primer día. Hoy el equipo refina KOB-151, transferencias programadas: la funcionalidad que más piden los clientes de Kobalto. Todavía no existe ni una línea de código.',
      'Tu trabajo empieza antes que el de Diego. Revisa la historia, encuentra lo ambiguo y pregúntaselo a Marta. A las 11:30 Diego empieza a desarrollar con lo que haya en el ticket.',
      'Por la tarde llegará un prototipo a staging. Ahí verás qué bugs nacieron de las dudas que nadie resolvió a tiempo.',
    ],
    goals: [
      'Revisa KOB-151 y envía tus dudas a Marta antes de las 11:30.',
      'Participa en el refinamiento de las 09:30.',
      'Diseña tus casos y prueba el prototipo cuando llegue a staging.',
      'Reporta y verifica los bugs; fíjate en cuáles vienen de los requisitos.',
      'A las 17:00, cuéntale a Laura qué has aprendido.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'tickets' },
    { tool: 'review' },
    { tool: 'design' },
    { tool: 'wiki' },
    {
      tool: 'app',
      enabledWhen: { kind: 'flag', key: 'proto.ready' },
      lockedMessage: 'El prototipo de KOB-151 llegará a staging por la tarde. Mientras tanto, revisa la historia y diseña tus casos.',
    },
    { tool: 'logs' },
  ],

  scenes: [
    // ---------------------------------------------------------- 09:00
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Martes: refinamiento de KOB-151 🔍',
      body: '¡Buenos días!\n\nHoy toca algo distinto: **probar antes de que exista el código**.\n\n- A las 09:30 refinamos KOB-151 (Transferencias programadas).\n- Lee la historia en **Revisión**, marca lo que no esté claro y envíaselo a Marta.\n- Diego empieza a desarrollar a las **11:30**: lo que no esté aclarado para entonces lo implementará como él lo entienda.\n- Por la tarde habrá un prototipo en staging. Diseña tus casos antes, en **Diseño**.\n\nSi tienes dudas de método, pregúntame.\n\nLaura',
    },
    {
      id: 'mail_marta',
      channel: 'email',
      from: 'marta',
      at: 0,
      subject: 'KOB-151 para el refinamiento',
      body: 'Hola equipo:\n\nOs dejo KOB-151 en el tablero para el refinamiento de hoy. Es la petición número 1 de los clientes (¡el 40 % del buzón de sugerencias!) y me gustaría llevarla a la release del viernes.\n\nCreo que está bastante clara, pero si veis algo, decídmelo.\n\nMarta',
    },

    // ---------------------------------------------------------- 09:30 refinamiento
    {
      id: 'refinement',
      channel: 'meeting',
      from: 'marta',
      with: ['diego', 'laura'],
      at: 30,
      subject: 'Refinamiento · KOB-151',
      body: '**Marta:** KOB-151: transferencias programadas. El cliente elige fecha y frecuencia y se envían solas. Está todo en el ticket.\n\n**Diego:** Está clarísimo. Son 3 puntos. ¿Lo estimamos y me pongo?\n\n**Laura:** Antes de estimar: ¿QA tiene dudas?',
      choices: [
        {
          id: 'already_sent',
          text: 'Sí: ya le he enviado mis dudas a Marta en la revisión. Propongo cerrar las respuestas antes de estimar; pueden cambiar mucho el trabajo.',
          requires: { kind: 'flag', key: 'review.submitted' },
          cost: 20,
          reply: 'Tiene razón. Diego, espera a las respuestas antes de ponerte.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'flag', key: 'refinement.good' },
            { kind: 'note', tone: 'good', text: 'En el refinamiento defendiste aclarar las dudas antes de estimar, con tu revisión ya enviada.' },
          ],
        },
        {
          id: 'ask_time',
          text: 'Tengo dudas sobre fechas, límites y cancelación. Dadme hasta las 11:00 para revisarla a fondo y se las paso a Marta antes de que Diego empiece.',
          cost: 20,
          reply: 'Perfecto, quedo atenta a tus dudas.',
          replyFrom: 'marta',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'flag', key: 'refinement.good' },
            { kind: 'note', tone: 'good', text: 'Pediste tiempo para revisar la historia antes de que empezara el desarrollo.' },
          ],
        },
        {
          id: 'all_clear',
          text: 'Por mi parte está clara, adelante.',
          cost: 20,
          reply: '¡Genial! Me pongo a las 11:30 🚀',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Diste por clara una historia con varios agujeros sin haberla revisado.' },
          ],
        },
        {
          id: 'estimate',
          text: 'Yo la estimaría en 8 puntos, me parece compleja.',
          cost: 20,
          reply: '¿Compleja por qué? Si no hay dudas concretas, me quedo con 3.',
          replyFrom: 'diego',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Opinaste sobre la estimación sin aportar las dudas concretas que la hacían compleja.' }],
        },
      ],
    },

    // ---------------------------------------------------------- 10:45 pista
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 105,
      when: { kind: 'notFlag', key: 'review.submitted' },
      body: 'Diego empieza en 45 minutos ⏳ ¿Has enviado ya tus dudas a Marta? Pista: busca palabras vagas («los mismos límites», «rápido»), casos que faltan («¿y si…?») y contradicciones entre la descripción y los ejemplos.',
      onDeliver: [{ kind: 'unlock', conceptId: 'requirement_defects' }],
    },

    // ---------------------------------------------------------- 11:30 empieza el desarrollo
    {
      id: 'dev_start',
      channel: 'chat',
      from: 'diego',
      at: 150,
      body: 'Me pongo con KOB-151 🚀 Lo que no esté aclarado en el ticket lo resuelvo como mejor me parezca.',
      onDeliver: [
        { kind: 'preventBugs' },
        { kind: 'note', tone: 'neutral', text: 'A las 11:30 empezó el desarrollo con las aclaraciones que había en ese momento en el ticket.' },
      ],
    },

    // ---------------------------------------------------------- 12:30 cambio de alcance (imprevisto)
    {
      id: 'scope_change',
      channel: 'chat',
      from: 'marta',
      at: 210,
      probability: 0.5,
      body: 'Me ha llamado Compliance 😰 ¿Podemos hacer que el límite diario también se compruebe al programar? Díselo tú directamente a Diego, que así no perdemos tiempo.',
      choices: [
        {
          id: 'register',
          text: 'Es un cambio de alcance: lo dejo anotado en el ticket y lo valoramos mañana en la daily con Diego y Laura, para ver el impacto en el sprint.',
          cost: 5,
          reply: 'Vale, tienes razón. Mejor hacerlo bien.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'unlock', conceptId: 'scope_change' },
            { kind: 'note', tone: 'good', text: 'Gestionaste un cambio de alcance a mitad de sprint por el proceso, no por un atajo.' },
          ],
        },
        {
          id: 'shortcut',
          text: 'Vale, se lo digo a Diego ahora.',
          cost: 3,
          reply: '¡Gracias! 🙌',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'unlock', conceptId: 'scope_change' },
            { kind: 'note', tone: 'bad', text: 'Pasaste un cambio de alcance por un atajo: sin registrarlo ni valorar su impacto.' },
          ],
        },
        {
          id: 'not_mine',
          text: 'Eso no es cosa mía.',
          cost: 1,
          reply: 'Vale… se lo digo yo.',
          effects: [{ kind: 'score', key: 'communication', add: -1 }],
        },
      ],
    },

    // ---------------------------------------------------------- 14:30 prototipo
    {
      id: 'proto_ready',
      channel: 'chat',
      from: 'diego',
      at: 330,
      body: 'Prototipo de programadas en staging (build proto1). Échale un ojo cuando puedas 🙏',
      onDeliver: [{ kind: 'flag', key: 'proto.ready' }],
    },
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'Primer bug del prototipo en el tablero 🐞 Fíjate en de dónde viene cada uno: ¿de un error de código o de un requisito que no aclaramos a tiempo? Es la mejor lección de hoy.',
      onDeliver: [{ kind: 'unlock', conceptId: 'shift_left' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Diego ya ha subido un fix 🔧 Como ayer: re-test en el build nuevo y repite los casos relacionados antes de cerrar.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
      ],
    },

    // ---------------------------------------------------------- 15:30 presión de negocio
    {
      id: 'marta_status',
      channel: 'chat',
      from: 'marta',
      at: 390,
      body: '¿Podemos comprometer KOB-151 para la release del viernes? Me lo pregunta dirección.',
      choices: [
        {
          id: 'evidence',
          text: 'Todavía no: hay bugs abiertos en el prototipo y varios vienen de requisitos que no estaban claros. Te paso la lista; con los fixes y un re-test lo confirmamos el jueves.',
          requires: { kind: 'reportsGte', value: 1 },
          cost: 5,
          reply: 'Entendido, mejor saberlo hoy. Espero al jueves.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Diste a la PO un estado con evidencia y una fecha realista para decidir.' },
          ],
        },
        {
          id: 'unsure',
          text: 'Aún no lo sé. A las 17:00 te digo algo con Laura.',
          cost: 3,
          reply: 'Ok, quedo atenta.',
          effects: [{ kind: 'score', key: 'communication', add: 1 }],
        },
        {
          id: 'yes',
          text: 'Sí, está casi.',
          cost: 2,
          reply: '¡Perfecto! Se lo digo a dirección 🎉',
          effects: [
            {
              kind: 'if',
              when: { kind: 'bugTriggered' },
              then: [
                { kind: 'score', key: 'risk', add: -2 },
                { kind: 'note', tone: 'bad', text: 'Comprometiste la release con bugs ya vistos en el prototipo.' },
              ],
              else: [
                { kind: 'score', key: 'risk', add: -1 },
                { kind: 'note', tone: 'bad', text: 'Comprometiste la release sin haber probado lo suficiente.' },
              ],
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------- 17:00 cierre
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Charla con Laura',
      body: '**Laura:** ¿Qué te llevas de hoy con KOB-151?',
      choices: [
        {
          id: 'lesson',
          text: 'Que aclarar la historia antes de desarrollar es lo más barato: lo que preguntamos a tiempo no se convirtió en bug y lo que no, sí. Mañana re-pruebo los fixes.',
          requires: { kind: 'flag', key: 'review.submitted' },
          reply: 'Exacto. Eso es shift-left: la mejor forma de encontrar un bug es evitar que se escriba.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'shift_left' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'blame',
          text: 'He encontrado bugs en el prototipo. Diego debería haber programado mejor.',
          requires: { kind: 'reportsGte', value: 1 },
          reply: 'Ojo: varios de esos bugs nacieron de una historia ambigua que nadie aclaró. La calidad es del equipo, no de Diego.',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Culpaste al desarrollador de bugs que nacieron de requisitos sin aclarar.' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'quiet',
          text: 'Ha sido un día tranquilo, poca cosa.',
          reply: 'Hmm. Repasa el debrief: hoy había más de lo que parece.',
          effects: [{ kind: 'score', key: 'communication', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_refinamiento',
      title: 'Guía de refinamiento para QA',
      updatedLabel: 'Actualizada hace 1 mes por Laura Méndez',
      readCost: 15,
      onRead: [
        { kind: 'unlock', conceptId: 'requirement_defects' },
        { kind: 'unlock', conceptId: 'testable_criteria' },
        { kind: 'unlock', conceptId: 'given_when_then' },
        { kind: 'score', key: 'rigor', add: 1 },
      ],
      body: `## Antes del refinamiento
Lee la historia frase a frase y pregúntate: «¿cómo lo probaría?». Si no sabes qué resultado esperar, hay un defecto en el requisito.

## Checklist
- **Ambigüedad**: palabras vagas («adecuado», «rápido», «los mismos que»).
- **Completitud**: ¿qué pasa si…? (vacíos, máximos, errores, cancelaciones, fechas raras).
- **Contradicciones**: ¿la descripción y los ejemplos dicen lo mismo?
- **Verificabilidad**: ¿hay un umbral objetivo para decidir si pasa o falla?

## Cómo preguntar
- Una duda por punto, citando el texto.
- Propón un ejemplo (Dado / Cuando / Entonces) para que la PO solo tenga que confirmar.
- Las respuestas, siempre escritas en el ticket.`,
    },
    {
      id: 'spec_transferencias',
      title: 'Transferencias · especificación (v1.0)',
      updatedLabel: 'Actualizada ayer por Marta Sanz',
      readCost: 5,
      body: `## Reglas vigentes
- Importe de 0,01 € a 5.000 € por operación, hasta 2 decimales.
- Límite diario acumulado: 6.000 €.
- IBAN español válido (formato y dígitos de control).
- Concepto opcional, máximo 140 caracteres.

## Nota
Actualizada tras la revisión de KOB-142 de ayer. La versión 0.3 queda obsoleta.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-151',
      title: 'Como cliente quiero programar transferencias para que se envíen solas en una fecha futura',
      status: 'En refinamiento',
      type: 'story',
      description: 'Funcionalidad para que el cliente programe pagos entre sus propias cuentas sin tener que acordarse de hacerlos.',
      acceptanceCriteria: [
        'El cliente elige la fecha de ejecución.',
        'Puede elegir la frecuencia: una vez, semanal o mensual.',
        'Se aplican los mismos límites que en una transferencia normal.',
        'La fecha de fin es opcional en las recurrentes y, si se indica, debe ser posterior o igual a la de inicio.',
        'El cliente puede cancelar una transferencia programada.',
        'El sistema debe ser rápido y fácil de usar.',
        'Ejemplo: pagar el alquiler al casero el día 1 de cada mes.',
        'Si no hay saldo suficiente, la transferencia no se ejecuta.',
        'El importe admite hasta 2 decimales.',
        'Se notifica al cliente.',
      ],
      comments: [{ author: 'diego', body: 'Esto son 3 puntos, fácil 💪' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'M1-B1',
      title: 'Se pueden programar transferencias para hoy o para fechas pasadas',
      severity: 'high',
      preventedBy: 'clar.date',
      requiresFlag: 'clar.date',
      disputeReply: 'La historia solo dice «el cliente elige la fecha». ¿Dónde pone que no puede ser hoy? Aclarádmelo con Marta.',
      explanation: 'Sin una regla sobre qué fechas son válidas, Diego no validó el borde inferior: una programación «para ayer» se acepta y nadie sabe cuándo se ejecuta.',
      technique: 'Valores límite con fechas: ayer, hoy, mañana, +365 y +366 días.',
      fix: { delay: 45 },
    },
    {
      id: 'M1-B2',
      title: 'Mensual el día 29–31: se saltan los meses que no tienen ese día',
      severity: 'high',
      preventedBy: 'clar.monthly',
      requiresFlag: 'clar.monthly',
      disputeReply: 'Si el mes no tiene día 31, no hay día 31. ¿Qué esperabas que hiciera? Pregúntaselo a Marta.',
      explanation: 'Nadie definió qué pasa en meses cortos: el prototipo se salta noviembre, y el cliente que paga su alquiler el día 31 ese mes no paga.',
      technique: 'Particiones de fechas: días 29, 30 y 31 frente a meses de 30 días y febrero.',
      fix: { delay: 50 },
    },
    {
      id: 'M1-B3',
      title: 'Se pueden programar importes de más de 5.000 €',
      severity: 'high',
      preventedBy: 'clar.limits',
      requiresFlag: 'clar.limits',
      disputeReply: '«Los mismos límites»: los compruebo el día de la ejecución, como siempre. ¿Dónde pone que sea al programar?',
      explanation: '«Los mismos límites» era ambiguo: Diego los comprueba solo al ejecutar, así que el cliente programa 7.000 € y descubre el rechazo el día del pago.',
      technique: 'Valores límite: 5.000 € y 5.000,01 € también al programar.',
      fix: { delay: 45 },
    },
    {
      id: 'M1-B4',
      title: 'Cancelar una recurrente borra toda la serie sin preguntar',
      severity: 'high',
      preventedBy: 'clar.cancel',
      requiresFlag: 'clar.cancel',
      disputeReply: 'Cancelar es cancelar, ¿no? La historia no dice nada de «solo la próxima».',
      explanation: 'El requisito no distinguía entre cancelar la próxima ejecución o toda la serie: un cliente que solo quería saltarse un mes pierde todos sus pagos programados.',
      technique: 'Flujos alternativos: cancelar una única, la próxima de una recurrente o toda la serie.',
      fix: { delay: 50 },
    },
    {
      id: 'M1-B5',
      title: 'Solo se permiten transferencias programadas a cuentas propias',
      severity: 'high',
      preventedBy: 'clar.destination',
      requiresFlag: 'clar.destination',
      disputeReply: 'La descripción dice «entre sus propias cuentas». Lo he hecho tal cual.',
      explanation: 'La descripción («entre sus propias cuentas») contradecía el ejemplo del alquiler. Diego siguió la descripción y el caso de uso principal quedó bloqueado.',
      technique: 'Revisar contradicciones entre la descripción y los ejemplos.',
      fix: { delay: 45 },
    },
    {
      id: 'M1-B6',
      title: 'Se acepta una fecha de fin anterior a la de inicio',
      severity: 'medium',
      explanation: 'El criterio 4 estaba claro: es un error de implementación. Una buena historia reduce bugs, pero no los elimina; por eso además hay que probar.',
      technique: 'Valores límite entre dos fechas: fin antes, el mismo día y después del inicio.',
      fix: { delay: 40 },
    },
  ],

  concepts: [
    {
      id: 'static_testing',
      title: 'Testing estático',
      summary: 'Revisar requisitos, diseños o código sin ejecutar nada. Encuentra defectos cuando más barato es corregirlos: antes de que existan en el software.',
    },
    {
      id: 'requirement_defects',
      title: 'Defectos en los requisitos',
      summary: 'Ambiguo (varias interpretaciones), incompleto (falta un caso o regla), contradictorio (partes incompatibles) y no verificable (sin forma objetiva de comprobarlo).',
    },
    {
      id: 'testable_criteria',
      title: 'Criterios verificables',
      summary: 'Un criterio es verificable si dos personas probándolo llegarían al mismo veredicto. «Rápido» no lo es; «menos de 2 segundos» sí.',
    },
    {
      id: 'given_when_then',
      title: 'Ejemplos Dado / Cuando / Entonces',
      summary: 'Escribir criterios como ejemplos concretos elimina interpretaciones y deja casos de prueba listos antes de desarrollar.',
    },
    {
      id: 'shift_left',
      title: 'Shift-left y coste de los defectos',
      summary: 'Un defecto encontrado en el requisito cuesta una pregunta; en staging, desarrollo y re-test; en producción, además, clientes afectados. QA entra lo antes posible.',
    },
    {
      id: 'scope_change',
      title: 'Cambios de alcance',
      summary: 'Los cambios a mitad de sprint se registran y se valoran con el equipo; los atajos acaban en funcionalidad sin probar.',
    },
    {
      id: 'boundary_values',
      title: 'Valores límite con fechas',
      summary: 'Ayer, hoy, mañana, el máximo y uno más; fines de semana; meses de 28 a 31 días; fechas relacionadas (fin antes, igual y después del inicio).',
    },
    {
      id: 'confirmation_testing',
      title: 'Re-test (pruebas de confirmación)',
      summary: 'Cuando el dev dice «arreglado», QA lo vuelve a probar en el build nuevo con el mismo caso que falló.',
    },
    {
      id: 'regression',
      title: 'Pruebas de regresión',
      summary: 'Un cambio puede romper lo que ya funcionaba: tras cada fix, repite los casos relacionados que antes pasaban.',
    },
  ],
  debriefConcepts: ['static_testing', 'requirement_defects', 'testable_criteria', 'given_when_then', 'shift_left'],
  seniorTips: [
    'Revisa la historia antes del refinamiento y lleva las dudas escritas, citando el texto.',
    'Busca palabras vagas, casos que faltan y contradicciones entre la descripción y los ejemplos.',
    'Propón ejemplos (Dado / Cuando / Entonces): la PO solo tiene que confirmar.',
    'Consigue las respuestas antes de que empiece el desarrollo y deja que queden en el ticket.',
    'Cuando llegue el prototipo, distingue los bugs de código de los que nacen de requisitos: los segundos se arreglan mejorando el proceso.',
    'Gestiona los cambios de alcance por el proceso, nunca por un atajo.',
  ],
}
