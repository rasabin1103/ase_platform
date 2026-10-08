import type { Mission } from '../../../engine/types'
import { CARD_BUG_SLOTS } from '../../../apps/kobalto-cards/cardLogic'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m04Lessons } from './m04-lessons'
import { m04Quiz } from './m04-quiz'

/**
 * Curso: Fundamentos de Testing · Misión 4 — Reportar como un profesional.
 * Guion legible: docs/academy/missions/m04-reportar.md
 *
 * Lunes de la segunda semana. La sección «Tarjetas» ha pasado el fin de
 * semana en beta cerrada y Atención al cliente trae quejas vagas. Hay que
 * reproducirlas en el laboratorio de dispositivos, aislar la condición,
 * reportarlas para que Diego las reproduzca a la primera y separar
 * severidad de prioridad en el triaje.
 */
export const m04Reportar: Mission = {
  id: 'm04-reportar',
  courseKey: 'testing-fundamentals',
  number: 4,
  title: 'Reportar como un profesional',
  subtitle: 'Bug reports reproducibles, aislamiento de condiciones, severidad frente a prioridad y triaje.',
  world: kobaltoWorld,
  playerRole: 'QA Junior',
  dayStart: 9 * 60,
  dayLabel: 'Lunes',
  duration: 480,
  appActionCost: 3,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-cards',
  reportPriority: true,
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  lessons: m04Lessons,
  mentor: 'laura',
  quiz: m04Quiz,
  bugSlots: CARD_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'Reports que se arreglan solos',
      body: 'Diego dice en la retro que tus reports se reproducen a la primera. Marta te invita a los próximos triajes.',
    },
    ok: {
      title: 'Lunes superado',
      body: 'Has encontrado los fallos, pero algunos reports necesitaron idas y vueltas o la prioridad no encajó. Revisa la tabla de calidad del debrief.',
    },
    bad: {
      title: 'Lunes de idas y vueltas',
      body: 'Un bug que el desarrollador no reproduce no se arregla. Repite la misión aislando la condición antes de reportar.',
    },
  },

  briefing: {
    title: 'Lunes: reportar como un profesional',
    paragraphs: [
      'La nueva sección «Tarjetas» de la app (KOB-180) ha estado el fin de semana en beta cerrada con 200 clientes. Nuria, de Atención al cliente, llega con sus quejas: vagas, mezcladas y alguna que quizá ni sea un bug.',
      'Tienes un laboratorio de dispositivos en staging: puedes cambiar de móvil, de idioma y de cuenta de pruebas. Los fallos solo aparecen en ciertas condiciones; tu trabajo es encontrar cuál.',
      'Diego devuelve los reports que no reproduce. Y a las 12:00 hay triaje con Marta: severidad no es lo mismo que prioridad.',
    ],
    goals: [
      'Reproduce las quejas de los clientes en el laboratorio de dispositivos.',
      'Aísla la condición exacta: cambia una cosa cada vez.',
      'Escribe reports que se reproduzcan a la primera, con entorno, evidencia, severidad y prioridad.',
      'Distingue lo que no es un bug y ayuda a Atención al cliente.',
      'Defiende en el triaje un orden basado en daño, alcance y fechas de negocio.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Lunes: reportar como un profesional 📝',
      body: '¡Buenos días!\n\nEsta semana empieza con la beta de **Tarjetas** (KOB-180). Nuria nos manda las quejas del fin de semana.\n\nHoy lo importante es **cómo reportas**:\n- Reproduce cada queja en el **laboratorio de dispositivos** (móvil, idioma y cuenta de pruebas).\n- **Aísla** la condición: cambia una sola cosa cada vez.\n- Report con **entorno**, pasos mínimos, esperado con su fuente, evidencia, **severidad** y **prioridad**.\n- La **guía de bug reports** está en la wiki.\n\nDiego devolverá lo que no reproduzca. Si pasa, complétalo y reenvíalo.\n\nLaura',
    },
    {
      id: 'mail_nuria',
      channel: 'email',
      from: 'nuria',
      at: 0,
      subject: 'Quejas de la beta de Tarjetas (fin de semana)',
      body: 'Hola, equipo:\n\nOs paso lo que nos ha llegado de la beta, tal cual lo cuentan los clientes:\n\n1. «Congelé la tarjeta porque no la encontraba y luego me llegó un cargo igual.» Usa **Android**. Dice que **ya la había congelado y descongelado** antes ese día.\n2. «He puesto el límite en 1,000 y ahora no me deja pagar nada.» Tiene la app **en inglés** y una **cuenta Joven**.\n3. «He exportado septiembre y me falta la compra del cine del día 30.»\n4. «Me habéis cobrado dos veces en Mercadona el 2 de septiembre.»\n5. Una **empresa** dice que al exportar «el histórico» la app «peta».\n\n¿Me decís qué es bug y qué le respondo a cada uno?\n\nNuria · Atención al cliente',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Equipo de Pagos',
      body: '**Diego:** Una petición: el viernes me llegaron tres reports del tipo «no funciona» y perdí la tarde intentando reproducirlos. Por favor, que se puedan reproducir a la primera 🙏\n\n**Laura:** ¿Cómo lo vas a hacer hoy?',
      choices: [
        {
          id: 'quality',
          text: 'Antes de reportar aíslo la condición. Cada report llevará entorno (dispositivo, idioma, cuenta), pasos mínimos con datos, esperado con su fuente y solo la evidencia que muestra el fallo.',
          cost: 10,
          reply: 'Así da gusto. Gracias 🙌',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'bug_report' },
            { kind: 'note', tone: 'good', text: 'Te comprometiste con reports reproducibles: entorno, pasos mínimos, esperado y evidencia.' },
          ],
        },
        {
          id: 'fast',
          text: 'Reporto rápido lo que me pase Nuria y, si Diego necesita algo, lo completo después.',
          cost: 10,
          reply: 'Eso es justo lo que me hizo perder el viernes…',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Planteaste reportar primero y completar después: el tiempo se pierde igual, solo que en el desarrollador.' },
          ],
        },
        {
          id: 'blame',
          text: 'Si no los reproduces, igual es que no miras bien.',
          cost: 10,
          reply: 'Vamos a dejarlo aquí… Laura, luego hablamos.',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'communication', add: -2 },
            { kind: 'metric', key: 'trust_diego', add: -2 },
            { kind: 'note', tone: 'bad', text: 'Culpaste al desarrollador en lugar de mejorar la información del report.' },
          ],
        },
      ],
    },
    {
      id: 'marta_typo',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'bugTriggered', bugId: 'C4' },
      body: 'He visto tu captura de la pantalla de la tarjeta 😱 «Conjelar». **Mañana grabamos el anuncio de la campaña con esa pantalla.** ¿Qué severidad y prioridad le pones?',
      choices: [
        {
          id: 'low_p1',
          text: 'Severidad baja: no rompe nada. Pero prioridad P1: hay que arreglarlo hoy, antes de la grabación.',
          cost: 3,
          reply: '¡Perfecto! Lo hablo con Diego para que entre hoy.',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'good', text: 'Separaste severidad (baja) y prioridad (P1) en la errata del anuncio.' },
          ],
        },
        {
          id: 'critical',
          text: 'La marco como crítica para que la arreglen ya.',
          cost: 3,
          reply: 'Hmm… Laura dice que si una errata es crítica, ¿qué es una tarjeta que no se congela?',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'bad', text: 'Inflaste la severidad de una errata para conseguir prioridad.' },
          ],
        },
        {
          id: 'backlog',
          text: 'Es una errata, severidad baja: al backlog.',
          cost: 3,
          reply: '¿Al backlog? ¡Mañana sale en un anuncio!',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'bad', text: 'Confundiste severidad baja con prioridad baja.' },
          ],
        },
      ],
    },
    {
      id: 'triage',
      channel: 'meeting',
      from: 'marta',
      with: ['diego', 'laura'],
      at: 180,
      subject: '12:00 · Triaje de la beta de Tarjetas',
      body: '**Marta:** Diego tiene esta semana para arreglar lo de la beta y no le da para todo. Tenemos: la tarjeta que no se congela del todo, el límite mensual raro, el CSV al que le falta un día, la exportación de empresa que falla y la errata de la pantalla que sale mañana en el anuncio.\n\n**Diego:** ¿Por dónde empiezo?',
      choices: [
        {
          id: 'risk_business',
          text: 'Primero la congelación: es dinero y seguridad del cliente. Luego la errata, porque mañana se graba el anuncio. Después el límite, que bloquea pagos. El CSV y la exportación de empresa (3 clientes, pueden exportar por años) pueden ir al siguiente sprint.',
          cost: 30,
          reply: 'Me gusta: daño, alcance, alternativa y fechas. Así lo planificamos.',
          replyFrom: 'marta',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'triage' },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'good', text: 'En el triaje ordenaste por daño, alcance, alternativa y fechas de negocio.' },
          ],
        },
        {
          id: 'by_severity',
          text: 'Por severidad: primero los críticos, luego los altos, los medios y al final los bajos.',
          cost: 30,
          reply: '¿Y la errata del anuncio de mañana se queda la última? La severidad no lo es todo.',
          replyFrom: 'marta',
          effects: [
            { kind: 'unlock', conceptId: 'triage' },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'neutral', text: 'Ordenaste solo por severidad y olvidaste las fechas de negocio.' },
          ],
        },
        {
          id: 'fifo',
          text: 'En el orden en que llegaron las quejas.',
          cost: 30,
          reply: 'Entonces la tarjeta que no se congela espera detrás del CSV… No.',
          replyFrom: 'marta',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'unlock', conceptId: 'triage' },
            { kind: 'note', tone: 'bad', text: 'Propusiste arreglar por orden de llegada, sin mirar el daño.' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 300,
      when: { kind: 'reportsLt', value: 2 },
      body: '¿Cómo vas? Pista: las quejas mezclan condiciones (Android **y** dos congelaciones; inglés **y** cuenta Joven). Cambia **una sola** en el laboratorio y mira cuándo aparece el fallo. Esa condición va en el título.',
      onDeliver: [{ kind: 'unlock', conceptId: 'isolation' }],
    },
    {
      id: 'laura_first_report',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'Un truco antes de enviar: léelo como si fueras Diego, sin haber visto nada. ¿Podrías reproducirlo sin preguntar? Si te lo devuelve, **complétalo** desde el propio report: no abras otro.',
      onDeliver: [{ kind: 'unlock', conceptId: 'environment' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Hay fix en staging 🔧 Verifícalo **en el mismo entorno** en que fallaba (mismo móvil, idioma y cuenta) y prueba también lo contrario de lo que se arregló: si arreglaron congelar, prueba descongelar.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
      ],
    },
    {
      id: 'nuria_followup',
      channel: 'chat',
      from: 'nuria',
      at: 390,
      body: 'Una cosa: el cliente de Mercadona vuelve a llamar. ¿Qué le digo? ¿Le hemos cobrado dos veces?',
      choices: [
        {
          id: 'explain',
          text: 'No: uno de los dos es una retención temporal que se liberó el 5 de septiembre; solo hay un cargo de 52,87 €. Te paso un texto para el cliente. Y propongo una mejora: que la app explique mejor las retenciones.',
          cost: 5,
          reply: '¡Genial, gracias! Así se lo explico.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'not_a_bug' },
            { kind: 'note', tone: 'good', text: 'Identificaste que el «doble cobro» era una retención (no un bug) y propusiste una mejora.' },
          ],
        },
        {
          id: 'open_bug',
          text: 'Abro un bug crítico de doble cobro para que lo miren.',
          cost: 3,
          reply: 'Vale… ¿lo has comprobado?',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'not_a_bug' },
            { kind: 'note', tone: 'bad', text: 'Ibas a reportar como bug una retención que funciona según la especificación.' },
          ],
        },
        {
          id: 'dunno',
          text: 'No lo he mirado todavía.',
          cost: 1,
          reply: 'Vale, cuando puedas me dices.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Dejaste sin respuesta la queja del doble cobro.' }],
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
          text: 'Que un bug que no se reproduce no se arregla: hay que aislar la condición, dar el entorno y la evidencia justa. Y que la severidad es el daño y la prioridad, cuándo arreglarlo.',
          requires: { kind: 'reportsGte', value: 2 },
          reply: 'Exacto. Eso es reportar como un profesional.',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'speed',
          text: 'Que hay que reportar rápido para que el dev tenga trabajo.',
          reply: 'Rápido sí, pero completo: un report devuelto es más lento que uno bien hecho.',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Te quedaste con «reportar rápido» en lugar de «reportar bien».' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Sinceramente, no he llegado a mucho.',
          reply: 'Mañana repasamos juntas un par de reports: se aprende rápido.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia',
      title: 'Guía de bug reports del equipo de Pagos',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'bug_report' },
        { kind: 'unlock', conceptId: 'severity_priority' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Un report se reproduce sin preguntar
- **Título**: qué falla + dónde + en qué condición.
- **Entorno**: dispositivo y sistema, idioma de la app, tipo de cuenta, build.
- **Pasos mínimos**, uno por línea, con los datos exactos.
- **Esperado** (y su fuente: wiki, criterio) y **obtenido**.
- **Evidencia**: la ejecución o la captura que lo muestra. Solo esa.
- Un report, un bug.

## Severidad (cuánto daño hace)
- **Crítica**: dinero, seguridad o datos de clientes en riesgo; o una función principal inutilizable sin alternativa.
- **Alta**: una función importante falla o hay un error del sistema, aunque haya alternativa.
- **Media**: resultado incorrecto con impacto limitado o con alternativa sencilla.
- **Baja**: estética, textos, molestias menores.

## Prioridad (cuándo se arregla; se decide en el triaje)
- **P1 · Urgente**: hoy o antes del próximo hito comprometido.
- **P2 · Alta**: en este sprint.
- **P3 · Media**: en el próximo sprint.
- **P4 · Baja**: backlog.

La prioridad tiene en cuenta el daño, a cuántos clientes afecta, si hay alternativa y las fechas de negocio.`,
    },
    {
      id: 'tarjetas',
      title: 'Tarjetas · Funcionamiento (beta)',
      updatedLabel: 'Actualizado el viernes por Marta Sanz',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'spec.read' }],
      body: `## Congelar
- Al congelar, **todas las compras se rechazan** hasta descongelar. Funciona igual en iOS, Android y web, y se puede congelar y descongelar cuantas veces se quiera.

## Límite mensual
- Cuentas Personal y Empresa: de **100 € a 6.000 €**. Cuenta Joven: de **100 € a 500 €**.
- Euros enteros. Se acepta el separador de miles del idioma de la app: «1.000» en español, «1,000» en inglés.

## Movimientos y exportación
- El CSV incluye los movimientos **desde y hasta las fechas indicadas, ambas incluidas**. Rango máximo: 24 meses.
- Las **retenciones** (preautorizaciones de gasolineras, hoteles o supermercados) aparecen tachadas y se liberan en unos días: **no son un cargo**.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-180',
      title: 'Como cliente quiero gestionar mi tarjeta desde la app: congelarla, fijar un límite y exportar mis movimientos',
      status: 'En beta',
      type: 'story',
      description: 'Sección «Tarjetas» de la app 5.0, en beta cerrada con 200 clientes desde el viernes. Funcionamiento en la wiki.',
      acceptanceCriteria: [
        'Dada una tarjeta congelada, cuando se intenta una compra, entonces se rechaza (en cualquier dispositivo y tantas veces como se congele).',
        'Dado un límite mensual dentro del rango de la cuenta, escrito con el formato del idioma de la app, entonces se guarda ese importe.',
        'Dado un rango de fechas de hasta 24 meses, cuando exporto, entonces el CSV incluye los movimientos de ambos extremos.',
        'Los textos de la pantalla de la tarjeta no tienen erratas (se usan en la campaña).',
      ],
      comments: [
        { author: 'marta', body: 'El martes grabamos el anuncio de la campaña con la pantalla de la tarjeta 🎬' },
        { author: 'diego', body: 'Probado en mi iPhone en español, todo OK.' },
      ],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'C1',
      title: 'En Android, congelar la tarjeta no bloquea las compras',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'el cliente cree que su tarjeta está bloqueada y no lo está: riesgo de fraude',
      explanation: 'La app de Android envía un campo antiguo («blocked») que el servidor ignora: la app muestra «Congelada», pero la tarjeta sigue activa.',
      technique: 'Aislamiento: el mismo flujo en iPhone y en Android; solo cambia el dispositivo.',
      repro: { groups: [['android', 'pixel']], ask: 'En mi iPhone congelo, pago y se rechaza bien. ¿En qué dispositivo te pasa?' },
      fix: { delay: 45, regression: 'C-R1', note: 'He cambiado la app de Android para usar el campo nuevo.' },
    },
    {
      id: 'C1b',
      title: 'Al congelar la tarjeta por segunda vez, las compras no se bloquean',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'el cliente cree que su tarjeta está bloqueada y no lo está: riesgo de fraude',
      explanation: 'Tras congelar y descongelar una vez, la siguiente congelación no llega al servidor: la app muestra «Congelada» y las compras pasan.',
      technique: 'Aislamiento por secuencia: congelar una vez frente a congelar, descongelar y volver a congelar.',
      repro: {
        groups: [['segunda', 'dos veces', '2 veces', 'otra vez', 'de nuevo', 'volver a congelar', 'vuelvo a congelar', 'descongel', 'recongel']],
        ask: 'Yo congelo, pago y se rechaza bien. ¿Qué hiciste antes de congelarla?',
      },
      fix: { delay: 45, regression: 'C-R1', note: 'He corregido el estado que guardaba la app tras descongelar.' },
    },
    {
      id: 'C2',
      title: 'Con la app en inglés, el límite «1,000» se guarda como 1 €',
      severity: 'high',
      priority: 'p2',
      priorityWhy: 'bloquea los pagos de quien usa la app en inglés; se arregla en este sprint',
      explanation: 'El servidor interpreta el importe siempre con formato español: en inglés la coma de miles se toma como decimal y el límite queda en 1 €.',
      technique: 'Aislamiento por idioma: el mismo importe en español y en inglés, con y sin separador de miles.',
      repro: { groups: [['ingles', 'english', 'idioma en', 'language', '· en ']], ask: 'Yo guardo 1.000 y se queda en 1.000 €. ¿Qué idioma tenía la app y cómo escribiste el importe?' },
      fix: { delay: 40 },
    },
    {
      id: 'C2b',
      title: 'La cuenta Joven acepta límites mensuales de más de 500 €',
      severity: 'high',
      priority: 'p2',
      priorityWhy: 'incumple la política de cuentas Joven; se arregla en este sprint',
      explanation: 'La validación usa el rango de la cuenta Personal (hasta 6.000 €) para todas las cuentas.',
      technique: 'Aislamiento por tipo de cuenta y valor límite: 500 y 501 € en la cuenta Joven.',
      repro: { groups: [['joven']], ask: 'Con mi cuenta de pruebas no pasa de 6.000, que es lo correcto. ¿Con qué tipo de cuenta te pasa?' },
      fix: { delay: 40 },
    },
    {
      id: 'C3',
      title: 'El CSV de movimientos no incluye el último día del rango',
      severity: 'medium',
      priority: 'p3',
      priorityWhy: 'hay alternativa (exportar un día más); se arregla en el próximo sprint',
      explanation: 'El filtro usa «menor que» la fecha final en lugar de «menor o igual»: los movimientos de ese día no salen.',
      technique: 'Valor límite con datos: un movimiento justo en la fecha final del rango.',
      repro: {
        groups: [['ultimo dia', 'dia final', 'fecha final', 'fecha fin', 'fecha de fin', 'hasta', 'incluid', 'dia 30', '30/09', '-30']],
        ask: 'Exporto septiembre y me salen todos. ¿Qué rango exacto usaste y qué movimiento falta?',
      },
      fix: { delay: 35 },
    },
    {
      id: 'C4',
      title: 'Errata en la pantalla de la tarjeta: «Conjelar tarjeta»',
      severity: 'low',
      priority: 'p1',
      priorityWhy: 'mañana se graba el anuncio con esa pantalla',
      explanation: 'Errata en el texto del botón en español. No rompe nada, pero sale en la campaña.',
      technique: 'Revisión visual con evidencia: captura de la pantalla en el idioma afectado.',
      fix: { delay: 20 },
    },
    {
      id: 'C5',
      title: 'Exportar más de un año en una cuenta Empresa da error 500',
      severity: 'high',
      priority: 'p3',
      priorityWhy: 'solo 3 empresas en la beta y pueden exportar año a año; próximo sprint',
      explanation: 'La consulta de cuentas con muchos movimientos supera el tiempo máximo cuando el rango pasa de un año.',
      technique: 'Aislamiento por tipo de cuenta y tamaño del rango (12 frente a 13 meses).',
      repro: { groups: [['empresa']], ask: 'Exporto un año y medio y funciona. ¿Con qué cuenta te pasa?' },
      fix: { delay: 50 },
    },
    {
      id: 'C-R1',
      title: 'Regresión: tras el fix de congelar, en Android no se puede descongelar',
      severity: 'high',
      priority: 'p1',
      priorityWhy: 'los clientes de Android se quedan sin poder pagar',
      regression: true,
      explanation: 'Al cambiar el campo de congelación, la descongelación en Android sigue usando el antiguo: la app muestra «Activa» y las compras se rechazan.',
      technique: 'Regresión: tras arreglar congelar, probar también descongelar en el mismo entorno.',
      repro: { groups: [['android', 'pixel']], ask: 'En mi iPhone descongelo y pago sin problema. ¿En qué dispositivo?' },
    },
  ],

  concepts: [
    { id: 'bug_report', title: 'Bug report reproducible', summary: 'Título con la condición, entorno, pasos mínimos con datos, esperado con su fuente, obtenido y solo la evidencia que muestra el fallo.' },
    { id: 'isolation', title: 'Aislar la condición', summary: 'Cambiar una sola condición cada vez (dispositivo, idioma, cuenta, secuencia, datos) hasta saber cuál enciende y apaga el fallo.' },
    { id: 'environment', title: 'Entorno', summary: 'La mayoría de los «no lo reproduzco» son diferencias de entorno o de datos: anótalo siempre.' },
    { id: 'severity_priority', title: 'Severidad frente a prioridad', summary: 'Severidad es el daño; prioridad, cuándo se arregla. Una errata puede ser P1 y un error 500 puede esperar.' },
    { id: 'triage', title: 'Triaje', summary: 'Ordenar los bugs por daño, alcance, alternativa y fechas de negocio, con producto y desarrollo.' },
    { id: 'not_a_bug', title: 'No todo es un bug', summary: 'Antes de reportar, compara con la especificación; si funciona como está definido, explícalo y, si confunde, propón una mejora.' },
    { id: 'confirmation_testing', title: 'Re-test (pruebas de confirmación)', summary: 'Verificar el fix en el mismo entorno en el que fallaba.' },
    { id: 'regression', title: 'Pruebas de regresión', summary: 'Tras un fix, probar lo relacionado: si se arregla congelar, probar descongelar.' },
  ],
  debriefConcepts: ['bug_report', 'isolation', 'severity_priority', 'triage', 'not_a_bug'],
  seniorTips: [
    'Lee la guía de reports y el funcionamiento de Tarjetas antes de abrir el laboratorio: son tus oráculos.',
    'Con cada queja, separa las condiciones que menciona el cliente y prueba una cada vez hasta saber cuál dispara el fallo.',
    'Pon la condición en el título: «En Android, congelar no bloquea las compras».',
    'La errata del anuncio es severidad baja y prioridad P1; la exportación de empresa, severidad alta y prioridad P3.',
    'El «doble cobro» de Mercadona es una retención liberada: no es un bug; ayuda a Nuria con la respuesta.',
    'Si Diego te devuelve un report, complétalo desde el mismo report con lo que pide, sin discutir.',
  ],
}
