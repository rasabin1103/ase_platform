import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (mission 4). Examples unrelated to the cards app. */
export const m04LessonsEn: Lesson[] = [
  {
    id: 'anatomy',
    question: 'What makes a good defect report?',
    conceptId: 'bug_report',
    cost: 5,
    body: `A good report can be reproduced **without asking you anything**.

- **Title**: what fails, where and under which condition. "The cart empties its items when switching language on Android", not "the cart doesn't work".
- **Environment**: device, OS, app version, language, account type, build.
- **Minimal steps**, one per line, with the exact data.
- **Expected** (and where it comes from) and **actual**.
- **Evidence**: the screenshot or run that shows it; only what matters.
- **Severity** and **priority**, separately.`,
  },
  {
    id: 'isolate',
    question: 'The customer mentions several things at once. Which one is the cause?',
    conceptId: 'isolation',
    cost: 5,
    body: `**Isolate**: change **one condition at a time** and watch when the failure appears and disappears.

- Example: "On my tablet, with the app in French, paying with a coupon fails". Try without the coupon, then in Spanish, then on a phone… until a single condition turns it on and off.
- Whatever has no influence **doesn't go in the steps**: it only adds noise.
- A report with the exact condition saves the developer hours.`,
  },
  {
    id: 'severity_priority',
    question: 'Aren\'t severity and priority the same thing?',
    conceptId: 'severity_priority',
    cost: 5,
    body: `No. **Severity** = how much damage the failure does. **Priority** = when it has to be fixed. QA proposes the severity; the priority is decided with the business in **triage**.

- **Low severity, high priority**: a typo in the logo on the home page on launch day.
- **High severity, low priority**: a serious failure in a feature three customers use and that has a workaround.
- Don't inflate the severity to get something fixed sooner: if everything is critical, nothing is.`,
  },
  {
    id: 'environment',
    question: 'Why does it fail for me and not for the developer?',
    conceptId: 'environment',
    cost: 5,
    body: `It's almost always the **environment** or the **data**: another device, another language, another type of user, another sequence of steps or a specific date.

- Always write down the full environment, even if you think it doesn't matter.
- If the dev can't reproduce it, don't argue: **compare environments** and look for the difference.
- "It works on my machine" is a clue, not a verdict.`,
  },
  {
    id: 'not_a_bug',
    question: 'Is everything a customer says a bug?',
    conceptId: 'not_a_bug',
    cost: 5,
    body: `No. Before reporting, compare with the **specification**: many complaints are expected behavior the customer doesn't understand (a temporary hold at the bank, a legally required rounding, a business rule).

- If it works as defined, it's not a bug: help **Customer Support** with a clear explanation.
- If the behavior confuses many customers, propose an **improvement** (wording, a notice), not a bug.`,
  },
  {
    id: 'tone',
    question: 'How do I write so the developer doesn\'t take it badly?',
    conceptId: 'bug_report',
    cost: 5,
    body: `Describe **facts**, not people: "saving 1,000 stores €1", not "you broke the limit again".

- No adjectives ("horrible", "absurd"), no all caps, no blame.
- If the dev sends the report back, **complete it** with what they ask for: it's not an attack, they're just missing information.
- Thank them for the fix and verify it soon: trust is built in both directions.`,
  },
]
