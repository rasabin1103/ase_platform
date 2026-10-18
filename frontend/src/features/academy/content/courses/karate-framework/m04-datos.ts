import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m04Lab } from './m04-lab'
import { m04Lessons } from './m04-lessons'
import { m04Quiz } from './m04-quiz'
import { m04Scenes } from './m04-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 5 — Dirigido por datos.
 * Guion legible: docs/academy/karate-framework/missions/m04-datos.md
 *
 * Reglas de las transferencias para partners (límites de importe, validaciones
 * y concepto de 140). El alumno convierte escenarios en Scenario Outline con
 * columnas tipadas, Examples dinámicos desde JSON y valores límite. Los bugs
 * solo aparecen en los bordes exactos.
 */
export const m04Datos: Mission = {
  id: 'm04-datos',
  courseKey: 'karate-framework',
  number: 4,
  title: 'Dirigido por datos',
  subtitle: 'Scenario Outline, Examples tipados y desde JSON, valores límite y matriz de errores.',
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
  codeLab: m04Lab,
  initialMetrics: {},
  lessons: m04Lessons,
  mentor: 'sergio',
  quiz: m04Quiz,
  verdicts: {
    good: {
      title: 'Cada regla, en su borde',
      body: 'Tus tablas prueban cada regla justo dentro y justo fuera de su límite, y los datos viven fuera del feature. Los bugs de borde no llegaron al lunes.',
    },
    ok: {
      title: 'Tablas con huecos',
      body: 'Tienes datos en tablas, pero algún borde o alguna regla se quedó sin fila. Mira en el debrief qué valor exacto faltaba.',
    },
    bad: {
      title: 'Copiar y pegar',
      body: 'Escenarios repetidos con valores del medio no encuentran los errores de límite. Repite la misión empezando por la lección «¿Qué datos pongo en la tabla?».',
    },
  },

  briefing: {
    title: 'Viernes: las reglas',
    paragraphs: [
      'Nico arregló ayer el doble cobro. El lunes Finvo empieza a hacer transferencias y Compliance ha fijado límites para los partners.',
      'Cada regla de la especificación necesita su prueba, y casi todas tienen un borde: un mínimo, un máximo, una longitud.',
      'Hoy escribes los pasos una vez y los datos en tablas. Los bugs de hoy solo aparecen en el valor exacto del borde.',
    ],
    goals: [
      'En la planificación, decide qué datos prueban un límite.',
      'Convierte el escenario en un Scenario Outline con importes tipados.',
      'Prueba justo a cada lado de cada borde del importe.',
      'Cubre la matriz de errores y llévala a un JSON como Examples dinámicos.',
      'Prueba el concepto de 140 caracteres que pide Carmen.',
      'Responde con datos si Finvo puede empezar el lunes.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m04Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'reglas',
      title: 'Transferencias · reglas para partners',
      updatedLabel: 'Compliance y Open API',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'boundaries' },
        { kind: 'flag', key: 'doc.rules' },
      ],
      body: `## Importe
- Número con **2 decimales como máximo**. Si no: **400 VALIDATION_ERROR** (field amount).
- **Mínimo 0,01 €**. 0 o negativo: **400 VALIDATION_ERROR**.
- **Máximo 1.000,00 € por transferencia** en cuentas **PERSONAL** (1.000,00 se acepta). Por encima: **422 LIMIT_EXCEEDED**.
- No puede superar el saldo disponible: **422 INSUFFICIENT_FUNDS**.

## Cuenta de origen
- Tiene que existir (**404 ACCOUNT_NOT_FOUND**) y estar **ACTIVE** (**422 ACCOUNT_NOT_OPERATIVE**).
- La divisa de la transferencia es la de la cuenta (**422 CURRENCY_MISMATCH**).

## Destino y concepto
- **toIban**: ES + 22 dígitos, sin espacios (**400 INVALID_IBAN**).
- **concept**: opcional, **hasta 140 caracteres** (140 se acepta). Más largo: **400 VALIDATION_ERROR** (field concept).

## Datos del sandbox útiles
- ACC-1001 · personal, EUR, saldo 1.520,35 · ACC-1002 · saldo 0 · ACC-1003 · bloqueada · ACC-1004 · en USD.`,
    },
    API_REFERENCE_DOC,
  ],

  tickets: [
    {
      id: 'API-27',
      title: 'Límites y validaciones de transferencias para partners',
      status: 'En QA',
      type: 'story',
      description: 'Como Compliance, queremos que las transferencias iniciadas por partners respeten los límites y validaciones acordados antes de abrirlas a Finvo.',
      acceptanceCriteria: [
        'Importe entre 0,01 € y 1.000,00 € (ambos incluidos) en cuentas personales.',
        'Todas las validaciones de la especificación devuelven su código.',
        'Concepto de hasta 140 caracteres.',
      ],
      comments: [{ author: 'nico', body: 'Implementado. Los límites los he puesto con cuidado (creo).' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-LIMITE',
      title: 'Una transferencia de 1.000,00 € justos se rechaza con LIMIT_EXCEEDED',
      severity: 'high',
      explanation: 'La comprobación usaba >= en lugar de >: el propio límite, que la regla permite, quedaba fuera. Muchos pagos (alquileres, nóminas) son de importes redondos.',
      technique: 'Valores límite: probar el borde exacto (1.000,00) además del primero de fuera (1.000,01).',
      fix: { delay: 60, note: 'El límite incluye ya los 1.000,00 €. Desplegado en sandbox.' },
      repro: { groups: [['1000', '1.000', 'limite', 'limit'], ['422', 'rechaz', 'limit_exceeded']], ask: '¿Qué importe exacto se rechaza y qué dice la regla?' },
    },
    {
      id: 'KA-CENT',
      title: 'Se rechazan los importes por debajo de 1 € (el mínimo es 0,01 €)',
      severity: 'medium',
      explanation: 'La validación del mínimo comparaba con 1 en lugar de con 0,01. Pagos pequeños (propinas, comisiones) fallaban.',
      technique: 'Valores límite en el borde inferior: 0 (fuera) y 0,01 (dentro).',
      fix: { delay: 90, note: 'El mínimo es ya 0,01 €. Desplegado.' },
      repro: { groups: [['0.01', '0,01', 'minimo', 'centimo', 'menos de 1'], ['400', 'rechaz', 'validation']], ask: '¿Qué importe exacto se rechaza y cuál es el mínimo de la regla?' },
    },
    {
      id: 'KA-CONCEPTO',
      title: 'Un concepto de 140 caracteres justos se rechaza',
      severity: 'medium',
      explanation: 'La validación usaba < 140 en lugar de <= 140. Los conceptos SEPA completos que mandan los ERP fallaban.',
      technique: 'Valores límite en longitudes de texto: 140 y 141 caracteres.',
      fix: { delay: 90, note: 'El concepto admite ya 140 caracteres. Desplegado.' },
      repro: { groups: [['concept', 'concepto'], ['140', 'longitud', 'caracteres']], ask: '¿Cuántos caracteres tenía el concepto rechazado y qué dice la regla?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Cómo quedaron las reglas de las transferencias al terminar la semana.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.outline', label: 'Scenario Outline con varios importes', explanation: 'Los pasos una vez; una fila por caso con amount! para que llegue como número.' },
      { flag: 'reto.limites', label: 'Los bordes del importe', explanation: '0,01 · 1.000 · 1.000,01 (y 0): justo dentro y justo fuera de cada límite.' },
      { flag: 'reto.codigos', label: 'Lo esperado en la tabla', explanation: 'Then status <status> con filas que esperan 201 y filas que esperan error.' },
      { flag: 'reto.negativos', label: 'Matriz de errores', explanation: 'IBAN, divisa, cuenta bloqueada, sin saldo, límite… cada uno con su código.' },
      { flag: 'reto.json', label: 'Examples dinámicos desde JSON', explanation: "Examples: | read('data/negativos.json') | con karate.merge(body, patch)." },
      { flag: 'reto.concepto', label: 'Concepto de 140 y 141 caracteres', explanation: "* set body.concept = 'x'.repeat(len) con len! en la tabla." },
    ],
  },

  concepts: [
    { id: 'outline', title: 'Scenario Outline y Examples', summary: 'Pasos con <columnas> y una fila por caso. Columnas con ! se evalúan (números, objetos). Examples dinámicos: | read(\'datos.json\') |, cada objeto una fila.' },
    { id: 'boundaries', title: 'Valores límite en tests de API', summary: 'Para cada rango, justo dentro y justo fuera de cada borde (0/0,01, 1.000/1.000,01, 140/141). Pocos datos deterministas y bien elegidos.' },
  ],
  debriefConcepts: ['outline', 'boundaries'],
  seniorTips: [
    'Lee las reglas en la wiki: cada una con su borde y su código de error.',
    'Scenario Outline con amount! en la cabecera para que el importe llegue como número.',
    'Filas 0 · 0,01 · 1.000 · 1.000,01 con su status esperado en otra columna.',
    'Matriz de errores en data/negativos.json y Examples: | read(\'data/negativos.json\') | con karate.merge.',
    "Concepto: len! 140 y 141 con 'x'.repeat(len).",
    'Reporta cada fila en rojo diciendo el valor exacto que falla.',
  ],
}
