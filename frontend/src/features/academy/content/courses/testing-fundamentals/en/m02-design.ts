import type { TestDesignModel } from '../../../../engine/types'
import { m02Design } from '../m02-design'

/**
 * Test design for the loan simulator (KOB-163), English version: several
 * interacting variables. A valid baseline and one variable at a time at its
 * boundaries, plus the critical combinations (debt-to-income, age + term)
 * and the calculation compared with the oracle.
 *
 * Only the human-readable text is translated; the case parsers are shared
 * with the Spanish version (same function references). They accept a dot
 * as the decimal separator when it has 1–2 decimals («5000.01»).
 */
export const m02DesignEn: TestDesignModel = {
  ...m02Design,
  areas: [
    {
      id: 'age',
      label: 'Age',
      inputLabel: 'Applicant\'s age (everything else: valid baseline)',
      inputPlaceholder: 'E.g.: 17 · 18 · 70 · 71',
      expectedQuestion: 'Can it be simulated (valid age)?',
      partitions: [
        { id: 'just_below', label: '17 (just below the minimum)', technique: 'Boundary values', core: true, hint: 'Test the lower boundary from outside…' },
        { id: 'min', label: '18 (minimum)', technique: 'Boundary values', core: true, hint: '…and from inside.' },
        { id: 'valid', label: 'Valid age in between', technique: 'Equivalence partitioning', core: true, hint: 'A normal case?' },
        { id: 'max', label: '70 (maximum)', technique: 'Boundary values', core: true, hint: 'The maximum is a boundary too…' },
        { id: 'just_above', label: '71 (just above the maximum)', technique: 'Boundary values', core: true, hint: '…and one year more.' },
        { id: 'out', label: 'Far out of range', technique: 'Equivalence partitioning', hint: '' },
      ],
    },
    {
      id: 'amount',
      label: 'Amount',
      inputLabel: 'Amount (everything else: valid baseline)',
      inputPlaceholder: 'E.g.: 999 · 1000 · 30000 · 30100 · 6050',
      expectedQuestion: 'Can it be simulated (valid amount)?',
      partitions: [
        { id: 'just_below', label: 'Below €1,000', technique: 'Boundary values', core: true, hint: 'Lower boundary from outside…' },
        { id: 'min', label: '€1,000 (minimum)', technique: 'Boundary values', core: true, hint: '…and from inside.' },
        { id: 'valid', label: 'Normal valid amount', technique: 'Equivalence partitioning', core: true, hint: 'A normal case?' },
        { id: 'max', label: '€30,000 (maximum)', technique: 'Boundary values', core: true, hint: 'The maximum…' },
        { id: 'just_above', label: 'Above €30,000', technique: 'Boundary values', core: true, hint: '…and just above it.' },
        { id: 'not_multiple', label: 'Not a multiple of €100', technique: 'Equivalence partitioning', core: true, hint: 'Read the amount rule carefully: there is more than a minimum and a maximum.' },
      ],
    },
    {
      id: 'term',
      label: 'Term',
      inputLabel: 'Term in months (everything else: valid baseline)',
      inputPlaceholder: 'E.g.: 11 · 12 · 84 · 85',
      expectedQuestion: 'Can it be simulated (valid term)?',
      partitions: [
        { id: 'just_below', label: '11 months', technique: 'Boundary values', core: true, hint: 'Lower boundary from outside…' },
        { id: 'min', label: '12 months (minimum)', technique: 'Boundary values', core: true, hint: '…and from inside.' },
        { id: 'valid', label: 'Normal valid term', technique: 'Equivalence partitioning', core: true, hint: 'A normal case?' },
        { id: 'max', label: '84 months (maximum)', technique: 'Boundary values', core: true, hint: 'The maximum…' },
        { id: 'just_above', label: '85 months', technique: 'Boundary values', core: true, hint: '…and one more.' },
      ],
    },
    {
      id: 'income',
      label: 'Income',
      inputLabel: 'Net monthly income (everything else: valid baseline)',
      inputPlaceholder: 'E.g.: 999 · 1000 · 2500',
      expectedQuestion: 'Can it be simulated (sufficient income)?',
      partitions: [
        { id: 'just_below', label: 'Below €1,000', technique: 'Boundary values', core: true, hint: 'Income has a minimum: test it from outside…' },
        { id: 'min', label: '€1,000 (minimum)', technique: 'Boundary values', core: true, hint: '…and right on it.' },
        { id: 'valid', label: 'Comfortable income', technique: 'Equivalence partitioning', core: true, hint: 'A normal case?' },
      ],
    },
    {
      id: 'tier',
      label: 'Interest band',
      inputLabel: 'Amount around €10,000 (compare the nominal rate with the policy)',
      inputPlaceholder: 'E.g.: 9500 · 9900 · 10000 · 10100',
      expectedQuestion: 'Can it be simulated?',
      partitions: [
        { id: 'below_far', label: 'Well below (€9,000–€9,800)', technique: 'Equivalence partitioning', core: true, hint: 'The interest rate changes at a threshold: test far from it…' },
        { id: 'below', label: 'Just below (€9,900)', technique: 'Boundary values', core: true, hint: '…just before it…' },
        { id: 'exact', label: 'Exactly €10,000', technique: 'Boundary values', core: true, hint: '…right on the threshold…' },
        { id: 'above', label: 'Above (€10,100 or more)', technique: 'Boundary values', core: true, hint: '…and after it.' },
      ],
    },
    {
      id: 'ratio',
      label: 'Debt-to-income (35%)',
      inputLabel: 'Income for a €15,000 loan over 36 months (monthly payment €455.99)',
      inputPlaceholder: 'E.g.: 1100 · 1250 · 1310 · 2000',
      expectedQuestion: 'Is it pre-approved?',
      partitions: [
        { id: 'approve', label: 'Ratio ≤ 35% (income ≥ €1,302.83)', technique: 'Equivalence partitioning', core: true, hint: 'A case that should be approved?' },
        { id: 'reject_near', label: 'Ratio between 35% and 40%', technique: 'Boundary values', core: true, hint: 'Get close to the 35% limit from above, without going much over…' },
        { id: 'reject_far', label: 'Ratio above 40%', technique: 'Equivalence partitioning', core: true, hint: '…and well above it.' },
      ],
    },
    {
      id: 'age_term',
      label: 'Age + term (≤ 75)',
      inputLabel: '«age;term» for €12,000 with an income of €4,000',
      inputPlaceholder: 'E.g.: 60;84 · 68;84 · 70;84',
      expectedQuestion: 'Is it pre-approved?',
      partitions: [
        { id: 'under', label: 'Ends before age 75', technique: 'Equivalence partitioning', core: true, hint: 'A case that should be approved?' },
        { id: 'exact', label: 'Ends exactly at age 75', technique: 'Boundary values', core: true, hint: 'There is a rule that combines two variables: look for its boundary…' },
        { id: 'over', label: 'Ends after age 75', technique: 'Boundary values', core: true, hint: '…and go past it.' },
      ],
    },
    {
      id: 'rounding',
      label: 'Monthly payment calculation',
      inputLabel: '«amount;term» to compare the monthly payment with Risk\'s table',
      inputPlaceholder: 'E.g.: 6000;48 · 10000;60',
      expectedQuestion: 'Can it be simulated?',
      partitions: [
        { id: 'oracle', label: 'Case compared with the oracle', technique: 'Test oracle', core: true, hint: 'Monthly payments get tested too: compare them with a reference result.' },
      ],
    },
  ],
}
