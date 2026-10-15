import type { RiskModel } from '../../../../engine/types'

/** Risk-based prioritization of KOB-163 (a senior QA's reference), English version. */
export const m02RiskEn: RiskModel = {
  topN: 2,
  submitCost: 5,
  reviewer: 'laura',
  items: [
    {
      id: 'ratio',
      label: 'Debt-to-income limit (35%)',
      description: 'Monthly payment versus income: decides whether it is pre-approved.',
      reference: { p: 3, i: 3, why: 'A regulatory rule with a new calculation: very likely to fail and, if it does, the bank grants loans it should not.' },
    },
    {
      id: 'age_term',
      label: 'Age at the end of repayment (≤ 75)',
      description: 'A rule that combines age and term.',
      reference: { p: 2, i: 3, why: 'Rules that combine variables are hardly ever tested; breaching it is a problem with Risk.' },
    },
    {
      id: 'tier',
      label: 'Interest band (€10,000)',
      description: 'The nominal rate changes from a certain amount.',
      reference: { p: 2, i: 2, why: 'A classic «>» versus «>=» threshold; it affects the price, but only within one range.' },
    },
    {
      id: 'rounding',
      label: 'Monthly payment calculation and rounding',
      description: 'French amortization method, rounded to the cent.',
      reference: { p: 2, i: 2, why: 'Small errors, but repeated across thousands of loans; the offer shown is binding.' },
    },
    {
      id: 'age',
      label: 'Age (18–70)',
      description: 'Applicant\'s age range.',
      reference: { p: 2, i: 2, why: 'A simple validation, but a minor would be a legal problem.' },
    },
    {
      id: 'amount',
      label: 'Amount (€1,000–€30,000)',
      description: 'Range and multiples of €100.',
      reference: { p: 1, i: 2, why: 'A simple and visible validation.' },
    },
    {
      id: 'term',
      label: 'Term (12–84 months)',
      description: 'Range of the term.',
      reference: { p: 1, i: 2, why: 'A simple and visible validation.' },
    },
  ],
}
