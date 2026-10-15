import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (mission 2), English version. Examples unrelated to the loan simulator. */
export const m02LessonsEn: Lesson[] = [
  {
    id: 'combinations',
    question: 'There are many variables: do I test every combination?',
    conceptId: 'combinatorial',
    cost: 5,
    body: `Impossible: 4 variables with 6 interesting values each make 1,296 combinations.

- **Valid baseline + one variable at a time**: fix a case that works and move only one variable across its partitions and boundaries. If it fails, you know exactly why.
- **Critical combinations separately**: rules that mix variables (e.g. «age + years with a licence» in car insurance) are tested at their own boundary.
- **Pairwise** testing: if you need more, cover every pair of values with far fewer test cases than all the combinations.`,
  },
  {
    id: 'oracle',
    question: 'How do I know what the correct result is?',
    conceptId: 'test_oracle',
    cost: 5,
    body: `You need an **oracle**: a reliable source of the expected result. Without one, «it looks odd to me» is your opinion against the developer's.

- The **specification or policy** (rules, formulas).
- **Validated examples** from people who know the business (a table of calculated cases).
- A **reference system** (the previous version, a reviewed spreadsheet).

In the defect report, always write the expected result **and where it comes from**.`,
  },
  {
    id: 'calculations',
    question: 'How do I test calculations and rounding?',
    conceptId: 'calculation_testing',
    cost: 5,
    body: `- Compare with the oracle **to the cent**: with money there is no «almost».
- Choose cases where rounding matters: values whose third decimal is 5 or more.
- Check **internal consistency**: total = monthly payment × number of payments? interest = total − amount?
- Test **band changes** (rates, taxes, fees) right at the threshold.

An unrelated example: 21% VAT on €9.99 is 2.0979 → €2.10, not €2.09.`,
  },
  {
    id: 'combined_rules',
    question: 'How do I test a rule that combines two variables?',
    conceptId: 'boundary_values',
    cost: 5,
    body: `Look for the **boundary of the combination**, not that of each variable.

An unrelated example: a car insurance policy requires «age + years with a licence ≥ 25». Key cases: 20 + 4 (24, outside), 20 + 5 (25, right on the boundary) and 20 + 6 (inside). Repeat with another combination that adds up to the same (18 + 7) to check that the rule really is the sum and not something else.`,
  },
  {
    id: 'random',
    question: 'Are tests with random data useful?',
    conceptId: 'random_vs_systematic',
    cost: 5,
    body: `They are useful for finding unexpected failures (*fuzzing*), but they **do not replace test design**.

A random value between 1 and 100,000 almost never lands on 17, 18, 70 or 10,000: exactly where the bugs are. Use them as a complement and always ask **what the automated tests cover** before accepting them.`,
  },
  {
    id: 'non_functional',
    question: 'The app is slow: is that QA\'s business?',
    conceptId: 'non_functional',
    cost: 5,
    body: `Yes: **performance** is quality, just like security or usability (non-functional testing).

But before opening a bug, **isolate the cause**: is it the system or the environment (a migration, the network, another team)? Note it as a risk, measure when the environment is stable and report with data (timings, conditions).`,
  },
]
