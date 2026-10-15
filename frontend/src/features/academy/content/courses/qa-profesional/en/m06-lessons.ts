import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (course 2 · mission 6). CTFL syllabus 5.3 and 1.4. */
export const m06LessonsEn: Lesson[] = [
  {
    id: 'metrics',
    question: 'Which metrics are used in testing? (CTFL 5.3.1)',
    conceptId: 'test_metrics',
    cost: 5,
    body: `Metrics show progress against the schedule and budget, the quality of the test object and the effectiveness of testing. The common ones:

- **project progress**: tasks, effort and cost;
- **test progress**: test cases prepared and executed against the plan, passed and failed;
- **product quality**: availability, response time, failures;
- **defects**: by severity, priority and status; density; detection percentage;
- **risk**: residual risk;
- **coverage**: of requirements, stories or code;
- **cost**: of testing and of quality.

A metric is useful if it helps you **decide**. Volume without context (test cases executed, bugs per person) doesn't help.`,
  },
  {
    id: 'misleading',
    question: 'When is a metric misleading?',
    conceptId: 'test_metrics',
    cost: 5,
    body: `Almost never because the number is false, but because it is **incomplete**:

- **100% of test cases passed** over a small part of the requirements;
- **closed defects** that were closed without verification;
- **zero defects** in a module nobody has tested.

Rule of thumb: cross-check every number against its context (coverage, how it was closed, how much has been tested) before reporting it.`,
  },
  {
    id: 'reports',
    question: 'What is the difference between a test progress report and a test completion report? (CTFL 5.3.2)',
    conceptId: 'progress_report',
    cost: 5,
    body: `- **Progress**: periodic, while testing is ongoing. Status, progress against the plan, impediments, metrics, new or changed risks and what is planned for the next period.
- **Completion**: at the end of a milestone, sprint or project. Summary, quality evaluation, deviations from the plan and the exit criteria, unresolved defects, residual risk, final metrics and lessons learned.

Both must also say what **didn't** go well.`,
  },
  {
    id: 'audience',
    question: 'How is test status communicated? (CTFL 5.3.3)',
    conceptId: 'status_comm',
    cost: 5,
    body: `It depends on the **audience** and the context:

- **management** needs status, risk and the decision being asked of them, at a glance;
- **the team** needs the detail to do the work: what's left, who's doing it, what's blocking.

Forms: verbal communication, dashboards (including CI/CD dashboards and team boards), electronic channels (email, chat), online documentation and formal reports. A single report rarely serves everyone.`,
  },
  {
    id: 'control',
    question: 'What is test control? (CTFL 5.3)',
    conceptId: 'test_control',
    cost: 5,
    body: `**Test monitoring** compares actual against plan. **Test control** uses that information to issue **directives** and correct course:

- reprioritize tests when a risk changes;
- re-evaluate whether entry or exit criteria are met;
- adjust the schedule;
- add resources where needed;
- renegotiate scope with stakeholders.

Hiding data or forcing numbers isn't control: it's losing the information you need to make decisions.`,
  },
  {
    id: 'closure',
    question: 'What happens during test completion? (CTFL 1.4.1)',
    conceptId: 'test_closure',
    cost: 5,
    body: `It happens at project milestones: the end of a release, an iteration or a test level.

- Check that the **exit criteria** are met and document deviations.
- Log **unresolved defects** as change requests or backlog items.
- **Archive** useful testware and hand it over to the right people (maintenance, other teams).
- Analyze **lessons learned** to improve the process.
- Produce the **test completion report** and communicate it.`,
  },
]
