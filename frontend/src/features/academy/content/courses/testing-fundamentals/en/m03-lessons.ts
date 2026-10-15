import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (mission 3). Examples unrelated to the payments console. */
export const m03LessonsEn: Lesson[] = [
  {
    id: 'states',
    question: 'How do you test something that has states?',
    conceptId: 'state_transition',
    cost: 5,
    body: `Draw the **state diagram**: boxes (states) and arrows (actions that lead from one to another). Think of an online order: "Received → Shipped → Delivered", and from "Received" also "Cancelled".

- **Valid transitions coverage**: every arrow, at least one test case (including the one nobody uses).
- **Check the resulting state**, not just that "there's no error".
- With the diagram in front of you, the missing arrows jump out.`,
  },
  {
    id: 'invalid',
    question: 'Why test what can\'t be done?',
    conceptId: 'invalid_transitions',
    cost: 5,
    body: `Because that's where the expensive bugs are. Build a **state table**: rows = states, columns = actions. Every cell without an arrow is an **invalid transition** that the system must reject without changing anything.

- Can a "cancelled" order be "delivered"? Can one already "delivered" be "shipped"?
- Hiding the button in the UI isn't enough: the API, another channel or a double click can still get there.
- Prioritize the invalid ones that **move money or data** and the **final states**: they should be final.`,
  },
  {
    id: 'decision_table',
    question: 'What is a decision table?',
    conceptId: 'decision_table',
    cost: 5,
    body: `A way to write rules that combine **conditions**. Example from a gym: "is a member?", "is it off-peak?" → price of the class.

- **Conditions** in rows (yes/no), **rules** in columns, **action** (outcome) at the bottom.
- Each **column is at least one test case**.
- Writing it forces you to see combinations nobody defined: asking questions is part of the technique.`,
  },
  {
    id: 'dont_care',
    question: 'The table has dashes (–). What do I test there?',
    conceptId: 'decision_table',
    cost: 5,
    body: `A dash means "**don't care**": the rule says that condition doesn't change the outcome. A column with two dashes hides **four combinations**.

- Test at least **one different combination for each dash** that matters for risk.
- The typical bug is the **order of the rules** in the code: a more general rule is evaluated first and "swallows" the one that should win.
- If a condition has a boundary (e.g. "up to 30 days"), combine it with **boundary values**: 30 and 31.`,
  },
  {
    id: 'sequences',
    question: 'Is it enough to test each transition once?',
    conceptId: 'switch_coverage',
    cost: 5,
    body: `Not always. Testing each arrow on its own is basic coverage (**0-switch**). Many bugs show up in **sequences**: two arrows in a row (**1-switch**) or a loop.

- Example from a library: "lend → return → lend" to the same member, or "renew" twice in a row.
- Sequences that **accumulate** something (amounts, counters, attempts) are the most dangerous: each step looks right but the sum doesn't.
- And the one that goes back: after "winning a dispute", does it return to the previous state or to a default one?`,
  },
  {
    id: 'test_data',
    question: 'How do I quickly get to a specific state?',
    conceptId: 'test_data',
    cost: 5,
    body: `Walking the whole path every time takes time. That's why teams have **test data generators** ("fixtures", "seeds") that create the object already in the state you need.

- Use them to **set up** the test case; the test is the action that comes after.
- But walk the real path at least once: a state created "by hand" may not be identical to the one reached for real.
- Write down which data you used: without it, the bug can't be reproduced.`,
  },
  {
    id: 'incidents',
    question: 'Where do I get test case ideas from?',
    conceptId: 'incident_learning',
    cost: 5,
    body: `Besides the specification: from **past incidents**. What already failed in production tends to come back in another shape.

- Ask Support, Operations or Risk what has hurt them lately.
- Turn each incident into a permanent **regression test case**.
- If an incident came from a legacy system, check it in the new one: bugs migrate along with the requirements.`,
  },
]
