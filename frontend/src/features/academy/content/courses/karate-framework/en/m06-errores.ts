import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m06LabEn } from './m06-lab'
import { m06LessonsEn } from './m06-lessons'
import { m06QuizEn } from './m06-quiz'
import { m06ScenesEn } from './m06-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * Course 3: Karate Framework · Mission 7 — When everything fails.
 * English translation of ../m06-errores.ts (same structure and ids).
 *
 * Open API 1.7 makes transfers asynchronous (202 PROCESSING). The player
 * adapts the suite with retry until and configure retry, validates the common
 * error format with a schema, builds the table of negative cases and tests
 * garbage input and simulated outages (x-sandbox-fault).
 */
export const m06ErroresEn: Mission = {
  id: 'm06-errores',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 6,
  title: 'When everything fails',
  subtitle: 'Negative cases, error schema, retry until and configure retry, responseHeaders and simulated outages.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Tuesday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m06LabEn,
  initialMetrics: {},
  lessons: m06LessonsEn,
  mentor: 'sergio',
  quiz: m06QuizEn,
  verdicts: {
    good: {
      title: 'Ready for the worst',
      body: 'Your suite knows how the API responds when something goes wrong: errors with a verified format, a table of negative cases, waits with retry until and simulated outages. And you found what would have failed on Thursday.',
    },
    ok: {
      title: 'Mostly happy paths',
      body: 'The suite is green again, but some error, some wait or some destination was left untested. Check the debrief.',
    },
    bad: {
      title: 'Only when everything goes well',
      body: 'Without negative cases or reliable waits, the suite says nothing about what happens when something fails. Replay the mission starting with the lesson “Which negative cases are worth automating?”.',
    },
  },

  briefing: {
    title: 'Tuesday: what fails',
    paragraphs: [
      'Open API 1.7 was deployed to sandbox last night: confirming a transfer no longer completes it straight away. The transfers suite woke up red.',
      'Finvo starts with real transfers on Thursday. Before that, Iván wants to know how the API behaves when things go wrong: errors, bad input, outages.',
      'Today you leave the happy path: the error format is part of the contract too, and asynchronous work has to be waited for properly.',
    ],
    goals: [
      'Decide whether the red suite is a bug or the contract change.',
      'At the stand-up, propose how to wait for a transfer.',
      'Fix the transfers scenario with retry until.',
      'Validate the error format with a common schema and a table of negative cases.',
      'Test garbage input and a simulated outage.',
      'Decide with data whether transfers to other banks go live.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m06ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'errores',
      title: 'Guide to errors and asynchronous transfers (Open API 1.7)',
      updatedLabel: 'Maintained by Nicolás Prado',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'errores' },
        { kind: 'flag', key: 'doc.errores' },
      ],
      body: `## Common error format
- Every error: **{ code, message, traceId }**. traceId is a UUID: it’s what the partner gives us when they open an incident.
- Validation errors: also **field** (the field that fails).
- Internal stack traces or the framework’s default error are never returned.

## Catalogue
- **400** VALIDATION_ERROR (with field), INVALID_IBAN, INVALID_ACCOUNT_ID, INVALID_STATUS, INVALID_PAGE, INVALID_SIZE
- **401** UNAUTHORIZED, INVALID_TOKEN, TOKEN_REVOKED · **403** INSUFFICIENT_SCOPE
- **404** ACCOUNT_NOT_FOUND, TRANSFER_NOT_FOUND, NOT_FOUND (route)
- **405** METHOD_NOT_ALLOWED (e.g. GET on /transfers)
- **409** TRANSFER_ALREADY_CONFIRMED
- **422** INSUFFICIENT_FUNDS, ACCOUNT_NOT_OPERATIVE, CURRENCY_MISMATCH
- **429** TOO_MANY_REQUESTS (with Retry-After)
- **5xx** INTERNAL_ERROR (500), SERVICE_UNAVAILABLE (503, with **Retry-After** in seconds), GATEWAY_TIMEOUT (504)

## Asynchronous transfers (1.7)
- **POST /transfers/{id}/confirm** → **202** with the transfer in **status: PROCESSING** and a Location header.
- Processing takes **up to 8 seconds**, whether to a Kobalto account or to **another bank**. Afterwards, GET /transfers/{id} returns **COMPLETED** with completedAt.
- Recommendation for partners: poll **every second**; Finvo’s timeout: 10 s.
- Confirming a transfer that is already processing or completed: **409 TRANSFER_ALREADY_CONFIRMED**.

## Simulating failures in the sandbox
- Header **x-sandbox-fault** with 500, 503 or 504 on any call to /accounts or /transfers: the API responds with that error (common format).
- Sandbox only: ignored in pre and prod.`,
    },
    API_REFERENCE_DOC_EN,
  ],

  tickets: [
    {
      id: 'API-38',
      title: 'Asynchronous transfers for partners',
      status: 'In QA',
      type: 'story',
      description: 'As a partner, I want to confirm a transfer and check its status until it completes, so my app isn’t blocked while it’s processed.',
      acceptanceCriteria: ['Confirming returns 202 PROCESSING.', 'The transfer reaches COMPLETED within 8 s at most, to any bank.', 'Confirming twice returns 409.'],
      comments: [{ author: 'nico', body: 'Deployed to sandbox last night (1.7).' }],
      actions: [],
    },
    {
      id: 'API-39',
      title: 'Common error format',
      status: 'Done',
      type: 'story',
      description: 'As a partner, I want every error to have the same format ({ code, message, traceId }) so I can handle them the same way and open incidents with the traceId.',
      acceptanceCriteria: ['Every 4xx and 5xx with code, message and traceId.', 'Validations state the field.', 'Never internal stack traces.'],
      comments: [],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-ASYNC',
      title: 'Transfers to other banks stay in PROCESSING forever',
      severity: 'critical',
      explanation: 'The external transfers processor wasn’t receiving the confirmation from the clearing system: the money left the account and the transfer never completed.',
      technique: 'Wait for the final status with retry until and repeat the case with a destination at another bank (Scenario Outline per destination).',
      fix: { delay: 90, note: 'The external transfers processor now listens for the clearing confirmation. Deployed to sandbox.' },
      repro: { groups: [['other bank', 'external', 'iban', 'es1420'], ['processing', 'retry', 'never', 'completed', 'stuck']], ask: 'Which IBAN did you send the transfer to, and what status did it get stuck in?' },
    },
    {
      id: 'KA-PARSE',
      title: 'An amount as text returns 500 with a Java error',
      severity: 'medium',
      explanation: 'The amount was converted to BigDecimal without validating its type first: a text value caused an unhandled exception and a 500 that also exposed internal details.',
      technique: 'Garbage input: wrong types in the body → 400 VALIDATION_ERROR with field.',
      fix: { delay: 60, note: 'The type of amount is now validated before converting it: 400 VALIDATION_ERROR. Deployed.' },
      repro: { groups: [['amount', 'text', 'string', '10,50'], ['500', 'bigdecimal', 'deserialize', '400']], ask: 'What amount did you send, and what did the API respond?' },
    },
    {
      id: 'KA-ERRFMT',
      title: 'The 404 for a missing transfer doesn’t follow the common error format',
      severity: 'medium',
      explanation: 'The transfers controller lacked the common error handler: the 404 came out in the framework’s default format ({ timestamp, status, error, path }), without code or traceId.',
      technique: 'Validate every error against a common schema (match response == errorSchema), not just the status.',
      fix: { delay: 60, note: 'Transfers now use the common error handler. Deployed.' },
      repro: { groups: [['transfer', 'transfers', 'trf'], ['404', 'format', 'code', 'traceid', 'timestamp', 'schema']], ask: 'What did you request, and what was missing from the response?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'How the suite stood up to errors at the end of the day.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that appeared',
    rules: [
      { flag: 'reto.esquema', label: 'Common error schema', explanation: "* def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' } and match response == errorSchema." },
      { flag: 'reto.negativos', label: 'Table of negative cases', explanation: 'Scenario Outline with status and code per row: 400, 404, 405…' },
      { flag: 'reto.asincrona', label: 'Waiting with retry until', explanation: "202 PROCESSING and retry until response.status == 'COMPLETED' with a tuned configure retry." },
      { flag: 'reto.basura', label: 'Garbage input → 400', explanation: "amount: '10,50' → 400 VALIDATION_ERROR with field amount." },
      { flag: 'reto.caida', label: 'Simulated outage → 503 + Retry-After', explanation: "header x-sandbox-fault = '503' and responseHeaders['Retry-After']." },
      { flag: 'reto.externa', label: 'Transfer to another bank', explanation: 'The same flow with an IBAN outside Kobalto (Outline per destination).' },
    ],
  },

  concepts: [
    { id: 'negativos', title: 'Negative cases', summary: 'One per rule a partner can break: format (400), doesn’t exist (404), not allowed (405/409/422), security (401/403). In a table, checking status and code.' },
    { id: 'errores', title: 'Errors are contract too', summary: 'A reusable common schema (code, message, traceId, ##field), headers such as Retry-After in responseHeaders, never internal traces or 5xx caused by the client.' },
    { id: 'retry', title: 'retry until', summary: 'Repeats the request until the condition holds. By default 3 attempts every 3 s; configure retry = { count, interval } according to the contract. Never fixed sleeps.' },
  ],
  debriefConcepts: ['negativos', 'errores', 'retry'],
  seniorTips: [
    'Read the “Error guide” in the Wiki: the 202 is the new contract, not a bug.',
    "Confirm → status 202 → Given path 'transfers', id · And retry until response.status == 'COMPLETED' · When method get.",
    'Processing takes up to 8 s: configure retry = { count: 10, interval: 1000 }.',
    "Background: * def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }.",
    'Error table with Scenario Outline: 400, 404 (account and transfer), 405. Check the code of every row.',
    "Garbage: amount: '10,50' → 400. Outage: header x-sandbox-fault = '503' → 503 and Retry-After.",
    'Repeat the transfer with an IBAN from another bank.',
  ],
}
