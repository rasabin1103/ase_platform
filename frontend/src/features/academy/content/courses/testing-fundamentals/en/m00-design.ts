import type { TestDesignModel } from '../../../../engine/types'
import { m00Design } from '../m00-design'

/**
 * Test design model for KOB-142 (Transfers), English version.
 *
 * Only the human-readable text of the areas and partitions is translated.
 * The classification logic (classify / expected / reveals / prefill) is the
 * very same as in the Spanish model, so saved games behave identically. It
 * already understands «4000 + 2500» or «4000; 2500» sequences and
 * «141 chars» for the reference length.
 */
export const m00DesignEn: TestDesignModel = {
  ...m00Design,
  areas: [
    {
      id: 'amount',
      label: 'Amount',
      inputLabel: 'Amount you would type',
      inputPlaceholder: 'E.g.: 150 · 0 · 5000,01',
      expectedQuestion: 'Is the transfer accepted?',
      partitions: [
        { id: 'valid', label: 'Normal valid amount', technique: 'Equivalence partitioning', core: true, hint: 'Do you have a «normal» test case that should work?' },
        { id: 'zero', label: 'Zero', technique: 'Equivalence partitioning', core: true, hint: 'What about values that make no sense as an amount?' },
        { id: 'negative', label: 'Negative amount', technique: 'Equivalence partitioning', core: true, hint: 'And below zero?' },
        { id: 'min_boundary', label: 'Exact minimum (€0.01)', technique: 'Boundary values', core: true, requiresFlag: 'rules.known', hint: 'Check the edges of the allowed range, at the bottom…' },
        { id: 'max_boundary', label: 'Exact maximum (€5,000.00)', technique: 'Boundary values', core: true, requiresFlag: 'rules.known', hint: '…and at the top: right on the limit.' },
        { id: 'above_max_boundary', label: 'Just above the maximum (€5,000.01)', technique: 'Boundary values', core: true, requiresFlag: 'rules.known', hint: 'And one cent above the limit.' },
        { id: 'above_max', label: 'Far above the maximum', technique: 'Equivalence partitioning', requiresFlag: 'rules.known', hint: '' },
        { id: 'comma_decimal', label: 'Decimals with a comma (10,50)', technique: 'Format partitions', core: true, hint: 'Think about how a Spanish customer writes decimals.' },
        { id: 'too_many_decimals', label: 'More than 2 decimal places', technique: 'Format partitions', requiresFlag: 'rules.known', hint: '' },
        { id: 'non_numeric', label: 'Text or empty', technique: 'Equivalence partitioning', hint: '' },
      ],
    },
    {
      id: 'iban',
      label: 'IBAN',
      inputLabel: 'IBAN you would type',
      inputPlaceholder: 'E.g.: ES30 9101 0001 1202 0001 2345',
      expectedQuestion: 'Is the transfer accepted?',
      partitions: [
        { id: 'valid', label: 'Valid IBAN', technique: 'Equivalence partitioning', core: true, hint: 'Do you have a correct IBAN from the test data?' },
        { id: 'bad_checksum', label: 'Correct format, wrong check digits', technique: 'Invalid data with a valid format', core: true, hint: 'An IBAN can «look» correct and not be: what really validates it?' },
        { id: 'bad_format', label: 'Wrong format (length, country…)', technique: 'Equivalence partitioning', core: true, hint: 'And something that does not even look like a Spanish IBAN?' },
        { id: 'with_spaces', label: 'Valid IBAN typed with spaces', technique: 'Format partitions', core: true, hint: 'What if the customer copies it as is, with spaces?' },
        { id: 'empty', label: 'Empty', technique: 'Equivalence partitioning', hint: '' },
      ],
    },
    {
      id: 'beneficiary',
      label: 'Beneficiary',
      inputLabel: 'Beneficiary name',
      inputPlaceholder: 'E.g.: Ana López (or leave it empty)',
      expectedQuestion: 'Is the transfer accepted?',
      partitions: [
        { id: 'filled', label: 'With a name', technique: 'Equivalence partitioning', core: true, hint: 'A normal beneficiary?' },
        { id: 'empty', label: 'Empty or only spaces', technique: 'Equivalence partitioning', core: true, hint: 'Mandatory fields are also tested empty.' },
      ],
    },
    {
      id: 'concept',
      label: 'Reference',
      inputLabel: 'Reference (you can type «140 characters» or «141 characters»)',
      inputPlaceholder: 'E.g.: Friday dinner · 141 characters',
      expectedQuestion: 'Is the transfer accepted?',
      partitions: [
        { id: 'normal', label: 'Normal reference', technique: 'Equivalence partitioning', hint: '' },
        { id: 'empty', label: 'Empty (it is optional)', technique: 'Equivalence partitioning', hint: '' },
        { id: 'max_140', label: 'Exactly 140 characters', technique: 'Boundary values', core: true, requiresFlag: 'rules.known', hint: 'Text fields have limits too: test them at the edge.' },
        { id: 'over_140', label: 'More than 140 characters', technique: 'Boundary values', core: true, requiresFlag: 'rules.known', hint: 'And just above?' },
      ],
    },
    {
      id: 'daily',
      label: 'Daily limit',
      inputLabel: 'Sequence of amounts on the same day',
      inputPlaceholder: 'E.g.: 4000 + 2500',
      expectedQuestion: 'Is the last transfer accepted?',
      partitions: [
        { id: 'under', label: 'Daily total below €6,000', technique: 'Sequence testing', core: true, requiresFlag: 'rules.known', hint: 'Some limits only show up when you chain transactions.' },
        { id: 'exact', label: 'Daily total of exactly €6,000', technique: 'Boundary values', core: true, requiresFlag: 'rules.known', hint: 'Test the daily total right at the limit…' },
        { id: 'over', label: 'Daily total above €6,000', technique: 'Boundary values', core: true, requiresFlag: 'rules.known', hint: '…and going over it.' },
        { id: 'single', label: 'A single transaction', technique: 'Sequence testing', hint: '' },
      ],
    },
    {
      id: 'double',
      label: 'Double submission',
      inputLabel: 'What you will do (e.g. «double-click Confirm»)',
      inputPlaceholder: 'E.g.: double-click Confirm',
      expectedQuestion: 'Is the second transfer accepted?',
      partitions: [
        { id: 'double_click', label: 'Double click / retry', technique: 'Real user behavior', core: true, hint: 'What does an impatient user do with the confirm button?' },
      ],
    },
  ],
}
