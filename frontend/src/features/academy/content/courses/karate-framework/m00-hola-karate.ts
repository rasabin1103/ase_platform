import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m00Lab } from './m00-lab'
import { m00Lessons } from './m00-lessons'
import { m00Quiz } from './m00-quiz'
import { m00Scenes } from './m00-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 1 — Hola, Karate.
 * Guion legible: docs/academy/karate-framework/missions/m00-hola-karate.md
 *
 * Primer día en el squad de Open API. El jugador escribe su primer feature
 * (salud, detalle de cuenta, 404), lo ordena con un Background y comprueba la
 * cuenta bloqueada que pide Compliance. Un test correcto en rojo revela un
 * bug de la API que hay que reportar con el escenario como evidencia.
 */
export const m00HolaKarate: Mission = {
  id: 'm00-hola-karate',
  courseKey: 'karate-framework',
  number: 0,
  title: 'Hola, Karate',
  subtitle: 'Tu primer feature: url, path, method, status, match y Background.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Lunes',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m00Lab,
  initialMetrics: {},
  lessons: m00Lessons,
  mentor: 'sergio',
  quiz: m00Quiz,
  verdicts: {
    good: {
      title: 'Primera suite, primer bug',
      body: 'Tu smoke se ejecuta en cada despliegue, cubre los casos de error y ya ha cazado un bug que habría visto un partner. Así se empieza.',
    },
    ok: {
      title: 'Buen arranque',
      body: 'Tienes tests que funcionan, pero algo se quedó sin comprobar o sin reportar. Mira en el debrief qué faltó.',
    },
    bad: {
      title: 'Tests que no prueban',
      body: 'Sin comprobaciones sobre la respuesta, un test siempre sale verde. Repite la misión empezando por la lección «¿Qué hace exactamente match?».',
    },
  },

  briefing: {
    title: 'Lunes: el squad de Open API',
    paragraphs: [
      'Kobalto abre su API a otras fintechs: el jueves empieza la beta privada y varios partners leerán cuentas de clientes desde sus apps.',
      'Hasta ahora la API se probaba a mano. Sergio, el QA Automation Lead, ha elegido Karate: los tests se leen casi como la especificación y se ejecutan en cada despliegue.',
      'Hoy escribes tu primer feature en el IDE contra el sandbox. Ojo: la API tiene bugs. Un test bien escrito que sale en rojo es una buena noticia… si lo reportas.',
    ],
    goals: [
      'En la daily, propón cómo saber en cada despliegue que la API sigue funcionando.',
      'Escribe un smoke de /health con status y match.',
      'Comprueba el detalle de una cuenta y el 404 de una que no existe.',
      'Ordena el feature con un Background: nada de URLs repetidas.',
      'Comprueba lo que pide Compliance y reporta lo que falle, con el escenario como evidencia.',
      'En la demo de las 16:30, cuenta qué cubre tu suite y qué no.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'wiki' },
    { tool: 'app' },
    { tool: 'tickets' },
  ],

  scenes: m00Scenes,
  endSceneId: 'closing',

  docs: [
    API_REFERENCE_DOC,
    {
      id: 'karate_5min',
      title: 'Karate en 5 minutos',
      updatedLabel: 'Mantenida por Sergio Navas',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'feature_anatomy' },
        { kind: 'flag', key: 'doc.karate' },
      ],
      body: `## Un feature
- Empieza por **Feature:** y contiene uno o varios **Scenario:**. Cada escenario es un test independiente.
- Las líneas que empiezan por **#** son comentarios.
- Cada paso empieza por **Given**, **When**, **Then**, **And**, **But** o **\`*\`** (son equivalentes) seguido de una palabra clave de Karate.

## Palabras clave del primer día
- **url** \`baseUrl\`: dirección base (viene de karate-config.js).
- **path** \`'accounts', 'ACC-1001'\`: segmentos que se añaden a la url.
- **method** \`get\`: envía la petición.
- **status** \`200\`: comprueba el código HTTP.
- **match** \`response.status == 'UP'\`: comprueba el cuerpo. **response** es el JSON de la respuesta.
- **print** \`response\`: escribe en la consola (para explorar, no para comprobar).

## Background
- Pasos que se ejecutan **antes de cada escenario**. Ideal para \`* url baseUrl\`.

## Leer el resultado
- **Informe**: escenarios en verde y en rojo, con el paso que falló y el motivo.
- **Consola**: \`1 > GET …\` es lo que envió Karate; \`1 < 200\` y el JSON, lo que respondió la API.`,
    },
    {
      id: 'checklist',
      title: 'Checklist de un buen test de API',
      updatedLabel: 'Equipo de QA',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'assertions' }],
      body: `- Un escenario, un comportamiento. El nombre dice qué se espera («cuenta inexistente devuelve 404»).
- Siempre **status** y **match** sobre lo que importa. Un test que no puede fallar no prueba nada.
- Prueba también los **errores**: ids que no existen, formatos no válidos.
- Prueba **más de un dato**: el ejemplo feliz no revela los casos raros.
- Nada de URLs completas en los escenarios: **url baseUrl** + **path**.
- Escenarios **independientes**: ninguno depende de que otro se haya ejecutado antes.
- Si un test correcto falla, **no lo cambies para que pase**: reporta el bug con el escenario como evidencia.`,
    },
  ],

  tickets: [
    {
      id: 'API-12',
      title: 'Beta privada de la Open API: suite automática',
      status: 'En curso',
      type: 'story',
      description: 'Como equipo de Open API, queremos una suite de tests de API que se ejecute en cada despliegue para abrir la beta a partners con garantías.',
      acceptanceCriteria: [
        'Smoke de /health.',
        'Detalle de cuenta y error 404 cubiertos.',
        'El estado de las cuentas bloqueadas por Compliance se comprueba.',
        'La suite corre contra cualquier entorno cambiando solo la configuración.',
      ],
      comments: [{ author: 'sergio', body: 'Empezamos con Karate. El proyecto está en el IDE.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-BLOQ',
      title: 'La cuenta bloqueada ACC-1003 aparece como ACTIVE',
      severity: 'critical',
      explanation: 'La API servía el estado desde una caché que no se invalidaba al bloquear la cuenta. Un partner podría haber operado con una cuenta bloqueada por Compliance.',
      technique: 'Test de API con match sobre el campo que importa (status de la cuenta), no solo sobre el código HTTP.',
      fix: { delay: 60, note: 'Ahora la caché de estado se invalida al bloquear o desbloquear una cuenta. Desplegado en sandbox.' },
      repro: { groups: [['acc-1003', '1003'], ['active', 'blocked', 'bloquead']], ask: '¿Qué cuenta y qué estado devuelve? Pon el id, el estado esperado y el que llega.' },
    },
    {
      id: 'KA-DIVISA',
      title: 'La cuenta en dólares ACC-1004 devuelve currency EUR',
      severity: 'high',
      explanation: 'El serializador ponía EUR por defecto en lugar de leer la divisa de la cuenta. Solo se ve con una cuenta que no esté en euros.',
      technique: 'Probar más de un dato: el ejemplo feliz (ACC-1001, en euros) no lo revela.',
      fix: { delay: 90, note: 'La divisa sale ya de la cuenta, no de un valor por defecto. Desplegado en sandbox.' },
      repro: { groups: [['acc-1004', '1004'], ['usd', 'dolar', 'eur', 'divisa', 'currency', 'moneda']], ask: '¿Qué cuenta es y qué divisa esperabas frente a la que llega?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Lo que consiguió tu suite al terminar el día.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.smoke', label: 'Smoke de /health con status y match', explanation: "Given path 'health' · When method get · Then status 200 · And match response.status == 'UP'" },
      { flag: 'reto.cuenta', label: 'Detalle de ACC-1001 comprobado con match', explanation: "match response.id == 'ACC-1001' y match response.currency == 'EUR'." },
      { flag: 'reto.noexiste', label: 'Error 404 de una cuenta inexistente', explanation: "Then status 404 · And match response.code == 'ACCOUNT_NOT_FOUND'" },
      { flag: 'reto.background', label: 'url baseUrl en el Background', explanation: 'Una sola línea para todos los escenarios y ninguna URL completa.' },
      { flag: 'reto.bloqueada', label: 'Estado de la cuenta bloqueada comprobado', explanation: "match response.status == 'BLOCKED': el test es correcto aunque la API falle." },
    ],
  },

  concepts: [
    { id: 'api_automation', title: 'Tests de API automáticos', summary: 'Pruebas que hablan con la API directamente (sin interfaz) y se ejecutan en cada despliegue: rápidas, estables y repetibles.' },
    { id: 'feature_anatomy', title: 'Anatomía de un feature', summary: 'Feature, Scenario y pasos. url y path preparan, method envía, status y match comprueban. response guarda el JSON de la respuesta.' },
    { id: 'assertions', title: 'Aserciones: status y match', summary: 'status mira el código HTTP; match compara el cuerpo. Un test sin aserciones siempre pasa y no prueba nada.' },
    { id: 'background', title: 'Background y baseUrl', summary: 'Pasos comunes que se ejecutan antes de cada escenario. url baseUrl permite cambiar de entorno sin tocar los tests.' },
    { id: 'red_test', title: 'Test en rojo: ¿test o bug?', summary: 'Compara el test con la especificación: si el test es correcto y falla, es un bug y se reporta con el escenario como evidencia.' },
  ],
  debriefConcepts: ['api_automation', 'feature_anatomy', 'assertions', 'background', 'red_test'],
  seniorTips: [
    'Lee la referencia de la API antes de escribir: dice qué devuelve cada endpoint y qué datos hay en el sandbox.',
    "Smoke: Given path 'health' · When method get · Then status 200 · And match response.status == 'UP'.",
    'Cada escenario con status y match. Y un caso de error: ACC-9999 → 404 ACCOUNT_NOT_FOUND.',
    'Con dos escenarios ya merece la pena un Background con * url baseUrl.',
    'ACC-1003 debe salir BLOCKED. Si tu test es correcto y falla, repórtalo con ese escenario como evidencia.',
    'Prueba más de un dato: la cuenta en dólares (ACC-1004) esconde otro bug.',
    'Tras el fix, vuelve a ejecutar y verifica el ticket con la ejecución nueva.',
  ],
}
