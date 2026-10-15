import type { Lesson } from '../../../../engine/types'

/** Laura’s micro-lessons (course 2 · mission 3). CTFL syllabus 4.3 and 2.2.1. */
export const m03LessonsEn: Lesson[] = [
  {
    id: 'whitebox',
    question: 'What does white-box testing offer that black-box testing doesn’t? (CTFL 4.3.3)',
    conceptId: 'white_box',
    cost: 5,
    body: `**White-box** test techniques are based on the **internal structure** of the test object (the code).

- They measure how much of the code the suite has executed (**coverage**) and point out what nobody has tested.
- They can be applied even when the specification is vague or out of date.

Their big **weakness**: they don’t detect what is **missing**. If a requirement isn’t implemented, there is no code to cover. That’s why they are combined with black-box testing.`,
  },
  {
    id: 'statement',
    question: 'How is statement coverage calculated? (CTFL 4.3.1)',
    conceptId: 'statement_cov',
    cost: 5,
    body: `**Statement coverage = executed statements ÷ executable statements × 100.**

- At 100%, every statement has been executed at least once: if a line has a defect, some test has gone through it.
- But going through a defect **doesn’t guarantee triggering the failure** (it depends on the data) and, above all, someone has to **check the result**.
- It doesn’t guarantee testing all the decision logic: an IF without an ELSE may never have been tested with the condition false.`,
  },
  {
    id: 'branch',
    question: 'What does branch coverage add? (CTFL 4.3.2)',
    conceptId: 'branch_cov',
    cost: 5,
    body: `A **branch** is a transfer of control between two nodes in the control flow graph: every decision has a **true** branch and a **false** branch.

**Branch coverage = executed branches ÷ total branches × 100.**

- It also counts the false branch of an IF without an ELSE, which has no statements of its own.
- **100% branch coverage implies 100% statement coverage**; not the other way around.
- It is the coverage most often required for critical code.`,
  },
  {
    id: 'calc',
    question: 'How do I calculate the coverage of a set of test cases? (K3)',
    conceptId: 'branch_cov',
    cost: 5,
    body: `1. Number the **executable statements** and mark the **decisions**, each with its T and F branches.
2. For each test case, follow the path and note which statements and branches it exercises.
3. Combine everything the suite exercises and divide by the total.

Example: 11 statements, 3 decisions (6 branches). If the suite exercises all 11 statements and 5 branches: **100% statement coverage and 83% branch coverage**.`,
  },
  {
    id: 'limits',
    question: 'Why might 100% coverage detect nothing?',
    conceptId: 'coverage_limits',
    cost: 5,
    body: `Coverage measures what was **executed**, not what was **checked**:

- A test **without an assertion** executes code and always passes.
- An expected result **copied from what the code returns** turns the bug into “expected behavior.”
- The expected result comes from the **test oracle**: the specification, not the implementation.

Coverage is a good **indicator of what’s missing**, not a measure of the suite’s quality.`,
  },
  {
    id: 'component',
    question: 'What is component testing? (CTFL 2.2.1)',
    conceptId: 'component_testing',
    cost: 5,
    body: `It tests **components in isolation** (a function, a class, a module).

- It is usually written by **developers**, often with TDD and in the development environment.
- It sometimes needs simulators, *stubs* or *drivers* to isolate the component.
- It is the test level where **code coverage** is most used as a criterion.`,
  },
]
