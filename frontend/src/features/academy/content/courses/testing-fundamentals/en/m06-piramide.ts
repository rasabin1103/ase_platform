import type { Mission } from '../../../../engine/types'
import { PYRAMID_BUG_SLOTS } from '../../../../apps/kobalto-pyramid/pyramidLogic'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m06LessonsEn } from './m06-lessons'
import { m06QuizEn } from './m06-quiz'

/**
 * Course: Testing Fundamentals · Mission 6 — The pyramid (English).
 *
 * Tuesday. KOB-190 "Split an expense" starts its sprint and QA defines where
 * each test lives. The chosen level determines the cost, the speed of the
 * suite and which bugs can be seen.
 */
export const m06PiramideEn: Mission = {
  id: 'm06-piramide',
  lang: 'en',
  courseKey: 'testing-fundamentals',
  number: 6,
  title: 'The pyramid',
  subtitle: 'Test levels and test types: unit, API, E2E, manual and non-functional.',
  world: kobaltoWorldEn,
  playerRole: 'Junior QA',
  dayStart: 9 * 60,
  dayLabel: 'Tuesday',
  duration: 480,
  appActionCost: 10,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-pyramid',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  lessons: m06LessonsEn,
  mentor: 'laura',
  quiz: m06QuizEn,
  bugSlots: PYRAMID_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'A pyramid that holds',
      body: 'Your plan for KOB-190 becomes the team\'s template: a suite that runs in minutes, security tested where it lives and performance with its own test.',
    },
    ok: {
      title: 'Tuesday cleared',
      body: 'The plan works, but some check lives at a level that can\'t see it or that makes it slow. Check the debrief.',
    },
    bad: {
      title: 'Ice cream cone',
      body: 'Testing everything through the UI feels safe, but it\'s slow, brittle and blind to security and performance. Replay the mission starting from the base.',
    },
  },

  briefing: {
    title: 'Tuesday: the pyramid',
    paragraphs: [
      'The sprint for KOB-190 "Split an expense" begins: from a transaction, the customer splits the amount among friends and sends them a payment request.',
      'Today isn\'t about testing by hand: Laura wants you to define **where each test lives**. The planner has 16 checks; for each one you choose the level (unit, API, E2E, manual or performance) and write it.',
      'Each level takes a different amount of time and sees different things: a mock doesn\'t see a contract failure and an E2E test with 3 friends doesn\'t see performance with 20. At 4:00 p.m. you present the strategy.',
    ],
    goals: [
      'Place each check at the lowest level that can see it.',
      'Test security where it lives (the API), not where it hides (the UI).',
      'Give performance and time (reminders) their own test.',
      'Report the bugs your tests find.',
      'Send the plan to Laura and defend the strategy at 4:00 p.m.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Tuesday: where does each test live? 🔺',
      body: 'Good morning!\n\nThis week the team wants to automate more, and KOB-190 "Split an expense" is the chance to do it right.\n\nIn the **test planner** (Staging) you have 16 checks. For each one:\n- Choose the **level**: unit, API, E2E, manual or performance.\n- **Write it** (or run it if it\'s manual): each level takes a different amount of time.\n- Tests find real bugs if they\'re at the level that can see them.\n\nWhen you have it, **send me the plan**. The architecture is in the wiki.\n\nLaura',
    },
    {
      id: 'mail_diego',
      channel: 'email',
      from: 'diego',
      at: 0,
      subject: 'KOB-190: architecture and what\'s already there',
      body: 'Hi,\n\nI\'ve left the architecture in the wiki. Summary: the split logic is in a separate module (`splitCalculator`), the API is at `/splits` and the app consumes the API.\n\nMy unit tests only cover the happy path (splitting €9 among 3), I admit it 😅\n\nDiego',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'sergio'],
      at: 30,
      subject: 'Daily · with Sergio (QA Automation)',
      body: '**Sergio:** In Cards we automate everything with E2E tests through the UI: that way we test like the user. I recommend you do the same.\n\n**Diego:** Our E2E suite already takes 25 minutes…\n\n**Laura:** What do you propose for KOB-190?',
      choices: [
        {
          id: 'pyramid',
          text: 'Each test at the lowest level that can see it: the split logic in unit tests, permissions and contract in the API, only the critical journeys in E2E, and performance and usability with their own tests.',
          cost: 15,
          reply: 'That\'s a pyramid. I like it.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'test_pyramid' },
            { kind: 'note', tone: 'good', text: 'You proposed distributing the tests across levels instead of automating everything through the UI.' },
          ],
        },
        {
          id: 'all_e2e',
          text: 'Sergio is right: if we test everything through the UI, we test like the user.',
          cost: 15,
          reply: 'That\'s it! 💪',
          replyFrom: 'sergio',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'test_pyramid' },
            { kind: 'note', tone: 'bad', text: 'You backed automating everything through the UI: slow, brittle and blind to what the UI hides.' },
          ],
        },
        {
          id: 'manual',
          text: 'For a new feature, it\'s better to test by hand and automate later.',
          cost: 15,
          reply: 'New things can be automated from the start too, especially the logic…',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'note', tone: 'neutral', text: 'You proposed leaving automation for later.' },
          ],
        },
      ],
    },
    {
      id: 'ivan_suite',
      channel: 'chat',
      from: 'ivan',
      at: 90,
      body: 'A data point for your plan: the Cards E2E suite takes **50 minutes** and fails 1 in 5 runs for no reason. The devs already merge without waiting for it 🙃',
      onDeliver: [{ kind: 'unlock', conceptId: 'test_pyramid' }],
    },
    {
      id: 'marta_security',
      channel: 'chat',
      from: 'marta',
      at: 180,
      body: 'Compliance is asking about KOB-190: can someone **cancel another person\'s split** or **see someone else\'s splits**? How are you going to check it?',
      choices: [
        {
          id: 'api',
          text: 'Against the API, with another user\'s token: the app doesn\'t show those buttons, but the rule has to be on the server.',
          cost: 3,
          reply: 'Perfect, I\'ll tell them that.',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'unlock', conceptId: 'test_levels' },
            { kind: 'note', tone: 'good', text: 'You proposed testing security at the API, where the rule lives.' },
          ],
        },
        {
          id: 'ui',
          text: 'The app doesn\'t show those buttons on other people\'s splits, so it can\'t be done.',
          cost: 2,
          reply: 'And what if someone calls the API directly? Compliance is going to ask exactly that.',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'unlock', conceptId: 'test_levels' },
            { kind: 'note', tone: 'bad', text: 'You assumed a rule was safe because the UI hides the button.' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 300,
      when: { kind: 'notFlag', key: 'plan.submitted' },
      body: 'How\'s it going? Hint: if a check needs to wait days or needs 20 users, no E2E test is going to help you. And remember to send me the plan before 4:00 p.m.',
      onDeliver: [{ kind: 'unlock', conceptId: 'test_types' }],
    },
    {
      id: 'review_good',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'plan.good' },
      body: 'What a good plan! 🔺 A wide base of unit tests, security and contract in the API, few E2E tests, performance with its own test and the human side explored by hand. That\'s how it\'s done.',
      onDeliver: [
        { kind: 'score', key: 'rigor', add: 2 },
        { kind: 'note', tone: 'good', text: 'Laura approved your plan: a complete, fast pyramid.' },
      ],
    },
    {
      id: 'review_ice',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'plan.shape.ice_cream' },
      body: 'Your plan has more E2E tests than unit tests: it\'s an **ice cream cone** 🍦. It\'s going to be slow and brittle, and E2E tests don\'t see what the UI hides. Move the logic down to unit tests.',
      onDeliver: [
        { kind: 'score', key: 'rigor', add: -1 },
        { kind: 'unlock', conceptId: 'test_pyramid' },
        { kind: 'note', tone: 'bad', text: 'Your plan ended up inverted: more E2E tests than unit tests.' },
      ],
    },
    {
      id: 'review_perf',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'plan.no_perf' },
      body: 'Something\'s missing: who checks that a split with **20 friends** takes less than 2 s? An E2E test with 3 doesn\'t tell you. That\'s a **performance** test.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'test_types' },
        { kind: 'note', tone: 'bad', text: 'Your plan had no performance test for the 20-friend case.' },
      ],
    },
    {
      id: 'review_explore',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'plan.automated_exploratory' },
      body: 'You\'ve automated texts, usability or accessibility. A script can check that a text exists, but not whether it **makes sense**: that gets explored by hand.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'exploratory' },
        { kind: 'note', tone: 'bad', text: 'You automated checks that need human judgment.' },
      ],
    },
    {
      id: 'review_slow',
      channel: 'chat',
      from: 'ivan',
      when: { kind: 'flag', key: 'plan.slow_ci' },
      body: 'I\'ve seen your plan: the suite would go over **15 minutes** per run. With that, nobody waits for green before merging 😬',
      onDeliver: [{ kind: 'note', tone: 'bad', text: 'Your plan left the suite above 15 minutes per run.' }],
    },
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'Nice bug 🐞 Notice the level where you saw it: that\'s the level where the test should stay so it doesn\'t come back (regression).',
      onDeliver: [{ kind: 'unlock', conceptId: 'test_levels' }],
    },
    {
      id: 'strategy',
      channel: 'meeting',
      from: 'raul',
      with: ['laura', 'diego', 'sergio'],
      at: 420,
      subject: '4:00 p.m. · KOB-190 test strategy',
      body: '**Raúl:** We want KOB-190 to be the model for automating everything else. What\'s the strategy?',
      choices: [
        {
          id: 'pyramid',
          text: 'A pyramid: the split logic and the reminder in unit tests with a simulated clock, permissions and contract in the API, two critical E2E tests, performance with 20 friends in the nightly run, and exploratory testing for texts, usability and accessibility. The suite runs in minutes.',
          requires: { kind: 'flag', key: 'plan.good' },
          cost: 20,
          reply: 'This is what I want to replicate in the other teams.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'score', key: 'efficiency', add: 1 },
            { kind: 'unlock', conceptId: 'test_pyramid' },
            { kind: 'note', tone: 'good', text: 'You defended a pyramid strategy with cost and speed data.' },
          ],
        },
        {
          id: 'partial',
          text: 'We have a plan by levels, although it still needs some adjustments Laura pointed out. I\'ll wrap them up this week.',
          requires: { kind: 'flag', key: 'plan.submitted' },
          cost: 20,
          reply: 'Good, but don\'t let it stay at "almost".',
          replyFrom: 'raul',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You presented a plan by levels with adjustments still pending.' }],
        },
        {
          id: 'all_e2e',
          text: 'Automate everything through the UI, like in Cards: that way we test like the user.',
          cost: 20,
          reply: 'Like the 50-minute suite nobody waits for? That\'s not what I\'m after.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You proposed an ice cream cone to Raúl as the model.' },
          ],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '5:00 p.m. · Chat with Laura',
      body: '**Laura:** What are you taking away from today?',
      choices: [
        {
          id: 'lesson',
          text: 'That each test goes at the lowest level that can see the problem: many unit tests, security and contract in the API, few E2E tests, and the non-functional and human aspects with their own tests.',
          requires: { kind: 'flag', key: 'plan.submitted' },
          reply: 'Exactly. A good pyramid leaves you time to think.',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'e2e',
          text: 'That the safest thing is to test everything like the user, through the UI.',
          reply: 'Go over the debrief: security and performance couldn\'t be seen from the UI.',
          effects: [
            { kind: 'note', tone: 'bad', text: 'You took away "everything through the UI".' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Honestly, I didn\'t get very far.',
          reply: 'Tomorrow we\'ll look at it with Diego: the unit test base is quick to set up.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'arquitectura',
      title: 'KOB-190 · "Split an expense" architecture',
      updatedLabel: 'Updated yesterday by Diego Ruiz',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_levels' },
        { kind: 'flag', key: 'arch.read' },
      ],
      body: `## Components
- **splitCalculator** (module): splits the amount; the leftover cent goes to the **payer**; validates amounts and number of friends (1 to 20).
- **API /splits**: creates, lists and cancels splits. This is where the **permissions** are: only the creator can cancel and each user only sees their own splits. Amounts in **cents** (integer).
- **Scheduler**: sends a reminder **once**, after 3 days, if it hasn't been paid.
- **App**: "Split" screen from a transaction's details and a "Pending" list. Sends the amounts to the API.

## Non-functional requirements
- Creating a split with **20 friends** in less than **2 s**.
- Accessible with a screen reader.

## Test data
- The staging database has users with 3 friends. For 20, data has to be generated (performance tool).`,
    },
    {
      id: 'guia_auto',
      title: 'Team automation guide',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'test_pyramid' }],
      body: `## Levels
- **Unit**: an isolated piece (calculations, validations, rules with simulated time). Milliseconds.
- **API / integration**: pieces talking to each other, permissions, contracts. Seconds.
- **E2E**: a complete journey through the UI. Minutes, and brittle: only the critical ones.
- **Manual / exploratory**: whatever needs human judgment.
- **Performance**: load and timings with real volumes; in the nightly run.

## Suite targets
- The suite that gates a change must take **less than 15 minutes**.
- Intermittent failures below **5%** of runs.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-190',
      title: 'As a customer I want to split an expense among friends and send them a payment request',
      status: 'In progress',
      type: 'story',
      description: 'From a transaction\'s details, the customer splits the amount among 1 to 20 friends (equally or in custom amounts) and sends them a request. Architecture in the wiki.',
      acceptanceCriteria: [
        'An equal split adds up to exactly the total; the leftover cent goes to the payer.',
        'Custom amounts must add up to the total.',
        'Only the creator can cancel a split and each user only sees their own.',
        'If it isn\'t paid, a single reminder is sent after 3 days.',
        'Creating a split with 20 friends takes less than 2 s.',
      ],
      comments: [
        { author: 'diego', body: 'Happy path unit tests done (€9 among 3) ✅' },
        { author: 'sergio', body: 'If you want, I can pass you our E2E framework 😉' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'P1', title: 'The equal split loses a cent (€10 among 3 = €9.99)', severity: 'medium', explanation: 'Each share is truncated to €3.33 and the leftover cent isn\'t assigned to anyone.', technique: 'Unit test of the calculation with an amount that doesn\'t divide evenly.', fix: { delay: 30 } },
    { id: 'P1b', title: 'The leftover cent is assigned to the last friend instead of the payer', severity: 'low', explanation: 'The remainder is added to the last share instead of the payer\'s, contrary to the acceptance criterion.', technique: 'Unit test of the calculation compared against the acceptance criterion.', fix: { delay: 30 } },
    { id: 'P2', title: 'A user can cancel another user\'s split by calling the API', severity: 'critical', explanation: 'The API doesn\'t check that whoever cancels is the creator; the app doesn\'t show the button, which is why nobody noticed.', technique: 'API test (security) with another user\'s token.', fix: { delay: 45 } },
    { id: 'P2b', title: 'The API returns another user\'s splits', severity: 'critical', explanation: 'The list endpoint accepts a userId parameter and doesn\'t compare it with the authenticated user: data leak.', technique: 'API test (privacy) requesting another user\'s data.', fix: { delay: 45 } },
    { id: 'P3', title: 'The app sends the amount in euros and the API reads it as cents', severity: 'high', explanation: 'Each side follows its own idea of the contract and its unit tests with mocks pass; together, €10.50 becomes €0.11.', technique: 'App ↔ API contract test (or the critical E2E test).', fix: { delay: 40 } },
    { id: 'P4', title: 'Creating a split with 20 friends takes 8 s', severity: 'high', explanation: 'One database query is made per friend: with 3 it isn\'t noticeable, with 20 it is.', technique: 'Performance test with the real volume (20 friends).', fix: { delay: 60 } },
    { id: 'P5', title: 'The reminder is sent every day instead of once after 3 days', severity: 'medium', explanation: 'The sending condition checks "more than 0 days" and doesn\'t mark the reminder as sent.', technique: 'Unit test with a simulated clock: no E2E test can wait 3 days.', fix: { delay: 35 } },
  ],

  concepts: [
    { id: 'test_pyramid', title: 'Test pyramid', summary: 'Many unit tests, a good number of API/integration tests and few E2E tests: a fast, stable and cheap suite. Inverted, it\'s an ice cream cone.' },
    { id: 'test_levels', title: 'Test levels', summary: 'Each check at the lowest level that can see the problem: logic at the bottom, permissions in the API, complete journeys at the top.' },
    { id: 'contract_testing', title: 'Mocks and contracts', summary: 'Unit tests with mocks don\'t see disagreements between pieces; a contract test checks the real format that travels.' },
    { id: 'test_types', title: 'Test types', summary: 'Functional, non-functional (performance, security, usability, accessibility) and change-related. Non-functional aspects need their own test.' },
    { id: 'exploratory', title: 'What not to automate', summary: 'Clarity, usability and real accessibility need human judgment: goal-driven exploratory testing.' },
  ],
  debriefConcepts: ['test_pyramid', 'test_levels', 'contract_testing', 'test_types', 'exploratory'],
  seniorTips: [
    'Read the architecture: it says where each rule lives (calculation in the module, permissions in the API).',
    'C01–C05 as unit tests (with a simulated clock for the reminder): fast and precise.',
    'C06–C10 in the API: permissions, privacy and contract can\'t be seen from the UI or with mocks.',
    'Only two E2E tests: the complete journey and the "Split" button.',
    'C15 as a performance test with 20 friends; C13, C14 and C16, exploratory and by hand.',
    'Result: 5 unit, 5 API, 2 E2E, 3 manual and 1 performance test; the suite runs in under 8 minutes.',
  ],
}
