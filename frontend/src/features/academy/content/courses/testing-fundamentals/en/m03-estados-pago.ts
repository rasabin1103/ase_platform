import type { Mission } from '../../../../engine/types'
import { PAY_BUG_SLOTS } from '../../../../apps/kobalto-payments/paymentLogic'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m03DesignEn } from './m03-design'
import { m03LessonsEn } from './m03-lessons'
import { m03QuizEn } from './m03-quiz'
import { m03RiskEn } from './m03-risk'

/**
 * Course: Testing Fundamentals · Mission 3 — Payment states (English).
 *
 * Thursday. Kobalto Pay (card payments for merchants) launches its operations
 * console: authorize, settle, cancel, refund and handle disputes.
 * Techniques: state transition testing (valid, invalid and sequences) and a
 * decision table (refund fee).
 */
export const m03EstadosPagoEn: Mission = {
  id: 'm03-estados-pago',
  lang: 'en',
  courseKey: 'testing-fundamentals',
  number: 3,
  title: 'Payment states',
  subtitle: 'State transitions, invalid transitions and decision tables.',
  world: kobaltoWorldEn,
  playerRole: 'Junior QA',
  dayStart: 9 * 60,
  dayLabel: 'Thursday',
  duration: 480,
  appActionCost: 3,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-payments',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  testDesign: m03DesignEn,
  riskModel: m03RiskEn,
  lessons: m03LessonsEn,
  mentor: 'laura',
  quiz: m03QuizEn,
  bugSlots: PAY_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'A leak-free Thursday',
      body: 'Operations turns on refunds with peace of mind: you tested what the system must do and, above all, what it must not allow. Carmen asks you for the state table for the audit.',
    },
    ok: {
      title: 'Thursday cleared',
      body: 'You found bugs, but some transitions or rules were left untested. Check the debrief: every bug has a specific starting state and action.',
    },
    bad: {
      title: 'A risky Thursday',
      body: 'Without the state diagram it\'s easy to stay on the happy path, and that\'s not where the expensive bugs were. Replay the mission starting with the Design.',
    },
  },

  briefing: {
    title: 'Thursday: payment states',
    paragraphs: [
      'Kobalto Pay, the card payments service for merchants, is launching its operations console (KOB-170): authorize, settle, cancel, refund and handle disputes.',
      'Diego has tested the happy path and it works. But a payment can be in eight different states and the console always shows every action: it\'s the API that must block the ones that don\'t apply.',
      'Also, Finance has defined a refund fee table with several conditions. At 4:00 p.m., Carmen (Risk) and Marta will ask whether the console can refund money it shouldn\'t.',
    ],
    goals: [
      'Sketch (in your head or in the Design) the states and their transitions from the wiki.',
      'Test the valid transitions and, above all, the invalid ones that move money.',
      'Test sequences: several refunds in a row on the same payment.',
      'Cover every rule of the fee table and its 30-day boundary.',
      'Report and verify the bugs; at 4:00 p.m., explain what you covered.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'design' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Thursday: payment states 🔁',
      body: 'Good morning!\n\nToday it\'s the Kobalto Pay operations console (KOB-170). It\'s a different kind of testing: what matters here isn\'t a field, but **which state each payment is in and what can be done from it**.\n\nMy advice:\n- Read the **payment lifecycle** in the wiki and draw the states and their arrows.\n- Every arrow is a test case. And so is every **arrow that doesn\'t exist**: the system must respond 409 without touching anything.\n- For the fee, Finance has given us a **decision table**: each rule, at least one test case.\n- Use the **test data generator** to create payments in whatever state you need.\n\nLaura',
    },
    {
      id: 'mail_marta',
      channel: 'email',
      from: 'marta',
      at: 0,
      subject: 'KOB-170 on staging',
      body: 'Hi,\n\nThe operations console is now on staging. Operations needs it so they can stop doing refunds by hand on Monday.\n\nFinance has published the **merchant refund fee** in the wiki. Any questions about the table, let me know.\n\nMarta',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Payments team',
      body: '**Diego:** Yesterday I tested the full flow: create payment, authorize, settle and refund. All OK ✅ The console shows every button, but the API validates the transitions.\n\n**Marta:** Great! Shall we call it good for Monday?\n\n**Laura:** What do you think?',
      choices: [
        {
          id: 'model',
          text: 'That path is only part of it. I\'ll pull all the states and transitions from the wiki and test both the valid and the invalid ones: money gets lost by refunding what shouldn\'t be refunded.',
          cost: 15,
          reply: 'Good call. Start with the invalid ones that move money.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'state_transition' },
            { kind: 'unlock', conceptId: 'invalid_transitions' },
            { kind: 'note', tone: 'good', text: 'You explained that the happy path doesn\'t cover invalid transitions, which is where money gets lost.' },
          ],
        },
        {
          id: 'trust_api',
          text: 'If the API validates the transitions, there\'s no need to test the invalid ones.',
          cost: 15,
          reply: '😎 Told you.',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You assumed the API rejected invalid transitions without checking it.' },
          ],
        },
        {
          id: 'all64',
          text: 'I\'ll test all 64 state × action combinations, one by one.',
          cost: 15,
          reply: 'Having the full table is great, but you won\'t have time to do it all carefully: prioritize the cells that move money.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'unlock', conceptId: 'invalid_transitions' },
            { kind: 'note', tone: 'neutral', text: 'You proposed the full state table; Laura asked you to prioritize by risk.' },
          ],
        },
      ],
    },
    {
      id: 'carmen_incident',
      channel: 'chat',
      from: 'carmen',
      at: 120,
      body: 'Hi. Something that might help: last month, on the old system, a merchant refunded a payment **while the customer had an open dispute** with their bank. Then we lost the dispute and paid twice. Does the new console prevent that?',
      choices: [
        {
          id: 'case',
          text: 'I\'ll turn it into a test case: refunding a "Disputed" payment must be rejected (409). I\'ll let you know the result.',
          cost: 3,
          reply: 'Thanks. That\'s exactly what I want to see covered.',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'flag', key: 'carmen.case' },
            { kind: 'unlock', conceptId: 'incident_learning' },
            { kind: 'note', tone: 'good', text: 'You turned a production incident into a test case.' },
          ],
        },
        {
          id: 'old',
          text: 'That was the old system; the new console is a different thing.',
          cost: 1,
          reply: 'The requirements are the same… I\'d check it.',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You dismissed a real incident as a source of test cases.' },
          ],
        },
      ],
    },
    {
      id: 'marta_fee',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'any', of: [{ kind: 'bugTriggered', bugId: 'F1' }, { kind: 'bugTriggered', bugId: 'F1b' }, { kind: 'bugTriggered', bugId: 'F2' }] },
      body: 'Diego says the fee thing you\'re looking at is "interpreting the table". Are you sure it\'s a bug?',
      choices: [
        {
          id: 'oracle',
          text: 'Finance\'s table is the test oracle: I\'ll point to the exact rule (column) that\'s broken, with plan, refund type and days. If the table is ambiguous, we clarify it with Finance.',
          cost: 3,
          reply: 'Perfect, that leaves no room for argument. Send it to him.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'decision_table' },
            { kind: 'note', tone: 'good', text: 'You defended the fee bug by citing the specific rule in the decision table.' },
          ],
        },
        {
          id: 'drop',
          text: 'It might be interpretation, I\'ll let it go.',
          cost: 1,
          reply: 'OK…',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You let a fee error slide without checking it against the table.' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 300,
      when: { kind: 'reportsLt', value: 1 },
      body: 'How\'s it going? Hint: with the **generator**, create one "Cancelled" payment, one "Authorized" and one "Disputed", and try to **refund** each of them. Then, two refunds in a row on the same payment.',
      onDeliver: [{ kind: 'unlock', conceptId: 'invalid_transitions' }],
    },
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'Nice bug 🐞 For transitions, the report needs: **starting state**, **action**, **expected result** (409 or the resulting state) and **what happened**. Plus the specific payment (KP-…) so Diego can look at it.',
      onDeliver: [{ kind: 'unlock', conceptId: 'state_transition' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Diego has pushed a fix 🔧 Re-test on the new build and repeat the refund sequences too: changing an amount validation can break the boundary case.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
        { kind: 'unlock', conceptId: 'switch_coverage' },
      ],
    },
    {
      id: 'go_live',
      channel: 'meeting',
      from: 'marta',
      with: ['carmen', 'laura'],
      at: 420,
      subject: '4:00 p.m. · Do we turn on refunds on Monday?',
      body: '**Marta:** Operations wants to use the console on Monday.\n\n**Carmen:** I have one question: can the console refund money it shouldn\'t?',
      choices: [
        {
          id: 'coverage',
          text: 'We\'ve tested the valid transitions, the invalid ones that move money and successive refunds, plus every rule in the fee table. The open bugs are on the board with their state and action; I recommend not turning on refunds until the critical fixes are verified.',
          requires: { kind: 'designCoverageGte', value: 0.6 },
          cost: 20,
          reply: 'That\'s what I needed. I\'ll sign off as soon as they\'re verified.',
          replyFrom: 'carmen',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'You answered Risk with state coverage and a clear recommendation.' },
          ],
        },
        {
          id: 'bugs_only',
          text: 'We\'ve found several bugs, but I can\'t say which transitions we\'ve covered.',
          requires: { kind: 'reportsGte', value: 1 },
          cost: 20,
          reply: 'Then I don\'t know what CAN\'T happen. I need the coverage before I sign off.',
          replyFrom: 'carmen',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You had bugs, but no state coverage to show.' }],
        },
        {
          id: 'happy',
          text: 'Diego tested the full flow and it works.',
          cost: 20,
          reply: 'And refunding a cancelled payment? Or a disputed one? I can\'t sign off like this.',
          replyFrom: 'carmen',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'note', tone: 'bad', text: 'You answered Risk with the happy path.' },
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
          text: 'That in a system with states, the expensive part is what shouldn\'t be possible: invalid transitions, final states and sequences that accumulate. And that a decision table is tested rule by rule, with its boundaries.',
          requires: { kind: 'designCoverageGte', value: 0.5 },
          reply: 'Exactly. You tested the way an auditor thinks, not like a user in a hurry.',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'happy',
          text: 'That if the main path works, the rest are edge cases.',
          reply: 'Hmm, go over the debrief: the most expensive bugs were in those "edge cases".',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You took the happy path as your quality criterion.' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Honestly, I didn\'t get very far.',
          reply: 'With eight states it\'s normal to get lost. Tomorrow we\'ll draw the diagram together before we start.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'ciclo',
      title: 'Card payment lifecycle (KOB-170)',
      updatedLabel: 'Updated on Monday by Marta Sanz',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'state_transition' },
        { kind: 'flag', key: 'states.read' },
      ],
      body: `## States
- **Pending**: the customer has paid at the merchant; the issuing bank's response is still pending.
- **Authorized**: the bank holds the money, but it hasn't been collected yet.
- **Declined**: the bank doesn't authorize it. Final state.
- **Cancelled**: cancelled before being collected. Final state.
- **Settled**: the money has been collected and credited to the merchant.
- **Partially refunded**: part of it has been refunded to the customer.
- **Refunded**: everything has been refunded. Final state.
- **Disputed**: the customer has disputed the charge with their bank.

## Allowed transitions
- Pending → **Authorize** → Authorized · **Decline** → Declined · **Cancel** → Cancelled.
- Authorized → **Settle** → Settled · **Cancel** → Cancelled.
- Settled → **Refund** → Partially refunded (or Refunded if everything is refunded) · **Open dispute** → Disputed.
- Partially refunded → **Refund** → Partially refunded (or Refunded once the full amount is reached) · **Open dispute** → Disputed.
- Disputed → **Dispute won** → back to the state before the dispute · **Dispute lost** → Refunded (chargeback of the remaining amount).

## Rules
- Any other action responds **409 Transition not allowed** and **does not change the payment**.
- A refund must be greater than €0, with at most 2 decimals, and **must not exceed the amount still refundable** (amount − already refunded).
- While a dispute is open, **refunds are not allowed**: the customer's bank may already be giving the money back to them.`,
    },
    {
      id: 'comisiones',
      title: 'Finance · Merchant refund fee',
      updatedLabel: 'Approved by Finance on Tuesday',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'decision_table' },
        { kind: 'flag', key: 'fees.read' },
      ],
      body: `## Conditions
- **Merchant plan**: Pro or Standard.
- **Refund type**: "full" if the entire payment amount is refunded in a single operation; anything else is "partial".
- **Period**: within the period if refunded **up to 30 calendar days** after the payment, **day 30 included**.

## Rules
- **R1** · Pro plan (any type and period) → **€0.00**.
- **R2** · Standard · full · within the period → **€0.00**.
- **R3** · Standard · full · outside the period → **€1.50**.
- **R4** · Standard · partial · within the period → **€0.75**.
- **R5** · Standard · partial · outside the period → **€1.50**.

The fee is charged to the merchant on each refund and is shown in the payment details.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-170',
      title: 'As an operations agent I want to manage payment refunds and disputes from a console',
      status: 'In QA',
      type: 'story',
      description: 'Internal Kobalto Pay console. It follows the payment lifecycle (wiki) and Finance\'s fee table. The console shows every action; the API validates the transitions.',
      acceptanceCriteria: [
        'Given a payment in any state, when I perform an action allowed by the lifecycle, then the payment moves to the indicated state and it is recorded in the history.',
        'Given an action not allowed in the current state, then the API responds 409 and the payment does not change.',
        'Given a refund, then its amount is > €0 and does not exceed the amount still refundable; once the full amount is reached the payment becomes "Refunded".',
        'Given a dispute that is won, then the payment returns to its previous state; if lost, it becomes "Refunded".',
        'Each refund applies the fee from Finance\'s table.',
      ],
      comments: [
        { author: 'diego', body: 'Tested the flow create → authorize → settle → refund ✅' },
        { author: 'marta', body: 'Operations needs this on Monday 🙏' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'S1', title: 'A cancelled payment can be refunded', severity: 'critical', explanation: 'The API doesn\'t check the state before refunding: money is refunded on a payment that was never collected.', technique: 'Invalid transition: Cancelled → Refund.', fix: { delay: 40 } },
    { id: 'S1b', title: 'A payment that is only authorized (not settled) can be refunded', severity: 'critical', explanation: 'Refunds are allowed from "Authorized": the money hasn\'t been collected yet and is credited to the customer anyway.', technique: 'Invalid transition: Authorized → Refund.', fix: { delay: 40 } },
    { id: 'S2', title: 'An already settled payment can be cancelled', severity: 'high', explanation: 'Cancellation doesn\'t check the state: the payment ends up "Cancelled" with the money already credited to the merchant and no refund to the customer.', technique: 'Invalid transition: Settled → Cancel.', fix: { delay: 40 } },
    { id: 'S2b', title: 'A cancelled payment can be settled', severity: 'critical', explanation: 'A final state isn\'t final: the customer is charged for a payment that had been cancelled.', technique: 'Invalid transition from a final state: Cancelled → Settle.', fix: { delay: 40 } },
    {
      id: 'S3',
      title: 'Successive refunds can exceed the payment amount',
      severity: 'critical',
      explanation: 'Each refund is validated against the original amount instead of the remaining amount: with two partial refunds, more is refunded than was collected.',
      technique: 'Transition sequence with boundary values: €60 + €41 on €100.',
      fix: { delay: 50, regression: 'S-R1', note: 'I changed the validation to use the amount still refundable.' },
    },
    { id: 'S4', title: 'A disputed payment can be refunded', severity: 'critical', explanation: 'Refunds are allowed while a dispute is open: if the dispute is lost, we pay twice (the incident Carmen described).', technique: 'Invalid transition taken from an incident: Disputed → Refund.', fix: { delay: 45 } },
    { id: 'S4b', title: 'A dispute cannot be opened on a partially refunded payment', severity: 'medium', explanation: 'A valid transition responds 409: Operations can\'t record disputes for those payments and would have to do it by hand.', technique: 'Valid transition: Partially refunded → Open dispute.', fix: { delay: 40 } },
    { id: 'S5', title: 'Refunding the full amount leaves the payment "Partially refunded"', severity: 'high', explanation: 'The switch to "Refunded" uses "greater than" instead of "greater than or equal to": the payment stays open with €0 remaining and reports count it wrong.', technique: 'Boundary value and resulting state: refund exactly €100.00 of €100.00.', fix: { delay: 40 } },
    { id: 'S5b', title: 'A declined payment can be authorized', severity: 'high', explanation: 'The final state "Declined" accepts "Authorize": the merchant would see as good a payment the bank denied.', technique: 'Invalid transition from a final state: Declined → Authorize.', fix: { delay: 40 } },
    {
      id: 'F1',
      title: 'Pro merchants are charged a fee on partial refunds',
      severity: 'medium',
      requiresFlag: 'fees.read',
      disputeReply: 'Where does it say Pro merchants don\'t pay on partial refunds? Send me the rule.',
      explanation: 'The partial-refund rule is evaluated before the Pro plan rule: R1 has a "–" for the type and the code doesn\'t respect it.',
      technique: 'Decision table: more than one combination in a rule with "don\'t care" (Pro · partial).',
      fix: { delay: 40 },
    },
    {
      id: 'F1b',
      title: 'Full refunds outside the period aren\'t charged a fee (Standard)',
      severity: 'medium',
      requiresFlag: 'fees.read',
      disputeReply: 'Are you sure? As far as I know, full refunds are free. Which rule says otherwise?',
      explanation: 'The period isn\'t checked for full refunds: R3 (€1.50) is never applied.',
      technique: 'Decision table: one test per rule (R3 · Standard · full · outside the period).',
      fix: { delay: 40 },
    },
    {
      id: 'F2',
      title: 'A refund on day 30 is charged as outside the period',
      severity: 'low',
      requiresFlag: 'fees.read',
      disputeReply: '30 days is 30 days… is day 30 in or not? Show me where it says so.',
      explanation: 'The period uses "less than 30" instead of "up to 30 inclusive": the fee is charged on the last day of the period.',
      technique: 'Boundary values within a table condition: day 30 and day 31.',
      fix: { delay: 35 },
    },
    {
      id: 'S-R1',
      title: 'Regression: refunding exactly the remaining amount is rejected',
      severity: 'high',
      regression: true,
      explanation: 'When the cumulative validation was fixed, "less than" the remaining amount was used: the refund of a payment can no longer be completed.',
      technique: 'Regression at the boundary of the sequence: €60 + €40 on €100.',
    },
  ],

  concepts: [
    { id: 'state_transition', title: 'State transition testing', summary: 'Model the system as states and arrows; every valid transition is at least one test case, and the resulting state is checked.' },
    { id: 'invalid_transitions', title: 'Invalid transitions', summary: 'Every empty cell in the state table must be rejected with no side effects. Prioritize those that move money and those leaving final states.' },
    { id: 'switch_coverage', title: 'Sequences (1-switch)', summary: 'Many bugs appear when transitions are chained: accumulations, loops and returning to the previous state.' },
    { id: 'decision_table', title: 'Decision table testing', summary: 'Conditions in rows, rules in columns: at least one test case per rule, several combinations if there is a "–", and boundaries on numeric conditions.' },
    { id: 'test_data', title: 'Test data', summary: 'Generators create the object in the state you need; they speed up setup, but walk the real path at least once and write down the data.' },
    { id: 'incident_learning', title: 'Incidents as a source of test cases', summary: 'What already failed in production comes back: turn every incident into a regression test case, also when migrating systems.' },
    { id: 'boundary_values', title: 'Boundary value analysis', summary: 'Just inside and just outside: also for cumulative amounts and for the periods in a decision table.' },
    { id: 'confirmation_testing', title: 'Confirmation testing (re-test)', summary: 'Re-run the test case that failed on the new build before closing.' },
    { id: 'regression', title: 'Regression testing', summary: 'After a fix, repeat the related test cases that used to pass, especially those at the boundary.' },
  ],
  debriefConcepts: ['state_transition', 'invalid_transitions', 'switch_coverage', 'decision_table', 'incident_learning'],
  seniorTips: [
    'Before touching the console, pull the states × actions table from the wiki: 11 valid cells; all the rest must return 409.',
    'Prioritize the invalid transitions that move money: refunding from Cancelled, Authorized or Disputed; settling what was cancelled.',
    'Treat final states as final: test at least one action from Declined, Cancelled and Refunded.',
    'Test refund sequences at their boundary: 60 + 40 (exact) and 60 + 41 (over), and check the resulting state.',
    'In the fee table, one test case per rule, an extra combination for the rule with "–", and day 30 versus day 31.',
    'Use production incidents as test cases: "refunding a disputed payment" already cost money once.',
  ],
}
