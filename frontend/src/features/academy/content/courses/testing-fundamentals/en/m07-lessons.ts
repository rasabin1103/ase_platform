import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (mission 7). Examples unrelated to the Kobalto incident. */
export const m07LessonsEn: Lesson[] = [
  {
    id: 'order',
    question: 'An incident fires. Where do I start?',
    conceptId: 'incident_response',
    cost: 5,
    body: `The order matters:

1. **Mitigate**: reduce the damage as soon as possible (turn off a flag, roll back, divert traffic). The root cause can wait; the customers can't.
2. **Communicate**: honest, frequent status updates to support, the business and customers.
3. **Diagnose** the root cause and **reproduce it**.
4. **Fix** and verify.
5. **Blameless postmortem**.

In an incident there is a **coordinator** (incident commander). QA contributes what it does best: narrowing down, reproducing and verifying.`,
  },
  {
    id: 'narrow',
    question: 'How do I find what is failing in production?',
    conceptId: 'observability',
    cost: 5,
    body: `With the data, just like when you isolated a condition: **break down** the error rate by one dimension (operation, version, OS, customer type…), **filter** what stands out and break it down again by another.

- Example: in an online store, 4% of payments fail. By payment method: only cards. By issuing bank: only one. By amount: only over €500.
- Always compare with what's "normal": a 0.3% rate may be the usual noise.
- **Correlation in time**: did it start at the same time as the change? A spike that happens every day at the same time isn't the cause.`,
  },
  {
    id: 'mitigate',
    question: 'Flag or rollback?',
    conceptId: 'mitigation',
    cost: 5,
    body: `- **Flag**: turns off only the affected feature, in minutes. It requires knowing which one it is.
- **Rollback**: goes back to the entire previous version. Slower, and it takes the good parts of the version down with it.
- Turning off flags **blindly** costs time and fixes nothing: narrow down the feature first.

That's why new things should ship behind a flag and with a **gradual rollout**: if they fail, the damage is small and they can be switched off quickly.`,
  },
  {
    id: 'communicate',
    question: 'What do I tell Customer Support if I don\'t know the cause yet?',
    conceptId: 'incident_response',
    cost: 5,
    body: `The truth, with what you know: **what is failing, who it affects, what customers should do and when there will be an update**.

- Example: "Some card payments over €500 have been failing since 10:00 a.m. Nothing has been charged. Advise customers to retry in an hour or use another method. Next update at 11:30 a.m."
- Never blame third parties without evidence or promise timelines you don't control.`,
  },
  {
    id: 'postmortem',
    question: 'What is a blameless postmortem?',
    conceptId: 'postmortem',
    cost: 5,
    body: `An analysis after the incident that looks for **what allowed the failure**, not **who** made the mistake. People act reasonably with the information they have; if the system let the error through, the system is what changes.

It contains: a **timeline**, the **impact**, the **root cause**, **contributing factors** (which test, alert or process was missing) and concrete **actions** with an owner and a date.`,
  },
  {
    id: 'shift',
    question: 'What are shift-left and shift-right?',
    conceptId: 'shift_right',
    cost: 5,
    body: `- **Shift-left**: finding problems earlier (reviewing requirements, contract tests, realistic test data).
- **Shift-right**: learning safely in production: monitoring and alerts per version, gradual rollout (*canary*), flags and synthetic tests.

A good postmortem usually proposes both: a test that would have caught it earlier and an alert or rollout that would have reduced the damage.`,
  },
]
