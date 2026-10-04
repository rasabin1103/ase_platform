/** The adaptability ranges and their colors — the single source of truth
 * so a given compatibility percentage always maps to the same tier/color
 * everywhere it's shown (card, modal, detail page). Kept in its own file
 * (not CompatibilityAnalysis.tsx) so that component file only exports
 * components — see components/ui/buttonStyles.ts for the same pattern. */
export function compatibilityTier(pct: number): {
  variant: 'error' | 'warning' | 'info' | 'success'
  labelKey: string
} {
  if (pct >= 75) return { variant: 'success', labelKey: 'jobPostingsPage.cv.tier.high' }
  if (pct >= 50) return { variant: 'info', labelKey: 'jobPostingsPage.cv.tier.good' }
  if (pct >= 30) return { variant: 'warning', labelKey: 'jobPostingsPage.cv.tier.moderate' }
  return { variant: 'error', labelKey: 'jobPostingsPage.cv.tier.low' }
}
