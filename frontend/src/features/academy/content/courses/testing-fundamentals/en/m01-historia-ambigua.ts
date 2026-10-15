import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m01DesignEn } from './m01-design'
import { m01LessonsEn } from './m01-lessons'
import { m01QuizEn } from './m01-quiz'
import { m01ReviewEn } from './m01-review'

/**
 * Course: Testing Fundamentals · Mission 1 — The ambiguous story (English).
 * Translation of ../m01-historia-ambigua.ts: same structure and ids.
 *
 * Tuesday at Kobalto. QA reviews KOB-151 (scheduled transfers) BEFORE the
 * code exists. At 11:30 Diego starts developing: every question that has not
 * been clarified turns into a prototype bug that reaches staging in the
 * afternoon (BugDef.preventedBy + preventBugs effect).
 */
export const m01HistoriaAmbiguaEn: Mission = {
  id: 'm01-historia-ambigua',
  lang: 'en',
  courseKey: 'testing-fundamentals',
  number: 1,
  title: 'The ambiguous story',
  subtitle: 'Testing before the code exists: requirements review and shift-left.',
  world: kobaltoWorldEn,
  playerRole: 'Junior QA',
  dayStart: 9 * 60,
  dayLabel: 'Tuesday',
  duration: 480,
  appActionCost: 4,
  reportCost: 12,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-scheduled',
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  requirementsReview: m01ReviewEn,
  testDesign: m01DesignEn,
  verdicts: {
    good: { title: 'A real QA Tuesday', body: 'Marta asks you to review next week\'s story too. Diego has stopped saying «it\'s crystal clear» in refinements.' },
    ok: { title: 'Tuesday passed', body: 'You prevented some bugs and found others. Check the debrief: every unclarified question became a bug that had to be developed, found and fixed.' },
    bad: { title: 'A rough Tuesday', body: 'The story reached development almost unreviewed. Replay the mission starting with the Review: you will see how many bugs never come to exist.' },
  },
  lessons: m01LessonsEn,
  mentor: 'laura',
  quiz: m01QuizEn,

  briefing: {
    title: 'Tuesday: the ambiguous story',
    paragraphs: [
      'You survived your first day. Today the team is refining KOB-151, scheduled transfers: the feature Kobalto customers ask for the most. Not a single line of code exists yet.',
      'Your work starts before Diego\'s. Review the story, find what is ambiguous and ask Marta about it. At 11:30 Diego starts developing with whatever is in the ticket.',
      'In the afternoon a prototype will reach staging. There you will see which bugs were born from the questions nobody answered in time.',
    ],
    goals: [
      'Review KOB-151 and send your questions to Marta before 11:30.',
      'Take part in the 09:30 refinement.',
      'Design your test cases and test the prototype when it reaches staging.',
      'Report and verify the bugs; notice which ones come from the requirements.',
      'At 17:00, tell Laura what you have learned.',
    ],
  },

  tools: [
    { tool: 'mail' },
    { tool: 'chat' },
    { tool: 'tickets' },
    { tool: 'review' },
    { tool: 'design' },
    { tool: 'wiki' },
    {
      tool: 'app',
      enabledWhen: { kind: 'flag', key: 'proto.ready' },
      lockedMessage: 'The KOB-151 prototype will reach staging in the afternoon. In the meantime, review the story and design your test cases.',
    },
    { tool: 'logs' },
  ],

  scenes: [
    // ---------------------------------------------------------- 09:00
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Tuesday: KOB-151 refinement 🔍',
      body: 'Good morning!\n\nToday is something different: **testing before the code exists**.\n\n- At 09:30 we refine KOB-151 (Scheduled transfers).\n- Read the story in **Review**, flag whatever is unclear and send it to Marta.\n- Diego starts developing at **11:30**: anything not clarified by then he will implement the way he understands it.\n- In the afternoon there will be a prototype in staging. Design your test cases beforehand, in **Design**.\n\nIf you have questions about the method, ask me.\n\nLaura',
    },
    {
      id: 'mail_marta',
      channel: 'email',
      from: 'marta',
      at: 0,
      subject: 'KOB-151 for the refinement',
      body: 'Hi team,\n\nI have put KOB-151 on the board for today\'s refinement. It is customers\' number 1 request (40% of the suggestion box!) and I would like to get it into Friday\'s release.\n\nI think it is pretty clear, but if you see anything, let me know.\n\nMarta',
    },

    // ---------------------------------------------------------- 09:30 refinement
    {
      id: 'refinement',
      channel: 'meeting',
      from: 'marta',
      with: ['diego', 'laura'],
      at: 30,
      subject: 'Refinement · KOB-151',
      body: '**Marta:** KOB-151: scheduled transfers. The customer chooses a date and a frequency and they are sent automatically. It\'s all in the ticket.\n\n**Diego:** It\'s crystal clear. It\'s 3 points. Shall we estimate it and I get started?\n\n**Laura:** Before estimating: does QA have any questions?',
      choices: [
        {
          id: 'already_sent',
          text: 'Yes: I\'ve already sent my questions to Marta in the review. I suggest we settle the answers before estimating; they could change the work a lot.',
          requires: { kind: 'flag', key: 'review.submitted' },
          cost: 20,
          reply: 'Good point. Diego, wait for the answers before you start.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'flag', key: 'refinement.good' },
            { kind: 'note', tone: 'good', text: 'In the refinement you argued for clarifying the questions before estimating, with your review already sent.' },
          ],
        },
        {
          id: 'ask_time',
          text: 'I have questions about dates, limits and cancellation. Give me until 11:00 to review it thoroughly and I\'ll send them to Marta before Diego starts.',
          cost: 20,
          reply: 'Perfect, I\'ll be waiting for your questions.',
          replyFrom: 'marta',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'flag', key: 'refinement.good' },
            { kind: 'note', tone: 'good', text: 'You asked for time to review the story before development started.' },
          ],
        },
        {
          id: 'all_clear',
          text: 'It\'s clear on my side, go ahead.',
          cost: 20,
          reply: 'Great! I\'ll get on it at 11:30 🚀',
          replyFrom: 'diego',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You declared a story with several gaps clear without having reviewed it.' },
          ],
        },
        {
          id: 'estimate',
          text: 'I\'d estimate it at 8 points, it looks complex to me.',
          cost: 20,
          reply: 'Complex why? If there are no specific questions, I\'ll stick with 3.',
          replyFrom: 'diego',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You gave an opinion on the estimate without bringing the specific questions that made it complex.' }],
        },
      ],
    },

    // ---------------------------------------------------------- 10:45 hint
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 105,
      when: { kind: 'notFlag', key: 'review.submitted' },
      body: 'Diego starts in 45 minutes ⏳ Have you sent your questions to Marta yet? Hint: look for vague words («the same limits», «fast»), missing cases («what if…?») and contradictions between the description and the examples.',
      onDeliver: [{ kind: 'unlock', conceptId: 'requirement_defects' }],
    },

    // ---------------------------------------------------------- 11:30 development starts
    {
      id: 'dev_start',
      channel: 'chat',
      from: 'diego',
      at: 150,
      body: 'Starting on KOB-151 🚀 Whatever is not clarified in the ticket I\'ll solve however I see fit.',
      onDeliver: [
        { kind: 'preventBugs' },
        { kind: 'note', tone: 'neutral', text: 'At 11:30 development started with the clarifications that were in the ticket at that moment.' },
      ],
    },

    // ---------------------------------------------------------- 12:30 scope change (unexpected)
    {
      id: 'scope_change',
      channel: 'chat',
      from: 'marta',
      at: 210,
      probability: 0.5,
      body: 'Compliance just called me 😰 Can we make the daily limit also be checked when scheduling? Tell Diego directly so we don\'t waste time.',
      choices: [
        {
          id: 'register',
          text: 'It\'s a scope change: I\'ll note it in the ticket and we\'ll assess it tomorrow at the daily with Diego and Laura, to see the impact on the sprint.',
          cost: 5,
          reply: 'Okay, you\'re right. Better to do it properly.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'unlock', conceptId: 'scope_change' },
            { kind: 'note', tone: 'good', text: 'You handled a mid-sprint scope change through the process, not through a shortcut.' },
          ],
        },
        {
          id: 'shortcut',
          text: 'Okay, I\'ll tell Diego now.',
          cost: 3,
          reply: 'Thanks! 🙌',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'unlock', conceptId: 'scope_change' },
            { kind: 'note', tone: 'bad', text: 'You pushed a scope change through a shortcut: without logging it or assessing its impact.' },
          ],
        },
        {
          id: 'not_mine',
          text: 'That\'s not my thing.',
          cost: 1,
          reply: 'Okay… I\'ll tell him myself.',
          effects: [{ kind: 'score', key: 'communication', add: -1 }],
        },
      ],
    },

    // ---------------------------------------------------------- 14:30 prototype
    {
      id: 'proto_ready',
      channel: 'chat',
      from: 'diego',
      at: 330,
      body: 'Scheduled transfers prototype is in staging (build proto1). Take a look when you can 🙏',
      onDeliver: [{ kind: 'flag', key: 'proto.ready' }],
    },
    {
      id: 'laura_first_bug',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'reportsGte', value: 1 },
      body: 'First prototype bug on the board 🐞 Look at where each one comes from: a coding error, or a requirement we didn\'t clarify in time? It\'s the best lesson of the day.',
      onDeliver: [{ kind: 'unlock', conceptId: 'shift_left' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Diego has already pushed a fix 🔧 Same as yesterday: re-test on the new build and repeat the related test cases before closing.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
      ],
    },

    // ---------------------------------------------------------- 15:30 business pressure
    {
      id: 'marta_status',
      channel: 'chat',
      from: 'marta',
      at: 390,
      body: 'Can we commit KOB-151 for Friday\'s release? Management is asking me.',
      choices: [
        {
          id: 'evidence',
          text: 'Not yet: there are open bugs in the prototype and several come from requirements that weren\'t clear. I\'ll send you the list; with the fixes and a re-test we\'ll confirm it on Thursday.',
          requires: { kind: 'reportsGte', value: 1 },
          cost: 5,
          reply: 'Understood, better to know today. I\'ll wait until Thursday.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'You gave the PO a status backed by evidence and a realistic date to decide.' },
          ],
        },
        {
          id: 'unsure',
          text: 'I don\'t know yet. I\'ll get back to you at 17:00 with Laura.',
          cost: 3,
          reply: 'Ok, I\'ll be waiting.',
          effects: [{ kind: 'score', key: 'communication', add: 1 }],
        },
        {
          id: 'yes',
          text: 'Yes, it\'s almost there.',
          cost: 2,
          reply: 'Perfect! I\'ll tell management 🎉',
          effects: [
            {
              kind: 'if',
              when: { kind: 'bugTriggered' },
              then: [
                { kind: 'score', key: 'risk', add: -2 },
                { kind: 'note', tone: 'bad', text: 'You committed the release with bugs already seen in the prototype.' },
              ],
              else: [
                { kind: 'score', key: 'risk', add: -1 },
                { kind: 'note', tone: 'bad', text: 'You committed the release without having tested enough.' },
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
      body: '**Laura:** What do you take away from today with KOB-151?',
      choices: [
        {
          id: 'lesson',
          text: 'That clarifying the story before development is the cheapest option: what we asked in time didn\'t become a bug, and what we didn\'t ask did. Tomorrow I\'ll re-test the fixes.',
          requires: { kind: 'flag', key: 'review.submitted' },
          reply: 'Exactly. That is shift-left: the best way to find a bug is to prevent it from being written.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'shift_left' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'blame',
          text: 'I found bugs in the prototype. Diego should have coded it better.',
          requires: { kind: 'reportsGte', value: 1 },
          reply: 'Careful: several of those bugs were born from an ambiguous story nobody clarified. Quality belongs to the team, not to Diego.',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You blamed the developer for bugs that were born from unclarified requirements.' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'quiet',
          text: 'It was a quiet day, not much going on.',
          reply: 'Hmm. Go over the debrief: there was more going on today than it seems.',
          effects: [{ kind: 'score', key: 'communication', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_refinamiento',
      title: 'Refinement guide for QA',
      updatedLabel: 'Updated 1 month ago by Laura Méndez',
      readCost: 15,
      onRead: [
        { kind: 'unlock', conceptId: 'requirement_defects' },
        { kind: 'unlock', conceptId: 'testable_criteria' },
        { kind: 'unlock', conceptId: 'given_when_then' },
        { kind: 'score', key: 'rigor', add: 1 },
      ],
      body: `## Before the refinement
Read the story sentence by sentence and ask yourself: «how would I test this?». If you don't know what result to expect, there is a defect in the requirement.

## Checklist
- **Ambiguity**: vague words («adequate», «fast», «the same as»).
- **Completeness**: what happens if…? (empty values, maximums, errors, cancellations, odd dates).
- **Contradictions**: do the description and the examples say the same thing?
- **Testability**: is there an objective threshold to decide whether it passes or fails?

## How to ask
- One question per point, quoting the text.
- Propose an example (Given / When / Then) so the PO only has to confirm it.
- The answers, always written down in the ticket.`,
    },
    {
      id: 'spec_transferencias',
      title: 'Transfers · specification (v1.0)',
      updatedLabel: 'Updated yesterday by Marta Sanz',
      readCost: 5,
      body: `## Current rules
- Amount from €0.01 to €5,000 per transaction, up to 2 decimal places.
- Cumulative daily limit: €6,000.
- Valid Spanish IBAN (format and check digits).
- Optional reference, 140 characters maximum.

## Note
Updated after yesterday's review of KOB-142. Version 0.3 is now obsolete.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-151',
      title: 'As a customer I want to schedule transfers so that they are sent automatically on a future date',
      status: 'In refinement',
      type: 'story',
      description: 'Feature that lets customers schedule payments between their own accounts without having to remember to make them.',
      acceptanceCriteria: [
        'The customer chooses the execution date.',
        'They can choose the frequency: once, weekly or monthly.',
        'The same limits as for a normal transfer apply.',
        'The end date is optional for recurring transfers and, if given, must be on or after the start date.',
        'The customer can cancel a scheduled transfer.',
        'The system must be fast and easy to use.',
        'Example: paying the rent to the landlord on the 1st of every month.',
        'If there are insufficient funds, the transfer is not executed.',
        'The amount allows up to 2 decimal places.',
        'The customer is notified.',
      ],
      comments: [{ author: 'diego', body: 'This is 3 points, easy 💪' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'M1-B1',
      title: 'Transfers can be scheduled for today or for past dates',
      severity: 'high',
      preventedBy: 'clar.date',
      requiresFlag: 'clar.date',
      disputeReply: 'The story only says «the customer chooses the date». Where does it say it can\'t be today? Clarify it with Marta for me.',
      explanation: 'Without a rule about which dates are valid, Diego did not validate the lower boundary: a transfer scheduled «for yesterday» is accepted and nobody knows when it runs.',
      technique: 'Boundary values with dates: yesterday, today, tomorrow, +365 and +366 days.',
      fix: { delay: 45 },
    },
    {
      id: 'M1-B2',
      title: 'Monthly on the 29th–31st: months without that day are skipped',
      severity: 'high',
      preventedBy: 'clar.monthly',
      requiresFlag: 'clar.monthly',
      disputeReply: 'If the month has no 31st, there is no 31st. What did you expect it to do? Ask Marta.',
      explanation: 'Nobody defined what happens in short months: the prototype skips November, and the customer who pays their rent on the 31st does not pay that month.',
      technique: 'Date partitions: days 29, 30 and 31 against 30-day months and February.',
      fix: { delay: 50 },
    },
    {
      id: 'M1-B3',
      title: 'Amounts over €5,000 can be scheduled',
      severity: 'high',
      preventedBy: 'clar.limits',
      requiresFlag: 'clar.limits',
      disputeReply: '«The same limits»: I check them on the execution date, as always. Where does it say it should be when scheduling?',
      explanation: '«The same limits» was ambiguous: Diego only checks them at execution, so the customer schedules €7,000 and discovers the rejection on the payment date.',
      technique: 'Boundary values: €5,000 and €5,000.01 also when scheduling.',
      fix: { delay: 45 },
    },
    {
      id: 'M1-B4',
      title: 'Cancelling a recurring transfer deletes the whole series without asking',
      severity: 'high',
      preventedBy: 'clar.cancel',
      requiresFlag: 'clar.cancel',
      disputeReply: 'Cancel means cancel, right? The story says nothing about «only the next one».',
      explanation: 'The requirement did not distinguish between cancelling the next execution or the whole series: a customer who only wanted to skip one month loses all their scheduled payments.',
      technique: 'Alternative flows: cancel a one-off, the next one of a recurring series or the whole series.',
      fix: { delay: 50 },
    },
    {
      id: 'M1-B5',
      title: 'Scheduled transfers are only allowed to the customer\'s own accounts',
      severity: 'high',
      preventedBy: 'clar.destination',
      requiresFlag: 'clar.destination',
      disputeReply: 'The description says «between their own accounts». I built it exactly like that.',
      explanation: 'The description («between their own accounts») contradicted the rent example. Diego followed the description and the main use case was blocked.',
      technique: 'Check for contradictions between the description and the examples.',
      fix: { delay: 45 },
    },
    {
      id: 'M1-B6',
      title: 'An end date before the start date is accepted',
      severity: 'medium',
      explanation: 'Criterion 4 was clear: this is an implementation error. A good story reduces bugs, but does not eliminate them; that is why you still have to test.',
      technique: 'Boundary values between two dates: end before, on the same day as and after the start.',
      fix: { delay: 40 },
    },
  ],

  concepts: [
    {
      id: 'static_testing',
      title: 'Static testing',
      summary: 'Reviewing requirements, designs or code without executing anything. It finds defects when they are cheapest to fix: before they exist in the software.',
    },
    {
      id: 'requirement_defects',
      title: 'Defects in requirements',
      summary: 'Ambiguous (several interpretations), incomplete (a case or rule is missing), contradictory (incompatible parts) and untestable (no objective way to check it).',
    },
    {
      id: 'testable_criteria',
      title: 'Testable criteria',
      summary: 'A criterion is testable if two people testing it would reach the same verdict. «Fast» is not; «under 2 seconds» is.',
    },
    {
      id: 'given_when_then',
      title: 'Given / When / Then examples',
      summary: 'Writing criteria as concrete examples removes interpretations and leaves test cases ready before development.',
    },
    {
      id: 'shift_left',
      title: 'Shift-left and the cost of defects',
      summary: 'A defect found in the requirement costs one question; in staging, development and a re-test; in production, affected customers on top of that. QA gets involved as early as possible.',
    },
    {
      id: 'scope_change',
      title: 'Scope changes',
      summary: 'Mid-sprint changes are logged and assessed with the team; shortcuts end up as untested functionality.',
    },
    {
      id: 'boundary_values',
      title: 'Boundary values with dates',
      summary: 'Yesterday, today, tomorrow, the maximum and one more; weekends; months of 28 to 31 days; related dates (end before, equal to and after the start).',
    },
    {
      id: 'confirmation_testing',
      title: 'Re-test (confirmation testing)',
      summary: 'When the dev says «fixed», QA tests it again on the new build with the same test case that failed.',
    },
    {
      id: 'regression',
      title: 'Regression testing',
      summary: 'A change can break what already worked: after every fix, repeat the related test cases that passed before.',
    },
  ],
  debriefConcepts: ['static_testing', 'requirement_defects', 'testable_criteria', 'given_when_then', 'shift_left'],
  seniorTips: [
    'Review the story before the refinement and bring your questions in writing, quoting the text.',
    'Look for vague words, missing cases and contradictions between the description and the examples.',
    'Propose examples (Given / When / Then): the PO only has to confirm them.',
    'Get the answers before development starts and make sure they are recorded in the ticket.',
    'When the prototype arrives, tell code bugs apart from those born in the requirements: the latter are fixed by improving the process.',
    'Handle scope changes through the process, never through a shortcut.',
  ],
}
