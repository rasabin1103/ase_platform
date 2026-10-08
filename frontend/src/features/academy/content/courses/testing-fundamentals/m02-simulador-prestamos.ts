import type { Mission } from '../../../engine/types'
import { LOAN_BUG_SLOTS } from '../../../apps/kobalto-loans/loanLogic'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m02Design } from './m02-design'
import { m02Lessons } from './m02-lessons'
import { m02Quiz } from './m02-quiz'
import { m02Risk } from './m02-risk'

/**
 * Curso: Fundamentos de Testing · Misión 2 — El simulador de préstamos.
 * Guion legible: docs/academy/missions/m02-simulador-prestamos.md
 *
 * Miércoles. La historia KOB-163 llega bien escrita, con ejemplos. El reto
 * es otro: muchas variables que interactúan (edad, ingresos, importe,
 * plazo), reglas combinadas, un tramo de interés y un cálculo que solo se
 * puede comprobar con un oráculo (la tabla de ejemplos de Riesgos).
 */
export const m02SimuladorPrestamos: Mission = {
  id: 'm02-simulador-prestamos',
  courseKey: 'testing-fundamentals',
  number: 2,
  title: 'El simulador de préstamos',
  subtitle: 'Particiones y valores límite con varias variables, reglas combinadas y oráculo.',
  world: kobaltoWorld,
  playerRole: 'QA Junior',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles',
  duration: 480,
  appActionCost: 3,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-loans',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  testDesign: m02Design,
  riskModel: m02Risk,
  lessons: m02Lessons,
  mentor: 'laura',
  quiz: m02Quiz,
  bugSlots: LOAN_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'Miércoles de precisión',
      body: 'Carmen, de Riesgos, pide que seas tú quien revise el próximo producto de préstamos. Has demostrado que «probado» significa cubierto, no aleatorio.',
    },
    ok: {
      title: 'Miércoles superado',
      body: 'Has encontrado bugs, pero se escaparon bordes o combinaciones. Revisa el debrief: cada uno tiene una variable y un límite concretos.',
    },
    bad: {
      title: 'Miércoles complicado',
      body: 'Con tantas variables, sin una base válida ni un oráculo es fácil perderse. Repite la misión empezando por el Diseño.',
    },
  },

  briefing: {
    title: 'Miércoles: el simulador de préstamos',
    paragraphs: [
      'Kobalto lanza préstamos personales y el simulador (KOB-163) ya está en staging. Esta vez la historia llega bien escrita y con ejemplos: Marta ha aprendido de lo de ayer.',
      'El reto es otro: edad, ingresos, importe y plazo interactúan entre sí, hay un tramo de interés y una regla que combina edad y plazo. No te dará tiempo a probar todas las combinaciones.',
      'Además, ¿cómo sabes si una cuota está bien calculada? Riesgos ha preparado una tabla de ejemplos validados. A las 16:00, Carmen, de Riesgos, preguntará qué habéis probado.',
    ],
    goals: [
      'Prioriza por riesgo y diseña tus casos: base válida y una variable cada vez.',
      'Prueba los bordes de cada regla y las combinaciones críticas.',
      'Compara los cálculos con el oráculo (tabla de Riesgos).',
      'Reporta y verifica los bugs con el resultado esperado y su fuente.',
      'A las 16:00, explica a Riesgos qué habéis cubierto.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'design' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Miércoles: el simulador de préstamos 🧮',
      body: '¡Buenos días!\n\nHoy probamos el simulador de préstamos (KOB-163). Ya está en staging y la historia viene con ejemplos 😉\n\nEl reto: **muchas variables a la vez**. Mi consejo:\n- Prioriza por riesgo en **Diseño → Riesgos**.\n- Elige una **base válida** y cambia **una variable cada vez**, en sus particiones y bordes.\n- Las reglas que combinan variables (edad + plazo) se prueban en su propio borde.\n- Para saber si una cuota está bien, usa la **tabla de ejemplos de Riesgos** (wiki): es nuestro oráculo.\n\nA las 16:00, Carmen (Riesgos) nos pregunta qué hemos cubierto.\n\nLaura',
    },
    {
      id: 'mail_carmen',
      channel: 'email',
      from: 'carmen',
      at: 0,
      subject: 'Ejemplos validados para KOB-163',
      body: 'Hola:\n\nOs he dejado en la wiki la **tabla de ejemplos calculados por Riesgos**. Cualquier diferencia con el simulador, **aunque sea de un céntimo**, es un problema: lo que mostramos al cliente es una oferta vinculante.\n\nHoy a las 16:00 os pregunto qué habéis probado de las reglas de riesgo.\n\nCarmen López · Riesgos y Compliance',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Equipo de Pagos',
      body: '**Diego:** Anoche lancé un script con 500 combinaciones aleatorias contra el simulador y no falló nada 💪\n\n**Marta:** ¡Genial! ¿Entonces podemos darlo por probado?\n\n**Laura:** ¿Qué opinas?',
      choices: [
        {
          id: 'systematic',
          text: 'Gracias, Diego, es útil. Pero los valores aleatorios casi nunca caen en los bordes (17, 18, 70, 10.000…). Hoy diseño casos en los límites de cada regla y en las combinaciones críticas.',
          cost: 15,
          reply: 'Buen punto. Compártenos luego qué has cubierto.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'random_vs_systematic' },
            { kind: 'note', tone: 'good', text: 'Explicaste por qué 500 casos aleatorios no sustituyen a probar los bordes.' },
          ],
        },
        {
          id: 'trust_script',
          text: 'Si el script no ha fallado, poco más hay que probar.',
          cost: 15,
          reply: '¡Así me gusta! 😎',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Diste por probado el simulador por un script aleatorio sin saber qué cubría.' },
          ],
        },
        {
          id: 'review_script',
          text: 'Pásame el script y miro qué valores cubre antes de decidir qué más probar.',
          cost: 15,
          reply: 'Te lo paso. Spoiler: genera importes entre 1.000 y 30.000 y edades entre 20 y 60.',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'random_vs_systematic' },
            { kind: 'note', tone: 'good', text: 'Revisaste qué cubrían las pruebas automáticas antes de fiarte de ellas (no tocaban ningún borde).' },
          ],
        },
      ],
    },
    {
      id: 'slow_staging',
      channel: 'chat',
      from: 'ivan',
      at: 120,
      probability: 0.5,
      body: '⚠️ Staging va lento hoy (8–10 s por simulación) por una migración de base de datos. Debería volver a la normalidad por la tarde.',
      choices: [
        {
          id: 'risk_note',
          text: 'Lo apunto como riesgo no funcional: cuando acabe la migración mido el tiempo de respuesta para confirmar que no es del simulador.',
          cost: 3,
          reply: '👍 Buena idea, avísame si sigue lento después.',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'non_functional' },
            { kind: 'note', tone: 'good', text: 'Trataste la lentitud como riesgo no funcional y planificaste medirla con el entorno estable.' },
          ],
        },
        {
          id: 'ignore',
          text: 'Vale, sigo con lo mío.',
          cost: 1,
          effects: [{ kind: 'note', tone: 'neutral', text: 'Dejaste pasar la lentitud de staging sin anotarla.' }],
        },
        {
          id: 'bug_now',
          text: 'Abro ya un bug de rendimiento en el simulador.',
          cost: 3,
          reply: 'Es la migración, no el simulador… Comprobadlo primero, porfa.',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'non_functional' },
            { kind: 'note', tone: 'bad', text: 'Ibas a abrir un bug sin aislar la causa (era el entorno).' },
          ],
        },
      ],
    },
    {
      id: 'diego_rounding',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'bugTriggered', bugId: 'L7' },
      body: 'He visto en los logs que andas comparando cuotas. Un céntimo de diferencia no es un bug, ¿no? Es redondeo 🤷',
      choices: [
        {
          id: 'matters',
          text: 'En un banco sí: lo que mostramos es una oferta vinculante y un céntimo por miles de préstamos es dinero. La política dice «redondeo al céntimo»; lo reporto con el ejemplo de Riesgos.',
          cost: 3,
          reply: 'Vale, visto así… Mándamelo y lo miro.',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'test_oracle' },
            { kind: 'unlock', conceptId: 'calculation_testing' },
            { kind: 'note', tone: 'good', text: 'Defendiste con el oráculo que un céntimo en una oferta vinculante es un bug.' },
          ],
        },
        {
          id: 'drop',
          text: 'Tienes razón, lo dejo.',
          cost: 1,
          reply: '👍',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Dejaste pasar un error de cálculo porque «solo era un céntimo».' },
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
      body: '¿Cómo vas? Pista: base válida (35 años, 2.500 €, 6.000 €, 48 meses) y cambia **una sola variable** cada vez, justo en sus bordes. Y compara las cuotas con la tabla de Riesgos.',
      onDeliver: [{ kind: 'unlock', conceptId: 'combinatorial' }],
    },
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'Buen bug 🐞 Recuerda escribir siempre el resultado esperado **y de dónde sale** (política o tabla de Riesgos). Sin oráculo, es tu opinión contra la de Diego.',
      onDeliver: [{ kind: 'unlock', conceptId: 'test_oracle' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Diego ha subido un fix 🔧 Re-test en el build nuevo y, ojo: en cálculos, repite también los ejemplos de Riesgos. Un cambio en el tramo puede descuadrar otra cosa.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
      ],
    },
    {
      id: 'carmen_audit',
      channel: 'meeting',
      from: 'carmen',
      with: ['laura'],
      at: 420,
      subject: '16:00 · Riesgos revisa KOB-163',
      body: '**Carmen:** Antes de dar el visto bueno a KOB-163 necesito saber qué habéis probado de las reglas de riesgo: edad, endeudamiento y edad al terminar el préstamo. ¿Qué me podéis decir?',
      choices: [
        {
          id: 'coverage',
          text: 'Hemos cubierto particiones y límites de cada variable sobre una base válida, el 35 % por ambos lados y la regla de 75 años justo en su borde. Los casos están en el diseño y los bugs, con su ejemplo de referencia, en el tablero.',
          requires: { kind: 'designCoverageGte', value: 0.6 },
          cost: 20,
          reply: 'Así da gusto. Con eso puedo firmar en cuanto estén corregidos los bugs.',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'Explicaste a Riesgos la cobertura con datos: qué reglas, qué bordes y dónde están las evidencias.' },
          ],
        },
        {
          id: 'bugs_only',
          text: 'Hemos encontrado varios bugs, pero no tengo claro qué hemos cubierto exactamente.',
          requires: { kind: 'reportsGte', value: 1 },
          cost: 20,
          reply: 'Encontrar bugs está bien, pero yo necesito saber qué NO ha fallado porque se ha probado. Mandadme la cobertura.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Tenías bugs, pero no una cobertura que enseñar a Riesgos.' }],
        },
        {
          id: 'random',
          text: 'Diego lanzó 500 combinaciones aleatorias y no falló nada.',
          cost: 20,
          reply: '¿Y alguna de esas combinaciones tenía 18 años, 70 años o terminaba justo a los 75? No puedo firmar así.',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'note', tone: 'bad', text: 'Respondiste a Riesgos con pruebas aleatorias en lugar de con cobertura.' },
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
          text: 'Que con muchas variables no se prueba todo: base válida, una variable cada vez en sus bordes, las combinaciones críticas aparte y un oráculo para saber el resultado correcto.',
          requires: { kind: 'designCoverageGte', value: 0.5 },
          reply: 'Exacto. Eso es lo que separa «he probado mucho» de «he probado bien».',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'random',
          text: 'Que hay que probar muchos valores al azar.',
          reply: 'Hmm, repasa el debrief: los bugs estaban en valores muy concretos.',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Te quedaste con «probar mucho» en lugar de «probar bien».' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Sinceramente, no he llegado a mucho.',
          reply: 'Con tantas variables es normal perderse. Mañana empezamos por el diseño juntos.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'tabla_riesgos',
      title: 'Riesgos · Tabla de ejemplos validados (KOB-163)',
      updatedLabel: 'Actualizada ayer por Carmen López',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_oracle' },
        { kind: 'flag', key: 'oracle.read' },
      ],
      body: `## Ejemplos calculados por Riesgos
Cualquier diferencia con el simulador, aunque sea de un céntimo, es un defecto.

- **35 años · 2.500 €/mes · 6.000 € · 48 meses** → TIN 6,95 % · cuota **143,54 €** · total **6.889,92 €** · preaprobado.
- **40 años · 3.000 €/mes · 10.000 € · 60 meses** → TIN 5,95 % · cuota **193,10 €** · total **11.586,00 €** · preaprobado.
- **40 años · 3.000 €/mes · 9.900 € · 60 meses** → TIN 6,95 % · cuota **195,80 €** · total **11.748,00 €** · preaprobado.
- **30 años · 1.200 €/mes · 15.000 € · 36 meses** → TIN 5,95 % · cuota **455,99 €** · ratio 38,0 % · **no preaprobado**.
- **68 años · 4.000 €/mes · 12.000 € · 84 meses** → termina a los 75 · cuota **175,02 €** · preaprobado.
- **70 años · 4.000 €/mes · 12.000 € · 84 meses** → terminaría a los 77 · **no preaprobado**.
- **45 años · 3.000 €/mes · 30.000 € · 84 meses** → TIN 5,95 % · cuota **437,54 €** · total **36.753,36 €** · preaprobado.

## Coherencia
Total a devolver = cuota × número de cuotas. Intereses = total − importe.`,
    },
    {
      id: 'politica',
      title: 'Política de préstamos personales (v2.1)',
      updatedLabel: 'Aprobada por el Comité de Riesgos',
      readCost: 5,
      body: `## Requisitos
- Edad: de **18 a 70 años**, ambos incluidos.
- Ingresos netos mensuales: mínimo **1.000 €**.
- Importe: de **1.000 € a 30.000 €**, en múltiplos de **100 €**.
- Plazo: de **12 a 84 meses**, ambos incluidos.
- Edad al terminar de pagar (edad + plazo en años): como máximo **75 años**.

## Precio
- TIN **6,95 %** por debajo de 10.000 €; **5,95 %** desde 10.000 € (incluido).
- Cuota por sistema francés, **redondeada al céntimo**.

## Decisión
- Preaprobado si la cuota es **como máximo el 35 %** de los ingresos netos.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-163',
      title: 'Como cliente quiero simular un préstamo personal para saber la cuota y si me lo preaprueban',
      status: 'En QA',
      type: 'story',
      description: 'Simulador público de préstamos personales según la Política de préstamos v2.1 (ver wiki). Riesgos ha validado una tabla de ejemplos.',
      acceptanceCriteria: [
        'Dado un solicitante de 18 a 70 años, con ingresos ≥ 1.000 €, importe de 1.000 € a 30.000 € (múltiplos de 100) y plazo de 12 a 84 meses, cuando simula, entonces ve TIN, cuota, total e intereses.',
        'Dado un importe ≥ 10.000 €, entonces el TIN es 5,95 %; si es menor, 6,95 %.',
        'Dada una cuota mayor que el 35 % de los ingresos, entonces el resultado es «No preaprobado».',
        'Dado que edad + plazo en años supera 75, entonces el resultado es «No preaprobado».',
        'La cuota coincide al céntimo con la tabla de ejemplos de Riesgos.',
      ],
      comments: [
        { author: 'marta', body: 'Esta vez con ejemplos y reglas cerradas, como aprendimos el martes 😉' },
        { author: 'diego', body: 'Probado con 500 combinaciones aleatorias, todo verde ✅' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'L1', title: 'Se aceptan solicitantes de 17 años', severity: 'critical', explanation: 'La validación de edad empieza en 17: el banco ofrecería préstamos a menores de edad, un problema legal.', technique: 'Valores límite: 17 y 18 años.', fix: { delay: 40 } },
    { id: 'L1b', title: 'Se rechaza a los solicitantes de exactamente 70 años', severity: 'medium', explanation: 'Se usa «menor que 70» en lugar de «menor o igual»: el valor límite, que es válido, se rechaza.', technique: 'Valores límite: 70 y 71 años.', fix: { delay: 40 } },
    { id: 'L2', title: 'Se aceptan importes que no son múltiplos de 100 €', severity: 'low', explanation: 'Solo se valida el rango, no la regla de los múltiplos de 100 €.', technique: 'Particiones de equivalencia: importes no múltiplos de 100.', fix: { delay: 45 } },
    { id: 'L2b', title: 'Se rechaza el importe máximo de 30.000 €', severity: 'medium', explanation: 'El máximo se compara con «menor que»: 30.000 €, que es válido, se rechaza.', technique: 'Valores límite: 30.000 € y 30.100 €.', fix: { delay: 45 } },
    { id: 'L3', title: 'Se aceptan plazos de 6 meses', severity: 'medium', explanation: 'El plazo mínimo está programado en 6 meses en lugar de 12.', technique: 'Valores límite: 11 y 12 meses.', fix: { delay: 40 } },
    { id: 'L3b', title: 'Se rechaza el plazo máximo de 84 meses', severity: 'medium', explanation: 'El máximo se compara con «menor que»: 84 meses se rechaza.', technique: 'Valores límite: 84 y 85 meses.', fix: { delay: 40 } },
    {
      id: 'L4',
      title: 'A 10.000 € exactos se aplica el TIN alto (6,95 %)',
      severity: 'high',
      explanation: 'El tramo usa «mayor que 10.000» en lugar de «desde 10.000»: el cliente que pide justo 10.000 € paga más de lo publicado.',
      technique: 'Valores límite en el umbral del tramo: 9.900, 10.000 y 10.100 €, comparando el TIN con la política.',
      fix: { delay: 50, regression: 'L-R1', note: 'He reescrito el cálculo del tramo.' },
    },
    {
      id: 'L4b',
      title: 'Desde 9.000 € se aplica el TIN bajo (5,95 %)',
      severity: 'high',
      explanation: 'El umbral del tramo está en 9.000 € en lugar de 10.000 €: el banco cobra menos de lo aprobado en toda esa franja.',
      technique: 'Particiones y límites alrededor del umbral: 9.000–9.999 € frente a 10.000 €.',
      fix: { delay: 50, regression: 'L-R1', note: 'He reescrito el cálculo del tramo.' },
    },
    { id: 'L5', title: 'Se preaprueban cuotas de hasta el 40 % de los ingresos', severity: 'critical', explanation: 'El límite de endeudamiento está programado al 40 % en lugar del 35 %: se conceden préstamos que la política prohíbe.', technique: 'Valores límite en la regla del 35 %: ingresos que dejen el ratio justo por encima (entre 35 % y 40 %).', fix: { delay: 45 } },
    { id: 'L5b', title: 'No se comprueba el límite de endeudamiento', severity: 'critical', explanation: 'La regla del 35 % no se aplica: cualquier cuota se preaprueba.', technique: 'Particiones: un caso con ratio claramente por encima del 35 %.', fix: { delay: 45 } },
    { id: 'L6', title: 'Se preaprueban préstamos que terminan después de los 75 años', severity: 'high', explanation: 'La regla combinada edad + plazo no está implementada; los aleatorios del script nunca la tocaban (edades 20–60).', technique: 'Límite de una regla combinada: 68 + 84 meses (75) frente a 70 + 84 meses (77).', fix: { delay: 50 } },
    { id: 'L7', title: 'La cuota se trunca en lugar de redondearse (1 céntimo menos)', severity: 'medium', explanation: 'La cuota se corta a dos decimales en lugar de redondear: no coincide con la tabla de Riesgos, y la oferta mostrada es vinculante.', technique: 'Oráculo: comparar las cuotas con los ejemplos validados, al céntimo.', fix: { delay: 45 } },
    {
      id: 'L-R1',
      title: 'Regresión: tras el fix del tramo, el total no cuadra con cuota × plazo',
      severity: 'medium',
      regression: true,
      explanation: 'Al reescribir el cálculo del tramo, el total se calcula con la cuota sin redondear: el total ya no es cuota × número de cuotas.',
      technique: 'Regresión con oráculo de coherencia: total = cuota × plazo, comparado con la tabla de Riesgos.',
    },
  ],

  concepts: [
    { id: 'combinatorial', title: 'Varias variables: base válida y combinaciones', summary: 'No se prueban todas las combinaciones: base válida y una variable cada vez en sus bordes; las reglas combinadas, aparte; pairwise si hace falta más.' },
    { id: 'test_oracle', title: 'Oráculo de pruebas', summary: 'La fuente fiable del resultado esperado: política, ejemplos validados, sistema de referencia o coherencia interna. Nunca la propia app bajo prueba.' },
    { id: 'calculation_testing', title: 'Probar cálculos', summary: 'Comparar al céntimo con el oráculo, elegir casos donde el redondeo importa, comprobar la coherencia interna y los cambios de tramo.' },
    { id: 'boundary_values', title: 'Valores límite (también combinados)', summary: 'Justo dentro y justo fuera de cada límite; en reglas que combinan variables, la combinación que cae exactamente en el límite.' },
    { id: 'equivalence', title: 'Particiones de equivalencia', summary: 'Un valor de cada grupo que el sistema debería tratar igual, también los grupos inválidos (no múltiplos, fuera de rango).' },
    { id: 'random_vs_systematic', title: 'Aleatorio frente a sistemático', summary: 'Los datos aleatorios complementan (fuzzing), pero rara vez caen en los bordes. Pregunta siempre qué cubren las pruebas automáticas.' },
    { id: 'non_functional', title: 'Pruebas no funcionales', summary: 'Rendimiento, seguridad o usabilidad también son calidad. Se reportan con datos y con la causa aislada (sistema o entorno).' },
    { id: 'confirmation_testing', title: 'Re-test (pruebas de confirmación)', summary: 'Volver a probar en el build nuevo el caso que falló antes de cerrar.' },
    { id: 'regression', title: 'Pruebas de regresión', summary: 'Tras un fix, repite los casos relacionados que antes pasaban; en cálculos, repite los ejemplos del oráculo.' },
  ],
  debriefConcepts: ['combinatorial', 'boundary_values', 'test_oracle', 'calculation_testing', 'random_vs_systematic'],
  seniorTips: [
    'Antes de nada, prioriza: endeudamiento y edad + plazo son las reglas con más riesgo.',
    'Elige una base válida (35 años, 2.500 €, 6.000 €, 48 meses) y cambia una sola variable cada vez.',
    'En cada regla, prueba justo dentro y justo fuera: 17/18, 70/71, 999/1.000, 30.000/30.100, 11/12, 84/85.',
    'Prueba el umbral del tramo en 9.900, 10.000 y 10.100 € y compara el TIN con la política.',
    'Compara las cuotas con la tabla de Riesgos al céntimo y revisa que total = cuota × plazo.',
    'Pregunta qué cubren las pruebas automáticas antes de fiarte de «500 casos en verde».',
  ],
}
