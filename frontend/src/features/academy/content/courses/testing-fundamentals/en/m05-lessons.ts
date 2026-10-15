import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (mission 5). Examples unrelated to the Kobalto release. */
export const m05LessonsEn: Lesson[] = [
  {
    id: 'risk_regression',
    question: 'I don\'t have time for the whole regression. What do I run?',
    conceptId: 'risk_based',
    cost: 5,
    body: `Prioritize by **risk = likelihood × impact**, and likelihood is driven above all by **what has changed**.

- Read the **release notes**: new code, fixes, parameters and updated **dependencies**.
- Start with what changed and is critical; continue with what **shares** parts with what changed.
- What didn't change and shares nothing can go last… or stay unexecuted, **as long as you say so**.`,
  },
  {
    id: 'dependencies',
    question: 'If an area doesn\'t change, can I skip it?',
    conceptId: 'regression_selection',
    cost: 5,
    body: `Not always. An updated **shared library** (dates, authentication, rounding) can break areas nobody has touched.

- Example: updating the PDF library in an e-commerce site can break the invoices, even though the team only changed the cart.
- Ask the team which dependencies have been updated and **who uses them**.
- History counts too: areas that have already failed tend to fail again.`,
  },
  {
    id: 'exit_criteria',
    question: 'When is it "tested enough"?',
    conceptId: 'exit_criteria',
    cost: 5,
    body: `It's never "all tested". That's why **exit criteria** are agreed before starting:

- No open critical or high bug without a plan (verified fix, flag turned off or explicit acceptance).
- Regression of the **high-risk** areas executed on the final build.
- Continuous integration failures **explained**.
- **Known risks** and what wasn't tested, documented.`,
  },
  {
    id: 'go_nogo',
    question: 'How do I defend a GO or a NO-GO?',
    conceptId: 'go_nogo',
    cost: 5,
    body: `QA **recommends with data**; the decision belongs to the team and the business. A good recommendation has:

- **What was tested** (and on which build) and **what wasn't**.
- **Open bugs** with their severity and plan.
- **Residual risks** and how to mitigate them: flag, gradual rollout, rollback, monitoring.
- A clear final sentence: "GO", "GO with conditions" or "NO-GO until…".

"I didn't have time to test everything" is not an argument: there's never time.`,
  },
  {
    id: 'flaky',
    question: 'Continuous integration has a red test. Do I block?',
    conceptId: 'flaky_tests',
    cost: 5,
    body: `First **investigate**: rerun it and look at its **history**. If it sometimes passes and sometimes fails with no changes, it's a **flaky** test.

- A flaky test doesn't block, but it isn't ignored either: flag it and open a task to stabilize it.
- If a test has failed consistently since a specific change, it's a **real failure**.
- A suite with many flaky tests loses value: the team stops looking at it.`,
  },
  {
    id: 'retest',
    question: 'They pushed a fix in the middle of the afternoon. What do I repeat?',
    conceptId: 'regression',
    cost: 5,
    body: `The **re-test** of the case that failed and the **nearby regression**: whatever touches the same code. If they fix the fee for instant transfers, repeat the standard one too.

- Every result from before the new build is **stale** for whatever has changed.
- That's why it pays to find the critical bugs **early**: a fix at 3:30 p.m. barely leaves time to verify it.`,
  },
]
