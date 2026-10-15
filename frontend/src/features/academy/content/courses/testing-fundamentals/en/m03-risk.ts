import type { RiskModel } from '../../../../engine/types'

/** Risk-based prioritization for KOB-170 (a senior QA's reference). */
export const m03RiskEn: RiskModel = {
  topN: 3,
  submitCost: 5,
  reviewer: 'laura',
  items: [
    {
      id: 'refund_source',
      label: 'Refunding from disallowed states',
      description: 'Refunds on cancelled, authorized-only or disputed payments.',
      reference: { p: 3, i: 3, why: 'This is where real money is lost, and nobody tests it because "the button shouldn\'t be used". It already happened in production with disputes.' },
    },
    {
      id: 'cumulative',
      label: 'Cumulative refund amount',
      description: 'Several partial refunds on the same payment.',
      reference: { p: 2, i: 3, why: 'Validating each refund against the original amount instead of the remaining amount is a classic mistake; if it fails, more is refunded than was collected.' },
    },
    {
      id: 'dispute',
      label: 'Disputes and chargebacks',
      description: 'Opening, winning and losing disputes; how they relate to refunds.',
      reference: { p: 2, i: 3, why: 'A rarely used lifecycle with money at stake: a lost dispute plus a refund means paying twice.' },
    },
    {
      id: 'capture',
      label: 'Cancel and settle',
      description: 'Cancel before settling; never settle what was cancelled.',
      reference: { p: 1, i: 3, why: 'Simple rules, but charging a cancelled payment directly affects the customer.' },
    },
    {
      id: 'fees',
      label: 'Refund fee',
      description: 'Finance\'s decision table: plan, type and period.',
      reference: { p: 2, i: 2, why: 'Many combinations and a 30-day boundary: easy to get wrong, but the amount is small and can be corrected.' },
    },
    {
      id: 'happy_path',
      label: 'Happy path',
      description: 'Authorize → settle → refund.',
      reference: { p: 1, i: 3, why: 'If it fails, nothing works; but it\'s exactly what Diego has already tested.' },
    },
    {
      id: 'ui',
      label: 'Console texts and presentation',
      description: 'Labels, state colors, history.',
      reference: { p: 1, i: 1, why: 'Internal tool: a clumsy text doesn\'t lose money.' },
    },
  ],
}
