import type { TestDesignModel } from '../../../../engine/types'
import { m01Design } from '../m01-design'

/**
 * Test design model for the KOB-151 prototype (scheduled transfers), English.
 *
 * Only the human-readable text of the areas and partitions is translated.
 * The case parsers are shared with the Spanish version (same function
 * references, required for saved-game parity). They understand day offsets
 * («-1», «0», «365»), ISO dates (YYYY-MM-DD) and numbers in either decimal
 * notation, and the destination and cancel keywords in both languages
 * («own» / «third-party», «one-off» / «next» / «series»).
 */
export const m01DesignEn: TestDesignModel = {
  ...m01Design,
  areas: [
    {
      id: 'exec_date',
      label: 'Execution date',
      inputLabel: 'Days from today (−1, 0, 1, 365, 366…) or a date as YYYY-MM-DD',
      inputPlaceholder: 'E.g.: 0 · 1 · 365 · 2026-10-17',
      expectedQuestion: 'Can it be scheduled?',
      partitions: [
        { id: 'past', label: 'Past date', technique: 'Equivalence partitioning', core: true, requiresFlag: 'clar.date', hint: 'And a date that has already passed?' },
        { id: 'today', label: 'Today', technique: 'Boundary values', core: true, requiresFlag: 'clar.date', hint: 'Check the lower edge of the allowed dates…' },
        { id: 'tomorrow', label: 'Tomorrow (first valid day)', technique: 'Boundary values', core: true, requiresFlag: 'clar.date', hint: '…and the first day that should be accepted.' },
        { id: 'within', label: 'Valid date in between', technique: 'Equivalence partitioning', core: true, hint: 'Do you have a normal test case that should work?' },
        { id: 'max_365', label: '365 days from now (maximum)', technique: 'Boundary values', core: true, requiresFlag: 'clar.date', hint: 'Dates have a maximum too: test it at the edge.' },
        { id: 'over_365', label: 'More than 365 days', technique: 'Boundary values', core: true, requiresFlag: 'clar.date', hint: 'And one day beyond the maximum?' },
        { id: 'weekend', label: 'Falls on a weekend', technique: 'Equivalence partitioning', core: true, requiresFlag: 'clar.date', hint: 'What happens if the date is a Saturday or a Sunday?' },
      ],
    },
    {
      id: 'monthly_day',
      label: 'Monthly: day of the month',
      inputLabel: 'Day of the month the monthly transfer starts on (1–31)',
      inputPlaceholder: 'E.g.: 15 · 30 · 31',
      expectedQuestion: 'Can it be scheduled?',
      partitions: [
        { id: 'normal', label: 'Day 1–28 (exists in every month)', technique: 'Equivalence partitioning', core: true, hint: 'A normal monthly transfer?' },
        { id: 'late', label: 'Day 29 or 30', technique: 'Equivalence partitioning', core: true, requiresFlag: 'clar.monthly', hint: 'Some days do not exist in every month…' },
        { id: 'day31', label: 'Day 31', technique: 'Boundary values', core: true, requiresFlag: 'clar.monthly', hint: '…especially the last possible one.' },
      ],
    },
    {
      id: 'amount',
      label: 'Amount',
      inputLabel: 'Amount to schedule',
      inputPlaceholder: 'E.g.: 650 · 5000 · 5000.01',
      expectedQuestion: 'Can it be scheduled?',
      partitions: [
        { id: 'valid', label: 'Normal valid amount', technique: 'Equivalence partitioning', core: true, hint: 'A normal amount?' },
        { id: 'zero', label: 'Zero or negative', technique: 'Equivalence partitioning', core: true, hint: 'And values that make no sense as an amount?' },
        { id: 'max', label: 'Exact maximum (€5,000)', technique: 'Boundary values', core: true, requiresFlag: 'clar.limits', hint: '«The same limits»: have you tested them here too, at the edge?' },
        { id: 'over_max', label: 'Above the maximum', technique: 'Boundary values', core: true, requiresFlag: 'clar.limits', hint: 'And just above?' },
      ],
    },
    {
      id: 'end_date',
      label: 'End date',
      inputLabel: 'Days between the start and the end date (−1, 0, 30) or empty',
      inputPlaceholder: 'E.g.: -1 · 0 · 30 · (empty)',
      expectedQuestion: 'Can it be scheduled?',
      partitions: [
        { id: 'before', label: 'End before the start', technique: 'Boundary values', core: true, hint: 'Two related dates: what happens if they are the wrong way round?' },
        { id: 'same', label: 'End on the same day as the start', technique: 'Boundary values', core: true, hint: 'And if they are the same?' },
        { id: 'after', label: 'End after the start', technique: 'Equivalence partitioning', core: true, hint: 'A normal case with an end date?' },
        { id: 'empty', label: 'No end date', technique: 'Equivalence partitioning', core: true, hint: 'It is optional: test it without one.' },
      ],
    },
    {
      id: 'destination',
      label: 'Destination account',
      inputLabel: '«own» (own account) or «third-party» (someone else’s account)',
      inputPlaceholder: 'own · third-party',
      expectedQuestion: 'Can it be scheduled?',
      partitions: [
        { id: 'own', label: 'Own account', technique: 'Equivalence partitioning', core: true, hint: 'To one of the customer\'s own accounts?' },
        { id: 'third', label: 'Third-party account', technique: 'Equivalence partitioning', core: true, requiresFlag: 'clar.destination', hint: 'Reread the description and the rent example: who is being paid?' },
      ],
    },
    {
      id: 'cancel',
      label: 'Cancel',
      inputLabel: '«one-off», «recurring – next» (next one only) or «recurring – series» (whole series)',
      inputPlaceholder: 'one-off · recurring – next · recurring – series',
      expectedQuestion: 'Is only what the customer chose cancelled?',
      partitions: [
        { id: 'once', label: 'Cancel a one-off transfer', technique: 'Equivalence partitioning', hint: '' },
        { id: 'next', label: 'Recurring: only the next one', technique: 'Alternative flows', core: true, requiresFlag: 'clar.cancel', hint: 'For a recurring transfer, what exactly does the customer want to cancel?' },
        { id: 'series', label: 'Recurring: the whole series', technique: 'Alternative flows', core: true, hint: 'And if they want to remove it completely?' },
      ],
    },
  ],
}
