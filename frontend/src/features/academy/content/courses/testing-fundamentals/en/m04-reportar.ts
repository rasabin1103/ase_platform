import type { Mission } from '../../../../engine/types'
import { CARD_BUG_SLOTS } from '../../../../apps/kobalto-cards/cardLogic'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m04LessonsEn } from './m04-lessons'
import { m04QuizEn } from './m04-quiz'

/**
 * Course: Testing Fundamentals · Mission 4 — Report like a professional (English).
 *
 * Monday of the second week. The "Cards" section spent the weekend in a
 * closed beta and Customer Support brings vague complaints. They have to be
 * reproduced in the device lab, the condition isolated, reported so Diego can
 * reproduce them on the first try, and severity separated from priority in
 * triage.
 */
export const m04ReportarEn: Mission = {
  id: 'm04-reportar',
  lang: 'en',
  courseKey: 'testing-fundamentals',
  number: 4,
  title: 'Report like a professional',
  subtitle: 'Reproducible defect reports, isolating conditions, severity versus priority, and triage.',
  world: kobaltoWorldEn,
  playerRole: 'Junior QA',
  dayStart: 9 * 60,
  dayLabel: 'Monday',
  duration: 480,
  appActionCost: 3,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-cards',
  reportPriority: true,
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  lessons: m04LessonsEn,
  mentor: 'laura',
  quiz: m04QuizEn,
  bugSlots: CARD_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'Reports that fix themselves',
      body: 'Diego says in the retro that your reports reproduce on the first try. Marta invites you to the upcoming triage meetings.',
    },
    ok: {
      title: 'Monday cleared',
      body: 'You found the failures, but some reports needed back-and-forth or the priority didn\'t fit. Check the quality table in the debrief.',
    },
    bad: {
      title: 'A back-and-forth Monday',
      body: 'A bug the developer can\'t reproduce doesn\'t get fixed. Replay the mission isolating the condition before reporting.',
    },
  },

  briefing: {
    title: 'Monday: report like a professional',
    paragraphs: [
      'The app\'s new "Cards" section (KOB-180) spent the weekend in a closed beta with 200 customers. Nuria, from Customer Support, comes with their complaints: vague, mixed up, and some maybe not even bugs.',
      'You have a device lab on staging: you can switch phone, language and test account. The failures only show up under certain conditions; your job is to find which one.',
      'Diego sends back the reports he can\'t reproduce. And at 12:00 p.m. there\'s triage with Marta: severity is not the same as priority.',
    ],
    goals: [
      'Reproduce the customers\' complaints in the device lab.',
      'Isolate the exact condition: change one thing at a time.',
      'Write reports that reproduce on the first try, with environment, evidence, severity and priority.',
      'Tell apart what isn\'t a bug and help Customer Support.',
      'In triage, defend an order based on damage, reach and business dates.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Monday: report like a professional 📝',
      body: 'Good morning!\n\nThis week starts with the **Cards** beta (KOB-180). Nuria is sending us the complaints from the weekend.\n\nToday what matters is **how you report**:\n- Reproduce each complaint in the **device lab** (phone, language and test account).\n- **Isolate** the condition: change only one thing at a time.\n- Report with **environment**, minimal steps, expected result with its source, evidence, **severity** and **priority**.\n- The **defect report guide** is in the wiki.\n\nDiego will send back whatever he can\'t reproduce. If that happens, complete it and resend it.\n\nLaura',
    },
    {
      id: 'mail_nuria',
      channel: 'email',
      from: 'nuria',
      at: 0,
      subject: 'Complaints from the Cards beta (weekend)',
      body: 'Hi team,\n\nHere\'s what came in from the beta, exactly as the customers tell it:\n\n1. "I froze my card because I couldn\'t find it and then I got a charge anyway." Uses **Android**. Says they **had already frozen and unfrozen it** earlier that day.\n2. "I set the limit to 1,000 and now it won\'t let me pay for anything." Has the app **in English** and a **Youth account**.\n3. "I exported September and the cinema purchase from the 30th is missing."\n4. "You charged me twice at Mercadona on September 2."\n5. A **business** customer says that when exporting "the full history" the app "crashes".\n\nCan you tell me which ones are bugs and what I should reply to each of them?\n\nNuria · Customer Support',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Payments team',
      body: '**Diego:** One request: on Friday I got three reports along the lines of "it doesn\'t work" and lost the afternoon trying to reproduce them. Please make them reproducible on the first try 🙏\n\n**Laura:** How are you going to do it today?',
      choices: [
        {
          id: 'quality',
          text: 'Before reporting I isolate the condition. Each report will include the environment (device, language, account), minimal steps with data, the expected result with its source, and only the evidence that shows the failure.',
          cost: 10,
          reply: 'Now that\'s a pleasure. Thanks 🙌',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'bug_report' },
            { kind: 'note', tone: 'good', text: 'You committed to reproducible reports: environment, minimal steps, expected result and evidence.' },
          ],
        },
        {
          id: 'fast',
          text: 'I\'ll quickly report whatever Nuria sends me and, if Diego needs something, I\'ll complete it later.',
          cost: 10,
          reply: 'That\'s exactly what made me lose Friday…',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You proposed reporting first and completing later: the time is lost anyway, just on the developer\'s side.' },
          ],
        },
        {
          id: 'blame',
          text: 'If you can\'t reproduce them, maybe you\'re not looking properly.',
          cost: 10,
          reply: 'Let\'s leave it there… Laura, let\'s talk later.',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'communication', add: -2 },
            { kind: 'metric', key: 'trust_diego', add: -2 },
            { kind: 'note', tone: 'bad', text: 'You blamed the developer instead of improving the information in the report.' },
          ],
        },
      ],
    },
    {
      id: 'marta_typo',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'bugTriggered', bugId: 'C4' },
      body: 'I saw your screenshot of the card screen 😱 "Freese card". **Tomorrow we shoot the campaign ad with that screen.** What severity and priority do you give it?',
      choices: [
        {
          id: 'low_p1',
          text: 'Low severity: it doesn\'t break anything. But priority P1: it has to be fixed today, before the shoot.',
          cost: 3,
          reply: 'Perfect! I\'ll talk to Diego so it goes in today.',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'good', text: 'You separated severity (low) and priority (P1) for the typo in the ad.' },
          ],
        },
        {
          id: 'critical',
          text: 'I\'ll mark it as critical so they fix it right away.',
          cost: 3,
          reply: 'Hmm… Laura says if a typo is critical, what is a card that doesn\'t freeze?',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'bad', text: 'You inflated the severity of a typo to get priority.' },
          ],
        },
        {
          id: 'backlog',
          text: 'It\'s a typo, low severity: to the backlog.',
          cost: 3,
          reply: 'To the backlog? It\'s in an ad tomorrow!',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'bad', text: 'You confused low severity with low priority.' },
          ],
        },
      ],
    },
    {
      id: 'triage',
      channel: 'meeting',
      from: 'marta',
      with: ['diego', 'laura'],
      at: 180,
      subject: '12:00 p.m. · Cards beta triage',
      body: '**Marta:** Diego has this week to fix the beta issues and can\'t get to everything. We have: the card that doesn\'t fully freeze, the weird monthly limit, the CSV missing a day, the failing business export, and the typo on the screen that\'s in tomorrow\'s ad.\n\n**Diego:** Where do I start?',
      choices: [
        {
          id: 'risk_business',
          text: 'Freezing first: it\'s the customer\'s money and security. Then the typo, because the ad is shot tomorrow. Then the limit, which blocks payments. The CSV and the business export (3 customers, they can export year by year) can go to the next sprint.',
          cost: 30,
          reply: 'I like it: damage, reach, workaround and dates. That\'s how we\'ll plan it.',
          replyFrom: 'marta',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'triage' },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'good', text: 'In triage you ordered by damage, reach, workaround and business dates.' },
          ],
        },
        {
          id: 'by_severity',
          text: 'By severity: critical first, then high, medium and finally low.',
          cost: 30,
          reply: 'And the typo for tomorrow\'s ad stays last? Severity isn\'t everything.',
          replyFrom: 'marta',
          effects: [
            { kind: 'unlock', conceptId: 'triage' },
            { kind: 'unlock', conceptId: 'severity_priority' },
            { kind: 'note', tone: 'neutral', text: 'You ordered by severity only and forgot the business dates.' },
          ],
        },
        {
          id: 'fifo',
          text: 'In the order the complaints came in.',
          cost: 30,
          reply: 'So the card that doesn\'t freeze waits behind the CSV… No.',
          replyFrom: 'marta',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'unlock', conceptId: 'triage' },
            { kind: 'note', tone: 'bad', text: 'You proposed fixing in order of arrival, without looking at the damage.' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 300,
      when: { kind: 'reportsLt', value: 2 },
      body: 'How\'s it going? Hint: the complaints mix conditions (Android **and** two freezes; English **and** a Youth account). Change **just one** in the lab and see when the failure shows up. That condition goes in the title.',
      onDeliver: [{ kind: 'unlock', conceptId: 'isolation' }],
    },
    {
      id: 'laura_first_report',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'A trick before sending: read it as if you were Diego, without having seen anything. Could you reproduce it without asking? If he sends it back, **complete it** from the report itself: don\'t open another one.',
      onDeliver: [{ kind: 'unlock', conceptId: 'environment' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'There\'s a fix on staging 🔧 Verify it **in the same environment** where it failed (same phone, language and account) and also test the opposite of what was fixed: if they fixed freezing, test unfreezing.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
      ],
    },
    {
      id: 'nuria_followup',
      channel: 'chat',
      from: 'nuria',
      at: 390,
      body: 'Quick thing: the Mercadona customer is calling again. What do I tell them? Did we charge them twice?',
      choices: [
        {
          id: 'explain',
          text: 'No: one of the two is a temporary hold that was released on September 5; there\'s only one charge of €52.87. I\'ll send you a text for the customer. And I\'m proposing an improvement: the app should explain holds better.',
          cost: 5,
          reply: 'Great, thanks! I\'ll explain it that way.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'not_a_bug' },
            { kind: 'note', tone: 'good', text: 'You identified that the "double charge" was a hold (not a bug) and proposed an improvement.' },
          ],
        },
        {
          id: 'open_bug',
          text: 'I\'ll open a critical double-charge bug so they look into it.',
          cost: 3,
          reply: 'OK… have you checked it?',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'not_a_bug' },
            { kind: 'note', tone: 'bad', text: 'You were about to report as a bug a hold that works according to the specification.' },
          ],
        },
        {
          id: 'dunno',
          text: 'I haven\'t looked at it yet.',
          cost: 1,
          reply: 'OK, let me know when you can.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You left the double-charge complaint unanswered.' }],
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
          text: 'That a bug that can\'t be reproduced doesn\'t get fixed: you have to isolate the condition and give the environment and just the right evidence. And that severity is the damage and priority is when to fix it.',
          requires: { kind: 'reportsGte', value: 2 },
          reply: 'Exactly. That\'s reporting like a professional.',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'speed',
          text: 'That you have to report fast so the dev has work to do.',
          reply: 'Fast, yes, but complete: a report sent back is slower than one done right.',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You took away "report fast" instead of "report well".' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Honestly, I didn\'t get very far.',
          reply: 'Tomorrow we\'ll go over a couple of reports together: you learn fast that way.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia',
      title: 'Payments team defect report guide',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'bug_report' },
        { kind: 'unlock', conceptId: 'severity_priority' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## A report can be reproduced without asking
- **Title**: what fails + where + under which condition.
- **Environment**: device and OS, app language, account type, build.
- **Minimal steps**, one per line, with the exact data.
- **Expected** (and its source: wiki, acceptance criterion) and **actual**.
- **Evidence**: the run or screenshot that shows it. Only that.
- One report, one bug.

## Severity (how much damage it does)
- **Critical**: money, security or customer data at risk; or a main feature unusable with no workaround.
- **High**: an important feature fails or there is a system error, even if there is a workaround.
- **Medium**: incorrect result with limited impact or with an easy workaround.
- **Low**: cosmetic, wording, minor annoyances.

## Priority (when it gets fixed; decided in triage)
- **P1 · Urgent**: today or before the next committed milestone.
- **P2 · High**: in this sprint.
- **P3 · Medium**: in the next sprint.
- **P4 · Low**: backlog.

Priority takes into account the damage, how many customers are affected, whether there is a workaround, and business dates.`,
    },
    {
      id: 'tarjetas',
      title: 'Cards · How it works (beta)',
      updatedLabel: 'Updated on Friday by Marta Sanz',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'spec.read' }],
      body: `## Freeze
- When frozen, **all purchases are declined** until unfrozen. It works the same on iOS, Android and web, and the card can be frozen and unfrozen as many times as you like.

## Monthly limit
- Personal and Business accounts: from **€100 to €6,000**. Youth account: from **€100 to €500**.
- Whole euros. The thousands separator of the app language is accepted: "1.000" in Spanish, "1,000" in English.

## Transactions and export
- The CSV includes the transactions **from and to the given dates, both inclusive**. Maximum range: 24 months.
- **Holds** (pre-authorizations from gas stations, hotels or supermarkets) appear struck through and are released within a few days: **they are not a charge**.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-180',
      title: 'As a customer I want to manage my card from the app: freeze it, set a limit and export my transactions',
      status: 'In beta',
      type: 'story',
      description: '"Cards" section of app 5.0, in a closed beta with 200 customers since Friday. How it works is in the wiki.',
      acceptanceCriteria: [
        'Given a frozen card, when a purchase is attempted, then it is declined (on any device and however many times it is frozen).',
        'Given a monthly limit within the account\'s range, written in the app language\'s format, then that amount is saved.',
        'Given a date range of up to 24 months, when I export, then the CSV includes the transactions on both ends.',
        'The texts on the card screen have no typos (they are used in the campaign).',
      ],
      comments: [
        { author: 'marta', body: 'On Tuesday we shoot the campaign ad with the card screen 🎬' },
        { author: 'diego', body: 'Tested on my iPhone in Spanish, all OK.' },
      ],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'C1',
      title: 'On Android, freezing the card doesn\'t block purchases',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'the customer believes their card is blocked and it isn\'t: fraud risk',
      explanation: 'The Android app sends a legacy field ("blocked") that the server ignores: the app shows "Frozen", but the card is still active.',
      technique: 'Isolation: the same flow on iPhone and on Android; only the device changes.',
      repro: { groups: [['android', 'pixel']], ask: 'On my iPhone I freeze, pay and it\'s declined correctly. On which device does it happen to you?' },
      fix: { delay: 45, regression: 'C-R1', note: 'I changed the Android app to use the new field.' },
    },
    {
      id: 'C1b',
      title: 'When the card is frozen a second time, purchases aren\'t blocked',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'the customer believes their card is blocked and it isn\'t: fraud risk',
      explanation: 'After freezing and unfreezing once, the next freeze never reaches the server: the app shows "Frozen" and purchases go through.',
      technique: 'Isolation by sequence: freezing once versus freezing, unfreezing and freezing again.',
      repro: {
        groups: [['second', 'twice', '2 times', 'again', 'once more', 'freeze it again', 'froze it again', 'unfreez', 'refreez']],
        ask: 'I freeze, pay and it\'s declined correctly. What did you do before freezing it?',
      },
      fix: { delay: 45, regression: 'C-R1', note: 'I fixed the state the app stored after unfreezing.' },
    },
    {
      id: 'C2',
      title: 'With the app in English, the limit "1,000" is saved as €1',
      severity: 'high',
      priority: 'p2',
      priorityWhy: 'it blocks payments for anyone using the app in English; fixed in this sprint',
      explanation: 'The server always parses the amount in Spanish format: in English the thousands comma is taken as a decimal point and the limit ends up at €1.',
      technique: 'Isolation by language: the same amount in Spanish and in English, with and without a thousands separator.',
      repro: { groups: [['english', 'ingles', 'lang en', 'language', '· en ']], ask: 'I save 1.000 and it stays at €1,000. What language was the app in and how did you write the amount?' },
      fix: { delay: 40 },
    },
    {
      id: 'C2b',
      title: 'The Youth account accepts monthly limits above €500',
      severity: 'high',
      priority: 'p2',
      priorityWhy: 'it breaches the Youth account policy; fixed in this sprint',
      explanation: 'The validation uses the Personal account range (up to €6,000) for every account.',
      technique: 'Isolation by account type and boundary value: €500 and €501 on the Youth account.',
      repro: { groups: [['youth']], ask: 'With my test account it doesn\'t go above 6,000, which is correct. With which account type does it happen to you?' },
      fix: { delay: 40 },
    },
    {
      id: 'C3',
      title: 'The transactions CSV doesn\'t include the last day of the range',
      severity: 'medium',
      priority: 'p3',
      priorityWhy: 'there\'s a workaround (export one more day); fixed in the next sprint',
      explanation: 'The filter uses "less than" the end date instead of "less than or equal to": that day\'s transactions are left out.',
      technique: 'Boundary value with data: a transaction exactly on the end date of the range.',
      repro: {
        groups: [['last day', 'final day', 'end date', 'to date', 'until', 'includ', 'day 30', '9/30', '30/09', '-30']],
        ask: 'I export September and I get all of them. Which exact range did you use and which transaction is missing?',
      },
      fix: { delay: 35 },
    },
    {
      id: 'C4',
      title: 'Typo on the card screen: "Freese card"',
      severity: 'low',
      priority: 'p1',
      priorityWhy: 'the ad with that screen is shot tomorrow',
      explanation: 'Typo in the button text. It doesn\'t break anything, but it appears in the campaign.',
      technique: 'Visual review with evidence: screenshot of the screen in the affected language.',
      fix: { delay: 20 },
    },
    {
      id: 'C5',
      title: 'Exporting more than one year on a Business account returns a 500 error',
      severity: 'high',
      priority: 'p3',
      priorityWhy: 'only 3 businesses in the beta and they can export year by year; next sprint',
      explanation: 'The query for accounts with many transactions exceeds the timeout when the range is longer than a year.',
      technique: 'Isolation by account type and range size (12 versus 13 months).',
      repro: { groups: [['business']], ask: 'I export a year and a half and it works. With which account does it happen to you?' },
      fix: { delay: 50 },
    },
    {
      id: 'C-R1',
      title: 'Regression: after the freeze fix, the card can\'t be unfrozen on Android',
      severity: 'high',
      priority: 'p1',
      priorityWhy: 'Android customers are left unable to pay',
      regression: true,
      explanation: 'When the freeze field was changed, unfreezing on Android still uses the old one: the app shows "Active" and purchases are declined.',
      technique: 'Regression: after fixing freezing, also test unfreezing in the same environment.',
      repro: { groups: [['android', 'pixel']], ask: 'On my iPhone I unfreeze and pay with no problem. On which device?' },
    },
  ],

  concepts: [
    { id: 'bug_report', title: 'Reproducible defect report', summary: 'A title with the condition, environment, minimal steps with data, the expected result with its source, the actual result, and only the evidence that shows the failure.' },
    { id: 'isolation', title: 'Isolating the condition', summary: 'Change a single condition at a time (device, language, account, sequence, data) until you know which one turns the failure on and off.' },
    { id: 'environment', title: 'Environment', summary: 'Most "I can\'t reproduce it" cases are differences in environment or data: always write it down.' },
    { id: 'severity_priority', title: 'Severity versus priority', summary: 'Severity is the damage; priority, when it gets fixed. A typo can be P1 and a 500 error can wait.' },
    { id: 'triage', title: 'Triage', summary: 'Ordering bugs by damage, reach, workaround and business dates, together with product and development.' },
    { id: 'not_a_bug', title: 'Not everything is a bug', summary: 'Before reporting, compare with the specification; if it works as defined, explain it and, if it\'s confusing, propose an improvement.' },
    { id: 'confirmation_testing', title: 'Confirmation testing (re-test)', summary: 'Verify the fix in the same environment where it failed.' },
    { id: 'regression', title: 'Regression testing', summary: 'After a fix, test what\'s related: if freezing is fixed, test unfreezing.' },
  ],
  debriefConcepts: ['bug_report', 'isolation', 'severity_priority', 'triage', 'not_a_bug'],
  seniorTips: [
    'Read the report guide and how Cards works before opening the lab: they are your test oracles.',
    'For each complaint, separate the conditions the customer mentions and test one at a time until you know which one triggers the failure.',
    'Put the condition in the title: "On Android, freezing doesn\'t block purchases".',
    'The typo in the ad is low severity and P1 priority; the business export, high severity and P3 priority.',
    'The Mercadona "double charge" is a released hold: it\'s not a bug; help Nuria with the reply.',
    'If Diego sends a report back, complete it from the same report with what he asks for, without arguing.',
  ],
}
