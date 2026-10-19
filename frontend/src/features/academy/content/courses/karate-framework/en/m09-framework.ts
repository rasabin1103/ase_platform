import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m09LabEn } from './m09-lab'
import { m09LessonsEn } from './m09-lessons'
import { m09QuizEn } from './m09-quiz'
import { m09ScenesEn } from './m09-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * English translation of ../m09-framework.ts (same structure and ids).
 *
 * Course 3: Karate Framework · Mission 10 — Your framework. The suite becomes
 * the player's: login with karate.callSingle in karate-config.js, schemas in
 * files, reusable utilities, conventions, reviewing a teammate's PR and the
 * final suite in the pipeline.
 */
export const m09FrameworkEn: Mission = {
  id: 'm09-framework',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 9,
  title: 'Your framework',
  subtitle: 'karate.callSingle, project structure, reusable schemas and utilities, conventions, code review and the final suite.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Friday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m09LabEn,
  initialMetrics: {},
  lessons: m09LessonsEn,
  mentor: 'sergio',
  quiz: m09QuizEn,
  verdicts: {
    good: {
      title: 'The suite is yours',
      body: 'Login in one place, reusable contracts and data, conventions that are followed, a review that found what the tests weren’t looking at, and the nightly run green. Anyone can maintain this suite… starting with you.',
    },
    ok: {
      title: 'Half tidied up',
      body: 'The suite works, but there are still copies, half-followed conventions or a PR that wasn’t reviewed thoroughly. Check the debrief.',
    },
    bad: {
      title: 'A suite nobody wants to touch',
      body: 'Without structure or review, every change costs more and the tests let the important things through. Replay the mission starting with the lesson “How do I organize the suite’s files?”.',
    },
  },

  briefing: {
    title: 'Friday: the suite is yours',
    paragraphs: [
      'Sergio is off on a two-week holiday and the Open API suite passes into your hands. It has grown fast: login copied into every feature, pasted schemas, repeated test data… and since yesterday the nightly run gives 429.',
      'Iker, who joined on Monday, has opened his first PR with the card tests. On Monday /cards opens to partners.',
      'There is no new syntax to learn today: today you decide how a suite is organized so that anyone can maintain it.',
    ],
    goals: [
      'At the stand-up, propose how to make the suite maintainable.',
      'A single login for the whole run (karate.callSingle).',
      'Review Iker’s PR.',
      'Schemas in JSON files and a utility for the test data.',
      'Follow the team’s conventions and launch the final suite.',
      'Decide with data whether /cards opens on Monday.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m09ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'convenciones',
      title: 'Open API suite conventions',
      updatedLabel: 'Maintained by Iván Torres',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'convenciones' },
        { kind: 'flag', key: 'doc.convenciones' },
      ],
      body: `## Structure
- **karate-config.js**: environment, QA client credentials and **single login** (\`karate.callSingle\`) with the Authorization header.
- **openapi/**: one feature per resource. **openapi/schemas/**: contracts in JSON. **common/**: reusable utilities with @ignore.

## Rules
1. Every scenario has **@smoke** or **@regression** (on the Feature counts too). The PR job runs @smoke; the nightly run, everything.
2. No feature contains **full URLs** or **tokens**: \`url baseUrl\` + \`path\`; the configuration sets the token.
3. Every response is checked **in the body**: never just the status or a print.
4. **Own** test data (sandbox accounts) created with the common utility.
5. Scenarios that only differ in the data → **Scenario Outline**.

## PR review
- What would fail if the API broke? If the answer is “nothing”, the test is useless.`,
    },
    {
      id: 'cards',
      title: 'Cards · GET /cards (Open API 1.7)',
      updatedLabel: 'Maintained by Nicolás Prado',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'doc.cards' }],
      body: `## Endpoints (token with accounts:read)
- **GET /cards?accountId=ACC-0000** → 200 { items, total }: **only** the cards of that account. Without accountId: 400 VALIDATION_ERROR.
- **GET /cards/{id}** → 200 with the card. Id with the format CRD-0000 (otherwise, 400 INVALID_CARD_ID). Nonexistent: 404 CARD_NOT_FOUND.

## Card
- **id** (CRD-0000) · **accountId** · **brand** (VISA, MASTERCARD) · **last4** (4 digits) · **status** (ACTIVE, BLOCKED, EXPIRED) · **expiry** (YYYY-MM)
- The full card number is **never** returned (PCI DSS): only last4.

## Sandbox data
- CRD-1001 and CRD-1004 · ACC-1001 · ACTIVE
- CRD-1002 · ACC-1002 · BLOCKED
- CRD-1003 · ACC-1004 · EXPIRED`,
    },
    API_REFERENCE_DOC_EN,
  ],

  tickets: [
    {
      id: 'API-52',
      title: 'Cards for partners (read-only)',
      status: 'In QA',
      type: 'story',
      description: 'As a partner, I want to look up the cards of my users’ accounts (without sensitive data) to show them in my app.',
      acceptanceCriteria: ['The list only returns the cards of the requested account.', 'The full card number is never returned.', 'Statuses ACTIVE, BLOCKED and EXPIRED.'],
      comments: [{ author: 'iker', body: 'PR with the card tests is open. They pass on my machine.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-PAN',
      title: 'A card’s detail returns the full number (pan)',
      severity: 'critical',
      explanation: 'The detail serializer used the full internal entity: besides last4, the whole card number came out. Exposing it breaches PCI DSS.',
      technique: 'Validate the response against the full contract (match == schema): one extra field makes the test fail.',
      fix: { delay: 60, note: 'The detail now uses the public DTO, without pan. Deployed to sandbox.' },
      repro: { groups: [['pan', 'full number', 'card number', 'card'], ['extra key', 'more key', 'schema', 'contract', 'expose']], ask: 'What extra field did the response have, and what does the contract say?' },
    },
    {
      id: 'KA-CARDFILTER',
      title: 'GET /cards?accountId= returns other customers’ cards',
      severity: 'critical',
      explanation: 'The account filter was lost in a refactoring of the query: the list returned the cards of every customer.',
      technique: 'match each on the list: every card must belong to the requested account.',
      fix: { delay: 60, note: 'The query filters by account again. Deployed.' },
      repro: { groups: [['list', 'accountid', 'filter'], ['another account', 'other customers', 'acc-1002', 'acc-1004', 'all']], ask: 'Which account did you request, and which accounts did the cards you got belong to?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'How you left the suite before Sergio left.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that appeared',
    rules: [
      { flag: 'reto.callsingle', label: 'One token per run', explanation: 'karate.callSingle in karate-config.js and the login removed from the Backgrounds.' },
      { flag: 'reto.revision', label: 'Iker’s PR reviewed', explanation: 'No pasted URLs or tokens, Outline instead of copies and match on the body.' },
      { flag: 'reto.esquemas', label: 'Schemas in schemas/', explanation: "read('schemas/error.json') from several features." },
      { flag: 'reto.utilidades', label: 'A utility for the data', explanation: 'common/cuenta-prueba.feature with @ignore and arguments.' },
      { flag: 'reto.convenciones', label: 'Conventions followed', explanation: 'Every scenario with @smoke or @regression; no URLs or tokens in the features.' },
      { flag: 'reto.final', label: 'Final suite in the nightly run', explanation: `Nightly run in parallel with the full suite and no failures caused by the tests.` },
    ],
  },

  concepts: [
    { id: 'callsingle', title: 'callonce and callSingle', summary: 'callonce: once per feature. karate.callSingle: once per run (every feature and thread), usually in karate-config.js with the configuration as argument.' },
    { id: 'estructura', title: 'Structure and reuse', summary: 'Login in karate-config.js, contracts in schemas/*.json, @ignore utilities in common/ with arguments. What is shared, only once.' },
    { id: 'convenciones', title: 'Conventions', summary: 'Few, written down and checkable: mandatory tags, no URLs or secrets, body checked, own data, Outline for variations.' },
    { id: 'revision', title: 'Reviewing tests', summary: 'What would fail if the API broke? Body checked, nothing pasted that expires, no copies, no dependencies on other tests.' },
  ],
  debriefConcepts: ['callsingle', 'estructura', 'convenciones', 'revision'],
  seniorTips: [
    'karate-config.js: var auth = karate.callSingle(\'classpath:openapi/auth/login.feature\', config); and karate.configure(\'headers\', …). Remove the login from the Backgrounds.',
    'Read “Cards” in the wiki: a card never includes the full number, and the list only returns those of the requested account.',
    "Iker’s PR: path 'cards', id; no Authorization header; an Outline per card with match response == cardSchema; the list with match each … accountId.",
    'New file → openapi/schemas/error.json and card.json; read(\'schemas/error.json\') in errors and transfers.',
    'New file → common/cuenta-prueba.feature (@ignore, karate.get(\'balance\', 100)) and use it in balances and transfers.',
    '@regression above every Feature and @smoke on the essentials. Then, Pipeline → Nightly.',
  ],
}
