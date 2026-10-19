import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m04LabEn } from './m04-lab'
import { m04LessonsEn } from './m04-lessons'
import { m04QuizEn } from './m04-quiz'
import { m04ScenesEn } from './m04-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * Course 3: Karate Framework · Mission 5 — Data-driven.
 * English translation of ../m04-datos.ts (same structure and ids).
 *
 * Transfer rules for partners (amount limits, validations and a 140-character
 * concept). The player turns scenarios into a Scenario Outline with typed
 * columns, dynamic Examples from JSON and boundary values. The bugs only show
 * up at the exact edges.
 */
export const m04DatosEn: Mission = {
  id: 'm04-datos',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 4,
  title: 'Data-driven',
  subtitle: 'Scenario Outline, typed and JSON-driven Examples, boundary values and an error matrix.',
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
  codeLab: m04LabEn,
  initialMetrics: {},
  lessons: m04LessonsEn,
  mentor: 'sergio',
  quiz: m04QuizEn,
  verdicts: {
    good: {
      title: 'Every rule, at its edge',
      body: 'Your tables test each rule just inside and just outside its limit, and the data lives outside the feature. The boundary bugs never made it to Monday.',
    },
    ok: {
      title: 'Tables with gaps',
      body: 'Your data is in tables, but some edge or some rule was left without a row. Check the debrief to see which exact value was missing.',
    },
    bad: {
      title: 'Copy and paste',
      body: 'Repeated scenarios with values from the middle of the range don’t find boundary errors. Replay the mission starting with the lesson “What data goes in the table?”.',
    },
  },

  briefing: {
    title: 'Friday: the rules',
    paragraphs: [
      'Nico fixed the double charge yesterday. On Monday Finvo starts making transfers, and Compliance has set limits for partners.',
      'Every rule in the specification needs its test, and almost all of them have an edge: a minimum, a maximum, a length.',
      'Today you write the steps once and the data in tables. Today’s bugs only show up at the exact boundary value.',
    ],
    goals: [
      'In the planning meeting, decide which data tests a limit.',
      'Turn the scenario into a Scenario Outline with typed amounts.',
      'Test just on each side of every amount boundary.',
      'Cover the error matrix and move it to a JSON file as dynamic Examples.',
      'Test the 140-character concept Carmen asks for.',
      'Answer with data whether Finvo can start on Monday.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m04ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'reglas',
      title: 'Transfers · rules for partners',
      updatedLabel: 'Compliance and Open API',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'boundaries' },
        { kind: 'flag', key: 'doc.rules' },
      ],
      body: `## Amount
- A number with **at most 2 decimals**. Otherwise: **400 VALIDATION_ERROR** (field amount).
- **Minimum €0.01**. 0 or negative: **400 VALIDATION_ERROR**.
- **Maximum €1,000.00 per transfer** on **PERSONAL** accounts (1,000.00 is accepted). Above it: **422 LIMIT_EXCEEDED**.
- It can’t exceed the available balance: **422 INSUFFICIENT_FUNDS**.

## Source account
- It must exist (**404 ACCOUNT_NOT_FOUND**) and be **ACTIVE** (**422 ACCOUNT_NOT_OPERATIVE**).
- The transfer currency is the account’s currency (**422 CURRENCY_MISMATCH**).

## Destination and concept
- **toIban**: ES + 22 digits, no spaces (**400 INVALID_IBAN**).
- **concept**: optional, **up to 140 characters** (140 is accepted). Longer: **400 VALIDATION_ERROR** (field concept).

## Useful sandbox data
- ACC-1001 · personal, EUR, balance 1,520.35 · ACC-1002 · balance 0 · ACC-1003 · blocked · ACC-1004 · in USD.`,
    },
    API_REFERENCE_DOC_EN,
  ],

  tickets: [
    {
      id: 'API-27',
      title: 'Transfer limits and validations for partners',
      status: 'In QA',
      type: 'story',
      description: 'As Compliance, we want partner-initiated transfers to respect the agreed limits and validations before opening them to Finvo.',
      acceptanceCriteria: [
        'Amount between €0.01 and €1,000.00 (both included) on personal accounts.',
        'Every validation in the specification returns its code.',
        'Concept of up to 140 characters.',
      ],
      comments: [{ author: 'nico', body: 'Implemented. I set the limits carefully (I think).' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-LIMITE',
      title: 'A transfer of exactly €1,000.00 is rejected with LIMIT_EXCEEDED',
      severity: 'high',
      explanation: 'The check used >= instead of >: the limit itself, which the rule allows, was left out. Many payments (rent, payroll) are round amounts.',
      technique: 'Boundary values: test the exact edge (1,000.00) as well as the first value outside it (1,000.01).',
      fix: { delay: 60, note: 'The limit now includes €1,000.00. Deployed to sandbox.' },
      repro: { groups: [['1000', '1,000', 'limit', 'boundary'], ['422', 'reject', 'limit_exceeded']], ask: 'Which exact amount is rejected, and what does the rule say?' },
    },
    {
      id: 'KA-CENT',
      title: 'Amounts below €1 are rejected (the minimum is €0.01)',
      severity: 'medium',
      explanation: 'The minimum check compared against 1 instead of 0.01. Small payments (tips, fees) failed.',
      technique: 'Boundary values at the lower edge: 0 (outside) and 0.01 (inside).',
      fix: { delay: 90, note: 'The minimum is now €0.01. Deployed.' },
      repro: { groups: [['0.01', '0,01', 'minimum', 'cent', 'less than 1'], ['400', 'reject', 'validation']], ask: 'Which exact amount is rejected, and what is the minimum in the rule?' },
    },
    {
      id: 'KA-CONCEPTO',
      title: 'A concept of exactly 140 characters is rejected',
      severity: 'medium',
      explanation: 'The validation used < 140 instead of <= 140. Full SEPA concepts sent by ERPs failed.',
      technique: 'Boundary values on text lengths: 140 and 141 characters.',
      fix: { delay: 90, note: 'The concept now accepts 140 characters. Deployed.' },
      repro: { groups: [['concept', 'description'], ['140', 'length', 'characters']], ask: 'How many characters did the rejected concept have, and what does the rule say?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'Where the transfer rules stood at the end of the week.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that showed up',
    rules: [
      { flag: 'reto.outline', label: 'Scenario Outline with several amounts', explanation: 'The steps once; one row per case with amount! so it arrives as a number.' },
      { flag: 'reto.limites', label: 'The amount boundaries', explanation: '0.01 · 1,000 · 1,000.01 (and 0): just inside and just outside each limit.' },
      { flag: 'reto.codigos', label: 'The expected result in the table', explanation: 'Then status <status> with rows expecting 201 and rows expecting an error.' },
      { flag: 'reto.negativos', label: 'Error matrix', explanation: 'IBAN, currency, blocked account, no balance, limit… each with its code.' },
      { flag: 'reto.json', label: 'Dynamic Examples from JSON', explanation: "Examples: | read('data/negativos.json') | with karate.merge(body, patch)." },
      { flag: 'reto.concepto', label: '140- and 141-character concept', explanation: "* set body.concept = 'x'.repeat(len) with len! in the table." },
    ],
  },

  concepts: [
    { id: 'outline', title: 'Scenario Outline and Examples', summary: 'Steps with <columns> and one row per case. Columns ending in ! are evaluated (numbers, objects). Dynamic Examples: | read(\'data.json\') |, each object a row.' },
    { id: 'boundaries', title: 'Boundary values in API tests', summary: 'For each range, just inside and just outside every edge (0/0.01, 1,000/1,000.01, 140/141). A few well-chosen, deterministic data points.' },
  ],
  debriefConcepts: ['outline', 'boundaries'],
  seniorTips: [
    'Read the rules in the wiki: each one with its edge and its error code.',
    'Scenario Outline with amount! in the header so the amount arrives as a number.',
    'Rows 0 · 0.01 · 1,000 · 1,000.01 with their expected status in another column.',
    'Error matrix in data/negativos.json and Examples: | read(\'data/negativos.json\') | with karate.merge.',
    "Concept: len! 140 and 141 with 'x'.repeat(len).",
    'Report every red row, stating the exact value that fails.',
  ],
}
