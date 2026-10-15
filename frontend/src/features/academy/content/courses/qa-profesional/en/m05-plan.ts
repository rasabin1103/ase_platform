import type { Mission } from '../../../../engine/types'
import { kobaltoWorldEn } from '../../../worlds/kobalto.en'
import { m05LessonsEn } from './m05-lessons'
import { m05QuizEn } from './m05-quiz'
import { m05ScenesEn } from './m05-scenes'

/**
 * Course 2: Professional QA · Mission 5 — The plan (CTFL 5.1 and 5.2).
 * English version of m05-plan.ts (same structure, translated text only).
 */
export const m05PlanEn: Mission = {
  id: 'm05-plan',
  courseKey: 'qa-profesional',
  lang: 'en',
  number: 5,
  title: 'The plan',
  subtitle: 'Test plan, entry and exit criteria, estimation, risks, prioritization and quadrants.',
  world: kobaltoWorldEn,
  playerRole: 'QA on the Business squad',
  dayStart: 9 * 60,
  dayLabel: 'Friday',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-plan',
  appLabel: 'Plan',
  hideBugList: true,
  initialMetrics: {},
  lessons: m05LessonsEn,
  mentor: 'laura',
  quiz: m05QuizEn,
  verdicts: {
    good: {
      title: 'A plan to decide with',
      body: 'Management approves the release with a scope adjusted to risk, and the team knows what to test, in what order and when to stop.',
    },
    ok: {
      title: 'Plan approved, with cracks',
      body: 'The plan got through the committee, but some piece of it will show in the sprints. Check the debrief.',
    },
    bad: {
      title: 'A paper plan',
      body: 'Without measurable criteria or a defensible estimate, the committee decided for you. Replay the mission starting with the estimation.',
    },
  },

  briefing: {
    title: 'Friday: the plan',
    paragraphs: [
      'Release 1.0 of Kobalto Business (accounts, team cards and recurring invoices) is decided today at 3:00 PM by the steering committee.',
      'Raúl needs your test plan and a defensible estimate. In the "Plan" app you have the planner: plan sections, risks, estimation, prioritization and quadrants.',
      'And be ready: committees always ask for it to be done in less time.',
    ],
    goals: [
      'Complete the plan: scope, approach and measurable entry and exit criteria.',
      'Separate product risks from project risks.',
      'Estimate with a historical ratio and with three-point estimation, and run Wideband Delphi with the team.',
      'Prioritize test cases by risk while respecting dependencies, and place the tests in the quadrants.',
      'At the committee, defend the estimate by negotiating scope or risk.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: m05ScenesEn,
  endSceneId: 'closing',

  docs: [
    {
      id: 'plantilla_plan',
      title: 'Test plan template',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_plan' },
        { kind: 'unlock', conceptId: 'entry_exit' },
      ],
      body: `## Typical content (CTFL 5.1.1)
- **Context**: scope (what is in and what is out), objectives and test basis.
- **Assumptions and constraints**.
- **Stakeholders**: roles and responsibilities.
- **Communication**: forms, frequency and templates.
- **Risk register**: product and project risks.
- **Test approach**: test levels, test types, test techniques, deliverables, entry and exit criteria, independence, metrics, data and environments.
- **Budget and schedule**.

## Entry and exit criteria (CTFL 5.1.3)
- **Entry**: preconditions for starting (resources, testware, initial quality level). E.g.: a stable build on staging.
- **Exit**: what must be achieved to declare it done (coverage, open defects, residual risk). They must be **measurable**.
- In Agile, the exit criteria are usually the "definition of done" and the entry criteria the "definition of ready".`,
    },
    {
      id: 'guia_estimacion',
      title: 'Estimation and risk guide',
      updatedLabel: 'Maintained by Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'estimation' },
        { kind: 'unlock', conceptId: 'risk_mgmt' },
      ],
      body: `## Estimation techniques (CTFL 5.1.4)
- **Ratio-based**: using historical data (e.g. testing = 40% of development effort).
- **Extrapolation**: based on early measurements from the project itself.
- **Wideband Delphi**: blind estimates; the outliers explain their reasoning and the round is repeated until estimates converge. Planning poker is a variant.
- **Three-point estimation**: E = (a + 4m + b) ÷ 6 and standard deviation = (b − a) ÷ 6.

## Risks (CTFL 5.2)
- **Product risks**: the quality of what is delivered (functionality, performance, security…).
- **Project risks**: management and control (deadlines, people, vendors, environments).
- Risk level = likelihood × impact. Responses: mitigate through testing, accept, transfer, or contingency plan.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'P-ALCANCE', title: "Half a week testing the mobile app, which belonged to another squad", severity: 'medium', explanation: "Without a scope that says what's in and what's out, everything gets tested.", technique: 'Explicit scope: in and out.', preventedBy: 'plan.scope' },
    { id: 'P-ENFOQUE', title: 'All tests manual and at the end: defects arrive late', severity: 'medium', explanation: 'Without a risk-based approach across test levels, everything piles up at the end.', technique: 'Approach based on risk, test levels and automation in CI.', preventedBy: 'plan.approach' },
    { id: 'P-ENTRADA', title: 'Testing starts without a stable build: three days lost', severity: 'medium', explanation: 'Without entry criteria, you test on a base that changes every hour.', technique: 'Concrete entry criteria.', preventedBy: 'plan.entry' },
    { id: 'P-SALIDA', title: 'Nobody knows when to stop: the release drags on arguing about whether it is ready', severity: 'high', explanation: 'Without measurable exit criteria, "done" is an opinion.', technique: 'Measurable exit criteria (coverage, defects, residual risk).', preventedBy: 'plan.exit' },
    { id: 'P-RIESGO', title: "Nobody manages the e-signature vendor's delay and it blocks the release", severity: 'high', explanation: 'A project risk treated as a product risk: someone tried to "test" it instead of managing it.', technique: 'Separate product risks from project risks.', preventedBy: 'plan.risks' },
    { id: 'P-PRIO', title: 'Card freezing is tested on the last day and there is no time left', severity: 'high', explanation: 'Without risk-based prioritization, the critical part was left until the end.', technique: 'Risk-based prioritization respecting dependencies.', preventedBy: 'prio.ok' },
    { id: 'P-CUAD', title: 'Nobody planned performance or security testing', severity: 'medium', explanation: "The quadrants help you not forget test types; without them, Q4 was left empty.", technique: 'Testing quadrants.', preventedBy: 'quad.ok' },
    { id: 'P-ESTIM', title: 'Sprint overflowing: half the time was accepted without touching the scope', severity: 'critical', explanation: 'Without a defended estimate, the cut fell on quality.', technique: 'Estimation with a method, and negotiation of scope or risk.', preventedBy: 'est.defended' },
  ],

  prevention: {
    title: 'Your plan',
    intro: "Each piece of the plan prevents a specific problem in the release's sprints.",
    preventedLabel: 'Problems the plan prevents',
    appearedLabel: 'Problems that will show up in the sprints',
    rules: [
      { flag: 'plan.scope', label: 'Explicit scope', explanation: "What's in and what's out." },
      { flag: 'plan.approach', label: 'Risk-based approach', explanation: 'Test levels, automation in CI, BDD, exploratory, performance and security testing.' },
      { flag: 'plan.entry', label: 'Entry criteria', explanation: 'Build on staging, stories with acceptance criteria, and data ready.' },
      { flag: 'plan.exit', label: 'Measurable exit criteria', explanation: 'High risk tested, no open critical defects, and branch coverage.' },
      { flag: 'plan.risks', label: 'Product and project risks separated', explanation: 'The vendor, the vacations and staging are project risks: they are managed, not tested.' },
      { flag: 'est.ok', label: 'Estimation with a method', explanation: 'Ratio: 50 × 0.4 = 20. Three-point: E = 20, SD = 4.' },
      { flag: 'delphi.ok', label: 'Wideband Delphi', explanation: 'The outliers explain and the round is repeated.' },
      { flag: 'prio.ok', label: 'Priority by risk and dependencies', explanation: 'Freezing and account opening first; e-signature and invoices after account opening; low-risk items last.' },
      { flag: 'quad.ok', label: 'Quadrants complete', explanation: 'Q1 unit and integration, Q2 BDD and prototypes, Q3 exploratory and UAT, Q4 performance and security.' },
      { flag: 'est.defended', label: 'Estimate defended at the committee', explanation: 'Scope was negotiated based on risk.' },
    ],
  },

  concepts: [
    { id: 'test_plan', title: 'Test plan', summary: 'Describes objectives, resources and processes: context, risks, approach, criteria, schedule. Used to communicate and to make decisions. (CTFL 5.1.1–5.1.2)' },
    { id: 'entry_exit', title: 'Entry and exit criteria', summary: 'Preconditions for starting and measurable conditions for finishing. In Agile, "definition of ready" and "definition of done". (CTFL 5.1.3)' },
    { id: 'estimation', title: 'Test estimation', summary: 'Ratio-based, extrapolation, Wideband Delphi and three-point estimation (E = (a + 4m + b) ÷ 6). (CTFL 5.1.4)' },
    { id: 'prioritization', title: 'Test case prioritization', summary: 'Risk-based, coverage-based or requirements-based, respecting dependencies. (CTFL 5.1.5)' },
    { id: 'quadrants', title: 'Test pyramid and testing quadrants', summary: 'The pyramid distributes automation across levels; the quadrants classify tests as business- or technology-facing and as supporting the team or critiquing the product. (CTFL 5.1.6–5.1.7)' },
    { id: 'risk_mgmt', title: 'Risk management', summary: 'Product and project risks; level = likelihood × impact; mitigate, accept, transfer or contingency plan. (CTFL 5.2)' },
  ],
  debriefConcepts: ['test_plan', 'entry_exit', 'estimation', 'prioritization', 'quadrants', 'risk_mgmt'],
  seniorTips: [
    'Scope with in and out; risk-based approach; entry with a stable build and data; measurable exit.',
    'Project risks: e-signature vendor, vacations and shared staging. Product risks: VAT, performance and frozen card.',
    'Ratio: 50 × 0.4 = 20. Three-point: (12 + 72 + 36) ÷ 6 = 20; SD = (36 − 12) ÷ 6 = 4.',
    'In Delphi, have the outliers explain and repeat blind.',
    'Order: freezing (high), account opening (prerequisite), e-signature and invoices (high), and CSV and language last.',
    'At the committee: with half the time, cut scope based on risk or accept the risk in writing.',
  ],
}
