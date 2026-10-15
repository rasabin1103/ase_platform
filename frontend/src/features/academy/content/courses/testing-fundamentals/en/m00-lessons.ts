import type { Lesson } from '../../../../engine/types'

/**
 * Laura's micro-lessons (mission 0), English version. They teach the
 * technique with examples outside Kobalto so the player applies it on their
 * own, without giving the bugs away.
 */
export const m00LessonsEn: Lesson[] = [
  {
    id: 'start',
    question: 'Where do I start testing a story?',
    conceptId: 'static_testing',
    cost: 5,
    body: `Before touching the app, **read the story and its acceptance criteria** as if you had to explain them to someone else.

- Highlight everything ambiguous: «valid», «correct», «the limits»… If you don't know exactly what it means, you won't know whether something is a bug.
- **Ask the PO** and write the answer down in the ticket. That is static testing: finding defects in the requirement, when fixing them costs almost nothing.
- Check whether the documentation is up to date: an old specification will make you report false bugs.
- Then **design your test cases**, and only then execute them.`,
  },
  {
    id: 'partitions',
    question: 'How do I choose which values to test?',
    conceptId: 'equivalence',
    cost: 5,
    body: `It is not about testing many values, but about testing **one from each group** the system should treat the same way: those are equivalence partitions.

Example: an «age» field that accepts 18 to 65 years.
- Valid partition: 18–65 → test 30.
- Invalid: under 18 (test 10), over 65 (test 80).
- And the ones nobody thinks of: 0, negatives, decimals, text, empty, other ways of writing it.

Also think about **how a real user types**: separators, spaces, capital letters, copy and paste.`,
  },
  {
    id: 'boundaries',
    question: 'What are boundary values?',
    conceptId: 'boundary_values',
    cost: 5,
    body: `Errors concentrate at the **edges** of the partitions, because that is where the developer chooses between «>» and «>=».

With the age from 18 to 65:
- Test **17, 18** (lower boundary) and **65, 66** (upper boundary).
- If there are decimals, the boundary is finer: 65.00 and 65.01.

For every limit you find in the criteria (amounts, lengths, daily totals…), test **right at the limit and just outside it**.`,
  },
  {
    id: 'bug_report',
    question: 'How do I write a good defect report?',
    conceptId: 'bug_anatomy',
    cost: 5,
    body: `A bug the developer cannot reproduce does not exist for the team.

- **Title**: what fails and where. «Transfers: X happens when doing Y», not «doesn't work».
- **Steps**: numbered, one per line, with the exact data you used.
- **Expected** and **actual**: according to the acceptance criterion, not your opinion.
- **Severity** according to the team's scale.
- **Evidence**: the execution or the log where it can be seen.`,
  },
  {
    id: 'severity',
    question: 'Severity or priority?',
    conceptId: 'severity_priority',
    cost: 5,
    body: `- **Severity**: the impact of the failure on the customer or the business. At a bank, anything that moves money incorrectly is critical.
- **Priority**: the urgency to fix it, decided by the team based on schedule and risk.

A typo on the home page on demo day can have low severity and high priority. You propose the severity with arguments; the priority is negotiated.`,
  },
  {
    id: 'risk',
    question: 'I don\'t have time to test everything, what do I do?',
    conceptId: 'risk_based',
    cost: 5,
    body: `Exhaustive testing is impossible, so you **prioritize by risk**: risk = **likelihood** of failure × **impact** if it fails.

- High likelihood: new or complex logic, validations with numbers, things «the dev tested locally».
- High impact: money, data, security, regulation, whatever is shown in the demo.

Start with what scores high on both and **say it out loud**: «today I cover X and Y; Z remains untested». Hiding what you haven't tested is worse than not testing it.`,
  },
  {
    id: 'retest',
    question: 'They tell me it\'s already fixed, what do I do?',
    conceptId: 'regression',
    cost: 5,
    body: `Two things, always on the **new build**:

1. **Re-test**: repeat exactly the test case that failed. If it still fails, reopen it with the new evidence.
2. **Regression**: also repeat the related test cases that **passed** before. A change in one validation can break the one next to it.

Never close a bug because «the dev says it's done». QA opens and QA closes.`,
  },
  {
    id: 'environments',
    question: 'Can I test in production?',
    conceptId: 'test_environments',
    cost: 5,
    body: `In general, **no**. That is what the development and **staging** (pre-production) environments are for.

In regulated sectors such as banking, a test transaction in production moves real money, is recorded in the audit trail and can affect customers. If staging goes down, flag it, use the time to design test cases or ask for an alternative environment.`,
  },
]
