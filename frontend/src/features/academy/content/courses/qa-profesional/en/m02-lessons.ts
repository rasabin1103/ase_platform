import type { Lesson } from '../../../../engine/types'

/** Laura’s micro-lessons (course 2 · mission 2). CTFL syllabus 2.1.3 and 4.5. */
export const m02LessonsEn: Lesson[] = [
  {
    id: 'test_first',
    question: 'What do TDD, ATDD and BDD have in common? (CTFL 2.1.3)',
    conceptId: 'test_first',
    cost: 5,
    body: `All three are **test-first** approaches: the tests are defined **before** the code.

- **TDD**: the developer writes a unit test, then the code. It guides the design of the code.
- **ATDD**: the team derives **acceptance** tests from the criteria before coding.
- **BDD**: behavior is expressed in natural language (Given/When/Then) that the business understands and that can be automated.

They apply the principle of **early testing** (shift-left), and the resulting tests are usually automated and kept as regression tests.`,
  },
  {
    id: 'three_c',
    question: 'What are the 3 Cs of a user story? (CTFL 4.5.1)',
    conceptId: 'user_story',
    cost: 5,
    body: `- **Card**: the medium of the story, a reminder. “As a… I want… so that…”.
- **Conversation**: how it will be used; the details come out by talking, not from the paper.
- **Confirmation**: the **acceptance criteria**.

Stories are written **collaboratively** (business, development and testing: the “three amigos”). A good story meets **INVEST**: independent, negotiable, valuable, estimable, small and testable.`,
  },
  {
    id: 'criteria',
    question: 'How are acceptance criteria written? (CTFL 4.5.2)',
    conceptId: 'acceptance_criteria',
    cost: 5,
    body: `They are the conditions the implementation must meet for the story to be accepted. They are used to define the scope, reach consensus, describe positive and negative scenarios, and as the basis for acceptance testing.

Two common formats:
- **Scenario-oriented**: Given/When/Then (BDD).
- **Rule-oriented**: a verification checklist or a table of inputs and outputs.

They must be **verifiable**: “fast” or “works well” won’t do.`,
  },
  {
    id: 'atdd',
    question: 'How does ATDD work, step by step? (CTFL 4.5.3)',
    conceptId: 'atdd',
    cost: 5,
    body: `1. **Specification workshop**: the team analyzes the story and its criteria, and resolves ambiguities and gaps.
2. **Create test cases** from the criteria: first the **positive** ones (correct behavior with no exceptions), then the **negative** ones and the non-functional ones.
3. Write the test cases in a format the business understands and that can be **automated**.
4. The code is written until they pass.

Black-box techniques (such as boundary value analysis) can be applied to choose the examples. Passing the acceptance tests does not prove there are no defects.`,
  },
  {
    id: 'gherkin',
    question: 'What makes a good Gherkin scenario? (BDD)',
    conceptId: 'bdd',
    cost: 5,
    body: `- **One behavior per scenario**: a single When.
- **Declarative**: what happens (“the customer pays the link”), not what gets clicked (“I click Pay”). UI steps make the suite brittle.
- **Verifiable Then**: a concrete, observable outcome.
- **Scenario Outline** with **Examples** when the data changes: ideal for boundary values (0.99 / 1.00 / 5,000.00 / 5,000.01).`,
  },
  {
    id: 'tdd',
    question: 'What is the TDD cycle? (CTFL 2.1.3)',
    conceptId: 'tdd',
    cost: 5,
    body: `1. **Red**: write a small test for the next rule and **run it**: it must fail.
2. **Green**: write the **minimum code** to make it pass.
3. **Refactor**: improve the code (names, duplication) with all tests **green**, and run them again.

Each special rule (such as a minimum commission) comes in with its own test. The tests remain as regression tests and guide the design.`,
  },
]
