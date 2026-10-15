import type { RequirementsReviewModel } from '../../../../engine/types'

/**
 * Specification KOB-E-12 “Recurring invoicing” for the inspection.
 * Eight real defects (keys). Carmen, Tomás and Sofía contribute theirs at the
 * meeting if they take part as reviewers and the review lets them prepare.
 */
export const m01ReviewEn: RequirementsReviewModel = {
  storyId: 'KOB-E-12',
  reviewer: 'elena',
  submitCost: 60,
  title: 'Specification inspection',
  intro:
    'Individual review: read the document before the meeting and mark each defect with its type. When you’re ready, hold the meeting: the other reviewers will contribute what they found during their preparation, and Elena will log and fix the defects in the minutes. Whatever isn’t found today goes to development at 4:00 PM.',
  submitLabel: 'Hold the review meeting',
  sections: [
    { id: 'scope', label: '1. Scope' },
    { id: 'issue', label: '2. Issuing' },
    { id: 'amounts', label: '3. Amounts' },
    { id: 'payment', label: '4. Payment collection' },
    { id: 'corrections', label: '5. Corrections' },
    { id: 'nfr', label: '6. Non-functional requirements' },
  ],
  fragments: [
    {
      id: 'f1',
      section: 'scope',
      text: 'Kobalto Business customers can set up recurring invoices, monthly or yearly, for their own customers.',
      fineReply: 'That’s the scope of the feature, as is.',
    },
    {
      id: 'f2',
      section: 'issue',
      text: 'The invoice is issued automatically on the 1st of every month.',
      issue: {
        types: ['contradictory'],
        key: 'fecha',
        explanation: 'It contradicts the next point: the 1st, or the sign-up date?',
        clarifyFlag: 'clarify.fecha',
        clarification: 'It is issued every month on the customer’s sign-up day; if that day doesn’t exist in the month, on the last day of the month.',
      },
    },
    {
      id: 'f3',
      section: 'issue',
      text: 'The first invoice is issued on the customer’s sign-up date and the following ones on that same date every month.',
      issue: {
        types: ['contradictory'],
        key: 'fecha',
        explanation: 'It contradicts the previous point (the 1st of every month).',
        clarifyFlag: 'clarify.fecha',
        clarification: 'It is issued every month on the customer’s sign-up day; if that day doesn’t exist in the month, on the last day of the month.',
      },
    },
    {
      id: 'f4',
      section: 'issue',
      text: 'Each invoice has a number.',
      issue: {
        types: ['incomplete'],
        key: 'numeracion',
        explanation: 'The regulations require sequential numbering per series, with no gaps; nothing is said about it.',
        clarifyFlag: 'clarify.numeracion',
        clarification: 'Sequential numbering per series and year (EMP-2026-000001), with no gaps. A voided invoice does not release its number.',
      },
    },
    {
      id: 'f5',
      section: 'issue',
      text: 'The invoice is emailed to the customer as a PDF.',
      fineReply: 'The format and channel are defined in the templates document.',
    },
    {
      id: 'f6',
      section: 'amounts',
      text: 'VAT is calculated on the amount.',
      issue: {
        types: ['ambiguous', 'incomplete'],
        key: 'iva',
        explanation: 'Which amount? Before or after the discount? Per line or on the total? Rounding changes the result.',
        clarifyFlag: 'clarify.iva',
        clarification: 'On the taxable base of each line, after the discount, rounding each line to the cent.',
      },
    },
    {
      id: 'f7',
      section: 'amounts',
      text: 'If there is a discount, the invoice shows the original amount, the discount and the taxable base.',
      fineReply: 'That’s clear and verifiable.',
    },
    {
      id: 'f8',
      section: 'amounts',
      text: 'The customer can change plans at any time.',
      issue: {
        types: ['incomplete', 'ambiguous'],
        key: 'prorrateo',
        explanation: 'What happens to the current month’s invoice? Is it prorated?',
        clarifyFlag: 'clarify.prorrateo',
        clarification: 'The change applies from the next invoice; the current month is not prorated.',
      },
    },
    {
      id: 'f9',
      section: 'payment',
      text: 'If collecting payment for the invoice fails, it is retried.',
      issue: {
        types: ['incomplete'],
        key: 'reintentos',
        explanation: 'How many times, how often, and what happens in the end?',
        clarifyFlag: 'clarify.reintentos',
        clarification: 'Up to 3 retries, after 1, 3 and 7 days. After that, the customer is notified and the invoice is marked “unpaid.”',
      },
    },
    {
      id: 'f10',
      section: 'payment',
      text: 'The customer receives a notification when each invoice is collected.',
      fineReply: 'The notification is the standard payment one, already defined.',
    },
    {
      id: 'f11',
      section: 'corrections',
      text: 'An invoice with errors can be deleted and issued again.',
      issue: {
        types: ['incomplete', 'contradictory'],
        key: 'rectificativa',
        explanation: 'Issued invoices cannot be deleted: they are corrected with a corrective invoice. This clashes with the regulations.',
        clarifyFlag: 'clarify.rectificativa',
        clarification: 'Invoices are never deleted: a corrective invoice is issued that references the original and explains the correction.',
      },
    },
    {
      id: 'f12',
      section: 'nfr',
      text: 'Sending the invoices will be fast.',
      issue: {
        types: ['untestable'],
        key: 'rapido',
        explanation: '“Fast” cannot be verified.',
        clarifyFlag: 'clarify.rapido',
        clarification: 'All of the day’s invoices sent before 8:00 AM; each PDF generated in under 3 s.',
      },
    },
    {
      id: 'f13',
      section: 'nfr',
      text: 'Invoicing complies with the regulations in force.',
      issue: {
        types: ['untestable', 'ambiguous'],
        key: 'normativa',
        explanation: 'Which regulations? Without naming them, nobody knows which requirements to test.',
        clarifyFlag: 'clarify.normativa',
        clarification: 'The Invoicing Regulation and the invoice recording system (requirements in the Compliance annex, which is added to the document).',
      },
    },
  ],
  teamFindings: [
    {
      by: 'carmen',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'role.reviewer.carmen' }, { kind: 'any', of: [{ kind: 'flag', key: 'review.type.inspection' }, { kind: 'flag', key: 'review.type.technical' }] }] },
      fragmentIds: ['f4', 'f11'],
    },
    {
      by: 'carmen',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'role.reviewer.carmen' }, { kind: 'flag', key: 'review.checklist' }, { kind: 'notFlag', key: 'review.type.informal' }] },
      fragmentIds: ['f13'],
    },
    {
      by: 'tomas',
      when: {
        kind: 'all',
        of: [
          { kind: 'flag', key: 'role.reviewer.tomas' },
          { kind: 'notFlag', key: 'role.manager.in' },
          { kind: 'any', of: [{ kind: 'flag', key: 'review.type.inspection' }, { kind: 'flag', key: 'review.type.technical' }] },
        ],
      },
      fragmentIds: ['f6', 'f9'],
    },
    {
      by: 'tomas',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'role.reviewer.tomas' }, { kind: 'flag', key: 'review.type.walkthrough' }] },
      fragmentIds: ['f6'],
    },
    {
      by: 'sofia',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'role.in.sofia' }, { kind: 'flag', key: 'review.type.inspection' }, { kind: 'notFlag', key: 'role.manager.in' }] },
      fragmentIds: ['f8'],
    },
  ],
}
