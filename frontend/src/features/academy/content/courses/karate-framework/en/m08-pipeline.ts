import type { Mission } from '../../../../engine/types'
import { kobaltoApiWorldEn } from '../../../worlds/kobaltoApi.en'
import { m08LabEn } from './m08-lab'
import { m08LessonsEn } from './m08-lessons'
import { m08QuizEn } from './m08-quiz'
import { m08ScenesEn } from './m08-scenes'
import { API_REFERENCE_DOC_EN } from './shared'

/**
 * Course 3: Karate Framework · Mission 9 — Green in the pipeline.
 * English translation of ../m08-pipeline.ts (same structure and ids).
 */
export const m08PipelineEn: Mission = {
  id: 'm08-pipeline',
  courseKey: 'karate-framework',
  lang: 'en',
  number: 8,
  title: 'Green in the pipeline',
  subtitle: 'JUnit 5 runners, asserting on failures, @smoke tags, parallel(), own data, flaky tests and reports.',
  world: kobaltoApiWorldEn,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Thursday',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'Karate IDE',
  codeLab: m08LabEn,
  initialMetrics: {},
  lessons: m08LessonsEn,
  mentor: 'sergio',
  quiz: m08QuizEn,
  verdicts: {
    good: {
      title: 'Truly green',
      body: 'Your pipeline fails when something fails, gives a fast signal on every PR and is stable in parallel. And you could tell an unstable test from an API that breaks under concurrency.',
    },
    ok: {
      title: 'Green, most of the time',
      body: 'The pipeline got better, but there is still a green that is not green, a slow smoke or a test that fails sometimes. Check the debrief.',
    },
    bad: {
      title: 'Fake green',
      body: 'A pipeline that never fails, or fails at random, protects nothing. Replay the mission starting with the lesson “How do I make the pipeline fail when a test fails?”.',
    },
  },

  briefing: {
    title: 'Thursday: the pipeline',
    paragraphs: [
      'The nightly job came out green with red scenarios, and the balance test fails now and then since Sergio put the suite in parallel.',
      'The devs want a smoke on every pull request that takes seconds, and on Friday 1.7 goes to production with Finvo calling in parallel.',
      'Today you make green mean green: the runner, the tags, each scenario’s data and stability.',
    ],
    goals: [
      'At the stand-up, decide what to do with a test that fails sometimes.',
      'Make the nightly job break the build when something fails.',
      'Set up the PR smoke with @smoke, in under 3 s.',
      'Fix the balance test with its own data.',
      'Get three nights in a row with no test failures.',
      'Decide with data whether 1.7 goes to production on Friday.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m08ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'ci',
      title: 'Open API CI pipeline',
      updatedLabel: 'Maintained by Sergio Navas',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'runner' },
        { kind: 'flag', key: 'doc.ci' },
      ],
      body: `## Jobs
- **PR · smoke**: on every pull request. \`mvn test -Dtest=SmokeRunner\`. Budget: **under 3 s**. Only **@smoke** scenarios.
- **Nightly · regression**: every night at 02:00. \`mvn test -Dtest=OpenApiRunner\`. The whole suite (except @ignore), in **parallel**.
- The build is red if the JUnit test fails. Karate does not fail the test on its own: the runner has to check \`results.getFailCount()\`.

## Reports
- Karate HTML in target/karate-reports (published as a job artifact).
- \`.outputCucumberJson(true)\`: Cucumber JSON for Xray. \`.outputJunitXml(true)\`: JUnit XML.

## Sandbox data
- **POST /sandbox/accounts** { balance, currency } → **201** with a new test account (ACC-9001, ACC-9002…), active, only for that run.
- Use them for anything that checks exact balances: ACC-1001 is used by many tests at the same time.

## Balance rules (1.7)
- The balance is checked on **create** and again on **confirm**: a confirmation that exceeds the balance available at that moment gets **422 INSUFFICIENT_FUNDS**.
- Transfer ids are unique (TRF-…), also with simultaneous requests.`,
    },
    API_REFERENCE_DOC_EN,
  ],

  tickets: [
    {
      id: 'API-47',
      title: 'Reliable pipeline for the Open API',
      status: 'In progress',
      type: 'story',
      description: 'As a team, we want a pipeline whose green means the API works, so we can go to production with confidence.',
      acceptanceCriteria: ['The nightly job fails if a scenario fails.', 'Smoke on every PR in under 3 s.', 'Three nights in a row with no test failures before releasing.'],
      comments: [{ author: 'sergio', body: 'Nightly job in parallel with 4 threads since yesterday.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-SEQ',
      title: 'Two transfers created at the same time get the same id',
      severity: 'critical',
      explanation: 'The transfer id was generated from the time (with 25 ms resolution). With simultaneous requests, two transfers shared an id and the second overwrote the first: a customer could see or confirm someone else’s transfer.',
      technique: 'Repeated parallel runs with own data: the failure appears only under concurrency, and the scenario passes when run alone.',
      fix: { delay: 90, note: 'Ids now come from a database sequence. Deployed to sandbox.' },
      repro: { groups: [['parallel', 'simultaneous', 'same time', 'thread', 'concurren'], ['same id', 'id', 'overwrit', 'duplicat', '409']], ask: 'What was happening at the same time, and what did the two transfers have in common?' },
    },
    {
      id: 'KA-RESERVA',
      title: 'Confirming two pending transfers leaves the account negative',
      severity: 'high',
      explanation: 'The balance was only checked when creating the transfer: two pending transfers that together exceeded the balance were both confirmed and the account went negative.',
      technique: 'Own account with a known balance, two transfers that together exceed it, and confirm both (the second one: 422).',
      fix: { delay: 60, note: 'Confirm now checks the available balance. Deployed.' },
      repro: { groups: [['two', 'pending', 'second'], ['negative', '202', '422', 'balance']], ask: 'What balance did you start with, and what did the second confirmation return?' },
    },
  ],

  prevention: {
    title: 'Your challenges',
    intro: 'How the pipeline looked at the end of the day.',
    preventedLabel: 'Bugs prevented',
    appearedLabel: 'Bugs that appeared',
    rules: [
      { flag: 'reto.assert', label: 'The nightly job breaks the build', explanation: 'assertEquals(0, results.getFailCount(), results.getErrorMessages()).' },
      { flag: 'reto.smoke', label: 'PR smoke in seconds', explanation: '@smoke on the essentials and SmokeRunner with .tags("@smoke").' },
      { flag: 'reto.aislado', label: 'Own data', explanation: 'The balance test creates its account with POST /sandbox/accounts.' },
      { flag: 'reto.estable', label: 'Three nights in a row', explanation: 'Nightly job in parallel with no failures caused by the tests, three times.' },
      { flag: 'reto.reserva', label: 'Two pending, one balance', explanation: 'The second confirmation that exceeds the balance gets 422.' },
      { flag: 'reto.informe', label: 'Results in Xray', explanation: '.outputCucumberJson(true) in the nightly runner.' },
    ],
  },

  concepts: [
    { id: 'runner', title: 'Runners and the build', summary: 'Runner.path(…).tags(…).parallel(n) runs and returns results; the assert on getFailCount() is what fails the build. Tags to separate smoke and regression; Cucumber JSON and JUnit XML reports.' },
    { id: 'paralelo', title: 'Parallel runs and own data', summary: 'In parallel the order changes on every run: each scenario creates and checks only its own data.' },
    { id: 'flaky', title: 'Flaky tests', summary: 'They have a cause: shared data, fixed waits… or the application under concurrency. You investigate them; retrying until they pass hides it.' },
  ],
  debriefConcepts: ['runner', 'paralelo', 'flaky'],
  seniorTips: [
    'Read “Open API CI pipeline” in the wiki: jobs, smoke budget, test accounts and balance rules.',
    'OpenApiRunner: import static org.junit.jupiter.api.Assertions.*; and assertEquals(0, results.getFailCount(), results.getErrorMessages());',
    '@smoke on the three account scenarios, then launch the “PR · smoke” job.',
    'Balance with own data: POST /sandbox/accounts { balance: 100 }, transfer 10 from that account and expect available == 90.',
    'Launch the nightly job several times: whatever still fails sometimes with own data, check whether it is the API (repeated ids) and report it.',
    'Carmen: account with 100, two transfers of 80, confirm both → the second one gets 422.',
    'Alba: .outputCucumberJson(true) before .parallel(…).',
  ],
}
