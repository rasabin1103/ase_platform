import type { Lesson } from '../../../../engine/types'

/** Laura’s micro-lessons (course 2 · mission 1). CTFL syllabus 3.1 and 3.2. */
export const m01LessonsEn: Lesson[] = [
  {
    id: 'static',
    question: 'What’s the point of reviewing a document if there’s nothing to execute yet? (CTFL 3.1)',
    conceptId: 'static_testing',
    cost: 5,
    body: `**Static testing** examines work products (requirements, designs, code, plans) **without executing them**. It finds **defects** directly; dynamic testing finds **failures**, and then you have to look for the defect that causes them.

- It detects what dynamic testing sees late or never: ambiguities, contradictions, missing requirements, regulatory non-compliance.
- The earlier a defect is found, the **cheaper** it is to fix: in a document, it means changing a sentence; in production, an incident.
- Almost any readable work product can be reviewed.`,
  },
  {
    id: 'types',
    question: 'Which type of review should I choose? (CTFL 3.2.4)',
    conceptId: 'review_types',
    cost: 5,
    body: `It depends on the **objective** and the context (risk, regulations, time):

- **Informal review**: no defined process, no documented output. Quick; for early questions.
- **Walkthrough**: led by the author. For educating, generating ideas and reaching consensus.
- **Technical review**: performed by prepared technical reviewers. For reaching consensus and making decisions on technical problems.
- **Inspection**: the most formal. Individual preparation, defined roles, defect logging and **metrics**. For finding the maximum number of defects and leaving **evidence** (regulations, audits).

Several types can be combined on the same work product over time.`,
  },
  {
    id: 'roles',
    question: 'Who does what in a formal review? (CTFL 3.2.3)',
    conceptId: 'review_roles',
    cost: 5,
    body: `- **Manager**: decides what is reviewed and provides resources. Best kept **out of the meeting**: their presence makes people keep defects to themselves.
- **Author**: creates and fixes the work product.
- **Moderator (facilitator)**: runs the meeting, mediates and ensures a safe environment. Never the author.
- **Scribe (recorder)**: collects the anomalies and decisions.
- **Reviewers**: different perspectives (business, development, regulations, testing).
- **Review leader**: takes overall responsibility for organizing the review.`,
  },
  {
    id: 'process',
    question: 'What are the steps of a review? (CTFL 3.2.2)',
    conceptId: 'review_process',
    cost: 5,
    body: `1. **Planning**: scope, objective, type, roles, exit criteria.
2. **Review initiation**: make sure everyone has the document and knows what to review.
3. **Individual review**: each reviewer reads it and notes anomalies, often using a **checklist**.
4. **Communication and analysis**: a meeting to understand the anomalies and decide their status and owner.
5. **Fixing and reporting**: the author fixes them, someone **checks** that each defect is closed, and the results are reported (metrics, evidence).

Skipping the individual review or the follow-up is the most common way for a review to “get done” without being much use.`,
  },
  {
    id: 'success',
    question: 'What makes a review work? (CTFL 3.2.5)',
    conceptId: 'review_success',
    cost: 5,
    body: `- Clear objectives and measurable **exit criteria**.
- The right **review type** for the objective.
- Reviewing in **small chunks**, with time to prepare.
- Giving feedback on the **product, not the person**: the author has to be able to hear it.
- Management support (time and resources) without pressure in the room.
- Making reviews part of the **culture** and training the participants.`,
  },
  {
    id: 'checklist',
    question: 'What is a checklist for in a review?',
    conceptId: 'review_process',
    cost: 5,
    body: `It focuses attention on the **typical** defects of that kind of document: dates and calendars, amounts and rounding, errors and retries, cited regulations, verifiable requirements…

- It makes different people review with a **common standard**.
- It doesn’t replace thinking: anything new isn’t on the checklist. Improve it with what you find.`,
  },
]
