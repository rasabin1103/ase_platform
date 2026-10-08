import type { Mission } from '../../../engine/types'
import { RELEASE_BUG_SLOTS } from '../../../apps/kobalto-release/releaseLogic'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m05Lessons } from './m05-lessons'
import { m05Quiz } from './m05-quiz'
import { m05Risk } from './m05-risk'

/**
 * Curso: Fundamentos de Testing · Misión 5 — Viernes de release.
 * Guion legible: docs/academy/missions/m05-release.md
 *
 * Viernes. La 5.1 se despliega a las 19:00 si a las 16:00 hay GO. La
 * regresión manual dura más de lo que queda de jornada: hay que elegir por
 * riesgo, encontrar los críticos pronto, verificar los fixes y defender una
 * recomendación con datos.
 */
export const m05Release: Mission = {
  id: 'm05-release',
  courseKey: 'testing-fundamentals',
  number: 5,
  title: 'Viernes de release',
  subtitle: 'Regresión basada en riesgos, criterios de salida y recomendación GO/NO-GO.',
  world: kobaltoWorld,
  playerRole: 'QA Junior',
  dayStart: 9 * 60,
  dayLabel: 'Viernes',
  duration: 480,
  appActionCost: 10,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-release',
  reportPriority: true,
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  riskModel: m05Risk,
  lessons: m05Lessons,
  mentor: 'laura',
  quiz: m05Quiz,
  bugSlots: RELEASE_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'Release con criterio',
      body: 'Raúl cuenta en la retro que tu recomendación fue la más clara que ha recibido: qué se probó, qué no y qué riesgo quedaba. La 5.1 sale sin sorpresas.',
    },
    ok: {
      title: 'Viernes superado',
      body: 'La release salió adelante, pero alguna zona de riesgo se quedó sin probar o la recomendación no tenía todos los datos. Revisa el debrief.',
    },
    bad: {
      title: 'Viernes peligroso',
      body: 'Con poco tiempo, probar en orden o sin mirar qué ha cambiado deja los críticos para el lunes. Repite la misión empezando por las notas de la versión.',
    },
  },

  briefing: {
    title: 'Viernes: release 5.1',
    paragraphs: [
      'La versión 5.1 de la app sale hoy a las 19:00 si a las 16:00 el equipo da GO. Trae comisiones nuevas en las transferencias instantáneas, una librería de autenticación actualizada, el fix de la tarjeta en Android y un tramo de interés nuevo.',
      'La regresión manual en TestHub son 22 casos y más de 5 horas. No da tiempo a todo: tendrás que elegir por riesgo, y cada caso consume su tiempo real.',
      'A las 16:00, Raúl (Engineering Manager) y Marta quieren tu recomendación: GO, GO con condiciones o NO-GO. Con datos.',
    ],
    goals: [
      'Lee las notas de la versión y prioriza por riesgo (Diseño → Riesgos).',
      'Ejecuta primero la regresión de las zonas de más riesgo para encontrar los críticos pronto.',
      'Reporta con severidad y prioridad, y verifica los fixes en el build nuevo.',
      'Investiga el test rojo de la integración continua antes de bloquear nada.',
      'Defiende a las 16:00 una recomendación con lo probado, lo no probado y los riesgos.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'design' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Viernes de release 🚀',
      body: '¡Buenos días!\n\nHoy sale la **5.1**. A las 16:00 tenemos el **GO/NO-GO** con Raúl y Marta.\n\nLa regresión manual en TestHub (Staging) son **22 casos y unas 5,5 horas**. No da tiempo a todo, así que:\n- Lee las **notas de la versión** (wiki): qué cambia, qué se arregla y qué dependencias se actualizan.\n- Prioriza en **Diseño → Riesgos**.\n- Ejecuta primero lo más arriesgado: si hay un crítico, cuanto antes lo encontremos, más margen tendrá Diego.\n- Revisa también los **criterios de salida** de la wiki.\n\nLaura',
    },
    {
      id: 'mail_raul',
      channel: 'email',
      from: 'raul',
      at: 0,
      subject: 'GO/NO-GO 5.1 a las 16:00',
      body: 'Hola:\n\nA las 16:00 necesito vuestra recomendación para la 5.1. No necesito que lo hayáis probado todo: necesito saber **qué riesgo asumimos** si sale hoy.\n\nEl banco partner arranca el lunes la campaña de transferencias instantáneas, así que hay presión, pero no a cualquier precio.\n\nRaúl Ortega · Engineering Manager',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Equipo de Pagos',
      body: '**Marta:** La campaña de instantáneas empieza el lunes. La 5.1 tiene que salir hoy sí o sí 🙏\n\n**Diego:** Por mi parte está todo terminado y con tests unitarios.\n\n**Laura:** ¿Cómo vas a organizar la regresión?',
      choices: [
        {
          id: 'risk',
          text: 'Por riesgo: primero lo que cambia y es crítico (instantáneas, autenticación y el fix de tarjetas), después lo que comparte dependencias con lo cambiado. A las 16:00 diré qué está probado, qué no y qué riesgo queda.',
          cost: 10,
          reply: 'Perfecto. Avísame en cuanto veas algo grave, no esperes a las 16:00.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'risk_based' },
            { kind: 'note', tone: 'good', text: 'Organizaste la regresión por riesgo y te comprometiste a informar de lo no probado.' },
          ],
        },
        {
          id: 'in_order',
          text: 'Ejecuto los 22 casos en orden, del TC-01 al TC-22, hasta donde llegue.',
          cost: 10,
          reply: 'Ojo: en orden puede que lo importante quede al final… y sin tiempo.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Planteaste ejecutar la regresión en orden en lugar de por riesgo.' },
          ],
        },
        {
          id: 'sign',
          text: 'Si Diego lo tiene con tests unitarios y es urgente, podemos dar el GO ya.',
          cost: 10,
          reply: 'Los unitarios no prueban la app de punta a punta. Mejor lo vemos a las 16:00 con datos.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Propusiste dar GO sin regresión por la presión de la campaña.' },
          ],
        },
      ],
    },
    {
      id: 'ci_red',
      channel: 'chat',
      from: 'ivan',
      at: 50,
      body: '🔴 La integración continua del build 5.1 tiene **1 test en rojo**: test_export_csv_timeout. ¿Bloqueamos la release?',
      choices: [
        {
          id: 'investigate',
          text: 'Antes de decidir, lo relanzo y miro su histórico en TestHub. Si es inestable, no bloquea, pero abrimos tarea para estabilizarlo.',
          cost: 3,
          reply: '👍 Te dejo el botón de relanzar en TestHub.',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'flaky_tests' },
            { kind: 'flag', key: 'ci.investigate' },
            { kind: 'note', tone: 'good', text: 'Investigaste el test rojo antes de bloquear la release.' },
          ],
        },
        {
          id: 'block',
          text: 'Sí, bloqueamos: rojo es rojo.',
          cost: 2,
          reply: 'Hmm, ese test falla de vez en cuando sin motivo… ¿seguro?',
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'unlock', conceptId: 'flaky_tests' },
            { kind: 'note', tone: 'bad', text: 'Ibas a bloquear la release por un test sin investigar si era inestable.' },
          ],
        },
        {
          id: 'ignore',
          text: 'Ese siempre falla, ignóralo.',
          cost: 1,
          reply: 'Vale… aunque si nadie lo mira, algún día un fallo real pasará desapercibido.',
          effects: [
            { kind: 'unlock', conceptId: 'flaky_tests' },
            { kind: 'note', tone: 'neutral', text: 'Ignoraste el test rojo sin comprobarlo ni pedir que se estabilice.' },
          ],
        },
      ],
    },
    {
      id: 'raul_status',
      channel: 'chat',
      from: 'raul',
      at: 210,
      body: '¿Cómo vamos con la 5.1? ¿Hay algo que me deba preocupar?',
      choices: [
        {
          id: 'data',
          text: 'Te paso el estado: casos ejecutados en las zonas de más riesgo, bugs encontrados con su severidad y prioridad, y lo que me queda por probar antes de las 16:00.',
          cost: 5,
          reply: 'Así da gusto. Si hay algo crítico, prefiero saberlo ahora.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'Diste a Raúl el estado a mediodía con datos.' },
          ],
        },
        {
          id: 'all_good',
          text: 'Todo bien de momento 👍',
          cost: 1,
          reply: '¡Genial!',
          effects: [
            {
              kind: 'if',
              when: { kind: 'bugTriggered', severity: 'critical' },
              then: [
                { kind: 'score', key: 'communication', add: -2 },
                { kind: 'note', tone: 'bad', text: 'Dijiste «todo bien» a mediodía con un crítico ya encontrado: las malas noticias, pronto.' },
              ],
              else: [{ kind: 'note', tone: 'neutral', text: 'Respondiste «todo bien» sin datos: ¿cuánto habías probado?' }],
            },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 270,
      when: { kind: 'reportsLt', value: 1 },
      body: '¿Cómo vas? Pista: en las notas de la versión hay una línea técnica que parece inofensiva: «actualización de la librería de fechas». ¿Qué zonas usan fechas? Y no dejes la autenticación para el final.',
      onDeliver: [{ kind: 'unlock', conceptId: 'regression_selection' }],
    },
    {
      id: 'laura_critical',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'bugReported', severity: 'critical' },
      body: 'Has reportado un crítico 🚨 Avisa a Raúl y Marta ya, no esperes al GO/NO-GO. Cuando Diego suba el fix, verifícalo en el build nuevo cuanto antes.',
      onDeliver: [{ kind: 'unlock', conceptId: 'exit_criteria' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Build nuevo en staging 🔧 Lo que ejecutaste antes está caducado para lo que haya cambiado: re-test del fallo y repite lo cercano (si tocan comisiones, la ordinaria también).',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
      ],
    },
    {
      id: 'go_nogo',
      channel: 'meeting',
      from: 'raul',
      with: ['marta', 'laura'],
      at: 420,
      subject: '16:00 · GO/NO-GO de la 5.1',
      body: '**Raúl:** Vamos al grano. ¿Sale la 5.1 hoy a las 19:00? ¿Cuál es tu recomendación?',
      choices: [
        {
          id: 'go_verified',
          text: 'GO. El crítico que encontramos está corregido y verificado en el build final, y he repetido la regresión de las zonas de más riesgo. Los bugs medios que quedan están documentados como riesgos conocidos, con plan para el próximo sprint.',
          requires: { kind: 'bugVerified', severity: 'critical' },
          cost: 20,
          reply: 'Clarísimo. Sale hoy. Gracias.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'go_nogo' },
            { kind: 'flag', key: 'release.go_safe' },
            { kind: 'note', tone: 'good', text: 'Recomendaste GO con el crítico corregido y verificado, y los riesgos residuales documentados.' },
          ],
        },
        {
          id: 'nogo_critical',
          text: 'NO-GO tal como está: hay un crítico abierto en acceso y sesión, sin fix verificado. Propuesta: sacar hoy la 5.1 sin la actualización de autenticación (volver a la librería anterior) o publicarla el lunes con el fix verificado.',
          requires: { kind: 'all', of: [{ kind: 'bugTriggered', severity: 'critical' }, { kind: 'not', of: { kind: 'bugVerified', severity: 'critical' } }] },
          cost: 20,
          reply: 'Duele, pero es lo correcto. Vamos con la alternativa sin la librería nueva.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'go_nogo' },
            { kind: 'flag', key: 'release.nogo_safe' },
            { kind: 'note', tone: 'good', text: 'Recomendaste NO-GO por un crítico sin verificar y propusiste una alternativa para no bloquear la campaña.' },
          ],
        },
        {
          id: 'go_blind',
          text: 'GO: todo lo que he probado ha pasado o tiene bugs menores.',
          requires: { kind: 'not', of: { kind: 'bugTriggered', severity: 'critical' } },
          cost: 20,
          reply: '¿Y la autenticación? Era la zona con la librería nueva… Bueno, si lo dices tú, sale.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'unlock', conceptId: 'go_nogo' },
            { kind: 'flag', key: 'release.go_blind' },
            { kind: 'note', tone: 'bad', text: 'Diste GO sin haber encontrado el crítico que había en acceso y sesión: el lunes estalla en producción.' },
          ],
        },
        {
          id: 'nogo_time',
          text: 'NO-GO: no me ha dado tiempo a probarlo todo.',
          cost: 20,
          reply: 'Nunca da tiempo a probarlo todo. ¿Qué riesgo concreto ves? Sin eso no puedo decidir.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'unlock', conceptId: 'go_nogo' },
            { kind: 'note', tone: 'bad', text: 'Recomendaste NO-GO sin un riesgo concreto: «no ha dado tiempo» no ayuda a decidir.' },
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
      body: '**Laura:** Semana completa. ¿Qué te llevas de hoy?',
      choices: [
        {
          id: 'lesson',
          text: 'Que con poco tiempo el riesgo decide qué se prueba, que lo que no cambia también puede romperse por una dependencia, y que una recomendación de release se defiende con lo probado, lo no probado y los riesgos que quedan.',
          requires: { kind: 'reportsGte', value: 2 },
          reply: 'Exacto. Esa es la diferencia entre ejecutar casos y hacer de QA.',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'more_time',
          text: 'Que necesitamos más tiempo para probar antes de cada release.',
          reply: 'Siempre querremos más tiempo. La clave es usar bien el que hay.',
          effects: [
            { kind: 'note', tone: 'neutral', text: 'Te quedaste con «más tiempo» en lugar de «priorizar mejor».' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Sinceramente, se me ha hecho bola.',
          reply: 'Los viernes de release se le hacen bola a todo el mundo. La próxima, empezamos por las notas de la versión.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'notas',
      title: 'Notas de la versión 5.1',
      updatedLabel: 'Publicadas ayer por Diego Ruiz',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'risk_based' },
        { kind: 'flag', key: 'notes.read' },
      ],
      body: `## Novedades
- **Transferencias instantáneas**: nuevo motor de comisiones (0,25 € por instantánea, hasta 1.000 €; por encima, se ofrece enviarla como ordinaria). Base de la campaña del lunes.
- **Préstamos**: el TIN del tramo alto baja a **5,75 %** (desde 10.000 €, incluido). Riesgos ha actualizado su tabla de ejemplos.

## Correcciones
- **Tarjetas**: congelar la tarjeta en Android ya bloquea las compras (bug de la beta).

## Cambios técnicos
- Actualizada la **librería de autenticación** (huella, Face ID y gestión de la sesión) a la versión 7.
- Actualizada la **librería de fechas** compartida (cálculo de calendarios y vencimientos).
- Nuevos textos del onboarding.

## Sin cambios
- Cobros (Kobalto Pay), exportación de movimientos y notificaciones.`,
    },
    {
      id: 'criterios',
      title: 'Criterios de salida de una release',
      updatedLabel: 'Acordados por el equipo · v3',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'exit_criteria' },
        { kind: 'flag', key: 'exit.read' },
      ],
      body: `## Para recomendar GO
- **Ningún bug crítico** abierto sin fix verificado en el build final (o la función afectada fuera de la release).
- Los bugs **altos** abiertos tienen un plan acordado con producto.
- Regresión de las zonas de **alto riesgo** ejecutada en el **build final**.
- Fallos de la integración continua **explicados** (fallo real o test inestable).
- **Lo no probado y los riesgos conocidos**, documentados en la recomendación.

## La recomendación
QA recomienda («GO», «GO con condiciones» o «NO-GO hasta…»); decide Raúl con producto. La recomendación incluye qué se probó, qué no, los bugs abiertos y su plan.`,
    },
  ],

  tickets: [
    {
      id: 'REL-5.1',
      title: 'Release 5.1 de la app: regresión y GO/NO-GO',
      status: 'En regresión',
      type: 'story',
      description: 'Despliegue previsto hoy a las 19:00. Regresión manual en TestHub (22 casos). Notas de la versión y criterios de salida en la wiki.',
      acceptanceCriteria: [
        'La regresión de las zonas de alto riesgo está ejecutada en el build final.',
        'No hay bugs críticos abiertos sin fix verificado.',
        'Los fallos de la integración continua están explicados.',
        'La recomendación GO/NO-GO incluye lo probado, lo no probado y los riesgos conocidos.',
      ],
      comments: [
        { author: 'diego', body: 'Todo terminado y con tests unitarios ✅' },
        { author: 'marta', body: 'El lunes arranca la campaña de instantáneas con el banco partner 🙏' },
      ],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'R1',
      title: 'Las transferencias instantáneas cobran 0,50 € en lugar de 0,25 €',
      severity: 'high',
      priority: 'p1',
      priorityWhy: 'el lunes arranca la campaña de instantáneas',
      explanation: 'El motor nuevo suma la comisión antigua y la nueva: cada instantánea cobra el doble.',
      technique: 'Regresión basada en riesgos: la zona con código nuevo que cobra dinero, primero.',
      fix: { delay: 50, regression: 'R-R1', note: 'He corregido el cálculo de comisiones.' },
    },
    {
      id: 'R1b',
      title: 'Una instantánea de más de 1.000 € se envía como ordinaria sin avisar',
      severity: 'high',
      priority: 'p1',
      priorityWhy: 'el lunes arranca la campaña de instantáneas',
      explanation: 'Por encima del límite, el motor cambia a ordinaria pero la app muestra «Instantánea enviada»: el dinero llega días después sin que el cliente lo sepa.',
      technique: 'Riesgo + valores límite: el límite de 1.000 € de la funcionalidad nueva.',
      fix: { delay: 50, regression: 'R-R1', note: 'He corregido la elección de tipo de transferencia en el motor.' },
    },
    {
      id: 'R-R1',
      title: 'Regresión: tras el fix de instantáneas, la transferencia ordinaria cobra 0,25 €',
      severity: 'medium',
      priority: 'p1',
      priorityWhy: 'cobra a todos los clientes una comisión que no existe',
      regression: true,
      explanation: 'El fix aplica la comisión de instantánea a cualquier transferencia SEPA.',
      technique: 'Regresión tras un fix: repetir lo cercano al código cambiado (la ordinaria).',
    },
    {
      id: 'R2',
      title: 'El login con huella falla en Android 15',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'bloquea el acceso de los clientes de Android con huella',
      explanation: 'La librería de autenticación 7 cambia la API biométrica de Android: la huella devuelve «Error de autenticación (-1)».',
      technique: 'Riesgo de una dependencia actualizada: probar cada método de acceso tras actualizar la librería.',
      fix: { delay: 90, note: 'He adaptado la llamada biométrica a la versión 7.' },
    },
    {
      id: 'R2b',
      title: 'La sesión no caduca tras 5 minutos de inactividad',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'riesgo de seguridad: cualquiera con el móvil desbloqueado puede operar',
      explanation: 'La librería 7 desactiva la caducidad si no recibe un parámetro nuevo, y la app no lo envía: la sesión no caduca nunca.',
      technique: 'Riesgo de una dependencia actualizada: probar también lo no funcional (seguridad de la sesión).',
      fix: { delay: 60, note: 'He corregido la configuración de la sesión para la librería 7.' },
    },
    {
      id: 'R3',
      title: 'El nuevo TIN de 5,75 % no se aplica a 10.000 € exactos',
      severity: 'medium',
      priority: 'p2',
      priorityWhy: 'afecta a una franja estrecha; puede ir en un parche la semana que viene si no da tiempo',
      explanation: 'Al cambiar el tipo se reescribió el umbral con «mayor que» 10.000 €.',
      technique: 'Valores límite en un parámetro cambiado: 9.900, 10.000 y la tabla de Riesgos.',
      fix: { delay: 40 },
    },
    {
      id: 'R4',
      title: 'Tras el fix de congelar, descongelar en Android no funciona',
      severity: 'high',
      priority: 'p1',
      priorityWhy: 'los clientes de Android que congelen la tarjeta no podrán volver a pagar',
      explanation: 'El fix de la beta cambió el campo de congelación, pero descongelar en Android sigue usando el antiguo.',
      technique: 'Regresión alrededor de un fix: si se arregla congelar, se prueba descongelar.',
      fix: { delay: 50 },
    },
    {
      id: 'R5',
      title: 'Las programadas mensuales del día 31 se saltan los meses cortos',
      severity: 'medium',
      priority: 'p2',
      priorityWhy: 'afecta a pocas series y la siguiente ejecución es a final de mes',
      explanation: 'La nueva librería de fechas cambia cómo se suma un mes al día 31: noviembre desaparece del calendario.',
      technique: 'Riesgo indirecto: una zona sin cambios que usa una dependencia actualizada.',
      fix: { delay: 60 },
    },
  ],

  concepts: [
    { id: 'risk_based', title: 'Regresión basada en riesgos', summary: 'Con poco tiempo, el riesgo (probabilidad × impacto) decide el orden; la probabilidad la marca lo que ha cambiado.' },
    { id: 'regression_selection', title: 'Qué regresión ejecutar', summary: 'Cambios, fixes, dependencias compartidas e historial de fallos: lo que no cambia también puede romperse.' },
    { id: 'exit_criteria', title: 'Criterios de salida', summary: 'Condiciones acordadas para publicar: críticos con fix verificado, regresión de alto riesgo en el build final y riesgos documentados.' },
    { id: 'go_nogo', title: 'Recomendación GO/NO-GO', summary: 'QA recomienda con datos (probado, no probado, bugs y plan, riesgos residuales); decide el equipo con negocio.' },
    { id: 'flaky_tests', title: 'Tests inestables (flaky)', summary: 'Un test que falla y pasa sin cambios no bloquea, pero se marca y se estabiliza; antes de decidir, se mira el histórico.' },
    { id: 'confirmation_testing', title: 'Re-test (pruebas de confirmación)', summary: 'Verificar el fix en el build nuevo, y cuanto antes: un crítico tardío deja la release sin margen.' },
    { id: 'regression', title: 'Pruebas de regresión', summary: 'Tras cada build nuevo, los resultados anteriores caducan para lo que ha cambiado; repite lo cercano al fix.' },
  ],
  debriefConcepts: ['risk_based', 'regression_selection', 'exit_criteria', 'go_nogo', 'flaky_tests'],
  seniorTips: [
    'Antes de ejecutar nada, lee las notas de la versión y los criterios de salida, y prioriza en la matriz de riesgos.',
    'Empieza por acceso y sesión y por las instantáneas: código nuevo o dependencias que pueden bloquear a todos.',
    'Tras un fix de la beta, prueba lo contrario: si arreglan congelar, prueba descongelar.',
    'La librería de fechas actualizada pone en riesgo las programadas aunque no hayan cambiado.',
    'Relanza el test rojo y mira su histórico antes de bloquear: era inestable.',
    'A las 16:00: qué se probó, qué no, los bugs con su plan y una recomendación clara. Las malas noticias, antes.',
  ],
}
