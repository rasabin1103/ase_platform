import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m00LabEn } from './m00-lab'
import { m00LessonsEn } from './m00-lessons'
import { m00QuizEn } from './m00-quiz'
import { m00ScenesEn } from './m00-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * Course 3: Karate Framework · Mission 1 — Hello, Karate.
 * English translation of ../m00-hola-karate.ts (same structure and ids).
 *
 * First day in the Open API squad. The player writes their first feature
 * (health, account details, 404), tidies it up with a Background and checks
 * the blocked account Compliance asks about. A correct test going red reveals
 * an API bug that must be reported with the scenario as evidence.
 */
export const m00HolaKarateEn: Mission = {
  id: 'm00-hola-karate',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 0,
  title: 'Hello, Karate',
  subtitle: 'Your first feature: url, path, method, status, match and Background.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Monday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m00LabEn,
  initialMetrics: {},
  lessons: m00LessonsEn,
  mentor: 'sergio',
  quiz: m00QuizEn,
  verdicts: {
    good: {
      title: 'First suite, first bug',
      body: 'Your smoke runs on every deployment, covers the error cases and has already caught a bug a partner would have seen. That’s how you start.',
    },
    ok: {
      title: 'Good start',
      body: 'You have tests that work, but something was left unchecked or unreported. Look at the debrief to see what was missing.',
    },
    bad: {
      title: 'Tests that test nothing',
      body: 'Without checks on the response, a test is always green. Replay the mission starting with the lesson “What exactly does match do?”.',
    },
  },

  briefing: {
    title: 'Monday: the Open API squad',
    paragraphs: [
      'Kobalto is opening its API to other fintechs: the private beta starts on Thursday and several partners will read customer accounts from their apps.',
      'Until now the API was tested by hand. Sergio, the QA Automation Lead, has chosen Karate: the tests read almost like the specification and run on every deployment.',
      'Today you write your first feature in the IDE against the sandbox. Heads-up: the API has bugs. A well-written test that goes red is good news… if you report it.',
    ],
    goals: [
      'At the daily, propose how to know on every deployment that the API still works.',
      'Write a /health smoke with status and match.',
      'Check an account’s details and the 404 for one that doesn’t exist.',
      'Tidy up the feature with a Background: no repeated URLs.',
      'Check what Compliance asks for and report whatever fails, with the scenario as evidence.',
      'At the 16:30 demo, explain what your suite covers and what it doesn’t.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'wiki' },
    { tool: 'app' },
    { tool: 'tickets' },
  ],

  scenes: m00ScenesEn,
  endSceneId: 'closing',

  docs: [
    API_REFERENCE_DOC_EN,
    {
      id: 'karate_5min',
      title: 'Karate in 5 minutes',
      updatedLabel: 'Maintained by Sergio Navas',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'feature_anatomy' },
        { kind: 'flag', key: 'doc.karate' },
      ],
      body: `## A feature
- It starts with **Feature:** and contains one or more **Scenario:** blocks. Each scenario is an independent test.
- Lines starting with **#** are comments.
- Each step starts with **Given**, **When**, **Then**, **And**, **But** or **\`*\`** (they are equivalent) followed by a Karate keyword.

## Day-one keywords
- **url** \`baseUrl\`: base address (it comes from karate-config.js).
- **path** \`'accounts', 'ACC-1001'\`: segments appended to the url.
- **method** \`get\`: sends the request.
- **status** \`200\`: checks the HTTP code.
- **match** \`response.status == 'UP'\`: checks the body. **response** is the JSON of the response.
- **print** \`response\`: writes to the console (for exploring, not for checking).

## Background
- Steps that run **before each scenario**. Ideal for \`* url baseUrl\`.

## Reading the result
- **Report**: scenarios in green and in red, with the step that failed and why.
- **Console**: \`1 > GET …\` is what Karate sent; \`1 < 200\` and the JSON, what the API responded.`,
    },
    {
      id: 'checklist',
      title: 'Checklist for a good API test',
      updatedLabel: 'QA team',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'assertions' }],
      body: `- One scenario, one behaviour. The name says what is expected (“non-existent account returns 404”).
- Always **status** and **match** on what matters. A test that cannot fail tests nothing.
- Test the **errors** too: ids that don't exist, invalid formats.
- Test **more than one data item**: the happy example doesn't reveal the odd cases.
- No full URLs in the scenarios: **url baseUrl** + **path**.
- **Independent** scenarios: none depends on another having run before.
- If a correct test fails, **don't change it to make it pass**: report the bug with the scenario as evidence.`,
    },
  ],

  tickets: [
    {
      id: 'API-12',
      title: 'Open API private beta: automated suite',
      status: 'In progress',
      type: 'story',
      description: 'As the Open API team, we want an API test suite that runs on every deployment so we can open the beta to partners with confidence.',
      acceptanceCriteria: [
        '/health smoke.',
        'Account details and 404 error covered.',
        'The status of accounts blocked by Compliance is checked.',
        'The suite runs against any environment by changing only the configuration.',
      ],
      comments: [{ author: 'sergio', body: 'We’re starting with Karate. The project is in the IDE.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-BLOQ',
      title: 'Blocked account ACC-1003 shows as ACTIVE',
      severity: 'critical',
      explanation: 'The API served the status from a cache that wasn’t invalidated when the account was blocked. A partner could have operated with an account blocked by Compliance.',
      technique: 'API test with a match on the field that matters (the account status), not just on the HTTP code.',
      fix: { delay: 60, note: 'The status cache is now invalidated when an account is blocked or unblocked. Deployed to sandbox.' },
      repro: { groups: [['acc-1003', '1003'], ['active', 'blocked', 'block']], ask: 'Which account, and what status does it return? Give the id, the expected status and the one you get.' },
    },
    {
      id: 'KA-DIVISA',
      title: 'Dollar account ACC-1004 returns currency EUR',
      severity: 'high',
      explanation: 'The serializer set EUR by default instead of reading the account’s currency. It only shows up with an account that isn’t in euros.',
      technique: 'Test more than one data item: the happy example (ACC-1001, in euros) doesn’t reveal it.',
      fix: { delay: 90, note: 'The currency now comes from the account, not from a default value. Deployed to sandbox.' },
      repro: { groups: [['acc-1004', '1004'], ['usd', 'dollar', 'eur', 'currency', 'euro', 'curr']], ask: 'Which account is it, and what currency did you expect versus the one you get?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'What your suite achieved by the end of the day.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that appeared',
    rules: [
      { flag: 'reto.smoke', label: '/health smoke with status and match', explanation: "Given path 'health' · When method get · Then status 200 · And match response.status == 'UP'" },
      { flag: 'reto.cuenta', label: 'ACC-1001 details checked with match', explanation: "match response.id == 'ACC-1001' and match response.currency == 'EUR'." },
      { flag: 'reto.noexiste', label: '404 error for a non-existent account', explanation: "Then status 404 · And match response.code == 'ACCOUNT_NOT_FOUND'" },
      { flag: 'reto.background', label: 'url baseUrl in the Background', explanation: 'A single line for every scenario and no full URLs.' },
      { flag: 'reto.bloqueada', label: 'Blocked account status checked', explanation: "match response.status == 'BLOCKED': the test is correct even though the API fails." },
    ],
  },

  concepts: [
    { id: 'api_automation', title: 'Automated API tests', summary: 'Tests that talk to the API directly (no UI) and run on every deployment: fast, stable and repeatable.' },
    { id: 'feature_anatomy', title: 'Anatomy of a feature', summary: 'Feature, Scenario and steps. url and path set up, method sends, status and match check. response holds the JSON of the response.' },
    { id: 'assertions', title: 'Assertions: status and match', summary: 'status looks at the HTTP code; match compares the body. A test without assertions always passes and tests nothing.' },
    { id: 'background', title: 'Background and baseUrl', summary: 'Common steps that run before each scenario. url baseUrl lets you switch environments without touching the tests.' },
    { id: 'red_test', title: 'Red test: test or bug?', summary: 'Compare the test with the specification: if the test is correct and fails, it’s a bug and gets reported with the scenario as evidence.' },
  ],
  debriefConcepts: ['api_automation', 'feature_anatomy', 'assertions', 'background', 'red_test'],
  seniorTips: [
    'Read the API reference before writing: it says what each endpoint returns and what data the sandbox has.',
    "Smoke: Given path 'health' · When method get · Then status 200 · And match response.status == 'UP'.",
    'Every scenario with status and match. And an error case: ACC-9999 → 404 ACCOUNT_NOT_FOUND.',
    'With two scenarios, a Background with * url baseUrl is already worth it.',
    'ACC-1003 must come back BLOCKED. If your test is correct and fails, report it with that scenario as evidence.',
    'Test more than one data item: the dollar account (ACC-1004) hides another bug.',
    'After the fix, run again and verify the ticket with the new run.',
  ],
}
