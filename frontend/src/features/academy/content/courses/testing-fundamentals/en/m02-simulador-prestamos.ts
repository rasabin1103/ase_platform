import type { Mission } from '../../../../engine/types'
import { LOAN_BUG_SLOTS } from '../../../../apps/kobalto-loans/loanLogic'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m02DesignEn } from './m02-design'
import { m02LessonsEn } from './m02-lessons'
import { m02QuizEn } from './m02-quiz'
import { m02RiskEn } from './m02-risk'

/**
 * Course: Testing Fundamentals · Mission 2 — The loan simulator (English).
 * Translation of ../m02-simulador-prestamos.ts: same structure and ids.
 *
 * Wednesday. Story KOB-163 arrives well written, with examples. The
 * challenge is different: many interacting variables (age, income, amount,
 * term), combined rules, an interest band and a calculation that can only be
 * checked against an oracle (Risk's table of examples).
 */
export const m02SimuladorPrestamosEn: Mission = {
  id: 'm02-simulador-prestamos',
  lang: 'en',
  courseKey: 'testing-fundamentals',
  number: 2,
  title: 'The loan simulator',
  subtitle: 'Equivalence partitions and boundary values with several variables, combined rules and a test oracle.',
  world: kobaltoWorldEn,
  playerRole: 'Junior QA',
  dayStart: 9 * 60,
  dayLabel: 'Wednesday',
  duration: 480,
  appActionCost: 3,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-loans',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  testDesign: m02DesignEn,
  riskModel: m02RiskEn,
  lessons: m02LessonsEn,
  mentor: 'laura',
  quiz: m02QuizEn,
  bugSlots: LOAN_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'A Wednesday of precision',
      body: 'Carmen, from Risk, asks for you to be the one who reviews the next loan product. You have shown that «tested» means covered, not random.',
    },
    ok: {
      title: 'Wednesday passed',
      body: 'You found bugs, but some boundaries or combinations slipped through. Check the debrief: each one has a specific variable and limit.',
    },
    bad: {
      title: 'A rough Wednesday',
      body: 'With so many variables, it is easy to get lost without a valid baseline or an oracle. Replay the mission starting with the Design.',
    },
  },

  briefing: {
    title: 'Wednesday: the loan simulator',
    paragraphs: [
      'Kobalto is launching personal loans and the simulator (KOB-163) is already in staging. This time the story arrives well written and with examples: Marta has learned from yesterday.',
      'The challenge is different: age, income, amount and term interact with each other, there is an interest band and a rule that combines age and term. You will not have time to test every combination.',
      'Besides, how do you know whether a monthly payment is calculated correctly? Risk has prepared a table of validated examples. At 16:00, Carmen, from Risk, will ask what you have tested.',
    ],
    goals: [
      'Prioritize by risk and design your test cases: a valid baseline and one variable at a time.',
      'Test the boundaries of each rule and the critical combinations.',
      'Compare the calculations with the oracle (Risk\'s table).',
      'Report and verify the bugs with the expected result and its source.',
      'At 16:00, explain to Risk what you have covered.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'design' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Wednesday: the loan simulator 🧮',
      body: 'Good morning!\n\nToday we are testing the loan simulator (KOB-163). It is already in staging and the story comes with examples 😉\n\nThe challenge: **many variables at once**. My advice:\n- Prioritize by risk in **Design → Risks**.\n- Choose a **valid baseline** and change **one variable at a time**, across its partitions and boundaries.\n- Rules that combine variables (age + term) are tested at their own boundary.\n- To know whether a monthly payment is right, use **Risk\'s table of examples** (wiki): it is our oracle.\n\nAt 16:00, Carmen (Risk) will ask us what we have covered.\n\nLaura',
    },
    {
      id: 'mail_carmen',
      channel: 'email',
      from: 'carmen',
      at: 0,
      subject: 'Validated examples for KOB-163',
      body: 'Hi,\n\nI have left the **table of examples calculated by Risk** in the wiki. Any difference from the simulator, **even a single cent**, is a problem: what we show the customer is a binding offer.\n\nToday at 16:00 I will ask you what you have tested of the risk rules.\n\nCarmen López · Risk & Compliance',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Payments team',
      body: '**Diego:** Last night I ran a script with 500 random combinations against the simulator and nothing failed 💪\n\n**Marta:** Great! So can we consider it tested?\n\n**Laura:** What do you think?',
      choices: [
        {
          id: 'systematic',
          text: 'Thanks, Diego, that\'s useful. But random values almost never land on the boundaries (17, 18, 70, 10,000…). Today I\'m designing test cases at the limits of each rule and in the critical combinations.',
          cost: 15,
          reply: 'Good point. Share what you\'ve covered with us later.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'random_vs_systematic' },
            { kind: 'note', tone: 'good', text: 'You explained why 500 random cases do not replace testing the boundaries.' },
          ],
        },
        {
          id: 'trust_script',
          text: 'If the script didn\'t fail, there\'s not much else to test.',
          cost: 15,
          reply: 'That\'s what I like to hear! 😎',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You considered the simulator tested because of a random script, without knowing what it covered.' },
          ],
        },
        {
          id: 'review_script',
          text: 'Send me the script and I\'ll check which values it covers before deciding what else to test.',
          cost: 15,
          reply: 'I\'ll send it over. Spoiler: it generates amounts between 1,000 and 30,000 and ages between 20 and 60.',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'random_vs_systematic' },
            { kind: 'note', tone: 'good', text: 'You checked what the automated tests covered before relying on them (they did not touch any boundary).' },
          ],
        },
      ],
    },
    {
      id: 'slow_staging',
      channel: 'chat',
      from: 'ivan',
      at: 120,
      probability: 0.5,
      body: '⚠️ Staging is slow today (8–10 s per simulation) because of a database migration. It should be back to normal in the afternoon.',
      choices: [
        {
          id: 'risk_note',
          text: 'I\'ll note it as a non-functional risk: when the migration is done I\'ll measure the response time to confirm it isn\'t the simulator.',
          cost: 3,
          reply: '👍 Good idea, let me know if it\'s still slow afterwards.',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'non_functional' },
            { kind: 'note', tone: 'good', text: 'You treated the slowness as a non-functional risk and planned to measure it once the environment was stable.' },
          ],
        },
        {
          id: 'ignore',
          text: 'Okay, I\'ll carry on with my stuff.',
          cost: 1,
          effects: [{ kind: 'note', tone: 'neutral', text: 'You let the staging slowness go without noting it.' }],
        },
        {
          id: 'bug_now',
          text: 'I\'ll open a performance bug on the simulator right away.',
          cost: 3,
          reply: 'It\'s the migration, not the simulator… Please check first.',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'non_functional' },
            { kind: 'note', tone: 'bad', text: 'You were about to open a bug without isolating the cause (it was the environment).' },
          ],
        },
      ],
    },
    {
      id: 'diego_rounding',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'bugTriggered', bugId: 'L7' },
      body: 'I saw in the logs that you\'re comparing monthly payments. A one-cent difference isn\'t a bug, right? It\'s rounding 🤷',
      choices: [
        {
          id: 'matters',
          text: 'At a bank it is: what we show is a binding offer and one cent across thousands of loans is money. The policy says «rounded to the cent»; I\'m reporting it with Risk\'s example.',
          cost: 3,
          reply: 'Okay, put like that… Send it over and I\'ll look at it.',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'test_oracle' },
            { kind: 'unlock', conceptId: 'calculation_testing' },
            { kind: 'note', tone: 'good', text: 'You used the oracle to argue that one cent in a binding offer is a bug.' },
          ],
        },
        {
          id: 'drop',
          text: 'You\'re right, I\'ll drop it.',
          cost: 1,
          reply: '👍',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You let a calculation error slide because «it was only one cent».' },
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
      body: 'How\'s it going? Hint: a valid baseline (35 years old, €2,500, €6,000, 48 months) and change **only one variable** at a time, right at its boundaries. And compare the monthly payments with Risk\'s table.',
      onDeliver: [{ kind: 'unlock', conceptId: 'combinatorial' }],
    },
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'Good bug 🐞 Remember to always write the expected result **and where it comes from** (the policy or Risk\'s table). Without an oracle, it\'s your opinion against Diego\'s.',
      onDeliver: [{ kind: 'unlock', conceptId: 'test_oracle' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Diego has pushed a fix 🔧 Re-test on the new build and, careful: with calculations, also repeat Risk\'s examples. A change in the band can throw something else off.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
      ],
    },
    {
      id: 'carmen_audit',
      channel: 'meeting',
      from: 'carmen',
      with: ['laura'],
      at: 420,
      subject: '16:00 · Risk reviews KOB-163',
      body: '**Carmen:** Before I sign off on KOB-163 I need to know what you have tested of the risk rules: age, debt-to-income and age at the end of the loan. What can you tell me?',
      choices: [
        {
          id: 'coverage',
          text: 'We covered the partitions and boundaries of each variable on a valid baseline, the 35% from both sides and the 75-year rule right at its boundary. The test cases are in the design and the bugs, with their reference example, are on the board.',
          requires: { kind: 'designCoverageGte', value: 0.6 },
          cost: 20,
          reply: 'That\'s how I like it. With that I can sign off as soon as the bugs are fixed.',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'You explained the coverage to Risk with data: which rules, which boundaries and where the evidence is.' },
          ],
        },
        {
          id: 'bugs_only',
          text: 'We\'ve found several bugs, but I\'m not sure exactly what we\'ve covered.',
          requires: { kind: 'reportsGte', value: 1 },
          cost: 20,
          reply: 'Finding bugs is good, but I need to know what has NOT failed because it was tested. Send me the coverage.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You had bugs, but no coverage to show Risk.' }],
        },
        {
          id: 'random',
          text: 'Diego ran 500 random combinations and nothing failed.',
          cost: 20,
          reply: 'And did any of those combinations have someone aged 18 or 70, or end exactly at 75? I can\'t sign off like this.',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'note', tone: 'bad', text: 'You answered Risk with random tests instead of coverage.' },
          ],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Chat with Laura',
      body: '**Laura:** What do you take away from today?',
      choices: [
        {
          id: 'lesson',
          text: 'That with many variables you don\'t test everything: a valid baseline, one variable at a time at its boundaries, the critical combinations separately and an oracle to know the correct result.',
          requires: { kind: 'designCoverageGte', value: 0.5 },
          reply: 'Exactly. That is what separates «I tested a lot» from «I tested well».',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'random',
          text: 'That you have to test lots of random values.',
          reply: 'Hmm, go over the debrief: the bugs were in very specific values.',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You took away «test a lot» instead of «test well».' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Honestly, I didn\'t get very far.',
          reply: 'With so many variables it\'s normal to get lost. Tomorrow we\'ll start with the design together.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'tabla_riesgos',
      title: 'Risk · Table of validated examples (KOB-163)',
      updatedLabel: 'Updated yesterday by Carmen López',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_oracle' },
        { kind: 'flag', key: 'oracle.read' },
      ],
      body: `## Examples calculated by Risk
Any difference from the simulator, even a single cent, is a defect.

- **35 years · €2,500/month · €6,000 · 48 months** → nominal rate 6.95% · monthly payment **€143.54** · total **€6,889.92** · pre-approved.
- **40 years · €3,000/month · €10,000 · 60 months** → nominal rate 5.95% · monthly payment **€193.10** · total **€11,586.00** · pre-approved.
- **40 years · €3,000/month · €9,900 · 60 months** → nominal rate 6.95% · monthly payment **€195.80** · total **€11,748.00** · pre-approved.
- **30 years · €1,200/month · €15,000 · 36 months** → nominal rate 5.95% · monthly payment **€455.99** · ratio 38.0% · **not pre-approved**.
- **68 years · €4,000/month · €12,000 · 84 months** → ends at age 75 · monthly payment **€175.02** · pre-approved.
- **70 years · €4,000/month · €12,000 · 84 months** → would end at age 77 · **not pre-approved**.
- **45 years · €3,000/month · €30,000 · 84 months** → nominal rate 5.95% · monthly payment **€437.54** · total **€36,753.36** · pre-approved.

## Consistency
Total repayable = monthly payment × number of payments. Interest = total − amount.`,
    },
    {
      id: 'politica',
      title: 'Personal loan policy (v2.1)',
      updatedLabel: 'Approved by the Risk Committee',
      readCost: 5,
      body: `## Requirements
- Age: from **18 to 70**, both inclusive.
- Net monthly income: at least **€1,000**.
- Amount: from **€1,000 to €30,000**, in multiples of **€100**.
- Term: from **12 to 84 months**, both inclusive.
- Age at the end of repayment (age + term in years): at most **75**.

## Pricing
- Nominal rate **6.95%** below €10,000; **5.95%** from €10,000 (inclusive).
- Monthly payment using the French amortization method, **rounded to the cent**.

## Decision
- Pre-approved if the monthly payment is **at most 35%** of net income.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-163',
      title: 'As a customer I want to simulate a personal loan to know the monthly payment and whether it is pre-approved',
      status: 'In QA',
      type: 'story',
      description: 'Public personal loan simulator based on the Personal loan policy v2.1 (see wiki). Risk has validated a table of examples.',
      acceptanceCriteria: [
        'Given an applicant aged 18 to 70, with income ≥ €1,000, an amount from €1,000 to €30,000 (multiples of 100) and a term of 12 to 84 months, when they run a simulation, then they see the nominal rate, monthly payment, total and interest.',
        'Given an amount ≥ €10,000, then the nominal rate is 5.95%; if it is lower, 6.95%.',
        'Given a monthly payment above 35% of income, then the result is «Not pre-approved».',
        'Given that age + term in years exceeds 75, then the result is «Not pre-approved».',
        'The monthly payment matches Risk\'s table of examples to the cent.',
      ],
      comments: [
        { author: 'marta', body: 'This time with examples and well-defined rules, as we learned on Tuesday 😉' },
        { author: 'diego', body: 'Tested with 500 random combinations, all green ✅' },
      ],
      actions: [],
    },
  ],

  bugs: [
    { id: 'L1', title: '17-year-old applicants are accepted', severity: 'critical', explanation: 'The age validation starts at 17: the bank would offer loans to minors, a legal problem.', technique: 'Boundary values: 17 and 18 years old.', fix: { delay: 40 } },
    { id: 'L1b', title: 'Applicants aged exactly 70 are rejected', severity: 'medium', explanation: '«Less than 70» is used instead of «less than or equal to»: the boundary value, which is valid, is rejected.', technique: 'Boundary values: 70 and 71 years old.', fix: { delay: 40 } },
    { id: 'L2', title: 'Amounts that are not multiples of €100 are accepted', severity: 'low', explanation: 'Only the range is validated, not the multiples-of-€100 rule.', technique: 'Equivalence partitioning: amounts that are not multiples of 100.', fix: { delay: 45 } },
    { id: 'L2b', title: 'The maximum amount of €30,000 is rejected', severity: 'medium', explanation: 'The maximum is compared with «less than»: €30,000, which is valid, is rejected.', technique: 'Boundary values: €30,000 and €30,100.', fix: { delay: 45 } },
    { id: 'L3', title: '6-month terms are accepted', severity: 'medium', explanation: 'The minimum term is coded as 6 months instead of 12.', technique: 'Boundary values: 11 and 12 months.', fix: { delay: 40 } },
    { id: 'L3b', title: 'The maximum term of 84 months is rejected', severity: 'medium', explanation: 'The maximum is compared with «less than»: 84 months is rejected.', technique: 'Boundary values: 84 and 85 months.', fix: { delay: 40 } },
    {
      id: 'L4',
      title: 'At exactly €10,000 the higher nominal rate (6.95%) is applied',
      severity: 'high',
      explanation: 'The band uses «greater than 10,000» instead of «from 10,000»: the customer who asks for exactly €10,000 pays more than advertised.',
      technique: 'Boundary values at the band threshold: €9,900, €10,000 and €10,100, comparing the nominal rate with the policy.',
      fix: { delay: 50, regression: 'L-R1', note: 'I rewrote the band calculation.' },
    },
    {
      id: 'L4b',
      title: 'From €9,000 the lower nominal rate (5.95%) is applied',
      severity: 'high',
      explanation: 'The band threshold is at €9,000 instead of €10,000: the bank charges less than approved across that whole range.',
      technique: 'Partitions and boundaries around the threshold: €9,000–€9,999 versus €10,000.',
      fix: { delay: 50, regression: 'L-R1', note: 'I rewrote the band calculation.' },
    },
    { id: 'L5', title: 'Monthly payments of up to 40% of income are pre-approved', severity: 'critical', explanation: 'The debt-to-income limit is coded at 40% instead of 35%: loans the policy forbids are granted.', technique: 'Boundary values on the 35% rule: income that puts the ratio just above it (between 35% and 40%).', fix: { delay: 45 } },
    { id: 'L5b', title: 'The debt-to-income limit is not checked', severity: 'critical', explanation: 'The 35% rule is not applied: any monthly payment is pre-approved.', technique: 'Partitions: a test case with a ratio clearly above 35%.', fix: { delay: 45 } },
    { id: 'L6', title: 'Loans ending after age 75 are pre-approved', severity: 'high', explanation: 'The combined age + term rule is not implemented; the script\'s random values never touched it (ages 20–60).', technique: 'Boundary of a combined rule: 68 + 84 months (75) versus 70 + 84 months (77).', fix: { delay: 50 } },
    { id: 'L7', title: 'The monthly payment is truncated instead of rounded (1 cent less)', severity: 'medium', explanation: 'The monthly payment is cut to two decimals instead of being rounded: it does not match Risk\'s table, and the offer shown is binding.', technique: 'Oracle: compare the monthly payments with the validated examples, to the cent.', fix: { delay: 45 } },
    {
      id: 'L-R1',
      title: 'Regression: after the band fix, the total does not match monthly payment × term',
      severity: 'medium',
      regression: true,
      explanation: 'When the band calculation was rewritten, the total is computed with the unrounded monthly payment: the total is no longer monthly payment × number of payments.',
      technique: 'Regression with a consistency oracle: total = monthly payment × term, compared with Risk\'s table.',
    },
  ],

  concepts: [
    { id: 'combinatorial', title: 'Several variables: valid baseline and combinations', summary: 'You do not test every combination: a valid baseline and one variable at a time at its boundaries; combined rules separately; pairwise testing if more is needed.' },
    { id: 'test_oracle', title: 'Test oracle', summary: 'The reliable source of the expected result: policy, validated examples, a reference system or internal consistency. Never the app under test itself.' },
    { id: 'calculation_testing', title: 'Testing calculations', summary: 'Compare with the oracle to the cent, choose cases where rounding matters, check internal consistency and band changes.' },
    { id: 'boundary_values', title: 'Boundary values (combined ones too)', summary: 'Just inside and just outside each limit; for rules that combine variables, the combination that falls exactly on the limit.' },
    { id: 'equivalence', title: 'Equivalence partitioning', summary: 'One value from each group the system should treat the same way, including the invalid groups (non-multiples, out of range).' },
    { id: 'random_vs_systematic', title: 'Random versus systematic', summary: 'Random data complements (fuzzing), but rarely lands on the boundaries. Always ask what the automated tests cover.' },
    { id: 'non_functional', title: 'Non-functional testing', summary: 'Performance, security and usability are quality too. They are reported with data and with the cause isolated (system or environment).' },
    { id: 'confirmation_testing', title: 'Re-test (confirmation testing)', summary: 'Testing the failed case again on the new build before closing it.' },
    { id: 'regression', title: 'Regression testing', summary: 'After a fix, repeat the related test cases that passed before; for calculations, repeat the oracle\'s examples.' },
  ],
  debriefConcepts: ['combinatorial', 'boundary_values', 'test_oracle', 'calculation_testing', 'random_vs_systematic'],
  seniorTips: [
    'First of all, prioritize: debt-to-income and age + term are the riskiest rules.',
    'Choose a valid baseline (35 years old, €2,500, €6,000, 48 months) and change only one variable at a time.',
    'For each rule, test just inside and just outside: 17/18, 70/71, 999/1,000, 30,000/30,100, 11/12, 84/85.',
    'Test the band threshold at €9,900, €10,000 and €10,100 and compare the nominal rate with the policy.',
    'Compare the monthly payments with Risk\'s table to the cent and check that total = monthly payment × term.',
    'Ask what the automated tests cover before trusting «500 green cases».',
  ],
}
