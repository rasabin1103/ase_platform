import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (course 2 · mission 5). CTFL syllabus 5.1 and 5.2. */
export const m05LessonsEn: Lesson[] = [
  {
    id: 'plan',
    question: 'What is a test plan for? (CTFL 5.1.1)',
    conceptId: 'test_plan',
    cost: 5,
    body: `It describes the **objectives, resources and processes** of testing. It is used to:

- document how testing will be done and how the objectives will be met;
- ensure that test activities meet the established criteria;
- **communicate** with the team and stakeholders;
- demonstrate that the test policy and test strategy are followed.

Typical content: context (scope, objectives), assumptions and constraints, stakeholders, communication, risk register, test approach, budget and schedule.`,
  },
  {
    id: 'criteria',
    question: 'What are entry and exit criteria? (CTFL 5.1.3)',
    conceptId: 'entry_exit',
    cost: 5,
    body: `- **Entry criteria**: preconditions for starting an activity. E.g.: a stable build on staging, stories with acceptance criteria, data available.
- **Exit criteria**: what must be achieved to declare it complete. E.g.: coverage achieved, no open critical defects, residual risk accepted.

They must be **measurable**. Running out of time or budget can also be a valid exit criterion, if stakeholders accept the risk of stopping. In Agile: **definition of ready** (entry) and **definition of done** (exit).`,
  },
  {
    id: 'estimation',
    question: 'Which estimation techniques are covered in the exam? (CTFL 5.1.4)',
    conceptId: 'estimation',
    cost: 5,
    body: `- **Ratio-based**: using the organization's historical data. E.g.: testing = 40% of development → 50 × 0.4 = 20.
- **Extrapolation**: measure early in the current project and extrapolate.
- **Wideband Delphi**: experts estimate blind; those at the extremes explain their reasoning and the process repeats until estimates converge. *Planning poker* is a variant.
- **Three-point estimation**: optimistic (a), most likely (m) and pessimistic (b). **E = (a + 4m + b) ÷ 6**; standard deviation **(b − a) ÷ 6**. E.g.: (12 + 4·18 + 36) ÷ 6 = 20 ± 4.`,
  },
  {
    id: 'priority',
    question: 'How is test case execution prioritized? (CTFL 5.1.5)',
    conceptId: 'prioritization',
    cost: 5,
    body: `Common strategies:
- **Risk-based**: highest risk first.
- **Coverage-based**: whatever adds the most coverage first.
- **Requirements-based**: according to requirement priority.

But **dependencies** must be respected: if a high-risk test case needs a medium-risk one, that one goes first. Resource availability (environments, people) also counts.`,
  },
  {
    id: 'quadrants',
    question: 'What are the test pyramid and the testing quadrants? (CTFL 5.1.6–5.1.7)',
    conceptId: 'quadrants',
    cost: 5,
    body: `**Test pyramid**: many small, fast, isolated tests at the base (unit) and few large, slow ones at the top (end-to-end).

**Testing quadrants** (Brian Marick):
- **Q1** · technology-facing, supporting the team: unit, component and integration tests.
- **Q2** · business-facing, supporting the team: functional tests, examples, story tests (BDD), prototypes.
- **Q3** · business-facing, critiquing the product: exploratory, usability, user acceptance testing.
- **Q4** · technology-facing, critiquing the product: performance, load, security and other non-functional tests.

They help you not forget test types when planning.`,
  },
  {
    id: 'risk',
    question: 'Product risk or project risk? (CTFL 5.2)',
    conceptId: 'risk_mgmt',
    cost: 5,
    body: `- **Product risk**: affects the **quality** of what is delivered (wrong calculations, slowness, security holes). It is mitigated **by testing**.
- **Project risk**: affects **management and control** (vendors running late, people unavailable, shared environments, deadlines). It is **managed**: contingency plans, transfer, accept.

Risk level = **likelihood × impact**. Risk analysis guides what to test, how thoroughly and in what order.`,
  },
]
