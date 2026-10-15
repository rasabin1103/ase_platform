import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m06LessonsEn } from './m06-lessons'
import { m06QuizEn } from './m06-quiz'
import { m06ScenesEn } from './m06-scenes'

/**
 * Course 2: Professional QA · Mission 6 — Numbers that count (CTFL 5.3 and 1.4).
 * English version of m06-metricas.ts (same structure, translated text only).
 */
export const m06MetricasEn: Mission = {
  id: 'm06-metricas',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 6,
  title: 'Numbers that count',
  subtitle: 'Metrics, test progress and completion reports, communicating status, test control and test completion.',
  world: kobaltoWorldEn,
  playerRole: 'QA on the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Wednesday',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-metrics',
  appLabel: 'Metrics',
  hideBugList: true,
  initialMetrics: {},
  lessons: m06LessonsEn,
  mentor: 'laura',
  quiz: m06QuizEn,
  verdicts: {
    good: {
      title: 'Numbers that count',
      body: "Management knows exactly where the release stands, the team knows what to do tomorrow, and the sprint closes by also reporting what didn't go well.",
    },
    ok: {
      title: 'Well measured, half told',
      body: 'The numbers were there, but some part of the monitoring or the closure will show. Check the debrief.',
    },
    bad: {
      title: 'Fake green',
      body: 'With volume metrics and a dressed-up status, management decided blind. Replay the mission starting with the dashboard readings.',
    },
  },

  briefing: {
    title: 'Wednesday: numbers that count',
    paragraphs: [
      'Halfway through sprint 3 of Kobalto Business. The committee approved the release plan and now it is time to show whether it is being met.',
      'At 12:00 PM Raúl needs a test progress report for management and, at the end of the day, the test completion report for the sprint. In the "Metrics" app you have the dashboard with the real data.',
      "Careful: some of the dashboard numbers look great… and don't tell the whole truth.",
    ],
    goals: [
      'Choose the metrics that help decision-making: progress against the plan, coverage, defects and residual risk.',
      'Spot the misleading readings on the dashboard.',
      'Write the test progress report for management and for the team.',
      'Decide on control actions: reprioritize, reopen, add resources or renegotiate.',
      'Close the sprint testing: exit criteria, open items, testware and lessons learned.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: m06ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_metricas',
      title: 'Test metrics guide',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_metrics' },
        { kind: 'unlock', conceptId: 'test_control' },
      ],
      body: `## Common metrics (CTFL 5.3.1)
- **Project progress**: tasks completed, effort and cost against plan.
- **Test progress**: test cases prepared and executed against the plan, passed and failed.
- **Product quality**: availability, response time, failures in production.
- **Defects**: open and closed by severity and priority, defect density, defect detection percentage.
- **Risk**: residual risk, i.e. what remains unmitigated.
- **Coverage**: requirements, stories, code.
- **Cost**: cost of testing, cost of quality.

## Dangerous readings
- A **% passed** without coverage behind it: 100% over half the requirements.
- **Closed defects** that were actually closed without verification ("cannot reproduce").
- **Zero defects** in a module nobody has tested.
- **Volume** (test cases, hours, bugs per person) instead of progress and risk.

## Control (CTFL 5.3)
Measuring is for correcting: reprioritize by risk, re-evaluate entry and exit criteria, adjust the schedule, add resources or renegotiate scope.`,
    },
    {
      id: 'plantilla_informes',
      title: 'Test report templates',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'progress_report' },
        { kind: 'unlock', conceptId: 'completion_report' },
        { kind: 'unlock', conceptId: 'test_closure' },
      ],
      body: `## Test progress report (CTFL 5.3.2)
Produced periodically (daily, weekly) during testing:
- reporting period and overall status;
- progress against the plan and deviations;
- impediments and how they are being resolved;
- relevant metrics;
- new or changed risks;
- what will be tested in the next period.

## Test completion report (CTFL 5.3.2)
At the end of a milestone, sprint or project:
- summary and evaluation of product quality;
- deviations from the plan and exit criteria;
- unresolved impediments and defects;
- final metrics and residual risk;
- archived testware and lessons learned.

## Audiences (CTFL 5.3.3)
Management needs status, risk and decisions; the team needs the detail to do the work. The form (conversation, dashboard, email, document) depends on the audience and on whether the team is distributed.

## Test completion (CTFL 1.4.1)
Check exit criteria, log open items, archive the testware, hand it over to the right people and gather lessons learned.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'P-VOLUMEN', title: 'Management receives "48 test cases and 26 defects" and doesn\'t know whether to ship', severity: 'medium', explanation: "Volume metrics: they don't say whether you'll make it or what risk remains.", technique: 'Progress against the plan, coverage, defects by severity and residual risk.', preventedBy: 'metrics.ok' },
    { id: 'P-VERDE', title: '100% of test cases passed hid 12 requirements with no tests', severity: 'high', explanation: 'A correct but incomplete metric was read as "all good".', technique: 'Cross-check the % passed against requirements coverage.', preventedBy: 'misleading.ok' },
    { id: 'P-NOREPRO', title: 'The 5 "cannot reproduce" defects show up again in production', severity: 'high', explanation: 'They were closed without verification so the chart would look good.', technique: 'Reopen and reproduce in the right environment before closing.', preventedBy: 'control.ok' },
    { id: 'P-AUDIENCIA', title: 'Management receives 30 pages of logs and the team just a traffic light', severity: 'medium', explanation: "The same report doesn't serve every audience.", technique: 'Executive report for management and actionable detail for the team.', preventedBy: 'report.audience' },
    { id: 'P-ESTADO', title: 'Management decides without a reliable status and stops trusting QA', severity: 'critical', explanation: "A green status that wasn't true fell apart in the demo.", technique: 'Communicate the real status with progress, coverage, defects and residual risk.', preventedBy: 'status.honest' },
    { id: 'P-TARJETAS', title: 'Cards, which are high risk, remain untested when the sprint closes', severity: 'critical', explanation: 'The delay was detected, but nobody corrected course.', technique: 'Control: reprioritize by risk and renegotiate scope.', preventedBy: 'control.defended' },
    { id: 'P-CIERRE', title: "Open defects get lost and the testware can't be reused", severity: 'medium', explanation: 'Without test completion activities, the next sprint starts blind.', technique: 'Test completion: exit criteria, open items logged, testware archived and lessons learned.', preventedBy: 'closure.ok' },
  ],

  prevention: {
    title: 'Your monitoring',
    intro: 'Each monitoring, control and completion decision prevents a specific problem in the release.',
    preventedLabel: 'Problems you prevent',
    appearedLabel: 'Problems that will show up',
    rules: [
      { flag: 'metrics.ok', label: 'Metrics that help decide', explanation: 'Progress against the plan, requirements coverage, defects by severity and residual risk.' },
      { flag: 'misleading.ok', label: 'Misleading readings spotted', explanation: '100% over 8 of 20 requirements, 5 closed without verification and 0 defects in an untested module.' },
      { flag: 'report.audience', label: 'One report per audience', explanation: 'Status, risk and decision for management; actionable detail for the team.' },
      { flag: 'control.ok', label: 'Coherent control actions', explanation: 'Reprioritize, reopen, add resources and renegotiate, without hiding data.' },
      { flag: 'status.honest', label: 'Real status communicated', explanation: 'Amber with a plan, not fake green.' },
      { flag: 'control.defended', label: 'Course corrected during monitoring', explanation: 'Cards first, and residual risk accepted in writing or scope moved.' },
      { flag: 'closure.ok', label: 'Complete test closure', explanation: 'Exit criteria, open items logged, testware archived and lessons learned.' },
    ],
  },

  concepts: [
    { id: 'test_metrics', title: 'Test metrics', summary: 'Project and test progress, product quality, defects, risk, coverage and cost. Useful if they help decision-making. (CTFL 5.3.1)' },
    { id: 'progress_report', title: 'Test progress report', summary: 'Periodic: status, progress against the plan, impediments, metrics, risks and next period. (CTFL 5.3.2)' },
    { id: 'completion_report', title: 'Test completion report', summary: 'At the end: quality evaluation, deviations, unresolved defects, residual risk and lessons learned. (CTFL 5.3.2)' },
    { id: 'status_comm', title: 'Communicating test status', summary: 'The form and level of detail depend on the audience: management decides, the team executes. (CTFL 5.3.3)' },
    { id: 'test_control', title: 'Test monitoring and control', summary: 'Monitoring: comparing actual against plan. Control: corrective actions such as reprioritizing, adjusting resources or renegotiating criteria. (CTFL 5.3)' },
    { id: 'test_closure', title: 'Test completion', summary: 'Check exit criteria, log open items, archive and hand over the testware, and gather lessons learned. (CTFL 1.4.1)' },
  ],
  debriefConcepts: ['test_metrics', 'progress_report', 'completion_report', 'status_comm', 'test_control', 'test_closure'],
  seniorTips: [
    'Metrics for the report: progress against the plan, requirements coverage, defects by severity and status, and residual risk.',
    'Misleading: 100% passed (only 8 of 20 requirements), 12 closed (5 without verification) and cards with 0 defects (0 test cases). Reliable: 40% vs. 50% and the critical one in invoices.',
    'Management: amber status, key figures, risk and the decision you need. Team: open items by owner, defects, blockers and priorities.',
    'Control: reprioritize, reopen, request an environment and support, and renegotiate. Never hide data or mark blocked tests as passed.',
    'Completion: exit criteria, open items logged, testware archived and lessons learned.',
  ],
}
