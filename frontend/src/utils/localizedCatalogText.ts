// Same helper as components/public/pricingFromPlans.ts's localizedPlanText,
// kept as its own small copy for catalog items so this module doesn't pull
// in the pricing/plans component tree. Falls back to the Spanish value
// whenever the English one is missing (item saved before _en fields
// existed, translation failed, etc.) — Spanish is always populated.
export function localizedCatalogText(
  language: 'en' | 'es',
  esValue: string | null | undefined,
  enValue: string | null | undefined,
): string {
  if (language === 'en' && enValue) return enValue
  return esValue ?? ''
}
