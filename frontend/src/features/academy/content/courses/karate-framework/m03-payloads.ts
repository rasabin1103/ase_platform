import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m03Lab } from './m03-lab'
import { m03Lessons } from './m03-lessons'
import { m03Quiz } from './m03-quiz'
import { m03Scenes } from './m03-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 4 — POST y encadenar.
 * Guion legible: docs/academy/karate-framework/missions/m03-payloads.md
 *
 * La beta está en producción y llegan las transferencias. El alumno crea
 * transferencias con request y read(), encadena peticiones con def, comprueba
 * lo guardado y el efecto en el saldo, y prueba reintentos y falta de saldo.
 * La API tiene estado durante cada ejecución (saldos y transferencias).
 */
export const m03Payloads: Mission = {
  id: 'm03-payloads',
  courseKey: 'karate-framework',
  number: 3,
  title: 'POST y encadenar',
  subtitle: 'request, read() con expresiones embebidas, def entre peticiones, set y el efecto de una operación.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Jueves',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m03Lab,
  initialMetrics: {},
  lessons: m03Lessons,
  mentor: 'sergio',
  quiz: m03Quiz,
  verdicts: {
    good: {
      title: 'El dinero, bajo control',
      body: 'Tu suite crea, lee, confirma y comprueba el saldo, y demostró con datos lo que pasa con los reintentos. Así se prueba una API que mueve dinero.',
    },
    ok: {
      title: 'Se crean, pero…',
      body: 'Las transferencias se crean y algo se comprueba, pero parte del efecto o de las reglas se quedó sin probar. Mira el debrief.',
    },
    bad: {
      title: 'Un 201 no es una prueba',
      body: 'Comprobar que algo se crea no dice qué se guardó ni qué efecto tiene. Repite la misión empezando por la lección «¿Qué hay que comprobar después de un POST?».',
    },
  },

  briefing: {
    title: 'Jueves: movemos dinero',
    paragraphs: [
      'La beta de la Open API ya está en producción. El siguiente paso que piden los partners: iniciar transferencias desde sus apps.',
      'Nico tiene el endpoint en el sandbox. Si todo va bien, se abre a Finvo la semana que viene. Aquí ya no se leen datos: se mueve dinero de los clientes.',
      'Hoy escribes tests que crean datos, los leen y comprueban su efecto. La API guarda el estado durante cada ejecución, como un servidor real.',
    ],
    goals: [
      'En el refinamiento, explica qué hay que comprobar de una operación que mueve dinero.',
      'Crea transferencias con request y saca el cuerpo a un fichero con expresiones embebidas.',
      'Encadena: guarda el id, lee la transferencia y comprueba lo que se guardó.',
      'Confirma y comprueba el efecto en el saldo.',
      'Responde a Carmen sobre los reintentos y a Finvo sobre la falta de saldo.',
      'Decide con datos si se abre a Finvo.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m03Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'transferencias',
      title: 'Transferencias (beta) · Especificación',
      updatedLabel: 'Mantenida por Nicolás Prado',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'http_codes' },
        { kind: 'flag', key: 'doc.transfers' },
      ],
      body: `## Crear · POST /transfers
- Cuerpo: **fromAccount** (id de cuenta), **toIban** (ES + 22 dígitos), **amount** (número > 0, máximo 2 decimales), **currency** (la de la cuenta), **concept** (opcional, hasta 140 caracteres).
- **201** con la transferencia en estado **PENDING** y cabecera **Location**. No mueve dinero todavía.
- El importe se guarda **exactamente** como se envía (con sus decimales).

## Leer · GET /transfers/{id}
- **200** con { id, fromAccount, toIban, amount, currency, concept, status, createdAt, completedAt }. **404 TRANSFER_NOT_FOUND** si no existe.

## Confirmar · POST /transfers/{id}/confirm
- **200**, status **COMPLETED**: descuenta el importe del saldo disponible de la cuenta.
- Confirmar una transferencia ya completada: **409 TRANSFER_ALREADY_COMPLETED**. **Nunca** se cobra dos veces.

## Errores
- **400 VALIDATION_ERROR** (con **field**): falta un campo obligatorio o un valor no es válido.
- **400 INVALID_IBAN** · **404 ACCOUNT_NOT_FOUND**
- **422 ACCOUNT_NOT_OPERATIVE**: cuenta bloqueada o cerrada.
- **422 CURRENCY_MISMATCH**: la divisa no es la de la cuenta.
- **422 INSUFFICIENT_FUNDS**: el importe supera el saldo disponible.

## Saldo · GET /accounts/{id}/balance
- { accountId, available, currency, updatedAt }. Refleja las transferencias confirmadas.

## IBAN de destino para pruebas
- ES9121000418450200051333`,
    },
    API_REFERENCE_DOC,
  ],

  tickets: [
    {
      id: 'API-24',
      title: 'Transferencias iniciadas por partners',
      status: 'En QA',
      type: 'story',
      description: 'Como partner de la Open API, quiero iniciar y confirmar transferencias en nombre de mis clientes para que puedan pagar desde mi app.',
      acceptanceCriteria: [
        'Crear devuelve 201 en estado PENDING y guarda los datos tal como se envían.',
        'Confirmar descuenta el importe del saldo una sola vez.',
        'Sin saldo suficiente: 422 INSUFFICIENT_FUNDS.',
      ],
      comments: [{ author: 'nico', body: 'Desplegado en sandbox. El POST devuelve 201 👍' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-IMPORTE',
      title: 'Las transferencias se guardan sin decimales (150.75 → 150)',
      severity: 'high',
      explanation: 'La columna del importe se mapeaba como entero. La respuesta del POST repetía lo recibido, así que solo se veía al leer la transferencia después.',
      technique: 'Encadenar: crear, guardar el id con def y leer el recurso con GET para comprobar lo que se guardó.',
      fix: { delay: 60, note: 'El importe se guarda ya con dos decimales. Desplegado en sandbox.' },
      repro: { groups: [['amount', 'importe', 'decimal'], ['150', 'trunc', 'sin decimales', 'redonde', 'entero']], ask: '¿Qué importe enviaste y cuál devuelve el GET de la transferencia?' },
    },
    {
      id: 'KA-DOBLE',
      title: 'Confirmar dos veces la misma transferencia la cobra dos veces',
      severity: 'critical',
      explanation: 'La confirmación no comprobaba el estado: un reintento del partner tras un timeout descontaba el importe otra vez.',
      technique: 'Prueba de idempotencia: repetir la operación en el mismo escenario y esperar 409.',
      fix: { delay: 60, note: 'Confirmar una transferencia completada devuelve 409 y no toca el saldo. Desplegado en sandbox.' },
      repro: { groups: [['confirm', 'confirmar', 'dos veces', 'segunda', 'reintent'], ['200', '409', 'cobr', 'saldo', 'descuenta']], ask: '¿Qué pasa en la segunda confirmación: qué código llega y qué le ocurre al saldo?' },
    },
    {
      id: 'KA-FONDOS',
      title: 'Se aceptan transferencias por encima del saldo disponible',
      severity: 'critical',
      explanation: 'La validación de saldo se hacía solo en la app de Kobalto, no en la API: un partner podía dejar cuentas en negativo.',
      technique: 'Caso negativo de regla de negocio: importe mayor que el saldo → 422 INSUFFICIENT_FUNDS.',
      fix: { delay: 90, note: 'La API valida el saldo disponible antes de crear la transferencia. Desplegado en sandbox.' },
      repro: { groups: [['saldo', 'insufficient', 'fondos', 'balance'], ['201', '422', 'acepta', 'crea']], ask: '¿Qué importe, de qué cuenta, y qué código llega frente al esperado?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Lo que comprobaba tu suite de transferencias al terminar el día.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.crear', label: 'Crear con request: 201 y PENDING', explanation: "And request {…} · When method post · Then status 201 · match response contains { status: 'PENDING' }" },
      { flag: 'reto.fichero', label: 'Cuerpo en un fichero con expresiones embebidas', explanation: "\"amount\": \"#(amount)\" en el JSON y * def body = read('payloads/transfer.json')." },
      { flag: 'reto.encadenar', label: 'Crear y leer lo guardado', explanation: "* def transferId = response.id · GET /transfers/{id} · match response.amount == amount" },
      { flag: 'reto.confirmar', label: 'Efecto en el saldo al confirmar', explanation: 'Saldo antes, confirmar, saldo después: available == before - amount.' },
      { flag: 'reto.doble', label: 'Reintento de la confirmación: 409', explanation: 'Confirmar dos veces el mismo id en un escenario.' },
      { flag: 'reto.fondos', label: 'Sin saldo: 422 INSUFFICIENT_FUNDS', explanation: '* set body.amount = 999999 sobre el mismo JSON.' },
    ],
  },

  concepts: [
    { id: 'payloads', title: 'Cuerpos y ficheros', summary: 'request fija el cuerpo; read() lee JSON con expresiones embebidas #(var); set, remove y copy adaptan el cuerpo para cada caso.' },
    { id: 'chaining', title: 'Encadenar y probar el efecto', summary: 'def guarda datos de una respuesta para la siguiente petición. Una operación se prueba leyendo lo creado y comprobando su efecto, no solo su código.' },
    { id: 'http_codes', title: 'Códigos de respuesta', summary: '201 creado, 400 petición no válida, 404 no existe, 409 conflicto con el estado, 422 regla de negocio. Los partners programan según el código exacto.' },
  ],
  debriefConcepts: ['payloads', 'chaining', 'http_codes'],
  seniorTips: [
    'Lee la especificación de transferencias: cada regla es un escenario.',
    "Crear: request + method post + status 201 + match response contains { status: 'PENDING' }.",
    'Saca el cuerpo a payloads/transfer.json con "#(amount)" y define las variables antes del read.',
    "* def transferId = response.id y GET /transfers/{id}: prueba con 150.75, no con un número redondo.",
    'Saldo antes, confirmar, saldo después. Y confirma dos veces: debe dar 409.',
    'Sin saldo: * set body.amount = 999999 → 422 INSUFFICIENT_FUNDS.',
  ],
}
