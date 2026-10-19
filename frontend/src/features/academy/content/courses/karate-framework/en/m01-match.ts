import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m01LabEn } from './m01-lab'
import { m01LessonsEn } from './m01-lessons'
import { m01QuizEn } from './m01-quiz'
import { m01ScenesEn } from './m01-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * Course 3: Karate Framework · Mission 2 — Match, your superpower.
 * English translation of ../m01-match.ts (same structure and ids).
 *
 * Contract tests: fuzzy markers, reusable schemas with def, match each and
 * contains. At 13:00 version 1.5 is deployed: one compatible change (optional
 * alias) and one undocumented breaking change (holder renamed) that would
 * break a partner.
 */
export const m01MatchEn: Mission = {
  id: 'm01-match',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 1,
  title: 'Match, your superpower',
  subtitle: 'Contracts: fuzzy markers, schemas, match each and compatible changes.',
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
  codeLab: m01LabEn,
  initialMetrics: {},
  lessons: m01LessonsEn,
  mentor: 'sergio',
  quiz: m01QuizEn,
  verdicts: {
    good: {
      title: 'Contract locked down',
      body: 'Your suite validates the shape of every response and told a compatible change apart from one that would have broken a partner. That is how you protect a public API.',
    },
    ok: {
      title: 'Half a contract',
      body: 'You validate part of the shape, but a change or a type slipped past you. Check in the debrief what your schema didn’t cover.',
    },
    bad: {
      title: 'Data, not contracts',
      body: 'Checking a few values doesn’t protect partners from a change of shape. Replay the mission starting with the lesson on fuzzy markers.',
    },
  },

  briefing: {
    title: 'Tuesday: contracts',
    paragraphs: [
      'Two days to go until the beta. Recently, a partner’s integration with another API broke because of a type change nobody announced.',
      'Alba wants your suite to catch any change in the shape of our responses before the partners do. Today you write contract tests with match and fuzzy markers.',
      'Nico deploys 1.5 at midday. Run your suite again afterwards: not every change is a bug, but some are.',
    ],
    goals: [
      'Explain in the refinement what a contract test protects.',
      'Validate the full contract of an account with fuzzy markers.',
      'Reuse the schema with def and refine it with #regex and a predicate.',
      'Validate the list of active accounts: the filter and the shape of each element.',
      'After the 1.5 deployment, adapt to the compatible change and report the breaking one.',
      'Answer Finvo with facts at the 16:30 meeting.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m01ScenesEn,
  endSceneId: 'closing',

  docs: [
    API_REFERENCE_DOC_EN,
    {
      id: 'chuleta_match',
      title: 'Match cheat sheet',
      updatedLabel: 'Maintained by Sergio Navas',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'fuzzy' },
        { kind: 'flag', key: 'doc.match' },
      ],
      body: `## Operators
- **==** exact equality (same keys). **!=** not equal.
- **contains** contains those keys or elements. **!contains**, **contains only**, **contains any**.
- **match each** list ==/contains element: applies to every element.

## Fuzzy markers
- **#string #number #boolean #array #object** · **#null #notnull #present #notpresent** · **#ignore**
- **#uuid** · **#regex EXPR** (the whole expression; the backslash is doubled: \`\\\\d\`)
- **#? EXPR** with \`_\` as the value · **#number? _ >= 0**
- **##marker**: optional (may be missing or null).
- **#[]** list · **#[3]** list of 3 · **#[] #string** list of strings.

## Contract pattern
\`\`\`
Background:
  * url baseUrl
  * def account = { id: '#string', balance: '#number', ... }

Scenario: detail contract
  Given path 'accounts', 'ACC-1001'
  When method get
  Then status 200
  And match response == account
\`\`\``,
    },
    {
      id: 'changelog',
      title: 'Changelog · Kobalto Open API 1.5.0',
      updatedLabel: 'Published by Nicolás Prado',
      readCost: 3,
      visibleWhen: { kind: 'flag', key: 'api.v15' },
      onRead: [{ kind: 'unlock', conceptId: 'compat' }, { kind: 'flag', key: 'doc.changelog' }],
      body: `## 1.5.0
- **New**: **alias** field on accounts (string, **optional**: may be null). A name the customer gives to their account.
- No breaking changes.

## 1.4.2
- Performance fix in /accounts.`,
    },
  ],

  tickets: [
    {
      id: 'API-15',
      title: 'Account contract tests',
      status: 'In progress',
      type: 'story',
      description: 'As the Open API team, we want to detect any change in the shape of the account responses before it affects the partners.',
      acceptanceCriteria: ['Contract of the account detail.', 'Contract of every element in the list.', 'The status filter returns only accounts with that status.'],
      comments: [{ author: 'alba', body: 'If something changes, we should be the first to see it.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-FILTRO',
      title: 'The status=ACTIVE filter also returns closed accounts (ACC-1005)',
      severity: 'high',
      explanation: 'The query treated CLOSED as active because of a mistake in the condition. A partner would show closed accounts as operational.',
      technique: 'match each on the filtered list: every element must meet the filter.',
      fix: { delay: 90, note: 'Fixed the condition of the status filter. Deployed to sandbox.' },
      repro: { groups: [['status', 'filter', 'active', 'activ'], ['closed', 'close', '1005']], ask: 'Which filter did you use, and which account shows up that shouldn’t?' },
    },
    {
      id: 'KA-TIPO',
      title: 'Zero balances arrive as text ("0.00") instead of a number',
      severity: 'high',
      explanation: 'The serializer formatted zero balances as a string. Apps expecting a number fail to read it: exactly what happened to the partner last month.',
      technique: "Contract with types: balance: '#number' validated on every element of the list (match each).",
      fix: { delay: 90, note: 'balance is always serialized as a number. Deployed to sandbox.' },
      repro: { groups: [['balance', 'amount'], ['string', 'text', '0.00', 'type', 'number', 'numeric']], ask: 'Which field, on which account, and what type arrives compared with what the reference says?' },
    },
    {
      id: 'KA-CONTRATO',
      title: '1.5 renames holder to holderName without notice',
      severity: 'critical',
      explanation: 'An undocumented breaking change: integrations that read holder (like Finvo’s) would stop showing the account holder.',
      technique: 'Strict contract (==) run after every deployment, telling compatible changes from breaking ones with the changelog.',
      fix: { delay: 60, note: 'Reverted: holder is back. holderName will be announced for v2 well in advance.' },
      repro: { groups: [['holder', 'holdername', 'account holder'], ['1.5', 'renam', 'missing', 'absent', 'present', 'chang']], ask: 'Which field is missing or has changed, and in which version?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'What your contract suite validated at the end of the day.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that appeared',
    rules: [
      { flag: 'reto.esquema', label: 'Full contract of the account detail', explanation: "match response == { id: '#string', … balance: '#number', … } with all eight fields." },
      { flag: 'reto.reutiliza', label: 'Reusable schema with def', explanation: '* def account = { … } in the Background and match response == account.' },
      { flag: 'reto.formato', label: 'Formats: #regex and predicates', explanation: "iban: '#regex ES\\\\d{22}' and balance: '#number? _ >= 0'." },
      { flag: 'reto.lista', label: 'Active accounts filter with match each', explanation: "param status = 'ACTIVE' and match each response.items contains { status: 'ACTIVE' }." },
      { flag: 'reto.tipos', label: 'Contract of every element in the list', explanation: 'match each response.items == account.' },
      { flag: 'reto.evolucion', label: 'Contract adapted to 1.5', explanation: "alias: '##string' (compatible) and holder reported if it disappears (breaking)." },
    ],
  },

  concepts: [
    { id: 'contract', title: 'Contract test', summary: 'Validates the shape of the response (fields, types, formats), not specific data. It catches changes that would break consumers.' },
    { id: 'fuzzy', title: 'Fuzzy markers', summary: "#string, #number, #regex, #? expr, ##optional… They compare shape instead of value and make the contract robust against changing data." },
    { id: 'each', title: 'match each and contains', summary: 'match each validates every element of a list; contains compares only the keys you give it. The error message names the element and the field ($[1].balance).' },
    { id: 'compat', title: 'Compatible and breaking changes', summary: 'Adding optional fields is compatible; removing, renaming or changing the type breaks clients. The changelog and the contract decide whether it is a bug.' },
  ],
  debriefConcepts: ['contract', 'fuzzy', 'each', 'compat'],
  seniorTips: [
    'Read the match cheat sheet and the reference: the contract comes from there, not from the response you see today.',
    "A contract with the eight fields: id, iban, holder, type, currency, balance ('#number'), status and createdAt.",
    "Store it with def in the Background and refine it: '#regex ES\\\\d{22}' and '#number? _ >= 0'.",
    "List: param status = 'ACTIVE', match each … contains { status: 'ACTIVE' } and match each … == account.",
    'After the 13:00 deployment, run again and read the changelog: alias is compatible; holder going missing is not.',
    'Report each bug with its scenario as evidence and answer Finvo with what you know.',
  ],
}
