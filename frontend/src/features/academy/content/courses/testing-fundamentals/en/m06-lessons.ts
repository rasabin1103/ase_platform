import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (mission 6). Examples unrelated to "Split an expense". */
export const m06LessonsEn: Lesson[] = [
  {
    id: 'pyramid',
    question: 'What is the test pyramid?',
    conceptId: 'test_pyramid',
    cost: 5,
    body: `A guide for distributing automation:

- **A wide base of unit tests**: fast (milliseconds), cheap and precise. They test the logic (calculations, validations, rules).
- **A middle layer of API / integration tests**: they test that the pieces talk to each other correctly and the server's rules (permissions, contracts).
- **A narrow tip of E2E tests**: a few complete journeys through the UI, the critical ones. They are slow and brittle.

If the pyramid is inverted (**ice cream cone**: many E2E tests and few unit tests), the suite takes forever, fails for no reason and the team stops looking at it.`,
  },
  {
    id: 'levels',
    question: 'How do I decide the level of a check?',
    conceptId: 'test_levels',
    cost: 5,
    body: `Ask yourself **where the rule lives**, and test it at the lowest level that can see it:

- A shipping cost calculation in an online store → **unit test** of the module that calculates it.
- That a customer can't see another customer's orders → **API**: the UI can hide the button, but the rule lives on the server.
- "Buy end to end" → **one E2E test**, not twenty.
- Anything that depends on time (expirations, reminders) → unit test with a **simulated clock**: no E2E test can wait three days.`,
  },
  {
    id: 'mocks',
    question: 'If each part has its tests and they pass, why does it fail when they\'re put together?',
    conceptId: 'contract_testing',
    cost: 5,
    body: `Because unit tests use **simulated data (mocks)**: each part honors **its own** idea of the agreement. If the app sends euros and the server expects cents, both suites pass… and the product fails.

- **Contract tests** (or integration tests) check the real format that travels between the parts.
- An E2E test would also catch it, but much later and at a higher cost.`,
  },
  {
    id: 'types',
    question: 'Besides the levels, what test types are there?',
    conceptId: 'test_types',
    cost: 5,
    body: `**Test levels** say *where* (component, integration, system, acceptance); **test types** say *which characteristic* is tested:

- **Functional**: does it do what it should?
- **Non-functional**: performance, security, usability, accessibility. They need their own test: an E2E test with 3 users says nothing about performance with 20.
- **Change-related**: confirmation testing and regression testing.`,
  },
  {
    id: 'manual',
    question: 'Are there things that aren\'t worth automating?',
    conceptId: 'exploratory',
    cost: 5,
    body: `Yes. Automation compares against a fixed expected result; some questions **need human judgment**:

- Is the screen understandable? Is the text clear? Is it truly accessible with a screen reader?
- For that, **exploratory testing** with a goal and a time box.
- Automate what's repetitive and stable; explore what's new and what depends on judgment.`,
  },
  {
    id: 'cost',
    question: 'Why does the suite\'s run time matter so much?',
    conceptId: 'test_pyramid',
    cost: 5,
    body: `Because the suite runs **on every change**. A 50-minute suite means nobody waits for the result before merging, and 20% intermittent failures means nobody believes the red.

- A common target: **minutes**, not hours, for the suite that gates a change.
- Slow things (performance, long E2E tests) go in **nightly** runs or before the release.`,
  },
]
