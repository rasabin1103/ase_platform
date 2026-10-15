import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m03LessonsEn } from './m03-lessons'
import { m03QuizEn } from './m03-quiz'
import { m03ScenesEn } from './m03-scenes'

/**
 * Course 2: Professional QA · Mission 3 — Inside the code (CTFL 4.3 and 2.2).
 * English translation of ../m03-cobertura.ts (same structure and ids).
 *
 * Tomás boasts of “100% coverage” in the invoice calculation, but there is a
 * bug in production. The player reads the code, runs the suite with statement
 * and branch coverage, discovers that the only test that goes through the bug
 * checks nothing, fixes it, covers the missing branch and reports what they find.
 */
export const m03CoberturaEn: Mission = {
  id: 'm03-cobertura',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 3,
  title: 'Inside the code',
  subtitle: 'White-box testing: statement and branch coverage, and what coverage doesn’t measure.',
  world: kobaltoWorldEn,
  playerRole: 'QA for the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Wednesday',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-coverage',
  appLabel: 'Coverage',
  initialMetrics: {},
  lessons: m03LessonsEn,
  mentor: 'laura',
  quiz: m03QuizEn,
  verdicts: {
    good: {
      title: 'Coverage, read correctly',
      body: 'You found what the “100%” was hiding, and the squad no longer confuses coverage with quality.',
    },
    ok: {
      title: 'Bug found, lesson half learned',
      body: 'You found part of what was failing, but something about coverage or assertions fell by the wayside. Check the debrief.',
    },
    bad: {
      title: 'The 100% that said nothing',
      body: 'The bugs are still in production. Replay the mission starting with Tomás’s suite: what does each test case check?',
    },
  },

  briefing: {
    title: 'Wednesday: inside the code',
    paragraphs: [
      'Carmen has received complaints: some invoices to businesses come out with a laughably small income tax withholding. Tomás insists that the calculation module has “100% coverage.”',
      'Today it’s white-box testing. You have the calculation code and Tomás’s component test suite in the “Coverage” app: you can edit and add test cases and run the suite to see which lines and which branches are exercised.',
      'Careful: coverage tells you what was executed, not whether anyone checked the result.',
    ],
    goals: [
      'Don’t stop at the “100%”: find out what it really measures.',
      'Find out why the suite doesn’t catch Carmen’s bug and write a test case that fails.',
      'Bring the suite to 100% branch coverage, not just statement coverage.',
      'Report every bug you find on the board, with the test run as evidence.',
      'Propose to Raúl a sensible use of coverage in the pipeline.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m03ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'spec_calculo',
      title: 'Invoice calculation specification',
      updatedLabel: 'Elena Prieto · product',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'spec.read' }],
      body: `## Invoice total
**Total = base + VAT − income tax withholding**, each amount rounded to the cent.

- **VAT**: 21% of the base.
- **Income tax withholding**: only if the **client is a business**.
  - Issuer registered for **less than 3 years**: **7%**.
  - Issuer registered for **3 years or more**: **15%**.
- Individual client: no withholding.

## Review
Invoices with a base of **€3,000 or more** are flagged for manual review by Compliance.

## Example
Base €1,000, business client, issuer registered for 5 years: VAT €210, withholding €150, total **€1,060**, no review.`,
    },
    {
      id: 'guia_cobertura',
      title: 'Code coverage: what it measures and what it doesn’t',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 3,
      onRead: [
        { kind: 'unlock', conceptId: 'statement_cov' },
        { kind: 'unlock', conceptId: 'branch_cov' },
      ],
      body: `## Statement coverage
Executed statements ÷ executable statements. 100% means every line was executed at least once.

## Branch coverage
Executed branches ÷ total branches. Every decision has a true branch and a false branch, even if the false one has no code (an IF without an ELSE).
- 100% branch coverage implies 100% statement coverage; not the other way around.

## What it doesn’t measure
- Whether the test **checks** the result: a test with no assertion also “covers.”
- Whether the code does **what the specification says**: an expected result copied from the code always passes.
- What is **missing** from the code: an unimplemented requirement has no lines to cover.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-31',
      title: 'Complaints about incorrect income tax withholding on invoices to businesses',
      status: 'In analysis',
      type: 'bug',
      description: 'Three long-standing freelance customers report withholdings of around 1.5% on invoices to businesses. Tomás maintains that the calculation has 100% coverage.',
      acceptanceCriteria: ['The cause is identified with a failing test case.', 'The component suite checks the result in every branch of the calculation.'],
      comments: [{ author: 'tomas', body: 'The coverage report says 100%. Look at the PDF.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'B-RET',
      title: 'Withholding is 1.5% instead of 15% for issuers registered for 3 years or more',
      severity: 'high',
      explanation: 'The ELSE branch of the calculation uses 0.015 instead of 0.15. Tomás’s case #3 went through that line (100% statement coverage), but didn’t check the result.',
      technique: 'Statement coverage + an assertion with the expected result from the specification.',
      fix: { delay: 45, note: 'Fixed: 15% withholding in the ELSE branch. Thanks for the failing test case.' },
    },
    {
      id: 'B-REV',
      title: 'An invoice for exactly €3,000 isn’t flagged for review',
      severity: 'medium',
      explanation: 'The code uses “base > 3000” and the specification says “€3,000 or more.” It only shows up when exercising the false branch of that decision with the boundary value.',
      technique: 'Branch coverage + boundary value (€3,000).',
      fix: { delay: 30, note: 'Changed to “base ≥ 3000.”' },
    },
  ],

  concepts: [
    { id: 'white_box', title: 'White-box testing', summary: 'Based on the internal structure (the code). It measures coverage and finds what hasn’t been tested, but doesn’t detect missing requirements. (CTFL 4.3.3)' },
    { id: 'statement_cov', title: 'Statement coverage', summary: 'Executed statements ÷ executable statements. 100% guarantees that every line was executed, not that it was checked or that all branches were tested. (CTFL 4.3.1)' },
    { id: 'branch_cov', title: 'Branch coverage', summary: 'Executed branches ÷ total branches, including false branches with no code. 100% branch coverage implies 100% statement coverage, but not the other way around. (CTFL 4.3.2)' },
    { id: 'coverage_limits', title: 'What coverage doesn’t measure', summary: 'A test with no assertion, or with the result copied from the code, also covers. Coverage shows what hasn’t been tested; it is not a measure of quality.' },
    { id: 'component_testing', title: 'Component testing', summary: 'Tests components in isolation; usually written by developers and supported by code coverage. (CTFL 2.2.1)' },
  ],
  debriefConcepts: ['white_box', 'statement_cov', 'branch_cov', 'coverage_limits', 'component_testing'],
  seniorTips: [
    'At the meeting: 100% statement coverage doesn’t say whether the result was checked or whether all branches were exercised.',
    'Run the suite first: you’ll see 100% statement and 83% branch coverage (the false branch of “IF base > 3000” is missing).',
    'Tomás’s case #3 goes through the bug’s line without checking anything: tick “Checks” and enter the result from the specification (€4,000, business, 5 years: €4,240, review yes).',
    'Add a case with a base of exactly €3,000: it covers the false branch and uncovers the second bug (expected review: yes).',
    'Calculate the expected result from the specification, never by copying what the code returns.',
    'Report each bug with the test run as evidence; when Tomás deploys the fix, run the suite again and verify the fix on the board.',
  ],
}
