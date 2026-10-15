import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m02LessonsEn } from './m02-lessons'
import { m02QuizEn } from './m02-quiz'
import { m02ScenesEn } from './m02-scenes'

/**
 * Course 2: Professional QA · Mission 2 — Given, when, then (CTFL 2.1.3 and 4.5).
 * English translation of ../m02-gherkin.ts (same structure and ids).
 *
 * Three amigos session for “Payment link collection.” The player turns the
 * rules into Gherkin scenarios (ATDD/BDD) and does TDD with Sofía. At
 * 3:00 PM Tomás codes from what was agreed: whatever isn't in a correct
 * scenario gets implemented wrong.
 */
export const m02GherkinEn: Mission = {
  id: 'm02-gherkin',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 2,
  title: 'Given, when, then',
  subtitle: 'Test-first: user stories, acceptance criteria, ATDD, BDD and TDD.',
  world: kobaltoWorldEn,
  playerRole: 'QA for the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Tuesday',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-gherkin',
  appLabel: 'Scenarios',
  hideBugList: true,
  initialMetrics: {},
  lessons: m02LessonsEn,
  mentor: 'laura',
  quiz: m02QuizEn,
  verdicts: {
    good: {
      title: 'Specification by example',
      body: 'Your scenarios are the specification, the acceptance criteria and the automated tests all at once. Tomás didn’t have to guess anything.',
    },
    ok: {
      title: 'Scenarios with gaps',
      body: 'Whatever was in a scenario was coded correctly; whatever wasn’t, Tomás decided. Check which rules or boundaries were missing.',
    },
    bad: {
      title: 'Test-last in disguise',
      body: 'Without a conversation or agreed scenarios, development guessed the rules. Replay the mission starting with the three amigos session.',
    },
  },

  briefing: {
    title: 'Tuesday: three amigos',
    paragraphs: [
      'Kobalto Business wants freelancers to get paid with a payment link: they create it, send it to their customer, and the customer pays by card.',
      'Today the three amigos get together: Elena (PO), Tomás (development) and you (QA). Whatever you agree on as Given/When/Then scenarios will be the specification, the acceptance criteria and the automated test.',
      'At 3:00 PM Tomás starts coding. Whatever isn’t in a correct scenario, he’ll decide… and he won’t always get it right. And Sofía wants to try TDD with you on the commission.',
    ],
    goals: [
      'In the three amigos session, draw out the rules with examples and don’t stop at the happy path.',
      'Write scenarios: one behavior per scenario, no screens and with verifiable outcomes.',
      'Use a scenario outline with examples at the amount boundaries.',
      'Agree on the scenarios with Elena and Tomás before 3:00 PM.',
      'Do a full TDD cycle with Sofía: red, green, refactor.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'wiki' },
    {
      tool: 'app',
      enabledWhen: { kind: 'flag', key: 'amigos.done' },
      lockedMessage: 'First, the three amigos session at 9:10 AM.',
    },
    { tool: 'tickets' },
  ],

  scenes: m02ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_bdd',
      title: 'Team BDD guide (Gherkin)',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'bdd' },
        { kind: 'unlock', conceptId: 'acceptance_criteria' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Keywords
- **Feature**: the functionality.
- **Scenario**: a concrete example of behavior.
- **Given** (context) · **When** (one action) · **Then** (observable outcome). **And** repeats the previous keyword.
- **Scenario Outline** + **Examples**: the same scenario with a table of values.

## Good practices
- One behavior per scenario: **a single When**.
- Describe **what happens**, not **what gets clicked**: no screens, buttons or clicks.
- The Then must be **verifiable**: “everything works” checks nothing.
- One clear context in the Given; don’t mix several.
- At boundaries, use examples **right on each side of each boundary** (boundary value analysis).

## Three amigos and example mapping
PO, development and QA together before coding: for each **rule**, concrete **examples** and the **questions** nobody can answer yet.`,
    },
    {
      id: 'guia_tdd',
      title: 'TDD in two minutes',
      updatedLabel: 'Development team',
      readCost: 3,
      onRead: [{ kind: 'unlock', conceptId: 'tdd' }],
      body: `## Cycle
1. **Red**: write a small test for the next rule and check that it fails.
2. **Green**: write the minimum code to make it pass.
3. **Refactor**: improve the code with all tests green, and run them again.

## Watch out
- If the test passes without new code, it isn’t testing anything new.
- Special rules (minimums, maximums, rounding) need their own test.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-21',
      title: 'Payment link collection',
      status: 'Refinement',
      type: 'story',
      description: 'As a freelancer who is a Kobalto Business customer, I want to send a payment link to my customer so that I can get paid without a card terminal. We’re working with ATDD: the scenarios agreed in the “Scenarios” app are the acceptance criteria.',
      acceptanceCriteria: ['The link can be for €1 to €5,000.', 'The customer pays by card.'],
      comments: [
        { author: 'elena', body: 'I think this covers everything 🙂' },
        { author: 'tomas', body: 'I’ll get started at 3:00 PM. Anything that isn’t clear, I’ll decide on the fly.' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'G-MIN', title: 'Links for €0.50 can be created', severity: 'medium', explanation: 'With no examples at the lower boundary, Tomás validated “greater than zero.”', technique: 'Scenario outline with examples on each side of the boundary: €0.99 and €1.00.', preventedBy: 'gk.r1min' },
    { id: 'G-MAX', title: 'A link for exactly €5,000.00 is rejected', severity: 'high', explanation: 'Tomás coded “less than 5,000”; no example said that €5,000.00 is accepted.', technique: 'Examples at the upper boundary: €5,000.00 and €5,000.01.', preventedBy: 'gk.r1max' },
    { id: 'G-CAD', title: 'Expired links can be paid', severity: 'high', explanation: 'The 7-day expiry wasn’t in any scenario and wasn’t coded.', technique: 'Example mapping: ask about the link’s lifecycle.', preventedBy: 'gk.r2' },
    { id: 'G-DOBLE', title: 'The same link can be paid twice', severity: 'critical', explanation: 'Nobody wrote the second-payment scenario: the prototype charges every time the link is opened.', technique: 'Negative scenario: Given a paid link, When the customer pays it, Then the payment is rejected.', preventedBy: 'gk.r3' },
    { id: 'G-ANUL', title: 'A canceled link can still be paid', severity: 'high', explanation: 'Canceling changed the status, but the payment didn’t check it.', technique: 'One scenario per link status (pending, paid, canceled, expired).', preventedBy: 'gk.r4' },
    { id: 'G-ANUL-PAG', title: 'An already paid link can be canceled and the payment is left unreconciled', severity: 'high', explanation: 'The “as long as it hasn’t been paid” rule stayed in the conversation.', technique: 'Negative cancellation scenario: Given a paid link, When the issuer cancels it, Then it is rejected.', preventedBy: 'gk.r5' },
    { id: 'G-COM', title: 'The minimum commission isn’t applied: a €5 link pays €0.07', severity: 'medium', explanation: 'Without a test for the minimum, the code only calculated 1.4%.', technique: 'TDD: one test per rule, including the minimum, before the code.', preventedBy: 'tdd.min' },
    { id: 'G-UI', title: 'The acceptance suite is brittle and doesn’t document the behavior', severity: 'medium', explanation: 'Scenarios with screens and clicks, several Whens or unverifiable outcomes (or too few clear scenarios): they break with every UI change and don’t explain the rule.', technique: 'BDD good practices: one behavior per scenario, declarative and verifiable.', preventedBy: 'gk.style' },
  ],

  prevention: {
    title: 'Your scenarios and your tests',
    intro: 'At 3:00 PM Tomás coded from what had been agreed. Whatever was in a correct scenario was coded correctly; whatever wasn’t, he decided.',
    preventedLabel: 'Bugs that never came to exist',
    appearedLabel: 'Bugs born from what wasn’t specified',
    rules: [
      { flag: 'gk.happy', label: 'Happy path: paying a pending link', explanation: 'Given a pending link, When the customer pays it, Then the payment is accepted and the link becomes “paid.”' },
      { flag: 'gk.r1min', label: 'Lower amount boundary (€0.99 / €1.00)', explanation: 'Scenario outline with examples on each side of the boundary.' },
      { flag: 'gk.r1max', label: 'Upper amount boundary (€5,000.00 / €5,000.01)', explanation: '“Up to €5,000” doesn’t say whether 5,000 is included: the example decides.' },
      { flag: 'gk.r2', label: 'An expired link cannot be paid', explanation: 'A rule that only came up in example mapping.' },
      { flag: 'gk.r3', label: 'A paid link doesn’t accept a second payment', explanation: 'The most important negative scenario: it prevents charging twice.' },
      { flag: 'gk.r4', label: 'A canceled link cannot be paid', explanation: 'One scenario per link status.' },
      { flag: 'gk.r5', label: 'A paid link cannot be canceled', explanation: 'The “as long as it hasn’t been paid” rule, turned into an example.' },
      { flag: 'gk.style', label: 'Declarative, single-When, verifiable scenarios', explanation: 'No screens or clicks, no “everything works correctly,” and at least three clear scenarios.' },
      { flag: 'tdd.min', label: 'Minimum commission covered by a test', explanation: 'commission(5.00) = €0.25, written before the code.' },
      { flag: 'tdd.cycle', label: 'Full TDD cycle with Sofía', explanation: 'Red before the code, green with the minimum code and refactor with the tests green.' },
    ],
  },

  concepts: [
    { id: 'test_first', title: 'Test-first approaches', summary: 'TDD, ATDD and BDD define the tests before the code: they apply the principle of early testing and shift-left. (CTFL 2.1.3)' },
    { id: 'user_story', title: 'User stories and the 3 Cs', summary: 'Card (a reminder), conversation (the details, as a team) and confirmation (acceptance criteria). They are written collaboratively. (CTFL 4.5.1)' },
    { id: 'acceptance_criteria', title: 'Acceptance criteria', summary: 'Conditions the story must meet to be accepted. Formats: scenario-oriented (Given/When/Then) or rule-oriented. (CTFL 4.5.2)' },
    { id: 'atdd', title: 'ATDD', summary: 'Acceptance test-driven development: the team writes the acceptance test cases before coding, based on the criteria, first the positive ones and then the negative ones. (CTFL 4.5.3)' },
    { id: 'bdd', title: 'BDD and Gherkin', summary: 'Behavior expressed as Given/When/Then scenarios, understandable by the business and automatable. One behavior per scenario, declarative and verifiable. (CTFL 2.1.3)' },
    { id: 'tdd', title: 'TDD', summary: 'Test-driven development: a failing test, the minimum code to pass it, and refactoring with the tests green. It guides the design of the code. (CTFL 2.1.3)' },
  ],
  debriefConcepts: ['test_first', 'user_story', 'acceptance_criteria', 'atdd', 'bdd', 'tdd'],
  seniorTips: [
    'In the three amigos session, ask for examples per rule and ask about the lifecycle: expiring, paying twice, canceling.',
    'One scenario per behavior: happy path, expired, paid, canceled and canceling a paid link.',
    'For the amount, an outline with 0.99 / 1.00 / 5,000.00 / 5,000.01 and their outcomes.',
    'No “I click Pay” and no “everything works correctly.”',
    'Ask Laura for a review before agreeing: it costs 10 minutes and saves bugs.',
    'TDD with Sofía: €100 test → run (red) → minimum code → run (green) → minimum test → red → code → green → refactor → green.',
    'At the demo, explain what the green scenarios cover and what they don’t.',
  ],
}
