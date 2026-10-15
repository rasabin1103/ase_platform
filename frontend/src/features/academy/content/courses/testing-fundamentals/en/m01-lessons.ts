import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (mission 1), English version. Examples unrelated to KOB-151. */
export const m01LessonsEn: Lesson[] = [
  {
    id: 'review_story',
    question: 'How do I review a story before it is developed?',
    conceptId: 'static_testing',
    cost: 5,
    body: `Read it **sentence by sentence** asking yourself: «how would I test this?». If you don't know what result to expect, there is a defect in the requirement.

- Look for **vague words**: «adequate», «fast», «the same as», «etc.».
- Look for what is **missing**: what if…? (empty, maximum, error, cancellation, another type of user).
- Compare the **description with the examples**: sometimes they contradict each other.
- Write down each question with its type and **send it to the PO before development starts**.`,
  },
  {
    id: 'defect_types',
    question: 'What types of defects do requirements have?',
    conceptId: 'requirement_defects',
    cost: 5,
    body: `- **Ambiguous**: it allows several interpretations. «The discount applies to long-standing customers» (since when?).
- **Incomplete**: a case or a rule is missing. «The user can upload a photo» (maximum size? formats?).
- **Contradictory**: two parts say incompatible things. «Business customers only» and then «example: Ana buys for her home».
- **Untestable**: there is no objective way to check it. «The screen must be intuitive».

The same sentence can have more than one problem: choose the main one.`,
  },
  {
    id: 'testable',
    question: 'What makes a criterion testable?',
    conceptId: 'testable_criteria',
    cost: 5,
    body: `A criterion is testable if two different people testing it would reach the **same verdict**.

- «Search is fast» ✗ → «Search returns results in under 1 second with 10,000 products» ✓
- «The form is easy» ✗ → «5 out of 5 users complete sign-up unaided in under 2 minutes» ✓

If you cannot write the expected result of a test case, the criterion is not testable yet.`,
  },
  {
    id: 'gwt',
    question: 'How do I write criteria as examples?',
    conceptId: 'given_when_then',
    cost: 5,
    body: `The **Given / When / Then** format turns vague rules into concrete examples that the whole team understands the same way:

- **Given** a cart with 3 products at €10
- **When** I apply the coupon SUMMER10
- **Then** the total is €27

Proposing examples like this in the refinement is one of the best ways QA has of preventing bugs before they exist.`,
  },
  {
    id: 'shift_left',
    question: 'Why is it cheaper to find it now?',
    conceptId: 'shift_left',
    cost: 5,
    body: `A defect found in the **requirement** costs one question. The same defect found in **staging** costs developing, testing, reporting, fixing and re-testing. In **production**, affected customers and reputation on top of that.

That is why QA takes part from the refinement onwards (*shift-left*): the best way to find a bug is to prevent it from being written.`,
  },
  {
    id: 'scope_change',
    question: 'What do I do if the requirements change mid-sprint?',
    conceptId: 'scope_change',
    cost: 5,
    body: `Changes are normal; what is dangerous is sneaking them in **through the back door**.

- Ask for them to be recorded in the ticket (what changes and why).
- Assess the impact with the team: does the estimate change? does anything need re-testing?
- Let whoever prioritizes (the PO) decide, in full view of everyone.

A «just tell Diego directly» usually ends in an untested change that nobody knows about.`,
  },
  {
    id: 'dates',
    question: 'How do I test date fields?',
    conceptId: 'boundary_values',
    cost: 5,
    body: `Dates are a gold mine of boundary values and partitions:

- **Edges**: yesterday, today, tomorrow; the maximum allowed and one day more.
- **Calendar**: weekends, public holidays, months of 28, 29, 30 and 31 days, leap years, year change.
- **Relationships**: end date before, equal to and after the start date.

An unrelated example: a hotel booking «up to 90 days in advance» → test today, 90 and 91 days; check-out before, equal to and after check-in.`,
  },
]
