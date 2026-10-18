import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m02Lab } from './m02-lab'
import { m02Lessons } from './m02-lessons'
import { m02Quiz } from './m02-quiz'
import { m02Scenes } from './m02-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 3 — Un test, tres entornos.
 * Guion legible: docs/academy/karate-framework/missions/m02-config.md
 *
 * La suite tiene que correr en el pipeline contra preproducción: otra URL,
 * otros datos y una clave obligatoria que no puede estar en el código. El
 * alumno edita karate-config.js, configura cabeceras comunes, lee el secreto
 * de karate.properties y prueba en negativo que sin clave no hay datos.
 */
export const m02Config: Mission = {
  id: 'm02-config',
  courseKey: 'karate-framework',
  number: 2,
  title: 'Un test, tres entornos',
  subtitle: 'karate-config.js, karate.env, cabeceras comunes, secretos y datos por entorno.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m02Lab,
  initialMetrics: {},
  lessons: m02Lessons,
  mentor: 'sergio',
  quiz: m02Quiz,
  verdicts: {
    good: {
      title: 'Lista para el pipeline',
      body: 'La misma suite corre en sandbox y en pre sin tocar un test, sin secretos en el código, y ha demostrado un fallo de seguridad antes de llegar a producción.',
    },
    ok: {
      title: 'Casi en el pipeline',
      body: 'La suite corre en más de un entorno, pero algo depende todavía de dónde se ejecuta, o algún riesgo se quedó sin probar. Mira el debrief.',
    },
    bad: {
      title: 'Atada a un entorno',
      body: 'Una suite que solo funciona en un sitio no sirve para un pipeline. Repite la misión empezando por la lección «¿Qué es karate-config.js?».',
    },
  },

  briefing: {
    title: 'Miércoles: el pipeline',
    paragraphs: [
      'Mañana la Open API sale a producción. Iván ha montado el pipeline: desplegar en preproducción, ejecutar vuestra suite contra pre y, si sale verde, promocionar.',
      'Pero la suite solo sabe hablar con el sandbox. Pre tiene otra URL, otros datos y exige una clave que no puede aparecer en el código.',
      'Hoy conviertes la suite en algo que corre en cualquier entorno cambiando solo karate.env. Y Carmen querrá una prueba de que, sin clave, nadie lee datos.',
    ],
    goals: [
      'En la reunión, propón cómo correr la misma suite en todos los entornos.',
      'Configura karate-config.js para sandbox y pre según karate.env.',
      'Envía la clave en todas las peticiones de pre sin escribirla en el código.',
      'Consigue la suite en verde en los dos entornos sin tocar los features entre ejecuciones.',
      'Demuestra que pre responde 401 sin clave, y añade el id de correlación que piden los partners.',
      'Decide con datos en el go/no-go de las 16:30.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m02Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'entornos',
      title: 'Entornos de la Open API',
      updatedLabel: 'Mantenida por Iván Torres',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'config' },
        { kind: 'flag', key: 'doc.envs' },
      ],
      body: `## Entornos
- **sandbox** · https://api.kobalto.test/v1 · abierto, datos de ejemplo (ACC-1001 a ACC-1005).
- **pre** · https://api.pre.kobalto.test/v1 · copia de producción con datos propios. Exige **x-api-key** en todo menos /health.
- **prod** · https://api.kobalto.com/v1 · a partir del jueves. Solo smoke (@smoke).

## Datos de pre
- **ACC-2001** · Carla Domínguez Ríos · EUR · ACTIVE
- **ACC-2002** · Talleres Ebro SL · EUR · ACTIVE
- **ACC-2003** · Pablo Ferrer Gil · USD · ACTIVE (saldo 0)
- **ACC-2004** · Comercial Duero SA · EUR · BLOCKED

## Clave de pre
- Cabecera **x-api-key**. Sin ella: **401 MISSING_API_KEY**; con una clave incorrecta: **401 INVALID_API_KEY**.
- En el pipeline llega como propiedad del sistema **kobalto.apiKey** desde el gestor de secretos. **Nunca** en el repositorio.

## Trazabilidad
- Si la petición trae **x-correlation-id**, la respuesta devuelve la misma cabecera con el mismo valor (en todos los entornos).

## Cómo ejecuta el pipeline
- \`mvn test -Dkarate.env=pre -Dkobalto.apiKey=$KOBALTO_PRE_KEY\``,
    },
    API_REFERENCE_DOC,
  ],

  tickets: [
    {
      id: 'API-18',
      title: 'La suite de Karate corre en el pipeline contra pre',
      status: 'En curso',
      type: 'story',
      description: 'Como equipo de plataforma, queremos ejecutar la suite de la Open API contra preproducción en cada despliegue para decidir si promocionamos a producción.',
      acceptanceCriteria: [
        'La misma suite corre en sandbox y en pre cambiando solo karate.env.',
        'Ningún secreto en el repositorio.',
        'Se comprueba que pre rechaza peticiones sin clave.',
      ],
      comments: [{ author: 'ivan', body: 'El pipeline ya pasa -Dkarate.env=pre y -Dkobalto.apiKey.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-KEY',
      title: 'Pre devuelve el detalle de una cuenta sin x-api-key',
      severity: 'critical',
      explanation: 'El filtro de autenticación excluía por error la ruta del detalle: cualquiera sin clave podía leer los datos de una cuenta. En producción habría sido una fuga de datos.',
      technique: 'Prueba negativa de seguridad: la misma petición sin la cabecera (header x-api-key = null) debe dar 401.',
      fix: { delay: 60, note: 'El filtro de autenticación cubre ya todas las rutas de /accounts. Desplegado en pre.' },
      repro: { groups: [['x-api-key', 'api key', 'api-key', 'clave', 'key'], ['200', '401', 'sin']], ask: '¿Qué endpoint, en qué entorno, y qué código llega sin la cabecera frente al esperado?' },
    },
    {
      id: 'KA-CORR',
      title: 'Pre no devuelve la cabecera x-correlation-id',
      severity: 'medium',
      explanation: 'El proxy de pre eliminaba la cabecera de la respuesta. Los partners no podrían rastrear sus llamadas en producción.',
      technique: 'Comprobar cabeceras de respuesta (responseHeaders) y ejecutar la misma suite en cada entorno.',
      fix: { delay: 90, note: 'El proxy de pre ya deja pasar x-correlation-id. Desplegado.' },
      repro: { groups: [['x-correlation-id', 'correlation', 'correlacion'], ['pre', 'preproduccion', 'no devuelve', 'falta', 'missing', 'undefined', 'no llega']], ask: '¿Qué cabecera falta, en qué entorno, y qué valor enviaste?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Cómo quedó la suite para el pipeline al terminar el día.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.entornos', label: 'karate-config.js elige la URL según karate.env', explanation: "if (env == 'pre') { config.baseUrl = 'https://api.pre.kobalto.test/v1'; }" },
      { flag: 'reto.clave', label: 'La clave en todas las peticiones con configure headers', explanation: "karate.configure('headers', { 'x-api-key': … }) en la rama de pre." },
      { flag: 'reto.secreto', label: 'Sin secretos en el código', explanation: "karate.properties['kobalto.apiKey'], que pasa el pipeline con -Dkobalto.apiKey." },
      { flag: 'reto.datos', label: 'Verde en sandbox y en pre con los mismos features', explanation: 'accountId en la config según el entorno: ACC-1001 en sandbox, ACC-2001 en pre.' },
      { flag: 'reto.sinclave', label: 'Prueba negativa: sin clave, 401', explanation: "header x-api-key = null y karate.abort() fuera de pre." },
      { flag: 'reto.correlacion', label: 'Id de correlación en todas las peticiones y comprobado en la respuesta', explanation: "match responseHeaders['x-correlation-id'][0] == correlationId" },
    ],
  },

  concepts: [
    { id: 'config', title: 'karate-config.js y karate.env', summary: 'Función que Karate ejecuta antes de cada escenario. Según karate.env (-Dkarate.env=pre) devuelve URL, datos y configuración; los features no saben en qué entorno corren.' },
    { id: 'headers', title: 'Cabeceras comunes', summary: 'configure headers añade cabeceras a todas las peticiones; header, solo a la siguiente; null la quita. responseHeaders[nombre][0] lee las de la respuesta.' },
    { id: 'secrets', title: 'Secretos fuera del código', summary: 'Claves y tokens llegan como propiedades del sistema (karate.properties) desde el gestor de secretos del pipeline. Una clave publicada se rota.' },
    { id: 'env_data', title: 'Datos y escenarios por entorno', summary: 'Lo que cambia entre entornos (ids de prueba) va a la config. Escenarios propios de un entorno: karate.abort() o tags.' },
  ],
  debriefConcepts: ['config', 'headers', 'secrets', 'env_data'],
  seniorTips: [
    'Lee «Entornos de la Open API» en la wiki: URL, datos y clave de pre.',
    "En la config: if (env == 'pre') con la URL de pre, y prueba con el selector -Dkarate.env=pre.",
    "La clave: karate.properties['kobalto.apiKey'] y karate.configure('headers', …). Nunca el valor en el código.",
    "accountId en la config (ACC-1001 / ACC-2001) y Given path 'accounts', accountId en el feature.",
    "Prueba negativa: header x-api-key = null → 401. Con * if (karate.env != 'pre') karate.abort() no rompe sandbox.",
    "x-correlation-id en las cabeceras configuradas y match responseHeaders['x-correlation-id'][0] == correlationId.",
    'Si algo falla solo en pre, compáralo con sandbox antes de reportar.',
  ],
}
