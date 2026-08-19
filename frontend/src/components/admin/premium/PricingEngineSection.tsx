import { useQuery } from '@tanstack/react-query'
import { getPricingConfig, type PricingPillarCode } from '../../../api/pricingAdmin.api'
import { calculateRecommendedPrice, matchDimensionLevelForQuantity } from '../../../utils/pricingEngine'
import { Select } from '../../ui/Select'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { useI18n } from '../../../i18n'

export type DimensionSelection = { dimension_type_id: number; dimension_level_id: number }

type Props = {
  pillarCode: PricingPillarCode
  /** One entry per manually-picked dimension type the item currently has a
   * level selected for — a pillar can have several "subelementos" (e.g.
   * product = Subtipo × Complejidad × Funcionalidad × Mantenimiento).
   * Range-based types (book "Páginas", service "Horas") are never in here;
   * those are driven by `quantity` instead. */
  dimensionSelections: DimensionSelection[]
  onDimensionSelectionsChange: (next: DimensionSelection[]) => void
  /** Range-based dimension types only (book "Páginas", service "Horas") —
   * the level is auto-matched from this instead of picked manually. Only
   * one range-based type is expected per pillar at a time. */
  quantity?: number | null
  onQuantityChange?: (n: number | null) => void
  onUseRecommended?: (price: number) => void
}

export function PricingEngineSection({
  pillarCode,
  dimensionSelections,
  onDimensionSelectionsChange,
  quantity,
  onQuantityChange,
  onUseRecommended,
}: Props) {
  const { t } = useI18n()
  const configQuery = useQuery({ queryKey: ['pricing-config'], queryFn: getPricingConfig, staleTime: 60_000 })
  const pillar = configQuery.data?.pillars.find((p) => p.code === pillarCode)

  if (!pillar) return null

  const dimensionTypes = pillar.dimension_types.filter((d) => d.is_active)

  function levelForType(typeId: number) {
    const dtype = dimensionTypes.find((d) => d.id === typeId)
    const levels = dtype?.levels.filter((l) => l.is_active) ?? []
    if (dtype?.is_range_based) {
      return quantity ? matchDimensionLevelForQuantity(levels, quantity) : null
    }
    const selectionId = dimensionSelections.find((s) => s.dimension_type_id === typeId)?.dimension_level_id
    return levels.find((l) => l.id === selectionId) ?? null
  }

  function setSelection(typeId: number, levelId: number | null) {
    const next = dimensionSelections.filter((s) => s.dimension_type_id !== typeId)
    if (levelId !== null) next.push({ dimension_type_id: typeId, dimension_level_id: levelId })
    onDimensionSelectionsChange(next)
  }

  const resolvedLevels = dimensionTypes
    .map((dtype) => ({ dtype, level: levelForType(dtype.id) }))
    .filter((r) => r.level !== null)

  const recommended =
    pillar.base_price > 0
      ? calculateRecommendedPrice(
          pillar.base_price,
          resolvedLevels.map((r) => r.level!.multiplier),
        )
      : null

  return (
    <div className="space-y-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 sm:col-span-2">
      <span className="block text-xs font-semibold uppercase tracking-wide text-cyan-200">
        {t('pricingEngine.sectionTitle')}
      </span>

      {pillar.base_price <= 0 ? (
        <p className="text-xs text-ase-muted">{t('pricingEngine.noBasePriceWarning')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {dimensionTypes.map((dtype) => {
            const levels = dtype.levels.filter((l) => l.is_active)
            if (dtype.is_range_based) {
              const matched = quantity ? matchDimensionLevelForQuantity(levels, quantity) : null
              return (
                <label className="block" key={dtype.id}>
                  <span className="mb-1 block text-xs text-ase-muted">{dtype.label}</span>
                  <Input
                    type="number"
                    min={1}
                    value={quantity ?? ''}
                    onChange={(e) => onQuantityChange?.(e.target.value ? Number(e.target.value) : null)}
                  />
                  {quantity ? (
                    <p className="mt-1 text-[11px] leading-snug text-ase-muted">
                      {matched
                        ? `${t('pricingEngine.matchedLevelPrefix')} ${matched.label} (×${matched.multiplier})`
                        : t('pricingEngine.noMatchedLevel')}
                    </p>
                  ) : null}
                </label>
              )
            }
            const selectionId = dimensionSelections.find((s) => s.dimension_type_id === dtype.id)?.dimension_level_id
            return (
              <label className="block" key={dtype.id}>
                <span className="mb-1 block text-xs text-ase-muted">{dtype.label}</span>
                <Select
                  value={selectionId ?? ''}
                  onChange={(e) => setSelection(dtype.id, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t('pricingEngine.dimensionPlaceholder')}</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} (×{l.multiplier})
                    </option>
                  ))}
                </Select>
              </label>
            )
          })}
        </div>
      )}

      {recommended !== null ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-emerald-200">
              {t('pricingEngine.recommendedPriceLabel')}: {recommended.toFixed(2)} €
            </p>
            <p className="text-[11px] text-ase-muted">
              {t('pricingEngine.breakdownPrefix')} {pillar.base_price} €
              {resolvedLevels.map((r) => ` × ${r.level!.multiplier}`).join('')}
            </p>
          </div>
          {onUseRecommended ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => onUseRecommended(recommended)}>
              {t('pricingEngine.useThisPrice')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
