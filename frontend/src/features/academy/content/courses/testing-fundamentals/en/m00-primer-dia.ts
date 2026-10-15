import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m00DesignEn } from './m00-design'
import { m00LessonsEn } from './m00-lessons'
import { m00RiskEn } from './m00-risk'
import { m00QuizEn } from './m00-quiz'
import { BUG_SLOTS } from '../../../../apps/kobalto/transferLogic'

/**
 * Course: Testing Fundamentals · Mission 0 — First day (English).
 * Translation of ../m00-primer-dia.ts: same structure and ids.
 *
 * Clock: minute 0 = 09:00, minute 480 = 17:00 (end of the working day).
 */
export const m00PrimerDiaEn: Mission = {
  id: 'm00-primer-dia',
  lang: 'en',
  courseKey: 'testing-fundamentals',
  number: 0,
  title: 'First day',
  subtitle: 'Fresh graduate, first job as a Junior QA at a neobank.',
  world: kobaltoWorldEn,
  playerRole: 'Junior QA',
  dayStart: 9 * 60,
  dayLabel: 'Monday',
  duration: 480,
  appActionCost: 4,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  testDesign: m00DesignEn,
  verdicts: {
    good: { title: 'First day passed with flying colors', body: 'Laura leaves the meeting convinced she made the right call hiring you. The team already knows it can count on your judgment.' },
    ok: { title: 'First day passed', body: 'A good start, with things to polish. Check the debrief: almost everything that slipped through has a specific technique behind it.' },
    bad: { title: 'A rough first day', body: 'Nobody is born knowing this. Replay the mission trying other decisions: you will see how the day changes.' },
  },
  lessons: m00LessonsEn,
  riskModel: m00RiskEn,
  quiz: m00QuizEn,
  mentor: 'laura',
  bugSlots: BUG_SLOTS,

  briefing: {
    title: 'First day at Kobalto',
    paragraphs: [
      'You have just finished your degree and today you start your first job: Junior QA at Kobalto, an 80-person neobank based in Madrid. The Payments team is preparing the big investor demo on Friday, and the star of the show is the new Transfers feature.',
      'Your day runs from 09:00 to 17:00. Everything takes time: reading, asking, testing, reporting. You will not have time for everything, so choose wisely.',
      'Your decisions will have consequences. At 17:00, Laura, your mentor, will ask you for a status update.',
    ],
    goals: [
      'Get your access set up and introduce yourself to the team.',
      'Design your test cases for KOB-142 and ask Laura to review them.',
      'Execute the test cases in staging (Transfers).',
      'Log the bugs you find, with evidence.',
      'At 17:00, give Laura a clear status and a recommendation.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'tickets' },
    { tool: 'design' },
    { tool: 'wiki' },
    {
      tool: 'app',
      enabledWhen: { kind: 'flag', key: 'access.staging' },
      lockedMessage: 'You do not have access to staging. Access is managed by Óscar, from IT.',
      unlockAction: {
        label: 'Ask Óscar for access and wait for him to process it (40 min)',
        cost: 40,
        effects: [
          { kind: 'flag', key: 'access.staging' },
          { kind: 'score', key: 'efficiency', add: -1 },
          { kind: 'note', tone: 'bad', text: 'You did not ask for staging access when you arrived: you lost 40 minutes waiting.' },
        ],
      },
    },
    {
      tool: 'logs',
      enabledWhen: { kind: 'flag', key: 'access.logs' },
      lockedMessage: 'Staging logs require a specific permission.',
      unlockAction: {
        label: 'Ask for access to the logs (30 min)',
        cost: 30,
        effects: [{ kind: 'flag', key: 'access.logs' }],
      },
    },
  ],

  scenes: [
    // ---------------------------------------------------------- 09:00
    {
      id: 'mail_bienvenida',
      channel: 'email',
      from: 'personas',
      at: 0,
      subject: 'Welcome to Kobalto! 🎉',
      body: 'Hi,\n\nWe are so happy to have you with us! Today you join the Payments team as a Junior QA. Your mentor will be Laura Méndez, QA Lead.\n\nWorking hours: 09:00 to 17:00. Óscar, from IT, will message you to set up your access.\n\nBest wishes,\nPeople Team',
    },
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Your first day 🚀',
      body: 'Hi and welcome!\n\nHere is my suggestion for today:\n- Ask Óscar for the access you need.\n- At 09:30 we have the team daily.\n- The wiki has the QA Guide and the test data.\n- Your main task: test the KOB-142 story (Transfers) in staging.\n- Before touching the app, go to **Design**, prioritize by risk (Risks tab) and design your test cases; ask me to review them. Then execute them and log the bugs on the board.\n- If you have questions, ask me (the «Ask Laura» button).\n\nAt 17:00 you tell me how it went and what you recommend for Friday\'s demo.\n\nLaura',
    },
    {
      id: 'chat_oscar',
      channel: 'chat',
      from: 'oscar',
      at: 0,
      body: 'Hi! I\'m Óscar, from IT 👋 Your laptop is all set up. What access do you need to get started?',
      choices: [
        {
          id: 'full',
          text: 'Staging, the ticket tracker and the wiki. Is there anything else QA usually uses?',
          cost: 5,
          reply: 'Good question 👍 QA usually asks for the staging logs too. I\'ll enable everything. Done!',
          effects: [
            { kind: 'flag', key: 'access.staging' },
            { kind: 'flag', key: 'access.logs' },
            { kind: 'score', key: 'efficiency', add: 1 },
            { kind: 'note', tone: 'good', text: 'You asked what QA usually needs and got all your access (logs included) in one go.' },
          ],
        },
        {
          id: 'basic',
          text: 'The standard stuff, I\'ll ask for whatever else I need later.',
          cost: 2,
          reply: 'Done: email, chat, tickets and wiki. If you need anything else, just let me know.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You only asked for the standard access.' }],
        },
      ],
    },

    // ---------------------------------------------------------- 09:30 daily
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Payments team',
      body: '**Marta:** Remember that on Friday we show Transfers to the investors. It is THE demo.\n\n**Diego:** KOB-142 has been in staging since yesterday. I tested it locally and it works fine.\n\n**Laura:** Someone new joins QA today. Would you like to say something to the team?',
      choices: [
        {
          id: 'ask',
          text: 'Hi everyone! Today I\'m focusing on KOB-142. Marta, can I message you later with questions about the acceptance criteria?',
          cost: 15,
          reply: 'Of course! I\'ll message you as soon as we finish.',
          replyFrom: 'marta',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'flag', key: 'po.contacted' },
            { kind: 'deliver', sceneId: 'marta_rules' },
            { kind: 'note', tone: 'good', text: 'At the daily you introduced yourself, said what you would focus on and opened a channel with the PO.' },
          ],
        },
        {
          id: 'promise',
          text: 'Hi! I\'ll test everything today, it\'ll be perfect by Friday.',
          cost: 15,
          reply: 'Good luck with that 😅',
          replyFrom: 'diego',
          effects: [
            { kind: 'flag', key: 'overpromised' },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You promised to test «everything» in one day: that is impossible and sets false expectations.' },
          ],
        },
        {
          id: 'quiet',
          text: '(Wave and say nothing)',
          cost: 15,
          effects: [{ kind: 'note', tone: 'neutral', text: 'You went unnoticed at your first daily.' }],
        },
      ],
    },
    {
      id: 'marta_rules',
      channel: 'chat',
      from: 'marta',
      body: 'Hi! Tell me, what questions do you have about KOB-142?',
      choices: [
        {
          id: 'rules',
          text: 'The criteria say «valid amount» and «the limits are respected». What exactly does that mean? Minimum, maximum, decimals, daily limit?',
          cost: 10,
          reply:
            'Great question! I\'ll add it to the ticket too:\n- Minimum amount €0.01 and maximum €5,000 per transaction.\n- Up to 2 decimal places, with a comma or a dot.\n- Cumulative daily limit: €6,000.\n- Valid Spanish IBAN (format and check digits).\n- Optional reference, 140 characters maximum.\n\nThe specification in the wiki is out of date, ignore it!',
          effects: [
            { kind: 'flag', key: 'rules.known' },
            { kind: 'score', key: 'rigor', add: 2 },
            { kind: 'unlock', conceptId: 'static_testing' },
            { kind: 'note', tone: 'good', text: 'You asked the PO what the ambiguous criteria meant: now you know what is a bug and what is not (static testing).' },
          ],
        },
        {
          id: 'none',
          text: 'Nothing, I think it\'s clear. Thanks!',
          cost: 2,
          reply: 'Great! 👍',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You assumed some ambiguous criteria were clear («valid amount», «the limits»).' },
          ],
        },
      ],
    },
    {
      id: 'laura_overpromise',
      channel: 'chat',
      from: 'laura',
      at: 60,
      when: { kind: 'flag', key: 'overpromised' },
      body: 'A bit of mentor advice 🙂 At the daily you said you would test «everything». Exhaustive testing is impossible: there are infinite combinations. Better something like: «today I\'m testing the riskiest parts of KOB-142 and I\'ll update you at 17:00». You\'ve got this!',
      onDeliver: [{ kind: 'unlock', conceptId: 'exhaustive' }],
      choices: [
        {
          id: 'thanks',
          text: 'Got it, thanks for the advice!',
          cost: 1,
          effects: [{ kind: 'score', key: 'communication', add: 1 }],
        },
      ],
    },

    // ---------------------------------------------------------- 11:00 unexpected event
    {
      id: 'staging_down',
      channel: 'chat',
      from: 'ivan',
      at: 120,
      probability: 0.6,
      body: '⚠️ Heads-up: staging will be down for about 40 minutes due to an infrastructure deployment. Sorry for the inconvenience.',
      choices: [
        {
          id: 'prepare',
          text: 'I\'ll use the time to read the documentation and prepare my test cases.',
          cost: 40,
          effects: [
            { kind: 'score', key: 'efficiency', add: 1 },
            { kind: 'unlock', conceptId: 'test_design' },
            { kind: 'note', tone: 'good', text: 'With staging down, you used the time to design test cases: the wait turned into preparation.' },
          ],
        },
        {
          id: 'prod',
          text: 'I\'ll quickly test in production with my personal account. Just a small transfer.',
          cost: 10,
          effects: [
            { kind: 'score', key: 'risk', add: -3 },
            { kind: 'metric', key: 'trust_laura', add: -2 },
            { kind: 'unlock', conceptId: 'test_environments' },
            { kind: 'deliver', sceneId: 'laura_prod' },
            { kind: 'note', tone: 'bad', text: 'You tested in production with real money. At a bank, that is a serious offense.' },
          ],
        },
        {
          id: 'wait',
          text: 'I\'ll wait for it to come back.',
          cost: 40,
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'note', tone: 'neutral', text: 'You waited 40 minutes for staging to come back without doing anything else.' },
          ],
        },
      ],
    },
    {
      id: 'laura_prod',
      channel: 'chat',
      from: 'laura',
      body: 'Hey, Iván has seen a test transfer in PRODUCTION from your account 😬 At a bank you never test in production with real money: there are audits, regulations and real customers. That is what staging is for. Don\'t let it happen again, okay?',
      choices: [
        {
          id: 'sorry',
          text: 'You\'re right, it won\'t happen again. Is there an alternative environment for when staging goes down?',
          cost: 3,
          reply: 'Yes, there is an isolated QA environment. I\'ll show it to you tomorrow. Thanks for asking.',
          effects: [
            { kind: 'metric', key: 'trust_laura', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
          ],
        },
        {
          id: 'excuse',
          text: 'It was only 5 euros…',
          cost: 2,
          reply: 'It\'s not the amount, it\'s the risk. We\'ll talk about it at 17:00.',
          effects: [
            { kind: 'metric', key: 'trust_laura', add: -1 },
            { kind: 'score', key: 'communication', add: -1 },
          ],
        },
      ],
    },

    // ---------------------------------------------------------- 13:00 pressure from the dev
    {
      id: 'diego_chat',
      channel: 'chat',
      from: 'diego',
      at: 240,
      body: 'Hey, one thing. If you see anything weird in Transfers, tell me here first and don\'t open tickets, because if Marta sees bugs on the board before the demo she gets nervous. Just between us, okay?',
      choices: [
        {
          id: 'both',
          text: 'Sure, I\'ll let you know here, but I\'ll also log it in the tracker with steps to reproduce: that way it doesn\'t get lost and Marta sees the real status.',
          cost: 5,
          reply: 'Hmm… okay, that makes sense. Send me the link when you have it.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'metric', key: 'trust_diego', add: 1 },
            { kind: 'flag', key: 'traceability' },
            { kind: 'unlock', conceptId: 'traceability' },
            { kind: 'note', tone: 'good', text: 'You kept traceability without damaging your relationship with Diego: giving a heads-up and logging the bug are not mutually exclusive.' },
          ],
        },
        {
          id: 'hide',
          text: 'Okay, I\'ll tell only you.',
          cost: 2,
          reply: 'Awesome, legend! 🙌',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'flag', key: 'hide_bugs' },
            { kind: 'metric', key: 'trust_diego', add: 1 },
            { kind: 'unlock', conceptId: 'traceability' },
            { kind: 'note', tone: 'bad', text: 'You agreed to hide bugs from the PO: without traceability, the risk reaches the demo without anyone knowing.' },
          ],
        },
        {
          id: 'clash',
          text: 'My job is to log bugs, not to ask for permission.',
          cost: 2,
          reply: 'Okay, okay… 🙄',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'metric', key: 'trust_diego', add: -2 },
            { kind: 'unlock', conceptId: 'traceability' },
            { kind: 'note', tone: 'neutral', text: 'You defended traceability, but your tone hurt your relationship with Diego.' },
          ],
        },
      ],
    },

    // ---------------------------------------------------------- Laura's reactions
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'I saw your first bug on the board! 🐞 One detail to keep in mind: severity is the impact on the customer or the business, and priority is the urgency to fix it. They don\'t always match.',
      onDeliver: [{ kind: 'unlock', conceptId: 'severity_priority' }],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 300,
      when: { kind: 'reportsLt', value: 1 },
      body: 'How\'s it going? A hint: bugs hide at the edges. Test right at the limit, a little above and a little below… and type things the way a real customer would (comma or dot?).',
      onDeliver: [{ kind: 'unlock', conceptId: 'boundary_values' }],
    },

    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'I see Diego has pushed the first fix 🔧 Remember two things: **re-test** (test the failed case again, on the new build, before closing) and **regression** (also repeat the related test cases that passed before: a fix can break something else). To close or reopen, attach the execution on the new build.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
        { kind: 'unlock', conceptId: 'defect_lifecycle' },
      ],
    },

    // ---------------------------------------------------------- 15:00 business pressure
    {
      id: 'marta_status',
      channel: 'chat',
      from: 'marta',
      at: 360,
      body: 'Hi! I\'m meeting the CEO to prepare the demo. Can I tell him Transfers is ready for Friday?',
      choices: [
        {
          id: 'critical',
          text: 'Not yet: there are critical bugs affecting real money (I\'ll send you the tracker links). At 17:00 we\'ll go over it with Laura and I\'ll give you a clear recommendation.',
          requires: { kind: 'bugReported', severity: 'critical' },
          cost: 5,
          reply: 'Ugh… okay. Thanks for telling me today and not on Friday. I\'ll wait for your recommendation.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'metric', key: 'trust_marta', add: 1 },
            { kind: 'note', tone: 'good', text: 'You warned the PO in time about the real risk for the demo, with evidence.' },
          ],
        },
        {
          id: 'unsure',
          text: 'I can\'t confirm it yet. At 17:00 I\'ll give you a clear status together with Laura.',
          cost: 3,
          reply: 'Ok, I\'ll be waiting.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'neutral', text: 'You did not give the green light without information, but you did not give the PO any data either.' },
          ],
        },
        {
          id: 'ok',
          text: 'Yes, all good, you can tell him.',
          cost: 2,
          reply: 'Great! I\'ll tell him right away 🎉',
          effects: [
            { kind: 'unlock', conceptId: 'principles' },
            {
              kind: 'if',
              when: { kind: 'bugTriggered', severity: 'critical' },
              then: [
                { kind: 'score', key: 'risk', add: -3 },
                { kind: 'flag', key: 'false_green' },
                { kind: 'metric', key: 'trust_marta', add: -1 },
                { kind: 'note', tone: 'bad', text: 'You gave the green light with critical bugs right in front of you: the PO has committed to a demo that may fail.' },
              ],
              else: [
                { kind: 'score', key: 'risk', add: -1 },
                { kind: 'note', tone: 'bad', text: 'You gave the green light without evidence: «I haven\'t seen any bugs» does not mean «there are no bugs» (principle 1).' },
              ],
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------- 17:00 wrap-up
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Chat with Laura',
      body: '**Laura:** So, how was your first day? Tell me: what is the status of KOB-142 and what do you recommend for Friday\'s demo?',
      choices: [
        {
          id: 'pro',
          text: 'I tested the amount, IBAN and limit validations, and logged the bugs with evidence on the board. With the critical ones still open, I recommend not showing Transfers until they are fixed and re-tested.',
          requires: { kind: 'reportsGte', value: 1 },
          reply: 'That is how you communicate a status: what you tested, what you found, what the risk is and what you recommend. Very well done.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'score', key: 'risk', add: 1 },
            {
              kind: 'if',
              when: { kind: 'flag', key: 'hide_bugs' },
              then: [{ kind: 'note', tone: 'bad', text: 'Laura: «By the way, Diego told me you two were going to "talk about" some bugs between yourselves. That cannot happen again».' }],
            },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'vague',
          text: 'I think it went well. I saw a couple of little things, but nothing serious.',
          reply: 'I need you to be more specific: what did you test and what risk do you see? Without that I can\'t decide anything.',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You gave a vague status, with no data and no recommendation.' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'none',
          text: 'Honestly, I didn\'t have time for much.',
          reply: 'That\'s normal on the first day. Tomorrow we\'ll plan your time better together.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_qa',
      title: 'Kobalto QA Guide',
      updatedLabel: 'Updated 2 weeks ago by Laura Méndez',
      readCost: 20,
      onRead: [
        { kind: 'flag', key: 'guide.read' },
        { kind: 'score', key: 'rigor', add: 1 },
        { kind: 'unlock', conceptId: 'principles' },
        { kind: 'unlock', conceptId: 'bug_anatomy' },
      ],
      body: `## How we work
Every story goes through "In QA" before reaching production. QA tests in **staging**, never in production.

## The 7 testing principles
- Testing shows the presence of defects, not their absence.
- Exhaustive testing is impossible: prioritize by risk.
- Early testing saves time and money (start with the requirements).
- Defects cluster together: where there is one, there are usually more.
- Repeating the same tests over and over stops finding bugs.
- Testing is context dependent: at a bank, money comes first.
- Absence of errors does not mean the product is useful.

## Severity scale
- **Critical**: loss or mismatch of money, data or security.
- **High**: a business rule or regulation is broken, or a main feature does not work and there is no workaround.
- **Medium**: the feature is affected, but there is a workaround or the impact is limited.
- **Low**: cosmetic issues or text.

## How to write a bug
- A title that says what fails and where.
- Steps to reproduce it, one per line.
- Expected result and actual result.
- Severity according to the scale.
- Evidence: attach the transaction or the log where it can be seen.`,
    },
    {
      id: 'datos_prueba',
      title: 'Test data · Staging',
      updatedLabel: 'Updated 1 month ago by Iván Torres',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'testdata.read' }],
      body: `## Test account
Account **QA-01**, opening balance **€7,450.00**. The balance and limits are reset every night.

## Valid test IBANs
- ES30 9101 0001 1202 0001 2345 · Ana López
- ES84 9101 0001 1503 0006 7890 · Carlos Pérez
- ES39 9101 0002 1104 0009 9999 · Lucía Martín

## Remember
An IBAN is valid if it matches the format **and** the check digits. If you change a single digit, it is no longer valid.`,
    },
    {
      id: 'spec_old',
      title: 'Transfers · Functional specification (v0.3)',
      updatedLabel: 'Updated 7 months ago · status: draft',
      readCost: 10,
      onRead: [{ kind: 'flag', key: 'spec_old.read' }],
      body: `## Scope
Domestic SEPA transfers from the web.

## Rules
- Maximum amount per transaction: **€3,000**.
- Daily limit: **€4,000**.
- Pending confirmation with Compliance.

## To do
- Define error messages.
- Review with Product.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-142',
      title: 'As a customer I want to send transfers to another account',
      status: 'In QA',
      type: 'story',
      description:
        'Allow customers to send domestic SEPA transfers from the web. Required for Friday\'s investor demo.',
      acceptanceCriteria: [
        'The customer can send a transfer by entering an IBAN, beneficiary, amount and an optional reference.',
        'The amount must be valid.',
        'The account limits are respected.',
        'The IBAN must be correct.',
        'After sending, the receipt is shown and the balance is updated.',
      ],
      comments: [
        { author: 'diego', body: 'Tested locally, works 👌' },
        {
          author: 'marta',
          visibleWhen: { kind: 'flag', key: 'rules.known' },
          body: 'Clarification of the criteria: amount between €0.01 and €5,000 per transaction, up to 2 decimal places (comma or dot). Cumulative daily limit of €6,000. Spanish IBAN with valid check digits. Optional reference, 140 characters maximum.',
        },
      ],
      actions: [
        {
          id: 'ask_po',
          label: 'Message Marta (PO) with questions',
          cost: 2,
          hiddenWhen: { kind: 'flag', key: 'po.contacted' },
          effects: [
            { kind: 'flag', key: 'po.contacted' },
            { kind: 'deliver', sceneId: 'marta_rules' },
          ],
        },
      ],
    },
  ],

  bugs: [
    {
      id: 'B1',
      title: 'Amounts between €5,000.01 and €5,000.99 are accepted',
      severity: 'high',
      requiresFlag: 'rules.known',
      disputeReply: 'Where does it say the maximum is €5,000? The specification in the wiki says something else. Confirm it with Marta and we\'ll take a look.',
      explanation: 'The validation only compares the integer part of the amount, so €5,000.50 exceeds the per-transaction limit without anyone noticing.',
      technique: 'Boundary values: test 5,000.00 and 5,000.01.',
      fix: { delay: 45 },
    },
    {
      id: 'B2',
      title: 'Negative amounts are accepted and increase the balance',
      severity: 'critical',
      explanation: 'Only 0 is rejected. With −€50 the customer «receives» money: it is an open door to fraud.',
      technique: 'Equivalence partitioning: test the negative partition, not just valid values.',
      fix: { delay: 40 },
    },
    {
      id: 'B3',
      title: '«10,50» is processed as €1,050',
      severity: 'critical',
      explanation: 'The app strips the comma instead of using it as the decimal separator. A customer who types 10,50 sends 100 times more money.',
      technique: 'Partitions on the format (comma versus dot), thinking like a real user.',
      fix: { delay: 50, regression: 'R1', note: 'I changed how decimals are parsed.' },
    },
    {
      id: 'B4',
      title: 'IBANs with incorrect check digits are accepted',
      severity: 'medium',
      explanation: 'Only the format is checked (ES + 22 digits), not the check digits. The transfer goes out to a non-existent account and the bank returns it days later.',
      technique: 'Invalid data with a correct format: change one digit of a valid IBAN.',
      fix: { delay: 60 },
    },
    {
      id: 'B5',
      title: 'Double-clicking «Confirm» creates duplicate transfers',
      severity: 'critical',
      explanation: 'The button is not disabled while the request is being processed and the backend does not check for duplicates (idempotency).',
      technique: 'Real user behavior: double clicks, retries, slow network.',
      fix: { delay: 45, attempts: ['not_fixed', 'fixed'], note: 'The button now shows «Processing…».' },
    },
    {
      id: 'B6',
      title: 'The cumulative daily limit of €6,000 is not applied',
      severity: 'high',
      requiresFlag: 'rules.known',
      disputeReply: 'A €6,000 daily limit? I don\'t have that written down anywhere. Confirm it with Marta.',
      explanation: 'Each transaction is compared with €6,000, not the day\'s total. With €4,000 + €2,500 the limit is exceeded.',
      technique: 'Sequence testing: several transactions in a row, not just one.',
      fix: { delay: 50 },
    },
    // --- Variants: each playthrough activates one option per slot (BUG_SLOTS) ---
    {
      id: 'B1b',
      title: 'You cannot send exactly the €5,000.00 maximum',
      severity: 'medium',
      requiresFlag: 'rules.known',
      disputeReply: 'Are you sure €5,000 is allowed? I understood something different. Confirm it with Marta.',
      explanation: 'The validation uses «greater than or equal to» instead of «greater than»: the boundary value, which is valid, is rejected.',
      technique: 'Boundary values: test exactly the maximum.',
      fix: { delay: 45 },
    },
    {
      id: 'B2b',
      title: '€0 transfers are accepted',
      severity: 'medium',
      explanation: 'Negatives are rejected but zero is not: empty transactions are created that clutter statements and reconciliation.',
      technique: 'Equivalence partitioning: zero is its own partition.',
      fix: { delay: 40 },
    },
    {
      id: 'B3b',
      title: '«10,50» is processed as €10 (the decimals are lost)',
      severity: 'high',
      explanation: 'The app truncates the amount at the comma: the customer sends less money than they typed and the payment is incomplete.',
      technique: 'Partitions on the format (comma versus dot), thinking like a real user.',
      fix: { delay: 50, regression: 'R1', note: 'I changed how decimals are parsed.' },
    },
    {
      id: 'B4b',
      title: 'A valid IBAN typed with spaces is rejected',
      severity: 'medium',
      explanation: 'The app does not ignore spaces: the usual format in which customers copy their IBAN causes an error and they cannot pay.',
      technique: 'Format partitions: the same valid data written in a different way.',
      fix: { delay: 60 },
    },
    {
      id: 'B6b',
      title: 'A daily total of exactly €6,000 is rejected',
      severity: 'low',
      requiresFlag: 'rules.known',
      disputeReply: 'Does the daily limit include the €6,000 itself? Ask Marta, I\'m not sure.',
      explanation: 'The daily limit is applied with «greater than or equal to»: the exact total, which is valid, is rejected.',
      technique: 'Boundary values on sequences: daily total exactly at the limit.',
      fix: { delay: 50 },
    },
    {
      id: 'R1',
      title: 'Regression: after the comma fix, «10.50» with a dot is processed as €1,050',
      severity: 'critical',
      regression: true,
      explanation:
        'When fixing B3, the developer stripped the dot instead of accepting it as a decimal separator. What used to work is now broken: it is only detected by repeating test cases that already passed.',
      technique: 'Regression testing: after a fix, re-run the related test cases that passed before.',
    },
  ],

  concepts: [
    {
      id: 'principles',
      title: 'The 7 testing principles',
      summary:
        'Testing can show that defects are present, but not that they are absent. Exhaustive testing is impossible. Early testing saves money. Defects cluster together. Repeating the same tests over and over stops finding bugs. Testing is context dependent. And an error-free product is not necessarily useful.',
    },
    {
      id: 'exhaustive',
      title: 'Exhaustive testing is impossible',
      summary: 'Not even with all the time in the world can you test every combination. That is why you prioritize by risk and communicate what has been tested and what has not.',
    },
    {
      id: 'static_testing',
      title: 'Static testing',
      summary:
        'Reviewing requirements, designs or code without executing anything. Asking «what does valid amount mean?» before testing is static testing: it finds defects when they are cheapest to fix.',
    },
    {
      id: 'equivalence',
      title: 'Equivalence partitioning',
      summary:
        'Split the inputs into groups the system should treat the same way (negatives, zero, valid, above the limit, comma or dot…) and test at least one value from each group.',
    },
    {
      id: 'boundary_values',
      title: 'Boundary value analysis',
      summary: 'Errors concentrate at the edges. For a €5,000 maximum, test 4,999.99, 5,000.00 and 5,000.01.',
    },
    {
      id: 'severity_priority',
      title: 'Severity versus priority',
      summary: 'Severity: impact on the customer or the business. Priority: urgency to fix it. A typo on the home page can have low severity and high priority.',
    },
    {
      id: 'bug_anatomy',
      title: 'Anatomy of a good defect report',
      summary: 'A clear title, steps to reproduce, expected and actual results, severity and evidence. If the dev cannot reproduce it, for the team that bug does not exist.',
    },
    {
      id: 'test_environments',
      title: 'Test environments',
      summary: 'Development, staging (pre-production) and production. In regulated sectors such as banking, testing in production with real money is a serious offense.',
    },
    {
      id: 'traceability',
      title: 'Traceability',
      summary: 'Every defect is logged where the whole team can see it. Bugs that are only discussed in chat get lost, and the risk reaches production hidden.',
    },
    {
      id: 'test_design',
      title: 'Design before you execute',
      summary: 'Preparing the test cases (inputs and expected result) before touching the app means you test with intent, not at random.',
    },
    {
      id: 'confirmation_testing',
      title: 'Re-test (confirmation testing)',
      summary: 'When the dev says «fixed», QA tests it again on the new build with the same test case that failed. Closing without re-testing is trusting, not verifying.',
    },
    {
      id: 'regression',
      title: 'Regression testing',
      summary: 'A change can break what already worked. After every fix, repeat the related test cases that passed before; that is why it pays to have your test cases designed and saved.',
    },
    {
      id: 'defect_lifecycle',
      title: 'Defect lifecycle',
      summary: 'New → accepted → in progress → resolved → verified and closed, or reopened if it still fails. QA opens and QA closes: the dev does not close their own bugs.',
    },
    {
      id: 'risk_based',
      title: 'Risk-based testing',
      summary: 'Risk = likelihood of failure × impact. Test first what scores high on both, and communicate what remains untested.',
    },
    {
      id: 'concurrency',
      title: 'Repeated actions and concurrency',
      summary: 'Double clicks, retries, slow networks: real users do things the happy path does not cover. In payments, a duplicate is lost money.',
    },
  ],
  debriefConcepts: ['principles', 'equivalence', 'boundary_values', 'bug_anatomy', 'concurrency'],
  seniorTips: [
    'Before touching the app, clarify with the PO what each ambiguous criterion means.',
    'Make a quick list of partitions: valid, zero, negatives, boundaries and formats.',
    'Test like a real customer: decimal comma, double click, several transfers in a row.',
    'Log every bug with evidence and give the dev a heads-up: transparency without conflict.',
    'When a fix arrives, re-test the failed case and repeat the related ones: a fix can break something else.',
    'Communicate the status with facts: what you tested, what you found, what risk you see and what you recommend.',
  ],
}
