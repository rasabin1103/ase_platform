import type { Lesson } from '../../../../engine/types'

/** Laura’s micro-lessons (course 2 · mission 0). CTFL syllabus 1.4, 1.5 and 2.1. */
export const m00LessonsEn: Lesson[] = [
  {
    id: 'activities',
    question: 'What activities make up a test process? (CTFL 1.4.1)',
    conceptId: 'test_activities',
    cost: 5,
    body: `1. **Test planning**: objectives and approach.
2. **Test monitoring and control**: compare against the plan and correct course (continuous).
3. **Test analysis**: **what** to test? Prioritized test conditions.
4. **Test design**: **how** to test it? Test cases and coverage items.
5. **Test implementation**: test procedures, data, environment and scripts.
6. **Test execution**: run, compare and log; report defects.
7. **Test completion**: when a milestone ends, archive, evaluate and learn.

They can overlap, repeat across iterations or be informal, but they always exist. The **context** (risks, deadlines, lifecycle, team) decides how they are done.`,
  },
  {
    id: 'testware',
    question: 'What testware does each activity produce? (CTFL 1.4.3)',
    conceptId: 'testware',
    cost: 5,
    body: `- Test planning → **test plan** (plus schedule, risk register, entry and exit criteria).
- Test monitoring and control → **test progress reports**.
- Test analysis → prioritized **test conditions** (and sometimes defects in the test basis).
- Test design → **test cases** and coverage items.
- Test implementation → **test procedures**, **test data**, automated scripts and environment.
- Test execution → **test logs** and **defect reports**.
- Test completion → **test completion report** and lessons learned.`,
  },
  {
    id: 'roles',
    question: 'What does test management do, and what does the tester do? (CTFL 1.4.5)',
    conceptId: 'test_roles',
    cost: 5,
    body: `- **Test management**: responsible for the test process, the test team and leadership. Focuses on **test planning, test monitoring and control, and test completion**.
- **Testing**: responsible for the technical side. Focuses on **test analysis, design, implementation and execution**.

These are **roles**, not job titles: in an agile team, some of the management can be done by the team itself, and the same person can hold both roles.`,
  },
  {
    id: 'trace',
    question: 'What is traceability for? (CTFL 1.4.4)',
    conceptId: 'traceability',
    cost: 5,
    body: `Linking the test basis (stories, requirements, risks) with test conditions, test cases, results and defects lets you:

- measure **coverage** (which requirements are tested);
- know which requirements have **open defects**;
- analyze the **impact of a change** (which tests to rerun);
- provide **evidence** in audits;
- report progress in terms the business understands.`,
  },
  {
    id: 'team',
    question: 'Whole team or independent testers? (CTFL 1.5.2 and 1.5.3)',
    conceptId: 'independence',
    cost: 5,
    body: `**Whole team**: anyone with the necessary skills can perform any task, and quality belongs to everyone. QA collaborates with the business (acceptance) and with development (strategy and automation).

**Independence**: an independent tester finds different defects from the author’s because of their different biases. Levels: the author, a teammate, someone from another area, someone external.

They are not opposites: it is usually best to **combine** several levels (devs at component level, independent QA at system level). Risks of independence: isolation, and the author no longer feeling responsible for quality.`,
  },
  {
    id: 'sdlc',
    question: 'When does QA get involved in the lifecycle? (CTFL 2.1.2 and 2.1.5)',
    conceptId: 'sdlc_testing',
    cost: 5,
    body: `Good practices in any lifecycle:

- Every development activity has a corresponding **test activity**.
- Every test level has its own specific **objectives**.
- Test **analysis and design** start during the corresponding development phase.
- Testers take part in **reviewing drafts** as soon as they are available.

This is **early testing** (*shift-left*): the sooner a defect is found, the cheaper it is.`,
  },
]
