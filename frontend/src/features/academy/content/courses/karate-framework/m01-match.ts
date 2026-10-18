import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m01Lab } from './m01-lab'
import { m01Lessons } from './m01-lessons'
import { m01Quiz } from './m01-quiz'
import { m01Scenes } from './m01-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 2 — Match, tu superpoder.
 * Guion legible: docs/academy/karate-framework/missions/m01-match.md
 *
 * Tests de contrato: marcadores difusos, esquemas reutilizables con def,
 * match each y contains. A las 13:00 se despliega la 1.5: un cambio
 * compatible (alias opcional) y uno incompatible sin documentar (holder
 * renombrado) que rompería a un partner.
 */
export const m01Match: Mission = {
  id: 'm01-match',
  courseKey: 'karate-framework',
  number: 1,
  title: 'Match, tu superpoder',
  subtitle: 'Contratos: marcadores difusos, esquemas, match each y cambios compatibles.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Martes',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m01Lab,
  initialMetrics: {},
  lessons: m01Lessons,
  mentor: 'sergio',
  quiz: m01Quiz,
  verdicts: {
    good: {
      title: 'Contrato blindado',
      body: 'Tu suite valida la forma de cada respuesta y distinguió un cambio compatible de uno que habría roto a un partner. Así se protege una API pública.',
    },
    ok: {
      title: 'Contrato a medias',
      body: 'Validas parte de la forma, pero algún cambio o algún tipo se te escapó. Mira en el debrief qué no cubría tu esquema.',
    },
    bad: {
      title: 'Datos, no contratos',
      body: 'Comprobar unos pocos valores no protege a los partners de un cambio de forma. Repite la misión empezando por la lección de marcadores difusos.',
    },
  },

  briefing: {
    title: 'Martes: contratos',
    paragraphs: [
      'Faltan dos días para la beta. A un partner se le rompió hace poco la integración con otra API por un cambio de tipo que nadie avisó.',
      'Alba quiere que, si cambia la forma de nuestras respuestas, lo vea vuestra suite antes que los partners. Hoy escribes tests de contrato con match y marcadores difusos.',
      'Nico despliega la 1.5 a mediodía. Vuelve a ejecutar tu suite después: no todo cambio es un bug, pero alguno sí.',
    ],
    goals: [
      'Explica en el refinamiento qué protege un test de contrato.',
      'Valida el contrato completo de una cuenta con marcadores difusos.',
      'Reutiliza el esquema con def y afínalo con #regex y un predicado.',
      'Valida la lista de cuentas activas: filtro y forma de cada elemento.',
      'Tras el despliegue de la 1.5, adapta lo compatible y reporta lo incompatible.',
      'Responde a Finvo con datos en la reunión de las 16:30.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m01Scenes,
  endSceneId: 'closing',

  docs: [
    API_REFERENCE_DOC,
    {
      id: 'chuleta_match',
      title: 'Chuleta de match',
      updatedLabel: 'Mantenida por Sergio Navas',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'fuzzy' },
        { kind: 'flag', key: 'doc.match' },
      ],
      body: `## Operadores
- **==** igualdad exacta (mismas claves). **!=** distinto.
- **contains** contiene esas claves o elementos. **!contains**, **contains only**, **contains any**.
- **match each** lista ==/contains elemento: aplica a cada elemento.

## Marcadores difusos
- **#string #number #boolean #array #object** · **#null #notnull #present #notpresent** · **#ignore**
- **#uuid** · **#regex EXPR** (la expresión entera; la barra va doble: \`\\\\d\`)
- **#? EXPR** con \`_\` como valor · **#number? _ >= 0**
- **##marcador**: opcional (puede faltar o ser null).
- **#[]** lista · **#[3]** lista de 3 · **#[] #string** lista de strings.

## Patrón de contrato
\`\`\`
Background:
  * url baseUrl
  * def account = { id: '#string', balance: '#number', ... }

Scenario: contrato del detalle
  Given path 'accounts', 'ACC-1001'
  When method get
  Then status 200
  And match response == account
\`\`\``,
    },
    {
      id: 'changelog',
      title: 'Changelog · Kobalto Open API 1.5.0',
      updatedLabel: 'Publicado por Nicolás Prado',
      readCost: 3,
      visibleWhen: { kind: 'flag', key: 'api.v15' },
      onRead: [{ kind: 'unlock', conceptId: 'compat' }, { kind: 'flag', key: 'doc.changelog' }],
      body: `## 1.5.0
- **Nuevo**: campo **alias** en las cuentas (string, **opcional**: puede ser null). Nombre que el cliente pone a su cuenta.
- Sin cambios incompatibles.

## 1.4.2
- Corrección de rendimiento en /accounts.`,
    },
  ],

  tickets: [
    {
      id: 'API-15',
      title: 'Tests de contrato de cuentas',
      status: 'En curso',
      type: 'story',
      description: 'Como equipo de Open API, queremos detectar cualquier cambio en la forma de las respuestas de cuentas antes de que afecte a los partners.',
      acceptanceCriteria: ['Contrato del detalle de cuenta.', 'Contrato de cada elemento de la lista.', 'El filtro por estado devuelve solo cuentas de ese estado.'],
      comments: [{ author: 'alba', body: 'Si algo cambia, que lo veamos nosotros primero.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-FILTRO',
      title: 'El filtro status=ACTIVE también devuelve cuentas cerradas (ACC-1005)',
      severity: 'high',
      explanation: 'La consulta trataba CLOSED como activa por un error en la condición. Un partner mostraría cuentas cerradas como operativas.',
      technique: 'match each sobre la lista filtrada: cada elemento debe cumplir el filtro.',
      fix: { delay: 90, note: 'Corregida la condición del filtro por estado. Desplegado en sandbox.' },
      repro: { groups: [['status', 'filtro', 'active', 'activ'], ['closed', 'cerrad', '1005']], ask: '¿Qué filtro usaste y qué cuenta aparece que no debería?' },
    },
    {
      id: 'KA-TIPO',
      title: 'Los saldos a cero llegan como texto ("0.00") en lugar de número',
      severity: 'high',
      explanation: 'El serializador formateaba los saldos a cero como string. Las apps que esperan un número fallan al leerlo: justo lo que le pasó al partner el mes pasado.',
      technique: "Contrato con tipos: balance: '#number' validado en cada elemento de la lista (match each).",
      fix: { delay: 90, note: 'balance se serializa siempre como número. Desplegado en sandbox.' },
      repro: { groups: [['balance', 'saldo'], ['string', 'texto', '0.00', 'tipo', 'number', 'numero']], ask: '¿Qué campo, de qué cuenta, y qué tipo llega frente al que dice la referencia?' },
    },
    {
      id: 'KA-CONTRATO',
      title: 'La 1.5 renombra holder a holderName sin avisar',
      severity: 'critical',
      explanation: 'Un cambio incompatible sin documentar: las integraciones que leen holder (como la de Finvo) dejarían de mostrar el titular.',
      technique: 'Contrato estricto (==) ejecutado tras cada despliegue, distinguiendo cambios compatibles de incompatibles con el changelog.',
      fix: { delay: 60, note: 'Revertido: vuelve holder. holderName se anunciará para la v2 con tiempo.' },
      repro: { groups: [['holder', 'holdername', 'titular'], ['1.5', 'renombr', 'falta', 'missing', 'present', 'cambi']], ask: '¿Qué campo falta o ha cambiado, y en qué versión?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Lo que validaba tu suite de contratos al terminar el día.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.esquema', label: 'Contrato completo del detalle de cuenta', explanation: "match response == { id: '#string', … balance: '#number', … } con los ocho campos." },
      { flag: 'reto.reutiliza', label: 'Esquema reutilizable con def', explanation: '* def account = { … } en el Background y match response == account.' },
      { flag: 'reto.formato', label: 'Formatos: #regex y predicados', explanation: "iban: '#regex ES\\\\d{22}' y balance: '#number? _ >= 0'." },
      { flag: 'reto.lista', label: 'Filtro de cuentas activas con match each', explanation: "param status = 'ACTIVE' y match each response.items contains { status: 'ACTIVE' }." },
      { flag: 'reto.tipos', label: 'Contrato de cada elemento de la lista', explanation: 'match each response.items == account.' },
      { flag: 'reto.evolucion', label: 'Contrato adaptado a la 1.5', explanation: "alias: '##string' (compatible) y holder reportado si desaparece (incompatible)." },
    ],
  },

  concepts: [
    { id: 'contract', title: 'Test de contrato', summary: 'Valida la forma de la respuesta (campos, tipos, formatos), no los datos concretos. Detecta cambios que romperían a los consumidores.' },
    { id: 'fuzzy', title: 'Marcadores difusos', summary: "#string, #number, #regex, #? expr, ##opcional… Comparan forma en lugar de valor y hacen el contrato robusto ante datos que cambian." },
    { id: 'each', title: 'match each y contains', summary: 'match each valida cada elemento de una lista; contains compara solo las claves indicadas. El mensaje de error indica elemento y campo ($[1].balance).' },
    { id: 'compat', title: 'Cambios compatibles e incompatibles', summary: 'Añadir campos opcionales es compatible; quitar, renombrar o cambiar el tipo rompe a los clientes. El changelog y el contrato deciden si es bug.' },
  ],
  debriefConcepts: ['contract', 'fuzzy', 'each', 'compat'],
  seniorTips: [
    'Lee la chuleta de match y la referencia: el contrato sale de ahí, no de la respuesta que ves hoy.',
    "Contrato con los ocho campos: id, iban, holder, type, currency, balance ('#number'), status y createdAt.",
    "Guárdalo con def en el Background y afínalo: '#regex ES\\\\d{22}' y '#number? _ >= 0'.",
    "Lista: param status = 'ACTIVE', match each … contains { status: 'ACTIVE' } y match each … == account.",
    'Tras el despliegue de las 13:00, vuelve a ejecutar y lee el changelog: alias es compatible; que falte holder, no.',
    'Reporta cada bug con su escenario como evidencia y responde a Finvo con lo que sabes.',
  ],
}
