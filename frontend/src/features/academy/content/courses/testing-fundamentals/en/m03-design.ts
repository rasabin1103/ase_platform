import type { TestDesignModel } from '../../../../engine/types'
import { m03Design } from '../m03-design'

/**
 * Test design for the payments console (KOB-170): state transitions (valid
 * and invalid), refund amounts and sequences, and the decision table for the
 * refund fee.
 *
 * The case parsers are shared with the Spanish version (same function
 * references): they accept both the Spanish words and the English state and
 * action ids, so saved games replay in either language.
 */
const { classify, expected, reveals, prefill } = m03Design

export const m03DesignEn: TestDesignModel = {
  storyId: 'KOB-170',
  intro:
    'Every arrow in the lifecycle is a test case, and so is every arrow that does not exist: the API must respond 409 without touching the payment. Then, refund sequences and one test per rule of the fee table.',
  caseCost: 2,
  reviewCost: 10,
  reviewer: 'laura',
  areas: [
    {
      id: 'valid',
      label: 'Valid transitions',
      inputLabel: '"state;action" (states: pending, authorized, declined, cancelled, settled, partially_refunded, refunded, disputed · actions: authorize, decline, cancel, settle, refund, dispute, win, lose)',
      inputPlaceholder: 'E.g.: authorized;settle · partially_refunded;dispute',
      expectedQuestion: 'Is the action allowed?',
      expectedLabels: { yes: 'Allowed', no: '409' },
      partitions: [
        { id: 'pending:authorize', label: 'Pending → Authorize', technique: 'State transition testing', core: true, hint: 'Walk the diagram: every arrow is a test case…' },
        { id: 'pending:decline', label: 'Pending → Decline', technique: 'State transition testing', core: true, hint: 'Three arrows leave "Pending".' },
        { id: 'pending:cancel', label: 'Pending → Cancel', technique: 'State transition testing', core: true, hint: 'Three arrows leave "Pending".' },
        { id: 'authorized:settle', label: 'Authorized → Settle', technique: 'State transition testing', core: true, hint: 'The happy path counts too.' },
        { id: 'authorized:cancel', label: 'Authorized → Cancel', technique: 'State transition testing', core: true, hint: 'Can you cancel before settling?' },
        { id: 'settled:refund', label: 'Settled → Refund', technique: 'State transition testing', core: true, hint: 'The happy path counts too.' },
        { id: 'partially_refunded:refund', label: 'Partially refunded → Refund', technique: 'State transition testing', core: true, hint: 'An intermediate state has its own arrows too.' },
        { id: 'settled:dispute', label: 'Settled → Open dispute', technique: 'State transition testing', core: true, hint: 'Disputes have their own lifecycle.' },
        { id: 'partially_refunded:dispute', label: 'Partially refunded → Open dispute', technique: 'State transition testing', core: true, hint: 'From which states can a dispute be opened?' },
        { id: 'disputed:win', label: 'Disputed → Dispute won', technique: 'State transition testing', core: true, hint: 'A dispute ends in one of two ways…' },
        { id: 'disputed:lose', label: 'Disputed → Dispute lost', technique: 'State transition testing', core: true, hint: '…and both are arrows.' },
      ],
    },
    {
      id: 'invalid',
      label: 'Invalid transitions',
      inputLabel: '"state;action" that should NOT be allowed (same names as for valid ones)',
      inputPlaceholder: 'E.g.: cancelled;refund · declined;authorize',
      expectedQuestion: 'Is the action allowed?',
      expectedLabels: { yes: 'Allowed', no: '409' },
      partitions: [
        { id: 'cancelled:refund', label: 'Cancelled → Refund', technique: 'Invalid transitions', core: true, hint: 'Can you refund money that was never collected?' },
        { id: 'authorized:refund', label: 'Authorized → Refund', technique: 'Invalid transitions', core: true, hint: 'Authorized is not the same as collected…' },
        { id: 'disputed:refund', label: 'Disputed → Refund', technique: 'Invalid transitions', core: true, hint: 'Think about the incident Carmen told you about.' },
        { id: 'settled:cancel', label: 'Settled → Cancel', technique: 'Invalid transitions', core: true, hint: 'Once settled: cancel or refund?' },
        { id: 'cancelled:settle', label: 'Cancelled → Settle', technique: 'Invalid transitions', core: true, hint: 'Can a cancelled payment "come back to life"?' },
        { id: 'declined:authorize', label: 'Declined → Authorize', technique: 'Invalid transitions', core: true, hint: 'Final states should be final.' },
        { id: 'refunded:refund', label: 'Refunded → Refund', technique: 'Invalid transitions', core: true, hint: 'What if everything has already been refunded?' },
        { id: 'other', label: 'Another invalid transition', technique: 'Invalid transitions', hint: '' },
      ],
    },
    {
      id: 'amount',
      label: 'Refund amount',
      inputLabel: 'Amount to refund on a settled €100.00 payment with no previous refunds',
      inputPlaceholder: 'E.g.: 0 · 40 · 100 · 100.01',
      expectedQuestion: 'Is the refund accepted?',
      partitions: [
        { id: 'zero', label: '€0 or negative', technique: 'Boundary value analysis', core: true, hint: 'The minimum amount is a boundary too…' },
        { id: 'partial', label: 'Partial refund', technique: 'Equivalence partitioning', core: true, hint: 'A normal case?' },
        { id: 'total', label: 'Exactly the amount (€100.00)', technique: 'Boundary value analysis', core: true, hint: 'Right at the maximum… and check which state it ends up in.' },
        { id: 'above', label: 'Above the amount (€100.01 or more)', technique: 'Boundary value analysis', core: true, hint: '…and one cent more.' },
        { id: 'decimals', label: 'More than 2 decimals', technique: 'Equivalence partitioning', hint: '' },
      ],
    },
    {
      id: 'cumulative',
      label: 'Successive refunds',
      inputLabel: '"first;second" refund on a settled €100.00 payment',
      inputPlaceholder: 'E.g.: 30;40 · 60;40 · 60;41',
      expectedQuestion: 'Is the second refund accepted?',
      partitions: [
        { id: 'under', label: 'They add up to less than the amount', technique: 'Transition sequences', core: true, hint: 'Two refunds in a row: the intermediate state matters.' },
        { id: 'exact', label: 'They add up to exactly the amount', technique: 'Boundary values in a sequence', core: true, hint: 'What if the second one completes the total exactly?' },
        { id: 'over', label: 'They add up to more than the amount', technique: 'Boundary values in a sequence', core: true, hint: 'Each one on its own is valid… and together?' },
      ],
    },
    {
      id: 'fee',
      label: 'Fee (decision table)',
      inputLabel: '"plan;type;days" · plan: standard or pro · type: total or partial (€40) · days since the payment (€100.00 payment)',
      inputPlaceholder: 'E.g.: pro;partial;10 · standard;total;31',
      expectedQuestion: 'Is the merchant charged no fee (€0)?',
      expectedLabels: { yes: '€0 fee', no: 'Fee charged' },
      partitions: [
        { id: 'r1_total', label: 'R1 · Pro with full refund', technique: 'Decision table testing', core: true, requiresFlag: 'fees.read', hint: 'Every rule (column) in the table is at least one test case.' },
        { id: 'r1_partial', label: 'R1 · Pro with partial refund', technique: 'Decision table testing', core: true, requiresFlag: 'fees.read', hint: 'A rule with "–" (don\'t care) hides several combinations: test more than one.' },
        { id: 'r2', label: 'R2 · Standard, full, within the period', technique: 'Decision table testing', core: true, requiresFlag: 'fees.read', hint: 'Every rule (column) in the table is at least one test case.' },
        { id: 'r3', label: 'R3 · Standard, full, outside the period', technique: 'Decision table testing', core: true, requiresFlag: 'fees.read', hint: 'Every rule (column) in the table is at least one test case.' },
        { id: 'r4', label: 'R4 · Standard, partial, within the period', technique: 'Decision table testing', core: true, requiresFlag: 'fees.read', hint: 'Every rule (column) in the table is at least one test case.' },
        { id: 'r5', label: 'R5 · Standard, partial, outside the period', technique: 'Decision table testing', core: true, requiresFlag: 'fees.read', hint: 'Every rule (column) in the table is at least one test case.' },
        { id: 'd30', label: 'Day 30 (last day within the period)', technique: 'Boundary value analysis', core: true, hint: 'One condition in the table has a boundary: test it from the inside…' },
        { id: 'd31', label: 'Day 31 (first day outside the period)', technique: 'Boundary value analysis', core: true, hint: '…and from the outside.' },
      ],
    },
  ],
  classify,
  expected,
  reveals,
  prefill,
}
