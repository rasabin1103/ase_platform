import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m07LabEn } from './m07-lab'
import { m07LessonsEn } from './m07-lessons'
import { m07QuizEn } from './m07-quiz'
import { m07ScenesEn } from './m07-scenes'

/**
 * Course 3: Karate Framework · Mission 8 — The third party that doesn’t respond.
 * English translation of ../m07-mocks.ts (same structure and ids).
 *
 * The card payments service is tested locally against a Karate mock of the
 * Paynexo processor (karate.start on port 8090): approved, declined, errors,
 * slowness and validation of the request contract.
 */
export const m07MocksEn: Mission = {
  id: 'm07-mocks',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 7,
  title: 'The third party that doesn’t respond',
  subtitle: 'Karate mocks: karate.start, scenarios by condition, responseStatus and responseDelay, validating the contract with karate.match.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Wednesday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m07LabEn,
  initialMetrics: {},
  lessons: m07LessonsEn,
  mentor: 'sergio',
  quiz: m07QuizEn,
  verdicts: {
    good: {
      title: 'Paynexo, at your command',
      body: 'Your mock triggers everything the processor can do —approve, decline, fail, take too long— and guards the contract of what we send it. You found the service’s failures without waiting for anyone.',
    },
    ok: {
      title: 'A mock that’s too friendly',
      body: 'The mock approves, but some hard case (decline, error, slowness or contract) was left untested. Check the debrief.',
    },
    bad: {
      title: 'Waiting for the third party',
      body: 'Without a useful mock, payments reach the launch without knowing what happens when Paynexo fails. Replay the mission starting with the lesson “How do you write a mock in Karate?”.',
    },
  },

  briefing: {
    title: 'Wednesday: the processor',
    paragraphs: [
      'On Monday card payments open to partners. Every payment is authorized by Paynexo, the card processor, and its sandbox has been down all week.',
      'The payments service runs locally and calls Paynexo at localhost:8090. That’s where you’ll put your own Paynexo: a Karate mock.',
      'With it you can trigger what the real one never lets you: declines, errors, slowness. And find out what our service does in each case.',
    ],
    goals: [
      'At the stand-up, propose how to test without Paynexo.',
      'Make the mock approve and the payment come out 201.',
      'Trigger a decline and a processor error.',
      'Walk through every case with a Scenario Outline.',
      'Simulate slowness and validate the contract in the mock.',
      'Decide with data whether payments launch on Monday.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m07ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'pagos',
      title: 'Card payments: service and Paynexo v2',
      updatedLabel: 'Maintained by Nicolás Prado',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'mock' },
        { kind: 'flag', key: 'doc.pagos' },
      ],
      body: `## Running locally
- Payments service: **http://localhost:8080/v1** (\`mvn spring-boot:run -Plocal\`).
- It calls Paynexo at **PROCESSOR_URL = http://localhost:8090**. If nothing is listening: **503 PROCESSOR_UNAVAILABLE**.

## Kobalto · POST /cards/{id}/payments
- Body: **amount** (euros, up to 2 decimals), **currency** (EUR), **merchant** (1–60).
- Cards: **CRD-1001** active · **CRD-1002** blocked (422 CARD_BLOCKED, without calling Paynexo) · **CRD-1003** expired (422 CARD_EXPIRED).
- Paynexo approves → **201** { id, status: APPROVED, authCode, amount, currency, merchant, cardId }.
- Paynexo declines → **422 PAYMENT_DECLINED** with **reason** = Paynexo’s reason.
- Paynexo responds 4xx/5xx or something invalid → **502 PROCESSOR_ERROR**.
- Paynexo doesn’t respond within **3 s** → **504 PROCESSOR_TIMEOUT**. A payment without authorization is **never** approved.
- Validation errors: 400 VALIDATION_ERROR with field.

## Paynexo v2 · POST /v2/authorizations
- Headers: Content-Type JSON, **Idempotency-Key**, X-Merchant-Id.
- Body: **amount** in **whole cents** (€25.50 → 2550), ISO **currency** (EUR), **merchant**, **cardToken**, **reference**.
- If the body doesn’t comply: **400** { error: "invalid_request" }.
- **200** { result: "APPROVED", authCode } or { result: "DECLINED", reason } (INSUFFICIENT_FUNDS, DO_NOT_HONOR, EXPIRED_CARD, SUSPECTED_FRAUD).
- 5xx when something fails on their side.`,
    },
  ],

  tickets: [
    {
      id: 'API-44',
      title: 'Card payments for partners',
      status: 'In QA',
      type: 'story',
      description: 'As a partner, I want to charge my users’ Kobalto cards and always know whether the payment was authorized and, if not, why.',
      acceptanceCriteria: ['Approved → 201 with authCode.', 'Declined → 422 with Paynexo’s reason.', 'Processor error or slowness → 502/504; never an approved payment without authorization.'],
      comments: [{ author: 'nico', body: 'Migrated to Paynexo v2 (amounts in cents) last week.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-TIMEOUT',
      title: 'If Paynexo takes more than 3 s, the payment is approved without authorization',
      severity: 'critical',
      explanation: 'Timeout handling returned the payment as APPROVED by default (without authCode): the merchant delivered the product and the charge had never been authorized.',
      technique: 'A mock with responseDelay above the service’s timeout and an assertion of 504.',
      fix: { delay: 90, note: 'A processor timeout now returns 504 PROCESSOR_TIMEOUT and the payment isn’t approved. Deployed.' },
      repro: { groups: [['slow', 'takes', 'timeout', 'responsedelay', 'delay'], ['201', 'approved', 'approv', 'authcode']], ask: 'How long did the mock take, and what did the service return?' },
    },
    {
      id: 'KA-UNIDADES',
      title: 'The amount is sent in euros to Paynexo v2, which expects cents',
      severity: 'high',
      explanation: 'The migration to Paynexo v2 didn’t change the conversion: 25.5 was sent instead of 2550. Paynexo rejects decimals and, with whole amounts, would charge a hundred times less.',
      technique: 'A mock that validates the request against the third party’s contract (karate.match with a schema) and a payment with decimals.',
      fix: { delay: 60, note: 'The amount is sent in whole cents. Deployed.' },
      repro: { groups: [['amount', 'cents', 'cent', 'euro', 'unit', '2550', '25.5'], ['400', 'contract', 'schema', 'decimal']], ask: 'What amount reached the mock, and what did Paynexo expect?' },
    },
    {
      id: 'KA-MOTIVO',
      title: 'Paynexo’s decline reason gets lost',
      severity: 'medium',
      explanation: 'The response mapping only copied the DO_NOT_HONOR reason: any other one arrived as UNKNOWN and the partner couldn’t tell the customer why it was declined.',
      technique: 'A mock that declines with a specific reason and an assertion on the propagated reason.',
      fix: { delay: 60, note: 'Any Paynexo decline reason is now propagated. Deployed.' },
      repro: { groups: [['declin', 'declined', 'reason', 'denied'], ['unknown', 'insufficient', 'lost']], ask: 'Which reason did the mock decline with, and which reason did the service return?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'What your Paynexo mock could do at the end of the day.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that appeared',
    rules: [
      { flag: 'reto.mock', label: 'A mock that approves', explanation: "Scenario: pathMatches('/v2/authorizations') && methodIs('post') with { result: 'APPROVED', authCode }." },
      { flag: 'reto.denegado', label: 'Decline with a reason', explanation: 'The mock declines by merchant and the test checks the propagated reason.' },
      { flag: 'reto.caida', label: 'Processor error → 502', explanation: 'responseStatus = 503 in the mock.' },
      { flag: 'reto.tabla', label: 'Every path in one table', explanation: 'Scenario Outline with one row per Paynexo behaviour.' },
      { flag: 'reto.lento', label: 'Slowness → 504', explanation: 'responseDelay = 5000, above the 3 s timeout.' },
      { flag: 'reto.contrato', label: 'The mock validates the contract', explanation: 'karate.match(request, schema) → 400 if the request doesn’t comply with Paynexo v2.' },
    ],
  },

  concepts: [
    { id: 'mock', title: 'Karate mocks', summary: 'A feature with condition scenarios (pathMatches, methodIs, request…) that responds with response, responseStatus and responseDelay. Started with karate.start; with a fixed port, only once (callonce).' },
    { id: 'dobles', title: 'Test doubles', summary: 'They stand in for a third party so you can trigger cases on demand. They must validate the contract of what they receive, and they don’t replace a final check against the real service.' },
  ],
  debriefConcepts: ['mock', 'dobles'],
  seniorTips: [
    'Read “Card payments” in the Wiki: the Kobalto and Paynexo v2 contracts.',
    "In the mock, above the catch-all: Scenario: pathMatches('/v2/authorizations') && methodIs('post') → { result: 'APPROVED', authCode: 'A1B2C3' }.",
    "One scenario per merchant: DENEGADO (DECLINED with reason), CAIDO (responseStatus 503), LENTO (responseDelay 5000).",
    'Scenario Outline in payments.feature with merchant and status: 201, 422, 502, 504.',
    "Contract: authRequest with amount '#? _ > 0 && _ % 1 == 0' and the mock’s first scenario with !karate.match(request, authRequest).pass → 400. Pay with decimals.",
  ],
}
