import type { Mission } from '../../../../engine/types'
import { RELEASE_BUG_SLOTS } from '../../../../apps/kobalto-release/releaseLogic'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m05LessonsEn } from './m05-lessons'
import { m05QuizEn } from './m05-quiz'
import { m05RiskEn } from './m05-risk'

/**
 * Course: Testing Fundamentals · Mission 5 — Release Friday (English).
 *
 * Friday. Version 5.1 is deployed at 7:00 p.m. if there's a GO at 4:00 p.m.
 * The manual regression takes longer than what's left of the day: you have to
 * choose by risk, find the critical bugs early, verify the fixes and defend a
 * recommendation with data.
 */
export const m05ReleaseEn: Mission = {
  id: 'm05-release',
  lang: 'en',
  courseKey: 'testing-fundamentals',
  number: 5,
  title: 'Release Friday',
  subtitle: 'Risk-based regression testing, exit criteria and a GO/NO-GO recommendation.',
  world: kobaltoWorldEn,
  playerRole: 'Junior QA',
  dayStart: 9 * 60,
  dayLabel: 'Friday',
  duration: 480,
  appActionCost: 10,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'diego',
  ticketPrefix: 'KOB',
  appId: 'kobalto-release',
  reportPriority: true,
  initialMetrics: { trust_laura: 0, trust_diego: 0, trust_marta: 0 },
  riskModel: m05RiskEn,
  lessons: m05LessonsEn,
  mentor: 'laura',
  quiz: m05QuizEn,
  bugSlots: RELEASE_BUG_SLOTS,
  verdicts: {
    good: {
      title: 'A release with sound judgment',
      body: 'Raúl says in the retro that your recommendation was the clearest he has ever received: what was tested, what wasn\'t and what risk remained. 5.1 ships with no surprises.',
    },
    ok: {
      title: 'Friday cleared',
      body: 'The release went ahead, but some risk area was left untested or the recommendation didn\'t have all the data. Check the debrief.',
    },
    bad: {
      title: 'A dangerous Friday',
      body: 'With little time, testing in order or without looking at what changed leaves the critical bugs for Monday. Replay the mission starting with the release notes.',
    },
  },

  briefing: {
    title: 'Friday: release 5.1',
    paragraphs: [
      'Version 5.1 of the app ships today at 7:00 p.m. if the team gives a GO at 4:00 p.m. It brings new fees on instant transfers, an updated authentication library, the Android card fix and a new interest tier.',
      'The manual regression in TestHub is 22 test cases and over 5 hours. There isn\'t time for everything: you\'ll have to choose by risk, and every test case takes its real time.',
      'At 4:00 p.m., Raúl (Engineering Manager) and Marta want your recommendation: GO, GO with conditions or NO-GO. With data.',
    ],
    goals: [
      'Read the release notes and prioritize by risk (Design → Risks).',
      'Run the regression for the highest-risk areas first to find the critical bugs early.',
      'Report with severity and priority, and verify the fixes on the new build.',
      'Investigate the red continuous integration test before blocking anything.',
      'At 4:00 p.m., defend a recommendation with what was tested, what wasn\'t and the risks.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'tickets' }, { tool: 'design' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'logs' }],

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Release Friday 🚀',
      body: 'Good morning!\n\nToday **5.1** ships. At 4:00 p.m. we have the **GO/NO-GO** with Raúl and Marta.\n\nThe manual regression in TestHub (Staging) is **22 test cases and about 5.5 hours**. There isn\'t time for everything, so:\n- Read the **release notes** (wiki): what changes, what gets fixed and which dependencies are updated.\n- Prioritize in **Design → Risks**.\n- Run the riskiest things first: if there\'s a critical bug, the sooner we find it, the more margin Diego will have.\n- Also check the **exit criteria** in the wiki.\n\nLaura',
    },
    {
      id: 'mail_raul',
      channel: 'email',
      from: 'raul',
      at: 0,
      subject: 'GO/NO-GO 5.1 at 4:00 p.m.',
      body: 'Hi,\n\nAt 4:00 p.m. I need your recommendation for 5.1. I don\'t need you to have tested everything: I need to know **what risk we\'re taking on** if it ships today.\n\nThe partner bank starts the instant transfers campaign on Monday, so there\'s pressure, but not at any price.\n\nRaúl Ortega · Engineering Manager',
    },
    {
      id: 'daily',
      channel: 'meeting',
      from: 'laura',
      with: ['diego', 'marta'],
      at: 30,
      subject: 'Daily · Payments team',
      body: '**Marta:** The instant transfers campaign starts on Monday. 5.1 has to ship today no matter what 🙏\n\n**Diego:** On my side everything is done and has unit tests.\n\n**Laura:** How are you going to organize the regression?',
      choices: [
        {
          id: 'risk',
          text: 'By risk: first what changes and is critical (instant transfers, authentication and the cards fix), then whatever shares dependencies with what changed. At 4:00 p.m. I\'ll say what\'s tested, what isn\'t and what risk remains.',
          cost: 10,
          reply: 'Perfect. Let me know as soon as you see something serious, don\'t wait until 4:00.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'risk_based' },
            { kind: 'note', tone: 'good', text: 'You organized the regression by risk and committed to reporting what wasn\'t tested.' },
          ],
        },
        {
          id: 'in_order',
          text: 'I\'ll run the 22 test cases in order, from TC-01 to TC-22, as far as I get.',
          cost: 10,
          reply: 'Careful: in order, the important stuff may end up last… with no time left.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You proposed running the regression in order instead of by risk.' },
          ],
        },
        {
          id: 'sign',
          text: 'If Diego has unit tests and it\'s urgent, we can give the GO now.',
          cost: 10,
          reply: 'Unit tests don\'t test the app end to end. Better to look at it at 4:00 with data.',
          replyFrom: 'laura',
          effects: [
            { kind: 'score', key: 'rigor', add: -1 },
            { kind: 'score', key: 'risk', add: -1 },
            { kind: 'note', tone: 'bad', text: 'You proposed giving a GO without regression because of the campaign pressure.' },
          ],
        },
      ],
    },
    {
      id: 'ci_red',
      channel: 'chat',
      from: 'ivan',
      at: 50,
      body: '🔴 Continuous integration for build 5.1 has **1 red test**: test_export_csv_timeout. Do we block the release?',
      choices: [
        {
          id: 'investigate',
          text: 'Before deciding, I\'ll rerun it and look at its history in TestHub. If it\'s flaky, it doesn\'t block, but we open a task to stabilize it.',
          cost: 3,
          reply: '👍 The rerun button is in TestHub for you.',
          effects: [
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'unlock', conceptId: 'flaky_tests' },
            { kind: 'flag', key: 'ci.investigate' },
            { kind: 'note', tone: 'good', text: 'You investigated the red test before blocking the release.' },
          ],
        },
        {
          id: 'block',
          text: 'Yes, we block: red is red.',
          cost: 2,
          reply: 'Hmm, that test fails every now and then for no reason… are you sure?',
          effects: [
            { kind: 'score', key: 'efficiency', add: -1 },
            { kind: 'unlock', conceptId: 'flaky_tests' },
            { kind: 'note', tone: 'bad', text: 'You were about to block the release over a test without checking whether it was flaky.' },
          ],
        },
        {
          id: 'ignore',
          text: 'That one always fails, ignore it.',
          cost: 1,
          reply: 'OK… although if nobody looks at it, one day a real failure will slip through.',
          effects: [
            { kind: 'unlock', conceptId: 'flaky_tests' },
            { kind: 'note', tone: 'neutral', text: 'You ignored the red test without checking it or asking for it to be stabilized.' },
          ],
        },
      ],
    },
    {
      id: 'raul_status',
      channel: 'chat',
      from: 'raul',
      at: 210,
      body: 'How are we doing with 5.1? Anything I should worry about?',
      choices: [
        {
          id: 'data',
          text: 'Here\'s the status: test cases run in the highest-risk areas, bugs found with their severity and priority, and what I still have to test before 4:00 p.m.',
          cost: 5,
          reply: 'Now that\'s helpful. If there\'s anything critical, I\'d rather know now.',
          effects: [
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'You gave Raúl a midday status update with data.' },
          ],
        },
        {
          id: 'all_good',
          text: 'All good so far 👍',
          cost: 1,
          reply: 'Great!',
          effects: [
            {
              kind: 'if',
              when: { kind: 'bugTriggered', severity: 'critical' },
              then: [
                { kind: 'score', key: 'communication', add: -2 },
                { kind: 'note', tone: 'bad', text: 'You said "all good" at midday with a critical bug already found: bad news, early.' },
              ],
              else: [{ kind: 'note', tone: 'neutral', text: 'You answered "all good" without data: how much had you tested?' }],
            },
          ],
        },
      ],
    },
    {
      id: 'laura_hint',
      channel: 'chat',
      from: 'laura',
      at: 270,
      when: { kind: 'reportsLt', value: 1 },
      body: 'How\'s it going? Hint: in the release notes there\'s a technical line that looks harmless: "date library update". Which areas use dates? And don\'t leave authentication for the end.',
      onDeliver: [{ kind: 'unlock', conceptId: 'regression_selection' }],
    },
    {
      id: 'laura_critical',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'bugReported', severity: 'critical' },
      body: 'You\'ve reported a critical bug 🚨 Tell Raúl and Marta now, don\'t wait for the GO/NO-GO. When Diego pushes the fix, verify it on the new build as soon as possible.',
      onDeliver: [{ kind: 'unlock', conceptId: 'exit_criteria' }],
    },
    {
      id: 'laura_regression',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'fix.deployed' },
      body: 'New build on staging 🔧 What you ran before is stale for whatever has changed: re-test the failure and repeat what\'s nearby (if they touch fees, the standard transfer too).',
      onDeliver: [
        { kind: 'unlock', conceptId: 'confirmation_testing' },
        { kind: 'unlock', conceptId: 'regression' },
      ],
    },
    {
      id: 'go_nogo',
      channel: 'meeting',
      from: 'raul',
      with: ['marta', 'laura'],
      at: 420,
      subject: '4:00 p.m. · GO/NO-GO for 5.1',
      body: '**Raúl:** Let\'s get to the point. Does 5.1 ship today at 7:00 p.m.? What\'s your recommendation?',
      choices: [
        {
          id: 'go_verified',
          text: 'GO. The critical bug we found is fixed and verified on the final build, and I\'ve repeated the regression for the highest-risk areas. The remaining medium bugs are documented as known risks, with a plan for the next sprint.',
          requires: { kind: 'bugVerified', severity: 'critical' },
          cost: 20,
          reply: 'Crystal clear. It ships today. Thanks.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 2 },
            { kind: 'unlock', conceptId: 'go_nogo' },
            { kind: 'flag', key: 'release.go_safe' },
            { kind: 'note', tone: 'good', text: 'You recommended GO with the critical bug fixed and verified, and the residual risks documented.' },
          ],
        },
        {
          id: 'nogo_critical',
          text: 'NO-GO as it stands: there\'s an open critical bug in access and session, with no verified fix. Proposal: ship 5.1 today without the authentication update (go back to the previous library) or release it on Monday with the fix verified.',
          requires: { kind: 'all', of: [{ kind: 'bugTriggered', severity: 'critical' }, { kind: 'not', of: { kind: 'bugVerified', severity: 'critical' } }] },
          cost: 20,
          reply: 'It hurts, but it\'s the right call. We\'ll go with the alternative without the new library.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: 2 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'unlock', conceptId: 'go_nogo' },
            { kind: 'flag', key: 'release.nogo_safe' },
            { kind: 'note', tone: 'good', text: 'You recommended NO-GO because of an unverified critical bug and proposed an alternative so the campaign isn\'t blocked.' },
          ],
        },
        {
          id: 'go_blind',
          text: 'GO: everything I\'ve tested has passed or has minor bugs.',
          requires: { kind: 'not', of: { kind: 'bugTriggered', severity: 'critical' } },
          cost: 20,
          reply: 'And authentication? That was the area with the new library… Well, if you say so, it ships.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'risk', add: -2 },
            { kind: 'unlock', conceptId: 'go_nogo' },
            { kind: 'flag', key: 'release.go_blind' },
            { kind: 'note', tone: 'bad', text: 'You gave a GO without finding the critical bug in access and session: on Monday it blows up in production.' },
          ],
        },
        {
          id: 'nogo_time',
          text: 'NO-GO: I didn\'t have time to test everything.',
          cost: 20,
          reply: 'There\'s never time to test everything. What concrete risk do you see? Without that I can\'t decide.',
          replyFrom: 'raul',
          effects: [
            { kind: 'score', key: 'communication', add: -1 },
            { kind: 'unlock', conceptId: 'go_nogo' },
            { kind: 'note', tone: 'bad', text: 'You recommended NO-GO without a concrete risk: "there wasn\'t time" doesn\'t help anyone decide.' },
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
      body: '**Laura:** A full week. What are you taking away from today?',
      choices: [
        {
          id: 'lesson',
          text: 'That with little time, risk decides what gets tested; that what doesn\'t change can also break because of a dependency; and that a release recommendation is defended with what was tested, what wasn\'t and the risks that remain.',
          requires: { kind: 'reportsGte', value: 2 },
          reply: 'Exactly. That\'s the difference between running test cases and doing QA.',
          effects: [{ kind: 'score', key: 'communication', add: 2 }, { kind: 'endMission' }],
        },
        {
          id: 'more_time',
          text: 'That we need more time to test before each release.',
          reply: 'We\'ll always want more time. The key is using the time we have well.',
          effects: [
            { kind: 'note', tone: 'neutral', text: 'You took away "more time" instead of "prioritize better".' },
            { kind: 'endMission' },
          ],
        },
        {
          id: 'little',
          text: 'Honestly, it got on top of me.',
          reply: 'Release Fridays get on top of everyone. Next time, we start with the release notes.',
          effects: [{ kind: 'score', key: 'efficiency', add: -1 }, { kind: 'endMission' }],
        },
      ],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'notas',
      title: 'Release notes 5.1',
      updatedLabel: 'Published yesterday by Diego Ruiz',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'risk_based' },
        { kind: 'flag', key: 'notes.read' },
      ],
      body: `## What's new
- **Instant transfers**: new fee engine (€0.25 per instant transfer, up to €1,000; above that, the app offers to send it as a standard transfer). Basis for Monday's campaign.
- **Loans**: the nominal interest rate of the top tier drops to **5.75%** (from €10,000, inclusive). Risk has updated its table of examples.

## Fixes
- **Cards**: freezing the card on Android now blocks purchases (beta bug).

## Technical changes
- Updated the **authentication library** (fingerprint, Face ID and session management) to version 7.
- Updated the shared **date library** (calendar and due date calculations).
- New onboarding texts.

## No changes
- Payments (Kobalto Pay), transaction export and notifications.`,
    },
    {
      id: 'criterios',
      title: 'Release exit criteria',
      updatedLabel: 'Agreed by the team · v3',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'exit_criteria' },
        { kind: 'flag', key: 'exit.read' },
      ],
      body: `## To recommend GO
- **No critical bug** open without a verified fix on the final build (or the affected feature left out of the release).
- Open **high** bugs have a plan agreed with product.
- Regression of the **high-risk** areas executed on the **final build**.
- Continuous integration failures **explained** (real failure or flaky test).
- **What wasn't tested and the known risks**, documented in the recommendation.

## The recommendation
QA recommends ("GO", "GO with conditions" or "NO-GO until…"); Raúl decides with product. The recommendation includes what was tested, what wasn't, the open bugs and their plan.`,
    },
  ],

  tickets: [
    {
      id: 'REL-5.1',
      title: 'App release 5.1: regression and GO/NO-GO',
      status: 'In regression',
      type: 'story',
      description: 'Deployment planned for today at 7:00 p.m. Manual regression in TestHub (22 test cases). Release notes and exit criteria in the wiki.',
      acceptanceCriteria: [
        'The regression of the high-risk areas has been executed on the final build.',
        'There are no open critical bugs without a verified fix.',
        'The continuous integration failures are explained.',
        'The GO/NO-GO recommendation includes what was tested, what wasn\'t and the known risks.',
      ],
      comments: [
        { author: 'diego', body: 'All done and with unit tests ✅' },
        { author: 'marta', body: 'On Monday the instant transfers campaign starts with the partner bank 🙏' },
      ],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'R1',
      title: 'Instant transfers charge €0.50 instead of €0.25',
      severity: 'high',
      priority: 'p1',
      priorityWhy: 'the instant transfers campaign starts on Monday',
      explanation: 'The new engine adds the old fee and the new one: each instant transfer charges double.',
      technique: 'Risk-based regression testing: the area with new code that charges money goes first.',
      fix: { delay: 50, regression: 'R-R1', note: 'I fixed the fee calculation.' },
    },
    {
      id: 'R1b',
      title: 'An instant transfer above €1,000 is sent as a standard transfer without warning',
      severity: 'high',
      priority: 'p1',
      priorityWhy: 'the instant transfers campaign starts on Monday',
      explanation: 'Above the limit, the engine switches to standard but the app shows "Instant transfer sent": the money arrives days later without the customer knowing.',
      technique: 'Risk + boundary values: the €1,000 limit of the new feature.',
      fix: { delay: 50, regression: 'R-R1', note: 'I fixed how the engine chooses the transfer type.' },
    },
    {
      id: 'R-R1',
      title: 'Regression: after the instant transfer fix, the standard transfer charges €0.25',
      severity: 'medium',
      priority: 'p1',
      priorityWhy: 'it charges every customer a fee that doesn\'t exist',
      regression: true,
      explanation: 'The fix applies the instant transfer fee to any SEPA transfer.',
      technique: 'Regression after a fix: repeat what\'s close to the changed code (the standard transfer).',
    },
    {
      id: 'R2',
      title: 'Fingerprint login fails on Android 15',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'it blocks access for Android customers using fingerprint',
      explanation: 'Authentication library 7 changes the Android biometric API: the fingerprint returns "Authentication error (-1)".',
      technique: 'Risk of an updated dependency: test every access method after updating the library.',
      fix: { delay: 90, note: 'I adapted the biometric call to version 7.' },
    },
    {
      id: 'R2b',
      title: 'The session doesn\'t expire after 5 minutes of inactivity',
      severity: 'critical',
      priority: 'p1',
      priorityWhy: 'security risk: anyone with the unlocked phone can make transactions',
      explanation: 'Library 7 disables the timeout if it doesn\'t receive a new parameter, and the app doesn\'t send it: the session never expires.',
      technique: 'Risk of an updated dependency: also test non-functional aspects (session security).',
      fix: { delay: 60, note: 'I fixed the session configuration for library 7.' },
    },
    {
      id: 'R3',
      title: 'The new 5.75% nominal rate isn\'t applied to exactly €10,000',
      severity: 'medium',
      priority: 'p2',
      priorityWhy: 'it affects a narrow band; it can go in a patch next week if there\'s no time',
      explanation: 'When the rate was changed, the threshold was rewritten as "greater than" €10,000.',
      technique: 'Boundary values on a changed parameter: 9,900, 10,000 and Risk\'s table.',
      fix: { delay: 40 },
    },
    {
      id: 'R4',
      title: 'After the freeze fix, unfreezing on Android doesn\'t work',
      severity: 'high',
      priority: 'p1',
      priorityWhy: 'Android customers who freeze their card won\'t be able to pay again',
      explanation: 'The beta fix changed the freeze field, but unfreezing on Android still uses the old one.',
      technique: 'Regression around a fix: if freezing is fixed, unfreezing gets tested.',
      fix: { delay: 50 },
    },
    {
      id: 'R5',
      title: 'Monthly scheduled transfers on the 31st skip short months',
      severity: 'medium',
      priority: 'p2',
      priorityWhy: 'it affects few series and the next run is at the end of the month',
      explanation: 'The new date library changes how a month is added to the 31st: November disappears from the calendar.',
      technique: 'Indirect risk: an unchanged area that uses an updated dependency.',
      fix: { delay: 60 },
    },
  ],

  concepts: [
    { id: 'risk_based', title: 'Risk-based regression testing', summary: 'With little time, risk (likelihood × impact) decides the order; likelihood is driven by what has changed.' },
    { id: 'regression_selection', title: 'Which regression tests to run', summary: 'Changes, fixes, shared dependencies and failure history: what doesn\'t change can break too.' },
    { id: 'exit_criteria', title: 'Exit criteria', summary: 'Agreed conditions for releasing: critical bugs with verified fixes, high-risk regression on the final build and documented risks.' },
    { id: 'go_nogo', title: 'GO/NO-GO recommendation', summary: 'QA recommends with data (tested, not tested, bugs and plan, residual risks); the team decides with the business.' },
    { id: 'flaky_tests', title: 'Flaky tests', summary: 'A test that fails and passes with no changes doesn\'t block, but it\'s flagged and stabilized; check its history before deciding.' },
    { id: 'confirmation_testing', title: 'Confirmation testing (re-test)', summary: 'Verify the fix on the new build, and as soon as possible: a late critical bug leaves the release with no margin.' },
    { id: 'regression', title: 'Regression testing', summary: 'After every new build, previous results are stale for whatever has changed; repeat what\'s close to the fix.' },
  ],
  debriefConcepts: ['risk_based', 'regression_selection', 'exit_criteria', 'go_nogo', 'flaky_tests'],
  seniorTips: [
    'Before running anything, read the release notes and the exit criteria, and prioritize in the risk matrix.',
    'Start with access and session and with instant transfers: new code or dependencies that can block everyone.',
    'After a beta fix, test the opposite: if they fix freezing, test unfreezing.',
    'The updated date library puts scheduled transfers at risk even though they haven\'t changed.',
    'Rerun the red test and look at its history before blocking: it was flaky.',
    'At 4:00 p.m.: what was tested, what wasn\'t, the bugs with their plan and a clear recommendation. Bad news, sooner.',
  ],
}
