import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (course 2 · mission 4). CTFL syllabus 4.4. */
export const m04LessonsEn: Lesson[] = [
  {
    id: 'experience',
    question: 'What are experience-based test techniques? (CTFL 4.4)',
    conceptId: 'experience_based',
    cost: 5,
    body: `They use the **knowledge and experience** of testers, developers and users to design, implement and execute tests.

The three in the syllabus:
- **Error guessing**.
- **Exploratory testing**.
- **Checklist-based testing**.

They find defects that systematic techniques may miss, but their effectiveness **depends on who applies them**. That's why they **complement**, rather than replace, black-box and white-box techniques.`,
  },
  {
    id: 'guessing',
    question: 'How is error guessing applied? (CTFL 4.4.1)',
    conceptId: 'error_guessing',
    cost: 5,
    body: `You anticipate **errors, defects and failures** based on what you know about:

- how the application has worked (and failed) in the past;
- the typical errors developers make;
- the failures that have occurred in similar applications.

A methodical approach is **fault attacks**: a list of attacks (empty fields, out-of-range values, special characters, double submission, expired session…) applied where they would do the most damage.`,
  },
  {
    id: 'exploratory',
    question: 'What keeps exploration from being "just clicking around"? (CTFL 4.4.2)',
    conceptId: 'exploratory',
    cost: 5,
    body: `In exploratory testing, **tests are designed, executed and evaluated at the same time** while you learn about the test object.

To make it manageable, it is done **in sessions** (session-based):
- **Charter**: the session's objective ("explore X with Y to discover Z").
- **Timebox**: limited time.
- **Notes** taken during the session.
- **Session report**: what was covered, what was found, what remains open.

It is useful with **poor specifications** or **heavy time pressure**, and benefits from experienced testers with domain knowledge.`,
  },
  {
    id: 'checklist',
    question: 'What is a checklist for, and what is its limit? (CTFL 4.4.3)',
    conceptId: 'checklist_based',
    cost: 5,
    body: `A **checklist** collects test conditions to verify, based on experience, on what matters to the user, or on why and how software fails.

- It provides **consistency** and acts as a guide when there are no detailed test cases.
- Its items should be checkable, and not so general that they add nothing.
- **It has to be kept alive**: over time it stops finding defects (like the pesticide paradox) and knows nothing about new features.`,
  },
  {
    id: 'session_report',
    question: 'What should an exploratory session report include?',
    conceptId: 'exploratory',
    cost: 5,
    body: `- The **charter** and the time actually used.
- Which **areas and attacks** were covered.
- The **defects** found (and reported with evidence).
- **Open questions** and what is **left to explore**: the input for the next session.

Without a report, exploration can't be tracked, measured or shared across the team.`,
  },
  {
    id: 'decide',
    question: 'How do I use what I find to make a go/no-go decision?',
    conceptId: 'experience_based',
    cost: 5,
    body: `Counting bugs isn't enough: you have to assess the **risk** of each one.

- Does it affect what customers **use most**?
- Is there **loss of money or data**?
- Is there a workaround, or can it be contained?

A single critical bug in a key operation can justify a no-go; five cosmetic bugs can't.`,
  },
]
