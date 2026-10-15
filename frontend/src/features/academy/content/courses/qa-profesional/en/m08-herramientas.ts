import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m08LessonsEn } from './m08-lessons'
import { m08QuizEn } from './m08-quiz'
import { m08ScenesEn } from './m08-scenes'

/**
 * Course 2: Professional QA · Mission 8 — Tools (CTFL 6.1 and 6.2).
 * English version of m08-herramientas.ts (same structure, translated text only).
 */
export const m08HerramientasEn: Mission = {
  id: 'm08-herramientas',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 8,
  title: 'Tools',
  subtitle: 'Test tool categories, benefits and risks of test automation, evaluation and pilot.',
  world: kobaltoWorldEn,
  playerRole: 'QA on the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Thursday',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-tools',
  appLabel: 'Tools',
  hideBugList: true,
  initialMetrics: {},
  lessons: m08LessonsEn,
  mentor: 'laura',
  quiz: m08QuizEn,
  verdicts: {
    good: {
      title: 'Tools with judgment',
      body: "The squad adopts a tool that meets its needs, with a measurable pilot and realistic expectations. The quality process is complete.",
    },
    ok: {
      title: 'A good purchase, with fine print',
      body: 'The decision is reasonable, but some test automation risk will show. Check the debrief.',
    },
    bad: {
      title: 'Buying a demo',
      body: 'The choice was driven by the demo and by haste, not by needs. Replay the mission starting with classifying the needs.',
    },
  },

  briefing: {
    title: 'Thursday: tools',
    paragraphs: [
      'Management approves €20,000 a year for test tools for the Business squad. At 3:00 PM the committee decides what to spend it on.',
      'Three vendors gave demos this week, and Sergio, from QA Automation, is excited about one of them. In the "Tools" app you have the squad\'s needs and the candidates\' profiles.',
      "This is the course's final mission: at the end of the day, a squad retro on everything you've built.",
    ],
    goals: [
      "Classify each of the squad's needs by tool category.",
      'Identify the risks of each candidate: expectations, maintenance, lock-in, CI and learning curve.',
      'Choose the candidate for the pilot and define its scope and measurable success criteria.',
      'Stop the impulse purchase and defend the proposal at the committee.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: m08ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_herramientas',
      title: 'Test tool categories',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'tool_categories' }],
      body: `## Categories (CTFL 6.1)
- **Management**: process, requirements, tests, defects, configuration and traceability.
- **Static testing**: reviews and static code analysis.
- **Test design and implementation**: generating test cases, data and procedures.
- **Test execution and coverage**: running automated tests and measuring coverage.
- **Non-functional testing**: performance, load, security, usability…
- **DevOps**: the delivery pipeline, workflow tracking, automated builds, CI/CD.
- **Collaboration**: communication between roles and teams.
- Also: scalability and deployment standardization (virtual machines, containers) and any tool that helps with testing (a spreadsheet counts too).`,
    },
    {
      id: 'guia_automatizacion',
      title: 'Test automation: benefits, risks and adoption',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'automation_benefits' },
        { kind: 'unlock', conceptId: 'automation_risks' },
        { kind: 'unlock', conceptId: 'tool_pilot' },
      ],
      body: `## Benefits (CTFL 6.2)
- Time saved on repetitive tasks (regression, re-entering data, comparing results).
- Fewer human errors and greater consistency and repeatability.
- More objective assessment (coverage) and measures that would be hard to obtain manually.
- Easier access to test information for test management and reporting.
- Faster execution: earlier defect detection, feedback and time to market.
- More time to design new, deeper tests.

## Risks (CTFL 6.2)
- **Unrealistic expectations** about what the tool does.
- Misjudging the time, cost and effort of introducing it, maintaining the scripts and changing the process.
- Using it when manual testing is more appropriate.
- Over-relying on it and ignoring critical thinking.
- **Vendor dependency (lock-in)**: the vendor goes out of business, retires the tool, sells it or provides poor support.
- Abandoned open-source software, or software that demands frequent updates.
- **Incompatibility** with the development platform or the CI.
- Failing to meet regulatory or security requirements.

## Adoption (good practice)
Before rolling it out: a scoped **pilot**, with training and **measurable success criteria**, and a decision at the end. Total cost over several years, not just the license.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'P-CATEGORIA', title: 'An execution tool is bought and traceability is still in three Excel files', severity: 'medium', explanation: 'The choice was made without classifying the needs by tool category.', technique: 'Need → category → candidates.', preventedBy: 'needs.ok' },
    { id: 'P-RIESGOS', title: 'Nobody planned for training: the pilot stalls for two weeks', severity: 'medium', explanation: "Each candidate's risks were not evaluated.", technique: 'Evaluate maintenance, lock-in, integration and learning curve.', preventedBy: 'eval.ok' },
    { id: 'P-FRAGIL', title: 'Recorded scripts break with every UI change', severity: 'high', explanation: 'The choice was driven by the demo, without counting the maintenance cost.', technique: 'Total cost and test level (API vs. UI).', preventedBy: 'choice.ok' },
    { id: 'P-PILOTO', title: 'Squad-wide adoption without a pilot: nobody knows whether it worked', severity: 'high', explanation: 'Without a defined scope and measurable criteria, no decision is possible.', technique: 'Pilot with measurable success criteria and a decision date.', preventedBy: 'pilot.ok' },
    { id: 'P-PRISA', title: 'Three years of licenses were signed before evaluating', severity: 'high', explanation: 'The sign-today discount weighed more than the evaluation.', technique: 'Evaluate and pilot before committing budget.', preventedBy: 'sergio.aligned' },
    { id: 'P-EXPECTATIVAS', title: 'Management expected 100% automation in a month and cuts the budget', severity: 'critical', explanation: 'Unrealistic expectations about test automation.', technique: 'Gradual proposal, with explicit benefits and risks.', preventedBy: 'proposal.defended' },
  ],

  prevention: {
    title: 'Your tool strategy',
    intro: 'Each step of the selection prevents a specific problem in adoption.',
    preventedLabel: 'Problems you prevent',
    appearedLabel: 'Problems that will show up',
    rules: [
      { flag: 'needs.ok', label: 'Needs classified', explanation: 'Management, static testing, test design, execution, non-functional, DevOps and collaboration.' },
      { flag: 'eval.ok', label: 'Risks evaluated', explanation: 'TestForge: expectations and maintenance. QualiCloud: lock-in and CI. Kestrel: learning curve.' },
      { flag: 'choice.ok', label: 'Right candidate', explanation: 'Kestrel: API tests in the repo, integrated with the CI and license-free.' },
      { flag: 'pilot.ok', label: 'Measurable pilot', explanation: '4 weeks, invoice regression on every merge, less than 5% flaky and a self-sufficient team.' },
      { flag: 'sergio.aligned', label: 'Impulse purchase stopped', explanation: 'Sergio joins the pilot instead of signing today.' },
      { flag: 'proposal.defended', label: 'Proposal defended', explanation: 'Gradual adoption with realistic expectations.' },
    ],
  },

  concepts: [
    { id: 'tool_categories', title: 'Test tool categories', summary: 'Management, static testing, test design and implementation, test execution and coverage, non-functional testing, DevOps and collaboration. (CTFL 6.1)' },
    { id: 'automation_benefits', title: 'Benefits of test automation', summary: 'Savings on repetitive tasks, consistency, objective measures, faster feedback and more time to design tests. (CTFL 6.2)' },
    { id: 'automation_risks', title: 'Risks of test automation', summary: 'Unrealistic expectations, underestimated maintenance cost, over-reliance, vendor lock-in and incompatibility with the platform. (CTFL 6.2)' },
    { id: 'tool_pilot', title: 'Tool pilot', summary: 'Trying out the tool in a limited scope, with training and measurable success criteria, before rolling it out. Good adoption practice (not examinable in CTFL v4.0).' },
  ],
  debriefConcepts: ['tool_categories', 'automation_benefits', 'automation_risks', 'tool_pilot'],
  seniorTips: [
    'N1 management, N2 static testing, N3 test design and implementation, N4 test execution and coverage, N5 non-functional, N6 DevOps, N7 collaboration.',
    'TestForge: unrealistic expectations and maintenance. QualiCloud: vendor lock-in and no CI. Kestrel: learning curve.',
    '4-week pilot with Kestrel on the invoices API; criteria: CI in under 10 min, less than 5% flaky, self-sufficient team.',
    "A sign-today discount doesn't replace evaluation.",
    "Test automation doesn't replace exploratory testing or the team's judgment.",
  ],
}
