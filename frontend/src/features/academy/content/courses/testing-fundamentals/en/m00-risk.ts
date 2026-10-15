import type { RiskModel } from '../../../../engine/types'

/** Risk-based prioritization of KOB-142 (a senior QA's reference), English version. */
export const m00RiskEn: RiskModel = {
  topN: 3,
  submitCost: 5,
  reviewer: 'laura',
  items: [
    {
      id: 'amount',
      label: 'Amount',
      description: 'Validation of amounts, decimals and the per-transaction limit.',
      reference: { p: 3, i: 3, why: 'New logic with numbers, formats and limits (high likelihood) and it moves money (maximum impact).' },
    },
    {
      id: 'double',
      label: 'Double submission',
      description: 'Pressing «Confirm» several times or retrying.',
      reference: { p: 2, i: 3, why: 'Nobody tests it locally and a duplicate is lost money.' },
    },
    {
      id: 'daily',
      label: 'Daily limit',
      description: 'Total of several transfers on the same day.',
      reference: { p: 2, i: 3, why: 'It requires sequences the dev does not usually test; breaching it is a regulatory problem.' },
    },
    {
      id: 'iban',
      label: 'IBAN',
      description: 'Format and validity of the destination account.',
      reference: { p: 2, i: 2, why: 'Validation with its own rules; an error causes returns and complaints, but the bank recovers them.' },
    },
    {
      id: 'beneficiary',
      label: 'Beneficiary',
      description: 'Name of the recipient.',
      reference: { p: 1, i: 1, why: 'A simple text field; an error is easy to spot and has low impact.' },
    },
    {
      id: 'concept',
      label: 'Reference',
      description: 'Optional text of up to 140 characters.',
      reference: { p: 1, i: 1, why: 'Optional and with no effect on the money.' },
    },
  ],
}
