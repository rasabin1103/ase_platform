import type { RequirementsReviewModel } from '../../../../engine/types'

/**
 * KOB-151 · Scheduled transfers, as it arrives at the refinement (English).
 * 8 real defects (one of them a contradiction between two fragments) and
 * 2 correct fragments that act as distractors.
 */
export const m01ReviewEn: RequirementsReviewModel = {
  storyId: 'KOB-151',
  reviewer: 'marta',
  submitCost: 10,
  fragments: [
    {
      id: 'd1',
      section: 'description',
      text: 'Feature that lets customers schedule payments between their own accounts without having to remember to make them.',
      issue: {
        types: ['contradictory', 'ambiguous'],
        key: 'destination',
        explanation: 'The description says «between their own accounts», but criterion 7 gives paying the rent to a landlord as an example, which is a third-party account.',
        clarifyFlag: 'clar.destination',
        clarification: 'To any account, own or third-party. Paying the rent is precisely the main use case.',
      },
    },
    {
      id: 'f1',
      section: 'criteria',
      text: '1. The customer chooses the execution date.',
      issue: {
        types: ['incomplete', 'ambiguous'],
        key: 'date',
        explanation: 'It does not say which dates are valid: today? past dates? how far ahead? what happens on weekends?',
        clarifyFlag: 'clar.date',
        clarification: 'From tomorrow up to 365 days ahead. If it falls on a weekend, it is executed the following Monday.',
      },
    },
    {
      id: 'f2',
      section: 'criteria',
      text: '2. They can choose the frequency: once, weekly or monthly.',
      issue: {
        types: ['incomplete'],
        key: 'monthly',
        explanation: 'It is missing what happens to a monthly transfer starting on the 29th, 30th or 31st in months that do not have that day.',
        clarifyFlag: 'clar.monthly',
        clarification: 'If the month does not have that day, it is executed on the last day of the month.',
      },
    },
    {
      id: 'f3',
      section: 'criteria',
      text: '3. The same limits as for a normal transfer apply.',
      issue: {
        types: ['ambiguous', 'incomplete'],
        key: 'limits',
        explanation: '«The same limits»: which ones? Are they checked when scheduling or on the execution date?',
        clarifyFlag: 'clar.limits',
        clarification: 'The €5,000 per-transaction maximum is validated when scheduling; the €6,000 daily limit, on the execution date.',
      },
    },
    {
      id: 'f4',
      section: 'criteria',
      text: '4. The end date is optional for recurring transfers and, if given, must be on or after the start date.',
      fineReply: 'this one is clear: optional and, if set, not before the start.',
    },
    {
      id: 'f5',
      section: 'criteria',
      text: '5. The customer can cancel a scheduled transfer.',
      issue: {
        types: ['incomplete', 'ambiguous'],
        key: 'cancel',
        explanation: 'For a recurring transfer, is only the next execution cancelled or the whole series? Until when can it be cancelled?',
        clarifyFlag: 'clar.cancel',
        clarification: 'For recurring transfers, the customer chooses «only the next one» or «the whole series». It can be cancelled up to the day before.',
      },
    },
    {
      id: 'f6',
      section: 'criteria',
      text: '6. The system must be fast and easy to use.',
      issue: {
        types: ['untestable', 'ambiguous'],
        key: 'nfr',
        explanation: '«Fast» and «easy» cannot be verified: there is no threshold or objective way to check them.',
        clarifyFlag: 'clar.nfr',
        clarification: 'Confirming a scheduled transfer must take less than 2 seconds; we will validate ease of use with 5 customers before the release.',
      },
    },
    {
      id: 'f7',
      section: 'criteria',
      text: '7. Example: paying the rent to the landlord on the 1st of every month.',
      issue: {
        types: ['contradictory'],
        key: 'destination',
        explanation: 'The description says «between their own accounts», but criterion 7 gives paying the rent to a landlord as an example, which is a third-party account.',
        clarifyFlag: 'clar.destination',
        clarification: 'To any account, own or third-party. Paying the rent is precisely the main use case.',
      },
    },
    {
      id: 'f8',
      section: 'criteria',
      text: '8. If there are insufficient funds, the transfer is not executed.',
      issue: {
        types: ['incomplete'],
        key: 'nofunds',
        explanation: 'It does not say whether it is retried or whether the customer is notified: the customer would not know their rent has not been paid.',
        clarifyFlag: 'clar.nofunds',
        clarification: 'It is retried once at 18:00 and, if it fails again, the customer is notified by email and in the app.',
      },
    },
    {
      id: 'f9',
      section: 'criteria',
      text: '9. The amount allows up to 2 decimal places.',
      fineReply: 'correct, same as for normal transfers.',
    },
    {
      id: 'f10',
      section: 'criteria',
      text: '10. The customer is notified.',
      issue: {
        types: ['incomplete', 'ambiguous', 'untestable'],
        key: 'notify',
        explanation: 'When, through which channel and about what are they notified?',
        clarifyFlag: 'clar.notify',
        clarification: 'An email the day before each execution and another one when it is executed.',
      },
    },
  ],
}
