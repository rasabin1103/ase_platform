import type { Mission } from '../../../engine/types'
import { PYRAMID_BUG_SLOTS } from '../../../apps/kobalto-pyramid/pyramidLogic'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m06Lessons } from './m06-lessons'
import { m06Quiz } from './m06-quiz'

/**
 * Curso: Fundamentos de Testing · Misión 6 — La pirámide.
 * Guion legible: docs/academy/missions/m06-piramide.md
 *
 * Martes. KOB-190 «Dividir un gasto» empieza el sprint y QA define dónde
 * vive cada prueba. El nivel elegido decide el coste, la velocidad de la
 * suite y qué bugs se pueden ver.
 */
export const m06Piramide: Mission = {
  id: 'm06-piramide',
  courseKey: 'testing-fundamentals',
  number: 6,
  title: 'La pirámide',
  subtitle: 'Niveles y tipos de prueba: unitarias, API, E2E, manuales y no funcionales.',
  world: kobaltoWorld,
  playerRole: 'QA Junior',
  dayStart: 9 * 60,
  dayLabel: 'Martes',
  duration: 480,
  appActionCost: 10,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-pyramid',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  lessons: m06Lessons,
  mentor: 'laura',
  quiz: m06Quiz,
  bugSlots: PYRAMID_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'Una pirámide que aguanta',
      body: 'Tu plan para KOB-190 se convierte en la plantilla del equipo: suite en minutos, seguridad probada donde vive y el rendimiento con su propia prueba.',
    },
    ok: {
      title: 'Martes superado',
      body: 'El plan funciona, pero alguna comprobación vive en un nivel que no puede verla o que la hace lenta. Revisa el debrief.',
    },
    bad: {
      title: 'Cono de helado',
      body: 'Probar todo por la interfaz parece seguro, pero es lento, frágil y ciego a la seguridad y al rendimiento. Repite la misión empezando por la base.',
    },
  },

  briefing: {
    title: 'Martes: la pirámide',
    paragraphs: [
      'Empieza el sprint de KOB-190 «Dividir un gasto»: desde un movimiento, el cliente reparte el importe entre amigos y les envía una solicitud de pago.',
      'Hoy no se trata de probar a mano: Laura quiere que definas **dónde vive cada prueba**. En el planificador hay 16 comprobaciones; para cada una eliges el nivel (unitaria, API, E2E, manual o rendimiento) y la escribes.',
      'Cada nivel cuesta un tiempo distinto y ve cosas distintas: un mock no ve un fallo de contrato y un E2E con 3 amigos no ve el rendimiento con 20. A las 16:00 presentas la estrategia.',
    ],
    goals: [
      'Coloca cada comprobación en el nivel más bajo que pueda verla.',
      'Prueba la seguridad donde vive (la API), no donde se esconde (la interfaz).',
      'Da al rendimiento y al tiempo (recordatorios) su propia prueba.',
      'Reporta los bugs que encuentren tus pruebas.',
      'Envía el plan a Laura y defiende la estrategia a las 16:00.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Martes: ¿dónde vive cada prueba? 🔺',
      body: '¡Buenos días!\n\nEsta semana el equipo quiere automatizar más, y KOB-190 «Dividir un gasto» es la oportunidad de hacerlo bien.\n\nEn el **planificador de pruebas** (Staging) tienes 16 comprobaciones. Para cada una:\n- Elige el **nivel**: unitaria, API, E2E, manual o rendimiento.\n- **Escríbela** (o ejecútala si es manual): cada nivel cuesta un tiempo distinto.\n- Las pruebas encuentran bugs de verdad si están en el nivel que puede verlos.\n\nCuando lo tengas, **envíame el plan**. Tienes la arquitectura en la wiki.\n\nLaura',
    },
    {
      id: 'mail_diego',
      channel: 'email',
      from: 'diego',
      at: 0,
      subject: 'KOB-190: arquitectura y lo que ya hay',
      body: 'Hola:\n\nOs he dejado la arquitectura en la wiki. Resumen: la lógica de reparto está en un módulo aparte (`splitCalculator`), la API en `/splits` y la app consume la API.\n\nMis tests unitarios solo cubren el caso feliz (dividir 9 € entre 3), lo reconozco 😅\n\nDiego',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'sergio'],
      at: 30,
      subject: 'Daily · con Sergio (QA Automation)',
      body: '**Sergio:** En Tarjetas lo automatizamos todo con E2E por la interfaz: así probamos como el usuario. Os recomiendo lo mismo.\n\n**Diego:** Nuestra suite E2E ya tarda 25 minutos…\n\n**Laura:** ¿Tú qué propones para KOB-190?',
      choices: [
        {
          id: 'pyramid',
          text: 'Cada prueba en el nivel más bajo que pueda verla: la lógica del reparto en unitarias, permisos y contrato en la API, solo los recorridos críticos en E2E, y rendimiento y usabilidad con pruebas propias.',
          cost: 15,
          reply: 'Eso es una pirámide. Me gusta.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'test_pyramid' },
            { kind: 'note', tone: 'good', text: 'Propusiste repartir las pruebas por niveles en lugar de automatizarlo todo por la interfaz.' },
          ],
        },
        {
          id: 'all_e2e',
          text: 'Sergio tiene razón: si lo probamos todo por la interfaz, probamos como el usuario.',
          cost: 15,
          reply: '¡Eso! 💪',
          replyFrom: 'sergio',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'test_pyramid' },
            { kind: 'note', tone: 'bad', text: 'Apoyaste automatizarlo todo por la interfaz: lento, frágil y ciego a lo que la interfaz esconde.' },
          ],
        },
        {
          id: 'manual',
          text: 'Para una funcionalidad nueva, mejor probar a mano y automatizar más adelante.',
          cost: 15,
          reply: 'Lo nuevo también se puede automatizar desde el principio, sobre todo la lógica…',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'note', tone: 'neutral', text: 'Propusiste dejar la automatización para más adelante.' },
          ],
        },
      ],
    },
    {
      id: 'ivan_suite',
      channel: 'chat',
      from: 'ivan',
      at: 90,
      body: 'Dato para vuestro plan: la suite E2E de Tarjetas tarda **50 minutos** y falla 1 de cada 5 ejecuciones sin motivo. Los devs ya fusionan sin esperarla 🙃',
      onDeliver: [{ kind: 'unlock', conceptId: 'test_pyramid' }],
    },
    {
      id: 'marta_security',
      channel: 'chat',
      from: 'marta',
      at: 180,
      body: 'Compliance pregunta por KOB-190: ¿puede alguien **cancelar el reparto de otra persona** o **ver los repartos de otro**? ¿Cómo lo vais a comprobar?',
      choices: [
        {
          id: 'api',
          text: 'Contra la API, con el token de otro usuario: la app no muestra esos botones, pero la regla tiene que estar en el servidor.',
          cost: 3,
          reply: 'Perfecto, así se lo cuento.',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'unlock', conceptId: 'test_levels' },
            { kind: 'note', tone: 'good', text: 'Planteaste probar la seguridad en la API, donde vive la regla.' },
          ],
        },
        {
          id: 'ui',
          text: 'La app no enseña esos botones en repartos ajenos, así que no se puede.',
          cost: 2,
          reply: '¿Y si alguien llama a la API directamente? Compliance va a preguntar eso.',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'unlock', conceptId: 'test_levels' },
            { kind: 'note', tone: 'bad', text: 'Diste por segura una regla porque la interfaz esconde el botón.' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 300,
      when: { kind: 'notFlag', key: 'plan.submitted' },
      body: '¿Cómo vas? Pista: si una comprobación necesita esperar días o 20 usuarios, ningún E2E te va a ayudar. Y recuerda enviarme el plan antes de las 16:00.',
      onDeliver: [{ kind: 'unlock', conceptId: 'test_types' }],
    },
    {
      id: 'review_good',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'plan.good' },
      body: '¡Qué buen plan! 🔺 Base ancha de unitarias, seguridad y contrato en la API, pocos E2E, rendimiento con su prueba y lo humano explorado a mano. Así se hace.',
      onDeliver: [
        { kind: 'score', key: 'rigor', add: 2 },
        { kind: 'note', tone: 'good', text: 'Laura aprobó tu plan: una pirámide completa y rápida.' },
      ],
    },
    {
      id: 'review_ice',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'plan.shape.ice_cream' },
      body: 'Tu plan tiene más E2E que unitarias: es un **cono de helado** 🍦. Va a ser lento y frágil, y los E2E no ven lo que la interfaz esconde. Baja la lógica a unitarias.',
      onDeliver: [
        { kind: 'score', key: 'rigor', add: -1 },
        { kind: 'unlock', conceptId: 'test_pyramid' },
        { kind: 'note', tone: 'bad', text: 'Tu plan quedó invertido: más E2E que unitarias.' },
      ],
    },
    {
      id: 'review_perf',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'plan.no_perf' },
      body: 'Te falta algo: ¿quién comprueba que un reparto con **20 amigos** tarda menos de 2 s? Un E2E con 3 no lo dice. Eso es una prueba de **rendimiento**.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'test_types' },
        { kind: 'note', tone: 'bad', text: 'Tu plan no tenía prueba de rendimiento para el caso de 20 amigos.' },
      ],
    },
    {
      id: 'review_explore',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'plan.automated_exploratory' },
      body: 'Has automatizado textos, usabilidad o accesibilidad. Un script puede comprobar que existe un texto, pero no si **se entiende**: eso se explora a mano.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'exploratory' },
        { kind: 'note', tone: 'bad', text: 'Automatizaste comprobaciones que necesitan criterio humano.' },
      ],
    },
    {
      id: 'review_slow',
      channel: 'chat',
      from: 'ivan',
      when: { kind: 'flag', key: 'plan.slow_ci' },
      body: 'He visto tu plan: la suite pasaría de **15 minutos** por ejecución. Con eso, nadie espera al verde antes de fusionar 😬',
      onDeliver: [{ kind: 'note', tone: 'bad', text: 'Tu plan dejaba la suite por encima de 15 minutos por ejecución.' }],
    },
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'Buen bug 🐞 Fíjate en qué nivel lo has visto: ese es el nivel donde debe quedarse la prueba para que no vuelva (regresión).',
      onDeliver: [{ kind: 'unlock', conceptId: 'test_levels' }],
    },
    {
      id: 'strategy',
      channel: 'meeting',
      from: 'raul',
      with: ['laura', 'diego', 'sergio'],
      at: 420,
      subject: '16:00 · Estrategia de pruebas de KOB-190',
      body: '**Raúl:** Queremos que KOB-190 sea el modelo para automatizar el resto. ¿Cuál es la estrategia?',
      choices: [
        {
          id: 'pyramid',
          text: 'Pirámide: la lógica de reparto y el recordatorio en unitarias con reloj simulado, permisos y contrato en la API, dos E2E críticos, rendimiento con 20 amigos en la ejecución nocturna y exploratorias para textos, usabilidad y accesibilidad. La suite tarda minutos.',
          requires: { kind: 'flag', key: 'plan.good' },
          cost: 20,
          reply: 'Esto es lo que quiero replicar en el resto de equipos.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'score', key: 'efficiency', add: 1 },
            { kind: 'unlock', conceptId: 'test_pyramid' },
            { kind: 'note', tone: 'good', text: 'Defendiste una estrategia de pirámide con datos de coste y velocidad.' },
          ],
        },
        {
          id: 'partial',
          text: 'Tenemos un plan por niveles, aunque le faltan ajustes que me ha señalado Laura. Los cierro esta semana.',
          requires: { kind: 'flag', key: 'plan.submitted' },
          cost: 20,
          reply: 'Bien, pero que no se quede en «casi».',
          replyFrom: 'raul',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Presentaste un plan por niveles con ajustes pendientes.' }],
        },
        {
          id: 'all_e2e',
          text: 'Automatizarlo todo por la interfaz, como en Tarjetas: así probamos como el usuario.',
          cost: 20,
          reply: '¿Como la suite de 50 minutos que nadie espera? No es lo que busco.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'Propusiste a Raúl un cono de helado como modelo.' },
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
          text: 'Que cada prueba va en el nivel más bajo que pueda ver el problema: muchas unitarias, la seguridad y el contrato en la API, pocos E2E, y lo no funcional y lo humano con sus propias pruebas.',
          requires: { kind: 'flag', key: 'plan.submitted' },
          reply: 'Exacto. Una buena pirámide te deja tiempo para pensar.',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'e2e',
          text: 'Que lo más seguro es probarlo todo como el usuario, por la interfaz.',
          reply: 'Repasa el debrief: la seguridad y el rendimiento no se veían desde la interfaz.',
          effects: [
            { kind: 'note', tone: 'bad', text: 'Te quedaste con «todo por la interfaz».' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Sinceramente, no he llegado a mucho.',
          reply: 'Mañana lo vemos con Diego: la base de unitarias se monta rápido.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'arquitectura',
      title: 'KOB-190 · Arquitectura de «Dividir un gasto»',
      updatedLabel: 'Actualizada ayer por Diego Ruiz',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_levels' },
        { kind: 'flag', key: 'arch.read' },
      ],
      body: `## Piezas
- **splitCalculator** (módulo): reparte el importe; el céntimo sobrante va al **pagador**; valida importes y número de amigos (1 a 20).
- **API /splits**: crea, lista y cancela repartos. Aquí están los **permisos**: solo el creador cancela y cada usuario ve solo sus repartos. Importes en **céntimos** (entero).
- **Planificador**: envía un recordatorio **una vez**, a los 3 días, si no se ha pagado.
- **App**: pantalla «Dividir» desde el detalle de un movimiento y lista «Pendientes». Envía los importes a la API.

## Requisitos no funcionales
- Crear un reparto con **20 amigos** en menos de **2 s**.
- Accesible con lector de pantalla.

## Datos de prueba
- La base de datos de staging tiene usuarios con 3 amigos. Para 20 hace falta generar datos (herramienta de rendimiento).`,
    },
    {
      id: 'guia_auto',
      title: 'Guía de automatización del equipo',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'test_pyramid' }],
      body: `## Niveles
- **Unitaria**: una pieza aislada (cálculos, validaciones, reglas con el tiempo simulado). Milisegundos.
- **API / integración**: piezas hablando entre sí, permisos, contratos. Segundos.
- **E2E**: un recorrido completo por la interfaz. Minutos y frágil: solo los críticos.
- **Manual / exploratoria**: lo que necesita criterio humano.
- **Rendimiento**: carga y tiempos con volúmenes reales; en ejecución nocturna.

## Objetivos de la suite
- La suite que bloquea un cambio debe tardar **menos de 15 minutos**.
- Fallos intermitentes por debajo del **5 %** de las ejecuciones.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-190',
      title: 'Como cliente quiero dividir un gasto entre amigos y enviarles una solicitud de pago',
      status: 'En curso',
      type: 'story',
      description: 'Desde el detalle de un movimiento, el cliente reparte el importe entre 1 y 20 amigos (a partes iguales o personalizadas) y les envía una solicitud. Arquitectura en la wiki.',
      acceptanceCriteria: [
        'El reparto a partes iguales suma exactamente el total; el céntimo sobrante va al pagador.',
        'Los importes personalizados deben sumar el total.',
        'Solo el creador puede cancelar un reparto y cada usuario ve solo los suyos.',
        'Si no se paga, se envía un único recordatorio a los 3 días.',
        'Crear un reparto con 20 amigos tarda menos de 2 s.',
      ],
      comments: [
        { author: 'diego', body: 'Unitarias del caso feliz hechas (9 € entre 3) ✅' },
        { author: 'sergio', body: 'Si queréis, os paso nuestro framework E2E 😉' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'P1', title: 'El reparto equitativo pierde un céntimo (10 € entre 3 = 9,99 €)', severity: 'medium', explanation: 'Cada parte se trunca a 3,33 € y el céntimo sobrante no se asigna a nadie.', technique: 'Unitaria del cálculo con un importe que no se divide exacto.', fix: { delay: 30 } },
    { id: 'P1b', title: 'El céntimo sobrante se asigna al último amigo y no al pagador', severity: 'low', explanation: 'El sobrante se suma a la última parte en lugar de a la del pagador, en contra del criterio de aceptación.', technique: 'Unitaria del cálculo comparada con el criterio de aceptación.', fix: { delay: 30 } },
    { id: 'P2', title: 'Un usuario puede cancelar el reparto de otro llamando a la API', severity: 'critical', explanation: 'La API no comprueba que quien cancela sea el creador; la app no muestra el botón y por eso nadie lo vio.', technique: 'Prueba de API (seguridad) con el token de otro usuario.', fix: { delay: 45 } },
    { id: 'P2b', title: 'La API devuelve los repartos de otro usuario', severity: 'critical', explanation: 'El listado acepta un parámetro userId y no lo compara con el usuario autenticado: fuga de datos.', technique: 'Prueba de API (privacidad) pidiendo los datos de otro usuario.', fix: { delay: 45 } },
    { id: 'P3', title: 'La app envía el importe en euros y la API lo interpreta en céntimos', severity: 'high', explanation: 'Cada parte cumple su propia idea del contrato y sus unitarias con mocks pasan; juntas, 10,50 € se convierte en 0,11 €.', technique: 'Test de contrato app ↔ API (o el E2E crítico).', fix: { delay: 40 } },
    { id: 'P4', title: 'Crear un reparto con 20 amigos tarda 8 s', severity: 'high', explanation: 'Se hace una consulta a la base de datos por cada amigo: con 3 no se nota, con 20 sí.', technique: 'Prueba de rendimiento con el volumen real (20 amigos).', fix: { delay: 60 } },
    { id: 'P5', title: 'El recordatorio se envía cada día en lugar de una vez a los 3 días', severity: 'medium', explanation: 'La condición de envío comprueba «más de 0 días» y no marca el recordatorio como enviado.', technique: 'Unitaria con reloj simulado: ningún E2E puede esperar 3 días.', fix: { delay: 35 } },
  ],

  concepts: [
    { id: 'test_pyramid', title: 'Pirámide de pruebas', summary: 'Muchas unitarias, bastantes de API/integración y pocos E2E: una suite rápida, estable y barata. Invertida es un cono de helado.' },
    { id: 'test_levels', title: 'Niveles de prueba', summary: 'Cada comprobación en el nivel más bajo que pueda ver el problema: la lógica abajo, los permisos en la API, los recorridos completos arriba.' },
    { id: 'contract_testing', title: 'Mocks y contratos', summary: 'Las unitarias con mocks no ven los desacuerdos entre piezas; un test de contrato comprueba el formato real que viaja.' },
    { id: 'test_types', title: 'Tipos de prueba', summary: 'Funcionales, no funcionales (rendimiento, seguridad, usabilidad, accesibilidad) y de cambio. Lo no funcional necesita su propia prueba.' },
    { id: 'exploratory', title: 'Qué no automatizar', summary: 'La claridad, la usabilidad y la accesibilidad real necesitan criterio humano: pruebas exploratorias con objetivo.' },
  ],
  debriefConcepts: ['test_pyramid', 'test_levels', 'contract_testing', 'test_types', 'exploratory'],
  seniorTips: [
    'Lee la arquitectura: dice dónde vive cada regla (cálculo en el módulo, permisos en la API).',
    'C01–C05 en unitarias (con reloj simulado para el recordatorio): rápidas y precisas.',
    'C06–C10 en la API: permisos, privacidad y contrato no se ven desde la interfaz ni con mocks.',
    'Solo dos E2E: el recorrido completo y el botón «Dividir».',
    'C15 como prueba de rendimiento con 20 amigos; C13, C14 y C16, exploratorias a mano.',
    'Resultado: 5 unitarias, 5 de API, 2 E2E, 3 manuales y 1 de rendimiento; la suite tarda menos de 8 minutos.',
  ],
}
