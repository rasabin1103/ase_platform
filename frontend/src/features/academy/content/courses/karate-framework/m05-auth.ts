import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m05Lab } from './m05-lab'
import { m05Lessons } from './m05-lessons'
import { m05Quiz } from './m05-quiz'
import { m05Scenes } from './m05-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 6 — Tokens y reutilización.
 * Guion legible: docs/academy/karate-framework/missions/m05-auth.md
 *
 * La API pasa a OAuth2 con scopes y un límite de tokens por minuto. El alumno
 * saca el login a un feature reutilizable (@ignore), lo llama con call y
 * callonce, le pasa argumentos y prueba en negativo scopes y revocación.
 */
export const m05Auth: Mission = {
  id: 'm05-auth',
  courseKey: 'karate-framework',
  number: 5,
  title: 'Tokens y reutilización',
  subtitle: 'call y callonce, features reutilizables, argumentos, @ignore, OAuth2: scopes y revocación.',
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
  codeLab: m05Lab,
  initialMetrics: {},
  lessons: m05Lessons,
  mentor: 'sergio',
  quiz: m05Quiz,
  verdicts: {
    good: {
      title: 'Autenticación bajo control',
      body: 'Un login reutilizable, un token por feature y pruebas negativas de scopes y revocación. Tu suite cuida la seguridad tanto como la funcionalidad.',
    },
    ok: {
      title: 'Funciona, pero…',
      body: 'La suite se autentica, pero el login sigue repetido o alguna prueba de seguridad se quedó sin hacer. Mira el debrief.',
    },
    bad: {
      title: 'Copiar y pegar el login',
      body: 'Un login repetido en cada escenario choca con el límite de la API y no prueba la seguridad. Repite la misión empezando por la lección «¿Cómo reutilizo un feature desde otro?».',
    },
  },

  briefing: {
    title: 'Lunes: tokens',
    paragraphs: [
      'Tras la auditoría de seguridad, la Open API 1.6 exige un token OAuth2 en cada llamada. Los tokens tienen scopes y el endpoint que los da admite solo 5 peticiones por minuto.',
      'Sergio adaptó la suite deprisa esta mañana copiando el login en cada escenario. Con más escenarios, la suite chocará con el límite.',
      'Hoy conviertes el login en una pieza reutilizable y pruebas lo que de verdad importa de la autenticación: que cada token solo pueda lo que debe, y que un token revocado muera al momento.',
    ],
    goals: [
      'En el stand-up, propón cómo se autentica la suite.',
      'Saca el login a auth/login.feature y llámalo con call.',
      'Que el login no corra suelto (@ignore) y se pida un token por feature (callonce).',
      'Prueba que un token de solo lectura no mueve dinero (403).',
      'Prueba que un token revocado deja de funcionar (401).',
      'Decide con datos si el agregador recibe acceso.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m05Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'oauth',
      title: 'Autenticación OAuth2 (Open API 1.6)',
      updatedLabel: 'Mantenida por Iván Torres',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'auth' },
        { kind: 'flag', key: 'doc.oauth' },
      ],
      body: `## Pedir un token · POST /auth/token
- Cuerpo: **clientId**, **clientSecret** y **scope** (opcional; por defecto todos los del cliente, separados por espacios).
- **200** con { access_token, token_type: "Bearer", expires_in: 300, scope }.
- Credenciales incorrectas: **401 INVALID_CLIENT**. Scope desconocido: **400 INVALID_SCOPE**.
- Límite: **5 peticiones por minuto** por cliente. Por encima: **429 TOO_MANY_REQUESTS** con cabecera Retry-After.

## Usar el token
- Cabecera **Authorization: Bearer <access_token>** en todo /accounts y /transfers.
- Sin token: **401 UNAUTHORIZED**. Token desconocido: **401 INVALID_TOKEN**.

## Scopes (mínimo privilegio)
- **accounts:read**: consultar cuentas, saldos y transferencias.
- **transfers:write**: crear y confirmar transferencias.
- Token válido sin el scope necesario: **403 INSUFFICIENT_SCOPE**.

## Revocar · POST /auth/revoke
- Cuerpo: { token }. **200** { revoked: true }.
- Desde ese momento el token responde **401 TOKEN_REVOKED**.

## Cliente de QA (sandbox)
- clientId y clientSecret en karate-config.js (en pre y prod llegarían como propiedades del pipeline).`,
    },
    API_REFERENCE_DOC,
  ],

  tickets: [
    {
      id: 'API-31',
      title: 'OAuth2 con scopes para partners',
      status: 'En QA',
      type: 'story',
      description: 'Como responsable de seguridad, quiero que los partners usen tokens OAuth2 con scopes y que puedan revocarlos, para limitar lo que cada uno puede hacer.',
      acceptanceCriteria: ['Cada llamada lleva un token válido.', 'Un token sin el scope necesario recibe 403.', 'Un token revocado recibe 401 al momento.'],
      comments: [{ author: 'ivan', body: 'Desplegado en sandbox con límite de 5 tokens/min por cliente.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-SCOPE',
      title: 'Un token con solo accounts:read puede crear transferencias',
      severity: 'critical',
      explanation: 'La comprobación de scopes solo se aplicaba a las rutas GET: cualquier token válido podía mover dinero, aunque fuera de un partner de solo consulta.',
      technique: 'Prueba negativa de autorización: token con el mínimo scope y operación que no debería permitir (403).',
      fix: { delay: 60, note: 'Los scopes se comprueban ya en todas las rutas. Desplegado en sandbox.' },
      repro: { groups: [['scope', 'accounts:read', 'solo lectura'], ['transfer', '201', '403', 'crear']], ask: '¿Con qué scope pediste el token, qué operación hiciste y qué código llegó?' },
    },
    {
      id: 'KA-REVOKE',
      title: 'Un token revocado sigue funcionando',
      severity: 'high',
      explanation: 'La revocación se guardaba, pero la validación usaba una caché de tokens que no se invalidaba: el token seguía vivo hasta caducar.',
      technique: 'Encadenar: pedir token, revocarlo y usarlo después en el mismo escenario (401 TOKEN_REVOKED).',
      fix: { delay: 90, note: 'Revocar invalida ya la caché de tokens. Desplegado.' },
      repro: { groups: [['revoc', 'revoke'], ['200', '401', 'sigue', 'funciona']], ask: '¿Qué hiciste con el token después de revocarlo y qué código llegó?' },
    },
    {
      id: 'KA-AUTH500',
      title: 'Credenciales incorrectas devuelven 500 con una traza interna',
      severity: 'medium',
      explanation: 'Un secreto incorrecto provocaba un NullPointerException: además de un código erróneo, la respuesta mostraba detalles internos del servidor.',
      technique: 'Prueba negativa del login: credenciales incorrectas → 401 INVALID_CLIENT.',
      fix: { delay: 90, note: 'Credenciales incorrectas devuelven 401 sin trazas. Desplegado.' },
      repro: { groups: [['secret', 'credencial', 'clientsecret', 'clientid'], ['500', 'nullpointer', 'traza', '401']], ask: '¿Qué credenciales enviaste y qué respondió la API?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Cómo quedó la autenticación de tu suite al terminar el día.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.login', label: 'Login en su propio feature', explanation: "auth/login.feature: POST /auth/token y * def token = response.access_token." },
      { flag: 'reto.call', label: 'Login llamado con call, sin copiarlo', explanation: "* def auth = call read('auth/login.feature') y configure headers con el token." },
      { flag: 'reto.ignore', label: 'El login no corre suelto', explanation: '@ignore encima de Feature: en login.feature.' },
      { flag: 'reto.callonce', label: 'Un token por feature', explanation: "callonce en el Background: no más de 3 tokens para toda la suite." },
      { flag: 'reto.scope', label: 'Token de solo lectura → 403', explanation: "call read('auth/login.feature') { scope: 'accounts:read' } y POST /transfers." },
      { flag: 'reto.revoke', label: 'Token revocado → 401', explanation: 'Token propio con call, POST /auth/revoke y usarlo después.' },
    ],
  },

  concepts: [
    { id: 'call', title: 'call y features reutilizables', summary: "call read('x.feature') ejecuta otro feature y devuelve sus variables; acepta argumentos ({ … }). Sin asignar, comparte variables y cabeceras. @ignore evita que corra suelto." },
    { id: 'callonce', title: 'callonce', summary: 'Ejecuta el llamado una vez por feature y reutiliza el resultado: para lo caro o limitado (tokens). Lo que devuelve es compartido entre escenarios.' },
    { id: 'auth', title: 'Probar la autenticación', summary: 'Sin token 401, sin scope 403, revocado 401, credenciales malas 401 sin trazas. Pruebas negativas que no ve quien solo usa la app.' },
  ],
  debriefConcepts: ['call', 'callonce', 'auth'],
  seniorTips: [
    'Lee «Autenticación OAuth2» en la wiki: endpoints, scopes, límite y códigos.',
    "auth/login.feature con url baseUrl dentro, POST /auth/token y * def token = response.access_token. Y @ignore.",
    "Background: * def auth = callonce read('auth/login.feature') y configure headers con Authorization.",
    "Scopes: karate.get('scope', …) en el login y call … { scope: 'accounts:read' } → POST /transfers → 403.",
    'Revocación: token propio con call (no el compartido), revoke y usarlo después → 401.',
    'Prueba también credenciales incorrectas: deberían dar 401, no otra cosa.',
  ],
}
