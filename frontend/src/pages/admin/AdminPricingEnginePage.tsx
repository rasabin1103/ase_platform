import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  createPricingDimensionLevel,
  createPricingDimensionType,
  deletePricingDimensionLevel,
  deletePricingDimensionType,
  getPricingConfig,
  updatePillarBasePrice,
  updatePricingDimensionLevel,
  updatePricingDimensionType,
  type PricingDimensionLevel,
  type PricingDimensionTypeConfig,
  type PricingPillarCode,
  type PricingPillarConfig,
} from '../../api/pricingAdmin.api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { Switch } from '../../components/ui/Switch'
import { useI18n } from '../../i18n'
import { parseApiError } from '../../utils/apiError'

const PILLAR_ORDER: PricingPillarCode[] = ['product', 'course', 'book', 'resource', 'service']

export function AdminPricingEnginePanel() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin-pricing-config'], queryFn: getPricingConfig })
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['admin-pricing-config'] })

  const [dimensionTypeEditor, setDimensionTypeEditor] = useState<
    { pillarCode: PricingPillarCode; initial: PricingDimensionTypeConfig | null } | null
  >(null)
  const [levelEditor, setLevelEditor] = useState<
    { dimensionTypeId: number; isRangeBased: boolean; initial: PricingDimensionLevel | null } | null
  >(null)
  const [deletingDimensionType, setDeletingDimensionType] = useState<PricingDimensionTypeConfig | null>(null)
  const [deletingLevel, setDeletingLevel] = useState<PricingDimensionLevel | null>(null)

  const deleteDimensionTypeMut = useMutation({
    mutationFn: deletePricingDimensionType,
    onSuccess: () => {
      invalidate()
      setDeletingDimensionType(null)
    },
  })
  const deleteLevelMut = useMutation({
    mutationFn: deletePricingDimensionLevel,
    onSuccess: () => {
      invalidate()
      setDeletingLevel(null)
    },
  })

  const pillars = query.data?.pillars ?? []
  const byCode = new Map(pillars.map((p) => [p.code, p]))

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm text-ase-text2">{t('pricingAdmin.subtitle')}</p>

      {query.isLoading ? (
        <Skeleton className="h-56 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('pricingAdmin.loadError')} />
      ) : (
        <div className="space-y-6">
          {PILLAR_ORDER.map((code) => {
            const pillar = byCode.get(code)
            if (!pillar) return null
            return (
              <PillarCard
                key={code}
                pillar={pillar}
                onAddDimensionType={() => setDimensionTypeEditor({ pillarCode: code, initial: null })}
                onEditDimensionType={(d) => setDimensionTypeEditor({ pillarCode: code, initial: d })}
                onDeleteDimensionType={setDeletingDimensionType}
                onAddLevel={(dtype) =>
                  setLevelEditor({ dimensionTypeId: dtype.id, isRangeBased: dtype.is_range_based, initial: null })
                }
                onEditLevel={(dtype, l) =>
                  setLevelEditor({ dimensionTypeId: dtype.id, isRangeBased: dtype.is_range_based, initial: l })
                }
                onDeleteLevel={setDeletingLevel}
                onSaved={invalidate}
              />
            )
          })}
        </div>
      )}

      {dimensionTypeEditor && (
        <DimensionTypeEditorModal
          pillarCode={dimensionTypeEditor.pillarCode}
          initial={dimensionTypeEditor.initial}
          onClose={() => setDimensionTypeEditor(null)}
          onSaved={() => {
            invalidate()
            setDimensionTypeEditor(null)
          }}
        />
      )}

      {levelEditor && (
        <DimensionLevelEditorModal
          dimensionTypeId={levelEditor.dimensionTypeId}
          isRangeBased={levelEditor.isRangeBased}
          initial={levelEditor.initial}
          onClose={() => setLevelEditor(null)}
          onSaved={() => {
            invalidate()
            setLevelEditor(null)
          }}
        />
      )}

      <Modal open={Boolean(deletingDimensionType)} onClose={() => setDeletingDimensionType(null)} title={t('pricingAdmin.delete')}>
        <p className="text-sm text-ase-text2">{t('pricingAdmin.confirmDeleteDimensionType')}</p>
        <p className="mt-2 font-medium text-ase-text">{deletingDimensionType?.label}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeletingDimensionType(null)}>
            {t('pricingAdmin.cancel')}
          </Button>
          <Button
            variant="danger"
            disabled={deleteDimensionTypeMut.isPending}
            onClick={() => deletingDimensionType && deleteDimensionTypeMut.mutate(deletingDimensionType.id)}
          >
            {t('pricingAdmin.delete')}
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(deletingLevel)} onClose={() => setDeletingLevel(null)} title={t('pricingAdmin.delete')}>
        <p className="text-sm text-ase-text2">{t('pricingAdmin.confirmDelete')}</p>
        <p className="mt-2 font-medium text-ase-text">{deletingLevel?.label}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeletingLevel(null)}>
            {t('pricingAdmin.cancel')}
          </Button>
          <Button variant="danger" disabled={deleteLevelMut.isPending} onClick={() => deletingLevel && deleteLevelMut.mutate(deletingLevel.id)}>
            {t('pricingAdmin.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function PillarCard({
  pillar,
  onAddDimensionType,
  onEditDimensionType,
  onDeleteDimensionType,
  onAddLevel,
  onEditLevel,
  onDeleteLevel,
  onSaved,
}: {
  pillar: PricingPillarConfig
  onAddDimensionType: () => void
  onEditDimensionType: (d: PricingDimensionTypeConfig) => void
  onDeleteDimensionType: (d: PricingDimensionTypeConfig) => void
  onAddLevel: (dtype: PricingDimensionTypeConfig) => void
  onEditLevel: (dtype: PricingDimensionTypeConfig, l: PricingDimensionLevel) => void
  onDeleteLevel: (l: PricingDimensionLevel) => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [basePrice, setBasePrice] = useState(String(pillar.base_price))
  const [saved, setSaved] = useState(false)

  // Re-sync the editable field whenever the underlying pillar value changes
  // (e.g. after a save round-trips through the query) — adjusted during
  // render rather than in a useEffect, so it's a single render pass instead
  // of a render-then-effect-then-render cascade.
  const [prevBasePrice, setPrevBasePrice] = useState(pillar.base_price)
  if (pillar.base_price !== prevBasePrice) {
    setPrevBasePrice(pillar.base_price)
    setBasePrice(String(pillar.base_price))
  }

  const saveBaseMut = useMutation({
    mutationFn: () => updatePillarBasePrice(pillar.code, Number(basePrice)),
    onSuccess: () => {
      onSaved()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  return (
    <Card className="space-y-6 rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 backdrop-blur sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-ase-text">{t(`pricingAdmin.pillars.${pillar.code}`)}</h2>
        <div className="flex items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">
              {pillar.code === 'service' ? t('pricingAdmin.hourlyRateLabel') : t('pricingAdmin.basePriceLabel')}
            </span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-32 rounded-xl border-white/10 bg-ase-bg2/50"
            />
          </label>
          <Button size="sm" disabled={saveBaseMut.isPending} onClick={() => saveBaseMut.mutate()}>
            {saveBaseMut.isPending ? t('pricingAdmin.saving') : t('pricingAdmin.saveBasePrice')}
          </Button>
          {saved ? <span className="pb-2 text-sm text-emerald-300">{t('pricingAdmin.basePriceSaved')}</span> : null}
        </div>
      </div>
      <p className="-mt-3 text-xs text-ase-muted">
        {pillar.code === 'service' ? t('pricingAdmin.hourlyRateHint') : t('pricingAdmin.basePriceHint')}
      </p>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-muted">{t('pricingAdmin.dimensionTypesTitle')}</h3>
          <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={onAddDimensionType}>
            {t('pricingAdmin.addDimensionType')}
          </Button>
        </div>
        <p className="mb-3 text-[11px] leading-snug text-ase-muted">{t('pricingAdmin.dimensionTypesHint')}</p>
        {pillar.dimension_types.length === 0 ? (
          <p className="text-xs text-ase-muted">{t('pricingAdmin.emptyDimensionTypes')}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pillar.dimension_types.map((dtype) => (
              <div key={dtype.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ase-text">{dtype.label}</span>
                    {dtype.is_range_based ? <Badge variant="info">{t('pricingAdmin.rangeBasedBadge')}</Badge> : null}
                    {!dtype.is_active ? <Badge variant="default">{t('pricingAdmin.activeLabel')}: —</Badge> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEditDimensionType(dtype)}>
                      {t('pricingAdmin.edit')}
                    </Button>
                    <button type="button" onClick={() => onDeleteDimensionType(dtype)} className="text-ase-error hover:opacity-80">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mb-3 text-[11px] leading-snug text-ase-muted">
                  {dtype.is_range_based ? t('pricingAdmin.dimensionHintBook') : t('pricingAdmin.dimensionHintGeneric')}
                </p>

                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('pricingAdmin.levelsTitle')}</span>
                  <Button size="sm" variant="ghost" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAddLevel(dtype)}>
                    {t('pricingAdmin.addDimensionLevel')}
                  </Button>
                </div>
                {dtype.levels.length === 0 ? (
                  <p className="text-xs text-ase-muted">{t('pricingAdmin.emptyDimensionLevels')}</p>
                ) : (
                  <div className="space-y-2">
                    {dtype.levels.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ase-text">{l.label}</p>
                          <p className="text-xs text-ase-muted">
                            ×{l.multiplier}
                            {dtype.is_range_based ? ` · ${l.min_value ?? 0}–${l.max_value ?? '∞'}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => onEditLevel(dtype, l)}>
                            {t('pricingAdmin.edit')}
                          </Button>
                          <button type="button" onClick={() => onDeleteLevel(l)} className="text-ase-error hover:opacity-80">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function DimensionTypeEditorModal({
  pillarCode,
  initial,
  onClose,
  onSaved,
}: {
  pillarCode: PricingPillarCode
  initial: PricingDimensionTypeConfig | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [code, setCode] = useState(initial?.code ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [isRangeBased, setIsRangeBased] = useState(initial?.is_range_based ?? false)
  const [displayOrder, setDisplayOrder] = useState(String(initial?.display_order ?? 0))
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [serverError, setServerError] = useState<string | null>(null)

  const codePattern = /^[a-z0-9_]+$/
  const codeValid = codePattern.test(code)

  const saveMut = useMutation({
    mutationFn: async () => {
      if (initial) {
        return updatePricingDimensionType(initial.id, {
          label,
          is_range_based: isRangeBased,
          display_order: Number(displayOrder),
          is_active: isActive,
        })
      }
      return createPricingDimensionType({
        pillar_code: pillarCode,
        code,
        label,
        is_range_based: isRangeBased,
        display_order: Number(displayOrder),
        is_active: isActive,
      })
    },
    onSuccess: onSaved,
    onError: (err) => setServerError(parseApiError(err, t('pricingAdmin.saveError') as string).message),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? t('pricingAdmin.editDimensionType') : t('pricingAdmin.newDimensionType')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('pricingAdmin.cancel')}
          </Button>
          <Button disabled={!label || (!initial && !codeValid) || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? t('pricingAdmin.saving') : t('pricingAdmin.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs text-ase-muted">{t('pricingAdmin.labelLabel')}</span>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('pricingAdmin.dimensionLabelPlaceholder') as string} />
        </label>
        {!initial && (
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('pricingAdmin.codeLabel')}</span>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              placeholder="funcionalidad"
            />
            <span className="mt-1 block text-[11px] text-ase-muted">{t('pricingAdmin.codeHint')}</span>
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-xs text-ase-muted">{t('pricingAdmin.displayOrderLabel')}</span>
          <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
        </label>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <div>
            <span className="block text-sm text-ase-text2">{t('pricingAdmin.rangeBasedLabel')}</span>
            <span className="block text-[11px] text-ase-muted">{t('pricingAdmin.rangeBasedHint')}</span>
          </div>
          <Switch checked={isRangeBased} onCheckedChange={setIsRangeBased} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <span className="text-sm text-ase-text2">{t('pricingAdmin.activeLabel')}</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        {serverError && <div className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{serverError}</div>}
      </div>
    </Modal>
  )
}

function DimensionLevelEditorModal({
  dimensionTypeId,
  isRangeBased,
  initial,
  onClose,
  onSaved,
}: {
  dimensionTypeId: number
  isRangeBased: boolean
  initial: PricingDimensionLevel | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [label, setLabel] = useState(initial?.label ?? '')
  const [multiplier, setMultiplier] = useState(String(initial?.multiplier ?? '1.0'))
  const [minValue, setMinValue] = useState(initial?.min_value != null ? String(initial.min_value) : '')
  const [maxValue, setMaxValue] = useState(initial?.max_value != null ? String(initial.max_value) : '')
  const [displayOrder, setDisplayOrder] = useState(String(initial?.display_order ?? 0))
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [serverError, setServerError] = useState<string | null>(null)

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        dimension_type_id: dimensionTypeId,
        label,
        multiplier: Number(multiplier),
        min_value: isRangeBased && minValue !== '' ? Number(minValue) : null,
        max_value: isRangeBased && maxValue !== '' ? Number(maxValue) : null,
        display_order: Number(displayOrder),
        is_active: isActive,
      }
      if (initial) return updatePricingDimensionLevel(initial.id, payload)
      return createPricingDimensionLevel(payload)
    },
    onSuccess: onSaved,
    onError: (err) => setServerError(parseApiError(err, t('pricingAdmin.saveError') as string).message),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? t('pricingAdmin.editLevel') : t('pricingAdmin.newLevel')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('pricingAdmin.cancel')}
          </Button>
          <Button disabled={!label || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? t('pricingAdmin.saving') : t('pricingAdmin.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs text-ase-muted">{t('pricingAdmin.labelLabel')}</span>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ase-muted">{t('pricingAdmin.multiplierLabel')}</span>
          <Input type="number" min={0.001} step="0.01" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
        </label>
        {isRangeBased && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('pricingAdmin.minPagesLabel')}</span>
              <Input type="number" min={0} value={minValue} onChange={(e) => setMinValue(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('pricingAdmin.maxPagesLabel')}</span>
              <Input type="number" min={0} value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
            </label>
          </div>
        )}
        <label className="block">
          <span className="mb-1 block text-xs text-ase-muted">{t('pricingAdmin.displayOrderLabel')}</span>
          <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
        </label>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <span className="text-sm text-ase-text2">{t('pricingAdmin.activeLabel')}</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        {serverError && <div className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{serverError}</div>}
      </div>
    </Modal>
  )
}
