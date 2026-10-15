import type { RiskModel } from '../../../../engine/types'

/** Risk-based prioritization for release 5.1 (a senior QA's reference). */
export const m05RiskEn: RiskModel = {
  topN: 3,
  submitCost: 5,
  reviewer: 'laura',
  items: [
    {
      id: 'instant',
      label: 'Instant transfers (new fee engine)',
      description: 'A big change in 5.1, with customer money and a campaign on Monday.',
      reference: { p: 3, i: 3, why: 'New code that charges money: very likely to fail and, if it does, it affects everyone using it from Monday.' },
    },
    {
      id: 'auth',
      label: 'Access and session (updated authentication library)',
      description: 'Login with password, fingerprint and Face ID; session timeout.',
      reference: { p: 2, i: 3, why: 'A library update looks small, but if login or the session fails, everything fails (or there\'s a security risk).' },
    },
    {
      id: 'cards',
      label: 'Cards (Android freeze fix)',
      description: 'Fix for the beta bug.',
      reference: { p: 2, i: 3, why: 'Fixes break things nearby: if freezing is fixed, unfreezing has to be tested.' },
    },
    {
      id: 'loans',
      label: 'Loans (new 5.75% nominal rate from €10,000)',
      description: 'Change to a tier parameter.',
      reference: { p: 2, i: 2, why: 'A small change, but on a classic ">" versus ">=" threshold.' },
    },
    {
      id: 'scheduled',
      label: 'Scheduled transfers',
      description: 'No functional changes in 5.1.',
      reference: { p: 2, i: 2, why: 'The functionality doesn\'t change, but 5.1 updates the date library it uses: indirect risk.' },
    },
    {
      id: 'payments',
      label: 'Payments (Kobalto Pay)',
      description: 'No changes in 5.1.',
      reference: { p: 1, i: 3, why: 'High impact, but nothing has changed and it shares no touched dependencies.' },
    },
    {
      id: 'onboarding',
      label: 'Onboarding, texts and accessibility',
      description: 'New onboarding texts.',
      reference: { p: 2, i: 1, why: 'The texts change, but a failure here doesn\'t block anyone.' },
    },
  ],
}
