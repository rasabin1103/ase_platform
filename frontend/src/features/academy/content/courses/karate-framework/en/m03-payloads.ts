import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m03LabEn } from './m03-lab'
import { m03LessonsEn } from './m03-lessons'
import { m03QuizEn } from './m03-quiz'
import { m03ScenesEn } from './m03-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * Course 3: Karate Framework · Mission 4 — POST and chaining.
 * English translation of ../m03-payloads.ts (same structure and ids).
 *
 * The beta is in production and transfers are next. The player creates
 * transfers with request and read(), chains requests with def, checks what was
 * stored and the effect on the balance, and tests retries and insufficient funds.
 * The API keeps state during each run (balances and transfers).
 */
export const m03PayloadsEn: Mission = {
  id: 'm03-payloads',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 3,
  title: 'POST and chaining',
  subtitle: 'request, read() with embedded expressions, def between requests, set and the effect of an operation.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Thursday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m03LabEn,
  initialMetrics: {},
  lessons: m03LessonsEn,
  mentor: 'sergio',
  quiz: m03QuizEn,
  verdicts: {
    good: {
      title: 'The money, under control',
      body: 'Your suite creates, reads, confirms and checks the balance, and it proved with evidence what happens with retries. That’s how you test an API that moves money.',
    },
    ok: {
      title: 'They get created, but…',
      body: 'Transfers get created and something is checked, but part of the effect or the rules went untested. Check the debrief.',
    },
    bad: {
      title: 'A 201 is not a test',
      body: 'Checking that something gets created doesn’t tell you what was stored or what effect it has. Replay the mission, starting with the lesson “What should you check after a POST?”.',
    },
  },

  briefing: {
    title: 'Thursday: we move money',
    paragraphs: [
      'The Open API beta is now in production. The next step the partners are asking for: initiating transfers from their apps.',
      'Nico has the endpoint in the sandbox. If all goes well, it opens to Finvo next week. This is no longer about reading data: it moves customers’ money.',
      'Today you write tests that create data, read it back and check its effect. The API keeps its state during each run, like a real server.',
    ],
    goals: [
      'In the refinement, explain what has to be checked in an operation that moves money.',
      'Create transfers with request and move the body to a file with embedded expressions.',
      'Chain: save the id, read the transfer and check what was stored.',
      'Confirm and check the effect on the balance.',
      'Answer Carmen about retries and Finvo about insufficient funds.',
      'Decide with evidence whether to open it to Finvo.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m03ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'transferencias',
      title: 'Transfers (beta) · Specification',
      updatedLabel: 'Maintained by Nicolás Prado',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'http_codes' },
        { kind: 'flag', key: 'doc.transfers' },
      ],
      body: `## Create · POST /transfers
- Body: **fromAccount** (account id), **toIban** (ES + 22 digits), **amount** (number > 0, at most 2 decimals), **currency** (the account’s currency), **concept** (optional, up to 140 characters).
- **201** with the transfer in **PENDING** status and a **Location** header. It doesn’t move any money yet.
- The amount is stored **exactly** as sent (with its decimals).

## Read · GET /transfers/{id}
- **200** with { id, fromAccount, toIban, amount, currency, concept, status, createdAt, completedAt }. **404 TRANSFER_NOT_FOUND** if it doesn’t exist.

## Confirm · POST /transfers/{id}/confirm
- **200**, status **COMPLETED**: deducts the amount from the account’s available balance.
- Confirming a transfer that is already completed: **409 TRANSFER_ALREADY_COMPLETED**. It is **never** charged twice.

## Errors
- **400 VALIDATION_ERROR** (with **field**): a required field is missing or a value is not valid.
- **400 INVALID_IBAN** · **404 ACCOUNT_NOT_FOUND**
- **422 ACCOUNT_NOT_OPERATIVE**: blocked or closed account.
- **422 CURRENCY_MISMATCH**: the currency is not the account’s currency.
- **422 INSUFFICIENT_FUNDS**: the amount exceeds the available balance.

## Balance · GET /accounts/{id}/balance
- { accountId, available, currency, updatedAt }. Reflects confirmed transfers.

## Destination IBAN for testing
- ES9121000418450200051333`,
    },
    API_REFERENCE_DOC_EN,
  ],

  tickets: [
    {
      id: 'API-24',
      title: 'Partner-initiated transfers',
      status: 'In QA',
      type: 'story',
      description: 'As an Open API partner, I want to initiate and confirm transfers on behalf of my customers so they can pay from my app.',
      acceptanceCriteria: [
        'Creating returns 201 in PENDING status and stores the data exactly as sent.',
        'Confirming deducts the amount from the balance only once.',
        'Without enough balance: 422 INSUFFICIENT_FUNDS.',
      ],
      comments: [{ author: 'nico', body: 'Deployed to sandbox. The POST returns 201 👍' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-IMPORTE',
      title: 'Transfers are stored without decimals (150.75 → 150)',
      severity: 'high',
      explanation: 'The amount column was mapped as an integer. The POST response echoed what it received, so it only showed up when reading the transfer afterwards.',
      technique: 'Chaining: create, save the id with def and read the resource with GET to check what was stored.',
      fix: { delay: 60, note: 'The amount is now stored with two decimals. Deployed to sandbox.' },
      repro: { groups: [['amount', 'decimal', 'cents'], ['150', 'truncat', 'no decimals', 'round', 'integer']], ask: 'What amount did you send, and what does the GET of the transfer return?' },
    },
    {
      id: 'KA-DOBLE',
      title: 'Confirming the same transfer twice charges it twice',
      severity: 'critical',
      explanation: 'The confirmation did not check the status: a partner retry after a timeout deducted the amount again.',
      technique: 'Idempotency test: repeat the operation in the same scenario and expect 409.',
      fix: { delay: 60, note: 'Confirming a completed transfer returns 409 and leaves the balance untouched. Deployed to sandbox.' },
      repro: { groups: [['confirm', 'twice', 'two times', 'second', 'retr'], ['200', '409', 'charge', 'balance', 'deduct']], ask: 'What happens on the second confirmation: what status comes back, and what happens to the balance?' },
    },
    {
      id: 'KA-FONDOS',
      title: 'Transfers above the available balance are accepted',
      severity: 'critical',
      explanation: 'The balance validation was only done in the Kobalto app, not in the API: a partner could leave accounts overdrawn.',
      technique: 'Negative business-rule case: amount greater than the balance → 422 INSUFFICIENT_FUNDS.',
      fix: { delay: 90, note: 'The API validates the available balance before creating the transfer. Deployed to sandbox.' },
      repro: { groups: [['balance', 'insufficient', 'funds', 'overdraw'], ['201', '422', 'accept', 'creat']], ask: 'What amount, from which account, and what status comes back versus the expected one?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'What your transfers suite checked at the end of the day.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that showed up',
    rules: [
      { flag: 'reto.crear', label: 'Create with request: 201 and PENDING', explanation: "And request {…} · When method post · Then status 201 · match response contains { status: 'PENDING' }" },
      { flag: 'reto.fichero', label: 'Body in a file with embedded expressions', explanation: "\"amount\": \"#(amount)\" in the JSON and * def body = read('payloads/transfer.json')." },
      { flag: 'reto.encadenar', label: 'Create and read what was stored', explanation: '* def transferId = response.id · GET /transfers/{id} · match response.amount == amount' },
      { flag: 'reto.confirmar', label: 'Effect on the balance when confirming', explanation: 'Balance before, confirm, balance after: available == before - amount.' },
      { flag: 'reto.doble', label: 'Retrying the confirmation: 409', explanation: 'Confirm the same id twice in one scenario.' },
      { flag: 'reto.fondos', label: 'Not enough balance: 422 INSUFFICIENT_FUNDS', explanation: '* set body.amount = 999999 on the same JSON.' },
    ],
  },

  concepts: [
    { id: 'payloads', title: 'Bodies and files', summary: 'request sets the body; read() reads JSON with embedded expressions #(var); set, remove and copy adapt the body for each case.' },
    { id: 'chaining', title: 'Chaining and testing the effect', summary: 'def saves data from a response for the next request. An operation is tested by reading what was created and checking its effect, not just its status code.' },
    { id: 'http_codes', title: 'Response codes', summary: '201 created, 400 invalid request, 404 does not exist, 409 conflict with the state, 422 business rule. Partners code against the exact status.' },
  ],
  debriefConcepts: ['payloads', 'chaining', 'http_codes'],
  seniorTips: [
    'Read the transfers specification: every rule is a scenario.',
    "Create: request + method post + status 201 + match response contains { status: 'PENDING' }.",
    'Move the body to payloads/transfer.json with "#(amount)" and define the variables before the read.',
    '* def transferId = response.id and GET /transfers/{id}: try 150.75, not a round number.',
    'Balance before, confirm, balance after. And confirm twice: it must return 409.',
    'Not enough balance: * set body.amount = 999999 → 422 INSUFFICIENT_FUNDS.',
  ],
}
