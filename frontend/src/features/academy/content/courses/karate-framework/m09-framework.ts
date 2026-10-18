import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m09Lab } from './m09-lab'
import { m09Lessons } from './m09-lessons'
import { m09Quiz } from './m09-quiz'
import { m09Scenes } from './m09-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 10 — Tu framework.
 * Guion legible: docs/academy/karate-framework/missions/m09-framework.md
 *
 * La suite pasa a ser del alumno: login con karate.callSingle en
 * karate-config.js, esquemas en ficheros, utilidades reutilizables,
 * convenciones, revisión de la PR de un compañero y la suite final en el
 * pipeline.
 */
export const m09Framework: Mission = {
  id: 'm09-framework',
  courseKey: 'karate-framework',
  number: 9,
  title: 'Tu framework',
  subtitle: 'karate.callSingle, estructura del proyecto, esquemas y utilidades reutilizables, convenciones, revisión de código y la suite final.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Viernes',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m09Lab,
  initialMetrics: {},
  lessons: m09Lessons,
  mentor: 'sergio',
  quiz: m09Quiz,
  verdicts: {
    good: {
      title: 'La suite es tuya',
      body: 'Login en un sitio, contratos y datos reutilizables, convenciones que se cumplen, una revisión que encontró lo que los tests no miraban y el nocturno en verde. Cualquiera puede mantener esta suite… empezando por ti.',
    },
    ok: {
      title: 'Ordenada a medias',
      body: 'La suite funciona, pero sigue habiendo copias, convenciones a medias o una PR sin revisar a fondo. Mira el debrief.',
    },
    bad: {
      title: 'Una suite que nadie quiere tocar',
      body: 'Sin estructura ni revisión, cada cambio cuesta más y los tests dejan pasar lo importante. Repite la misión empezando por la lección «¿Cómo organizo los ficheros de la suite?».',
    },
  },

  briefing: {
    title: 'Viernes: la suite es tuya',
    paragraphs: [
      'Sergio se va dos semanas de vacaciones y la suite de la Open API pasa a tus manos. Ha crecido deprisa: login copiado en cada feature, esquemas pegados, datos de prueba repetidos… y desde ayer el nocturno da 429.',
      'Iker, que llegó el lunes, ha abierto su primera PR con los tests de tarjetas. El lunes /cards se abre a los partners.',
      'Hoy no hay sintaxis nueva que aprender: hoy decides cómo se organiza una suite para que la mantenga cualquiera.',
    ],
    goals: [
      'En el stand-up, propón cómo dejar la suite mantenible.',
      'Un solo login para toda la ejecución (karate.callSingle).',
      'Revisa la PR de Iker.',
      'Esquemas en ficheros JSON y una utilidad para los datos de prueba.',
      'Cumple las convenciones del equipo y lanza la suite final.',
      'Decide con datos si /cards se abre el lunes.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m09Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'convenciones',
      title: 'Convenciones de la suite de la Open API',
      updatedLabel: 'Mantenida por Iván Torres',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'convenciones' },
        { kind: 'flag', key: 'doc.convenciones' },
      ],
      body: `## Estructura
- **karate-config.js**: entorno, credenciales del cliente de QA y **login único** (\`karate.callSingle\`) con la cabecera Authorization.
- **openapi/**: un feature por recurso. **openapi/schemas/**: contratos en JSON. **common/**: utilidades reutilizables con @ignore.

## Reglas
1. Todo escenario lleva **@smoke** o **@regression** (vale en el Feature). El job de PR ejecuta @smoke; el nocturno, todo.
2. Ningún feature contiene **URLs completas** ni **tokens**: \`url baseUrl\` + \`path\`; el token lo pone la configuración.
3. Cada respuesta se comprueba **en el cuerpo**: nunca solo el status ni un print.
4. Datos de prueba **propios** (cuentas del sandbox) creados con la utilidad común.
5. Escenarios que solo cambian en los datos → **Scenario Outline**.

## Revisión de PR
- ¿Qué fallaría si la API se rompiera? Si la respuesta es «nada», el test no sirve.`,
    },
    {
      id: 'cards',
      title: 'Tarjetas · GET /cards (Open API 1.7)',
      updatedLabel: 'Mantenida por Nicolás Prado',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'doc.cards' }],
      body: `## Endpoints (token con accounts:read)
- **GET /cards?accountId=ACC-0000** → 200 { items, total }: **solo** las tarjetas de esa cuenta. Sin accountId: 400 VALIDATION_ERROR.
- **GET /cards/{id}** → 200 con la tarjeta. Id con formato CRD-0000 (si no, 400 INVALID_CARD_ID). Inexistente: 404 CARD_NOT_FOUND.

## Tarjeta
- **id** (CRD-0000) · **accountId** · **brand** (VISA, MASTERCARD) · **last4** (4 dígitos) · **status** (ACTIVE, BLOCKED, EXPIRED) · **expiry** (AAAA-MM)
- **Nunca** se devuelve el número completo de la tarjeta (PCI DSS): solo last4.

## Datos del sandbox
- CRD-1001 y CRD-1004 · ACC-1001 · ACTIVE
- CRD-1002 · ACC-1002 · BLOCKED
- CRD-1003 · ACC-1004 · EXPIRED`,
    },
    API_REFERENCE_DOC,
  ],

  tickets: [
    {
      id: 'API-52',
      title: 'Tarjetas para partners (solo lectura)',
      status: 'En QA',
      type: 'story',
      description: 'Como partner, quiero consultar las tarjetas de las cuentas de mis usuarios (sin datos sensibles) para mostrarlas en mi app.',
      acceptanceCriteria: ['La lista solo trae las tarjetas de la cuenta pedida.', 'Nunca se devuelve el número completo de la tarjeta.', 'Estados ACTIVE, BLOCKED y EXPIRED.'],
      comments: [{ author: 'iker', body: 'PR con los tests de tarjetas abierta. En mi máquina pasan.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-PAN',
      title: 'El detalle de una tarjeta devuelve el número completo (pan)',
      severity: 'critical',
      explanation: 'El serializador del detalle usaba la entidad interna completa: además de last4, salía el número entero de la tarjeta. Exponerlo incumple PCI DSS.',
      technique: 'Validar la respuesta contra el contrato completo (match == esquema): un campo de más hace fallar el test.',
      fix: { delay: 60, note: 'El detalle usa ya el DTO público, sin pan. Desplegado en sandbox.' },
      repro: { groups: [['pan', 'número completo', 'numero completo', 'tarjeta'], ['clave de más', 'more key', 'esquema', 'contrato', 'expone']], ask: '¿Qué campo de más traía la respuesta y qué dice el contrato?' },
    },
    {
      id: 'KA-CARDFILTER',
      title: 'GET /cards?accountId= devuelve tarjetas de otros clientes',
      severity: 'critical',
      explanation: 'El filtro por cuenta se perdió en una refactorización de la consulta: la lista devolvía las tarjetas de todos los clientes.',
      technique: 'match each sobre la lista: todas las tarjetas deben ser de la cuenta pedida.',
      fix: { delay: 60, note: 'La consulta vuelve a filtrar por cuenta. Desplegado.' },
      repro: { groups: [['lista', 'accountid', 'filtro'], ['otra cuenta', 'otros clientes', 'acc-1002', 'acc-1004', 'todas']], ask: '¿Qué cuenta pediste y de qué cuentas eran las tarjetas que llegaron?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Cómo dejaste la suite antes de que Sergio se fuera.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.callsingle', label: 'Un token por ejecución', explanation: 'karate.callSingle en karate-config.js y fuera el login de los Background.' },
      { flag: 'reto.revision', label: 'PR de Iker revisada', explanation: 'Sin URLs ni tokens pegados, Outline en lugar de copias y match sobre el cuerpo.' },
      { flag: 'reto.esquemas', label: 'Esquemas en schemas/', explanation: "read('schemas/error.json') desde varios features." },
      { flag: 'reto.utilidades', label: 'Utilidad para los datos', explanation: 'common/cuenta-prueba.feature con @ignore y argumentos.' },
      { flag: 'reto.convenciones', label: 'Convenciones cumplidas', explanation: 'Todo escenario con @smoke o @regression; sin URLs ni tokens en los features.' },
      { flag: 'reto.final', label: 'Suite final en el nocturno', explanation: `Nocturno en paralelo con la suite completa y sin fallos de los tests.` },
    ],
  },

  concepts: [
    { id: 'callsingle', title: 'callonce y callSingle', summary: 'callonce: una vez por feature. karate.callSingle: una vez por ejecución (todos los features e hilos), normalmente en karate-config.js con la configuración como argumento.' },
    { id: 'estructura', title: 'Estructura y reutilización', summary: 'Login en karate-config.js, contratos en schemas/*.json, utilidades @ignore en common/ con argumentos. Lo común, una sola vez.' },
    { id: 'convenciones', title: 'Convenciones', summary: 'Pocas, escritas y comprobables: tags obligatorios, nada de URLs ni secretos, cuerpo comprobado, datos propios, Outline para variaciones.' },
    { id: 'revision', title: 'Revisar tests', summary: '¿Qué fallaría si la API se rompiera? Cuerpo comprobado, nada pegado que caduque, sin copias, sin dependencias de otros tests.' },
  ],
  debriefConcepts: ['callsingle', 'estructura', 'convenciones', 'revision'],
  seniorTips: [
    'karate-config.js: var auth = karate.callSingle(\'classpath:openapi/auth/login.feature\', config); y karate.configure(\'headers\', …). Fuera el login de los Background.',
    'Lee «Tarjetas» en la wiki: la tarjeta nunca trae el número completo y la lista solo trae las de la cuenta pedida.',
    "PR de Iker: path 'cards', id; sin header Authorization; Outline por tarjeta con match response == cardSchema; lista con match each … accountId.",
    'Nuevo fichero → openapi/schemas/error.json y card.json; read(\'schemas/error.json\') en errors y transfers.',
    'Nuevo fichero → common/cuenta-prueba.feature (@ignore, karate.get(\'balance\', 100)) y úsalo en balances y transfers.',
    '@regression encima de cada Feature y @smoke en lo imprescindible. Después, Pipeline → Nocturno.',
  ],
}
