import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { MAX_ACTIVE_ORDERS, SANDBOX_TODAY } from '../../../../karate/apis/kobaltoOpenApi'
import { EXAM_MIN_SCENARIOS } from '../m10-lab'
import { m10LabEn } from './m10-lab'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * English translation of ../m10-examen.ts (same structure and ids).
 *
 * Four hours, no mentor and no hints, on a new API resource (standing orders)
 * with bugs the student has not seen. Score: 10 points per challenge and 5 per
 * reported bug, −5 per rejected report; passes with 70/100.
 */
export const m10ExamenEn: Mission = {
  id: 'm10-examen',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 10,
  title: 'Practical exam',
  subtitle: 'Four hours, no hints: automate a new API resource and find its bugs. Pass with 70 out of 100.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Monday',
  duration: 240,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m10LabEn,
  practicalExam: { passMark: 70, retoPoints: 10, bugPoints: 5, rejectedPenalty: 5 },
  initialMetrics: {},
  hideBugList: true,
  verdicts: {
    good: {
      title: 'Practical exam passed',
      body: 'You automated a resource you did not know, with judgment and without help, and you found what was wrong. This counts toward the certificate.',
    },
    ok: {
      title: 'Practical exam passed',
      body: 'Passed. Check the details to see which challenges and which bugs slipped through.',
    },
    bad: {
      title: 'Practical exam not passed',
      body: 'You have not reached 70 yet. See which challenges were missing, review the matching mission and try again: the exam can be retaken.',
    },
  },

  briefing: {
    title: 'Practical exam',
    paragraphs: [
      'Monday, 09:00. The squad is launching a new resource in the Open API: standing orders (scheduled transfers). Nobody has tested it yet.',
      'You have four hours to automate it with Karate and find out what is broken. There is no mentor and there are no hints: the contract is in the wiki and the suite framework (login, error schema, test-account utility, runner) is already in place.',
      'Each challenge is worth 10 points and each real bug you report, 5. A rejected report takes away 5. You pass with 70 out of 100.',
    ],
    goals: [
      'Read the standing orders contract in the wiki.',
      'Complete the 8 challenges in the IDE (80 points).',
      'Report the bugs you find on the Board (5 points each).',
      'Do not report what is not a bug: it costs you points.',
      'Hand in before 13:00.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: [
    {
      id: 'mail_exam',
      channel: 'email',
      from: 'ivan',
      at: 0,
      subject: 'Practical exam: standing orders',
      body: `Good morning,\n\nToday we launch **/standing-orders** in the sandbox, and it is your practical exam. The contract is in the wiki (“Standing orders”).\n\n- You have until **13:00**.\n- The IDE **challenges** are worth 10 points each; each real **bug** you report on the Board, 5; a rejected report takes away 5.\n- You pass with **70 out of 100**.\n\nThe suite framework is ready: login in karate-config.js, \`schemas/error.json\`, \`common/cuenta-prueba.feature\` and the nightly runner.\n\nGood luck.\nIván`,
    },
    {
      id: 'reminder',
      channel: 'chat',
      from: 'ivan',
      at: 180,
      body: '**One hour** left. If you have not done it yet, launch the nightly run and report what you have found.',
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ivan',
      at: 240,
      subject: '13:00 · Hand-in',
      body: '**Iván:** Time is up. Let us look at the score.',
      choices: [{ id: 'submit', text: 'Hand in the exam.', reply: 'Received. Here is your result.', effects: [{ kind: 'endMission' }] }],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'standing_orders',
      title: 'Standing orders · contract (Open API 1.8)',
      updatedLabel: 'Maintained by Nicolás Prado',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'doc.standing' }],
      body: `## Endpoints (OAuth2 token)
- **POST /standing-orders** (scope transfers:write) → **201** with the order and a Location header.
- **GET /standing-orders/{id}** (accounts:read) → **200**. Id in SO-0000 format (otherwise, 400 INVALID_ORDER_ID). Not found: 404 STANDING_ORDER_NOT_FOUND.
- **GET /standing-orders?accountId=ACC-0000** (accounts:read) → **200** { items, total }.
- **DELETE /standing-orders/{id}** (scope **transfers:write**) → **204** with no body; from then on the order is **CANCELLED** and nextExecution is null. Cancelling again: 409 ALREADY_CANCELLED. Without the scope: **403 INSUFFICIENT_SCOPE**.

## Create: body
- **fromAccount**, **toIban** (ES + 22 digits), **amount**, **currency**, **frequency**, **startDate** (YYYY-MM-DD) and **concept** (optional).
- **frequency**: exactly **WEEKLY**, **MONTHLY** or **QUARTERLY** (uppercase).

## Rules
- **amount**: greater than 0, up to 2 decimals. On personal accounts, at most **1,000** per order (above that: 422 LIMIT_EXCEEDED).
- **startDate**: **today or later**. The sandbox is fixed at **${SANDBOX_TODAY}**. A past date: 400 VALIDATION_ERROR (field startDate).
- At most **${MAX_ACTIVE_ORDERS} active orders** per account (otherwise: 422 TOO_MANY_ORDERS). Use test accounts.
- The account must be active (422 ACCOUNT_NOT_OPERATIVE) and in the same currency (422 CURRENCY_MISMATCH).
- Validation errors: **400 VALIDATION_ERROR** with **field**, in the common error format.

## Order
- { id, fromAccount, toIban, amount, currency, frequency, startDate, nextExecution, concept, status, createdAt }
- **status**: ACTIVE or CANCELLED. **nextExecution**: the next execution date (on creation, startDate; once cancelled, null).

## Grading
- 8 challenges × 10 points, 4 bugs × 5 points, −5 per rejected report. Pass mark: 70. Nightly run: at least ${EXAM_MIN_SCENARIOS} scenarios.`,
    },
    API_REFERENCE_DOC_EN,
  ],

  tickets: [
    {
      id: 'API-60',
      title: 'Standing orders for partners',
      status: 'In QA',
      type: 'story',
      description: 'As a partner, I want to schedule recurring transfers for my users and be able to cancel them.',
      acceptanceCriteria: ['Create, fetch and cancel according to the contract.', 'Validation of frequency, amount and date.', 'Cancelling requires transfers:write.'],
      comments: [],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-FRECUENCIA',
      title: 'Lowercase frequency is accepted',
      severity: 'medium',
      explanation: 'The validation compared case-insensitively and stored the value as sent: “monthly” was accepted and then the scheduler did not recognise it.',
      technique: 'Negative cases for the enum: values outside the list, also with different capitalisation.',
      repro: { groups: [['frequency', 'freq'], ['lowercase', 'lower case', 'monthly', 'weekly', '201']], ask: 'What frequency value did you send and what did the API respond?' },
    },
    {
      id: 'KA-HOY',
      title: 'An order starting today is rejected',
      severity: 'high',
      explanation: 'The date comparison used “greater than” instead of “greater than or equal”: today, which the contract allows, was rejected.',
      technique: 'Boundary values of the start date: yesterday, today and tomorrow.',
      repro: { groups: [['startdate', 'start date', 'today', '2026-10-23'], ['400', 'reject', 'boundary', 'limit']], ask: 'What start date did you send and what did the API respond?' },
    },
    {
      id: 'KA-CANCELAR',
      title: 'Cancel returns 204 but the order stays active',
      severity: 'critical',
      explanation: 'The cancellation was recorded in another table and the order status was not updated: the order kept running.',
      technique: 'Chaining: cancel and then fetch.',
      repro: { groups: [['cancel', 'delete'], ['active', 'still', 'status', 'cancelled']], ask: 'What did you do after cancelling and what status did the order have?' },
    },
    {
      id: 'KA-SCOPE-DEL',
      title: 'A read-only token can cancel orders',
      severity: 'critical',
      explanation: 'The DELETE did not check the scope: any valid token could cancel payment orders.',
      technique: 'Negative authorization test with a least-privilege token.',
      repro: { groups: [['scope', 'accounts:read', 'read-only', 'token'], ['delete', 'cancel', '204', '403']], ask: 'Which token did you cancel with and what did the API respond?' },
    },
  ],

  prevention: {
    title: 'Exam challenges',
    intro: 'What you achieved in the practical exam.',
    preventedLabel: 'Bugs found in time',
    appearedLabel: 'Bugs',
    rules: m10LabEn.retos.map((r) => ({ flag: `reto.${r.id}`, label: r.title, explanation: r.description.replace(/\*\*|`/g, '') })),
  },

  concepts: [],
  debriefConcepts: [],
  seniorTips: [],
}
