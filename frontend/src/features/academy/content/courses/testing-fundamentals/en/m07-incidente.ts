import type { Condition, Mission } from '../../../../engine/types'
import { INCIDENT_BUG_SLOTS } from '../../../../apps/kobalto-incident/incidentLogic'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m07LessonsEn } from './m07-lessons'
import { m07QuizEn } from './m07-quiz'

const rootCauseFound: Condition = { kind: 'any', of: [{ kind: 'bugReported', bugId: 'I1' }, { kind: 'bugReported', bugId: 'I1b' }] }

/**
 * Course: Testing Fundamentals · Mission 7 — Production incident (English).
 *
 * Wednesday. The instant transfers campaign has been running for two days and
 * at 9:00 a.m. an alert fires: the payments API is failing more than usual.
 * You have to narrow it down with data, mitigate without switching off what
 * works, communicate, reproduce the cause on staging and close with a
 * blameless postmortem.
 */
export const m07IncidenteEn: Mission = {
  id: 'm07-incidente',
  lang: 'en',
  courseKey: 'testing-fundamentals',
  number: 7,
  title: 'Production incident',
  subtitle: 'Incident response, observability, mitigation and blameless postmortems.',
  world: kobaltoWorldEn,
  playerRole: 'Junior QA',
  dayStart: 9 * 60,
  dayLabel: 'Wednesday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'INC',
  appId: 'kobalto-incident',
  reportPriority: true,
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  lessons: m07LessonsEn,
  mentor: 'laura',
  quiz: m07QuizEn,
  bugSlots: INCIDENT_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'Incident under control',
      body: 'You mitigated quickly, found the cause with data, and the postmortem left the team better off than before. Raúl asks you to join the on-call rotation next quarter.',
    },
    ok: {
      title: 'Incident cleared',
      body: 'The incident was resolved, but the mitigation took too long or the root cause wasn\'t clear. Check the timeline in the debrief.',
    },
    bad: {
      title: 'A long day',
      body: 'Without narrowing it down with data or mitigating first, the damage grows every minute. Replay the mission: break it down, switch off just what\'s needed, then investigate.',
    },
  },

  briefing: {
    title: 'Wednesday: production incident',
    paragraphs: [
      '5.1 has been in production for two days and the instant transfers campaign is under way. At 9:00 a.m. an alert fires: the payments API is failing a lot more than usual.',
      'You have the observability console: you can break down errors by operation, OS, version, amount or account age, turn off flags, roll back and reproduce combinations on staging.',
      'Every minute without mitigation adds affected customers. At 3:00 p.m., postmortem with the whole team.',
    ],
    goals: [
      'Mitigate first: narrow down with data which feature is failing and switch it off.',
      'Communicate honestly with Customer Support.',
      'Don\'t chase false leads: check the correlation.',
      'Reproduce the exact cause on staging and report it.',
      'Bring a blameless root cause and concrete actions to the postmortem.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'alert',
      channel: 'chat',
      from: 'ivan',
      at: 0,
      body: '🚨 **ALERT** · The payments API error rate has been well above the usual 0.3% since 9:00 a.m. Customer Support is already getting calls. Do we open an incident?',
      choices: [
        {
          id: 'declare',
          text: 'Yes: incident open and war room. I\'m starting to narrow it down with the observability data.',
          cost: 2,
          reply: 'Opened. Raúl is coordinating. 🚒',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'unlock', conceptId: 'incident_response' },
            { kind: 'note', tone: 'good', text: 'You opened the incident as soon as the alert fired.' },
          ],
        },
        {
          id: 'wait',
          text: 'Let\'s wait 30 minutes, maybe it goes down on its own.',
          cost: 30,
          reply: 'Hmm… it keeps going up. I\'ll open it.',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'unlock', conceptId: 'incident_response' },
            { kind: 'note', tone: 'bad', text: 'You waited 30 minutes with customers affected before acting.' },
          ],
        },
      ],
    },
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Incident: the order matters',
      body: 'I\'m at the doctor\'s until 11, so here\'s a quick note:\n\n1. **Mitigate** first: narrow down which feature is failing and switch it off (flag). Rollback is the last safety net.\n2. **Communicate** with Nuria using whatever you know.\n3. **Reproduce** the exact condition on staging and report it.\n4. **Blameless** postmortem.\n\nThe incident guide is in the wiki. You\'ve got this!\n\nLaura',
    },
    {
      id: 'war_room',
      channel: 'meeting',
      from: 'raul',
      with: ['ivan', 'diego'],
      at: 10,
      subject: '9:10 a.m. · War room',
      body: '**Raúl:** I\'m coordinating. Iván, infrastructure; Diego, code. QA, you help narrow it down and reproduce it. Where do we start?',
      choices: [
        {
          id: 'data',
          text: 'We narrow it down with the data: error breakdown by operation, version, OS… As soon as we know which feature it is, we switch it off with its flag.',
          cost: 10,
          reply: 'Good. Let me know as soon as you have the feature.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'observability' },
            { kind: 'note', tone: 'good', text: 'You proposed narrowing it down with data and mitigating with the right flag.' },
          ],
        },
        {
          id: 'code',
          text: 'Let\'s review the 5.1 code line by line until we find the failure.',
          cost: 10,
          reply: 'That\'s hours. I need to reduce the damage now.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You proposed looking for the cause in the code before mitigating.' },
          ],
        },
        {
          id: 'rollback',
          text: 'Roll everything back to 5.0.3 now, and then we look.',
          cost: 10,
          reply: 'It\'s an option, but it takes 40 minutes and we lose the good parts. Can we narrow it down first?',
          replyFrom: 'raul',
          effects: [{ kind: 'unlock', conceptId: 'mitigation' }, { kind: 'note', tone: 'neutral', text: 'You proposed a full rollback without narrowing it down.' }],
        },
      ],
    },
    {
      id: 'nuria',
      channel: 'chat',
      from: 'nuria',
      at: 30,
      body: 'The phone lines are swamped 📞 Customers say "the transfer gives an error". What do I tell them?',
      choices: [
        {
          id: 'honest',
          text: 'That some transfers have been failing since 9:00 a.m., that nothing has been charged for the ones that fail, that they should retry in an hour or use a standard transfer, and that I\'ll update you every 30 minutes.',
          cost: 5,
          reply: 'Thanks! I can work with that.',
          effects: [
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'incident_response' },
            { kind: 'note', tone: 'good', text: 'You gave Customer Support an honest, useful message with a next update.' },
          ],
        },
        {
          id: 'bank',
          text: 'That it\'s a problem with the receiving bank.',
          cost: 2,
          reply: 'Are you sure? If it turns out not to be, we\'ll look terrible…',
          effects: [
            { kind: 'score', key: 'communication', add: -2 },
            { kind: 'note', tone: 'bad', text: 'You blamed a third party without evidence.' },
          ],
        },
        {
          id: 'nothing',
          text: 'We don\'t know anything yet, better not to say anything.',
          cost: 1,
          reply: 'Sure, but they keep calling me…',
          effects: [{ kind: 'score', key: 'communication', add: -1 }, { kind: 'note', tone: 'neutral', text: 'You left Customer Support without a message.' }],
        },
      ],
    },
    {
      id: 'cpu',
      channel: 'chat',
      from: 'sergio',
      at: 45,
      body: 'Hey, I noticed the **notifications** service is at 95% CPU. Couldn\'t that be it? Should we restart it?',
      choices: [
        {
          id: 'correlate',
          text: 'First, let\'s check the correlation: that CPU goes up every day at 9:00 a.m. because of the mass send, and the errors are in the payments API. It doesn\'t match.',
          cost: 3,
          reply: 'True, that happens every day. False alarm 👍',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'observability' },
            { kind: 'note', tone: 'good', text: 'You ruled out a false lead by checking the correlation.' },
          ],
        },
        {
          id: 'restart',
          text: 'Yes, restart it just in case.',
          cost: 15,
          reply: 'Restarted… and the errors are still the same 😕',
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You chased a false lead (the notifications CPU) and lost 15 minutes.' },
          ],
        },
      ],
    },
    {
      id: 'wrong_flag',
      channel: 'chat',
      from: 'raul',
      when: { kind: 'flag', key: 'flag.wrong' },
      body: 'You\'ve turned off a flag and the error rate is still the same. Be careful about switching things off blindly: every flag turned off is a feature customers lose.',
      onDeliver: [
        { kind: 'unlock', conceptId: 'mitigation' },
        { kind: 'note', tone: 'bad', text: 'You turned off a flag that had nothing to do with the incident.' },
      ],
    },
    {
      id: 'mitigated_fast',
      channel: 'chat',
      from: 'raul',
      when: { kind: 'flag', key: 'mitigated.fast' },
      body: 'Errors back to 0.3% in under an hour 👏 Now, root cause and fix, calmly.',
      onDeliver: [
        { kind: 'score', key: 'risk', add: 2 },
        { kind: 'note', tone: 'good', text: 'You mitigated the incident in under an hour.' },
      ],
    },
    {
      id: 'mitigated_slow',
      channel: 'chat',
      from: 'raul',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'mitigated' }, { kind: 'notFlag', key: 'mitigated.fast' }] },
      body: 'Mitigated, but it took us more than an hour. In the postmortem we\'ll look at what slowed us down.',
      onDeliver: [{ kind: 'note', tone: 'neutral', text: 'The mitigation came after the first hour.' }],
    },
    {
      id: 'marta_flag',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'mitigated.flag' },
      body: 'I see the new instant transfers have been switched off 😬 The campaign… when do we turn them back on?',
      choices: [
        {
          id: 'after_fix',
          text: 'When the fix is verified on staging with the exact condition that fails. Meanwhile, instant transfers go through the previous engine: customers can keep using them.',
          cost: 3,
          reply: 'OK, I\'ll explain it to the partner bank.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'mitigation' },
            { kind: 'note', tone: 'good', text: 'You explained to the business when, and under what condition, the flag gets turned back on.' },
          ],
        },
        {
          id: 'now',
          text: 'We can turn it back on now, I\'m sure it was a one-off.',
          cost: 1,
          reply: 'Are you sure? I wouldn\'t want to repeat this morning…',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'note', tone: 'bad', text: 'You proposed turning the flag back on with no root cause and no fix.' },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 120,
      when: { kind: 'notFlag', key: 'mitigated' },
      body: 'I\'m back 👋 Still not mitigated? Break it down by **operation** first: whatever stands out will tell you which flag to turn off. Then keep breaking it down to find the exact condition.',
      onDeliver: [{ kind: 'unlock', conceptId: 'observability' }],
    },
    {
      id: 'diego_fix',
      channel: 'chat',
      from: 'diego',
      when: rootCauseFound,
      body: 'With your reproduction I can see it clearly 🙏 I\'m on the fix. When I push it, verify it on staging with that same combination before turning the flag back on.',
      onDeliver: [{ kind: 'unlock', conceptId: 'incident_response' }],
    },
    {
      id: 'laura_verify',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'Fix on staging 🔧 Repeat the exact reproduction and a few neighboring combinations before Raúl turns the flag back on.',
      onDeliver: [{ kind: 'unlock', conceptId: 'confirmation_testing' }],
    },
    {
      id: 'postmortem',
      channel: 'meeting',
      from: 'raul',
      with: ['laura', 'diego', 'marta', 'ivan'],
      at: 360,
      subject: '3:00 p.m. · Incident postmortem',
      body: '**Raúl:** Blameless postmortem. Timeline, impact and, above all: what was the root cause and what do we change so it doesn\'t happen again?',
      choices: [
        {
          id: 'blameless',
          text: 'Root cause: the new instant transfer engine fails with a specific combination that I\'ve reproduced on staging (it\'s in the report). Contributing factors: we had no test data or contract test for that case, the alert didn\'t break down by version and the flag was switched on to 100% all at once. Actions: a test with that data, a per-version alert and gradual rollout of flags.',
          requires: rootCauseFound,
          cost: 30,
          reply: 'A textbook postmortem. Those three actions go into the sprint with owners.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'postmortem' },
            { kind: 'unlock', conceptId: 'shift_right' },
            { kind: 'note', tone: 'good', text: 'You brought a reproduced root cause, system factors and shift-left and shift-right actions to the postmortem.' },
          ],
        },
        {
          id: 'blame',
          text: 'Diego pushed the new engine without testing it properly.',
          cost: 30,
          reply: 'We\'re not looking for someone to blame here. Diego worked with what the system allowed him. What was missing?',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'communication', add: -2 },
            { kind: 'metric', key: 'trust_diego', add: -2 },
            { kind: 'unlock', conceptId: 'postmortem' },
            { kind: 'note', tone: 'bad', text: 'You singled out a person in a blameless postmortem.' },
          ],
        },
        {
          id: 'self_blame',
          text: 'It was my fault: I should have found it in Friday\'s regression.',
          cost: 30,
          reply: 'Blameless also means not blaming yourself. What do we change in the system?',
          replyFrom: 'laura',
          effects: [
            { kind: 'unlock', conceptId: 'postmortem' },
            { kind: 'note', tone: 'neutral', text: 'You blamed yourself instead of proposing changes to the system.' },
          ],
        },
        {
          id: 'luck',
          text: 'Bad luck: these things happen.',
          cost: 30,
          reply: 'If we don\'t learn anything, it will happen again.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'unlock', conceptId: 'postmortem' },
            { kind: 'note', tone: 'bad', text: 'You closed the postmortem with no cause and no actions.' },
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
      body: '**Laura:** You\'ve finished your first weeks at Kobalto. From day one to a production incident. What are you taking away?',
      choices: [
        {
          id: 'lesson',
          text: 'That testing isn\'t just finding bugs: it\'s providing information for decisions. Before development, when designing, when reporting, when releasing… and also when something fails in production.',
          requires: rootCauseFound,
          reply: 'Exactly. Welcome to the team for real. 💜',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'fear',
          text: 'That something will always fail in production and there\'s nothing you can do.',
          reply: 'Things will fail, yes. But you can catch them earlier, limit the damage and learn. Go over the debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'You took away fatalism instead of actions.' }, { kind: 'endMission' }],
        },
        {
          id: 'little',
          text: 'That today was a bit too much for me.',
          reply: 'An incident is too much for anyone the first time. The second time you\'ll know where to start.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_incidentes',
      title: 'Kobalto incident guide',
      updatedLabel: 'Maintained by Raúl Ortega',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'incident_response' },
        { kind: 'flag', key: 'guide.read' },
      ],
      body: `## Roles
- **Coordinator** (Raúl): decides and prioritizes. **Infra** (Iván), **Development** (Diego), **QA**: narrows down, reproduces and verifies. **Communication**: Customer Support (Nuria) receives updates every 30 minutes.

## Order
1. Mitigate (flag for the affected feature; rollback if there's no flag or it can't be narrowed down).
2. Communicate status: what is failing, for whom, what to do, next update.
3. Root cause: reproduce on staging with the exact condition and report it.
4. Verified fix → turn the flag back on gradually.
5. Blameless postmortem within 24 h.

## Tools
- **Observability**: error breakdown by operation, OS, version, amount and account age.
- **Flags** in 5.1: instant_fees_v2 (instant transfers), split_payments (split expenses), new_onboarding.`,
    },
    {
      id: 'cambios',
      title: 'Production changes this week',
      updatedLabel: 'Change log',
      readCost: 3,
      body: `- **Friday 7:00 p.m.**: deployment of app and API 5.1 (flags turned off).
- **Monday 9:00 a.m.**: split_payments flag turned on for 10% of customers.
- **Tuesday 6:00 p.m.**: new_onboarding flag turned on at 100%.
- **Wednesday 8:55 a.m.**: **instant_fees_v2** flag turned on at **100%** for the campaign.
- **Every day 9:00 a.m.**: mass notification send (usual CPU spike).`,
    },
  ],

  tickets: [
    {
      id: 'INC-77',
      title: 'Incident: increase in payments API errors since 9:00 a.m.',
      status: 'Open · SEV1',
      type: 'story',
      description: 'The payments API error rate is well above the usual level (0.3%). Raúl is coordinating. QA: narrow down, reproduce and verify.',
      acceptanceCriteria: [
        'The impact is mitigated (error rate at normal levels).',
        'The root cause is reproduced on staging and reported.',
        'The fix is verified with the combination that was failing before any flag is turned back on.',
        'There is a blameless postmortem with concrete actions.',
      ],
      comments: [{ author: 'ivan', body: 'Dashboards and breakdowns available in the observability console (Staging → production, read-only).' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'I1',
      title: 'Instant transfers over €1,000 from the Android 5.1 app return a 500 error',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'active incident in production',
      explanation: 'The Android 5.1 app sends the amount in local format ("1.250,00") only from €1,000 upward, and the new engine can\'t parse it.',
      technique: 'Observability + isolation: breakdown by operation → OS → version → amount, and exact reproduction on staging.',
      repro: { groups: [['android'], ['1,000', '1000', 'over 1', 'more than 1', 'above 1', '1,250', '1250']], ask: 'It doesn\'t fail with small amounts. With which OS and which amount do you reproduce it?' },
      fix: { delay: 60, note: 'I normalized the amount in the new engine.' },
    },
    {
      id: 'I1b',
      title: 'Instant transfers from accounts opened before 2024 return a 500 error',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'active incident in production',
      explanation: 'Old accounts don\'t have the iban_country field, which the new engine takes for granted. Staging only had recent accounts.',
      technique: 'Observability + isolation by data type (account age) and reproduction with representative data.',
      repro: { groups: [['before 2024', 'old account', 'older', '2023', 'legacy', 'iban_country', 'prior to 2024']], ask: 'It doesn\'t fail with my test account. What do the affected accounts have in common?' },
      fix: { delay: 60, note: 'I added the default value for old accounts.' },
    },
  ],

  concepts: [
    { id: 'incident_response', title: 'Incident response', summary: 'Mitigate, communicate, diagnose, fix and learn, with clear roles. QA narrows down, reproduces and verifies.' },
    { id: 'observability', title: 'Observability', summary: 'Break metrics down by dimensions, filter what stands out and check the correlation in time before chasing a lead.' },
    { id: 'mitigation', title: 'Mitigation', summary: 'A flag switches off only what\'s affected, in minutes; a rollback is slower and takes the good parts with it. Never switch things off blindly.' },
    { id: 'postmortem', title: 'Blameless postmortem', summary: 'Timeline, impact, root cause, system factors and concrete actions; the system is changed, people aren\'t singled out.' },
    { id: 'shift_right', title: 'Shift-left and shift-right', summary: 'Catch it earlier (realistic tests and data) and limit the damage in production (per-version alerts, gradual rollout, flags).' },
    { id: 'confirmation_testing', title: 'Confirmation testing (re-test)', summary: 'The fix is verified with the exact combination that was failing before the feature is turned back on.' },
  ],
  debriefConcepts: ['incident_response', 'observability', 'mitigation', 'postmortem', 'shift_right'],
  seniorTips: [
    'Open the incident as soon as the alert fires: waiting to see if it goes down adds affected customers.',
    'Break it down by operation first: instant transfers stand out; turn off instant_fees_v2 and no other flag.',
    'Look at the change log: the flag was switched on at 100% at 8:55 a.m.; the 9:00 a.m. CPU spike happens every day.',
    'Keep breaking it down (OS, version, amount, account age) until you reach the exact condition and reproduce it on staging.',
    'Give Customer Support an honest message with a next update.',
    'In the postmortem: reproduced cause, system factors (test data, alert, 100% rollout) and actions, without blame.',
  ],
}
