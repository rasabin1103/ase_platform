import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { CatalogItemAdmin } from '../../api/catalogAdmin.api'
import type {
  PricingBillingInterval,
  PricingPlan,
  PricingPlanPayload,
  PricingPlanType,
  PricingSupportLevel,
} from '../../api/pricingAdmin.api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { useI18n } from '../../i18n'
import { StringListEditor } from './StringListEditor'

const PLAN_TYPES: PricingPlanType[] = [
  'free',
  'one_time',
  'subscription',
  'lifetime',
  'request_quote',
]
const INTERVALS: PricingBillingInterval[] = ['none', 'monthly', 'quarterly', 'yearly']
const SUPPORT: PricingSupportLevel[] = ['none', 'basic', 'priority', 'enterprise']

type FormValues = PricingPlanPayload & { features: string[]; limitations: string[] }

const defaults: FormValues = {
  name: '',
  slug: '',
  description: '',
  plan_type: 'one_time',
  billing_interval: 'none',
  price: 0,
  currency: 'EUR',
  trial_days: null,
  setup_fee: null,
  discount_percentage: null,
  is_active: true,
  is_default: false,
  max_users: null,
  max_downloads: null,
  access_duration_days: null,
  includes_updates: false,
  includes_support: false,
  support_level: 'none',
  features: [],
  limitations: [],
}

type Props = {
  open: boolean
  onClose: () => void
  initial?: PricingPlan | null
  onSubmit: (payload: PricingPlanPayload) => Promise<void>
  isSubmitting?: boolean
  /** Required when creating from the global plans page */
  catalogItems?: CatalogItemAdmin[]
  catalogItemId?: number
  onCatalogItemIdChange?: (id: number) => void
}

export function CatalogPricingPlanModal({
  open,
  onClose,
  initial,
  onSubmit,
  isSubmitting,
  catalogItems,
  catalogItemId,
  onCatalogItemIdChange,
}: Props) {
  const { t } = useI18n()
  const isEdit = Boolean(initial)
  const form = useForm<FormValues>({ defaultValues: defaults })
  const planType = form.watch('plan_type')

  useEffect(() => {
    if (!open) return
    if (initial) {
      form.reset({
        name: initial.name,
        slug: initial.slug,
        description: initial.description ?? '',
        plan_type: initial.plan_type,
        billing_interval: initial.billing_interval,
        price: Number(initial.price),
        currency: initial.currency,
        trial_days: initial.trial_days,
        setup_fee: initial.setup_fee != null ? Number(initial.setup_fee) : null,
        discount_percentage:
          initial.discount_percentage != null ? Number(initial.discount_percentage) : null,
        is_active: initial.is_active,
        is_default: initial.is_default,
        max_users: initial.max_users,
        max_downloads: initial.max_downloads,
        access_duration_days: initial.access_duration_days,
        includes_updates: initial.includes_updates,
        includes_support: initial.includes_support,
        support_level: initial.support_level,
        features: initial.features ?? [],
        limitations: initial.limitations ?? [],
      })
    } else {
      form.reset(defaults)
    }
  }, [open, initial, form])

  useEffect(() => {
    if (planType === 'subscription') return
    if (planType === 'one_time' || planType === 'lifetime' || planType === 'free' || planType === 'request_quote') {
      form.setValue('billing_interval', 'none')
    }
    if (planType === 'free' || planType === 'request_quote') {
      form.setValue('price', 0)
    }
  }, [planType, form])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('catalogPricing.edit') : t('catalogPricing.create')}
      size="wide"
    >
      <form
        className="max-h-[70vh] space-y-8 overflow-y-auto pr-1"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            ...values,
            slug: values.slug?.trim() || undefined,
            description: values.description?.trim() || null,
          })
          onClose()
        })}
      >
        {!isEdit && catalogItems?.length ? (
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminPricingPlans.selectCatalogItem')}</span>
            <Select
              value={catalogItemId ?? ''}
              onChange={(e) => onCatalogItemIdChange?.(Number(e.target.value))}
              required
            >
              <option value="">—</option>
              {catalogItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.type})
                </option>
              ))}
            </Select>
          </label>
        ) : null}

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            {t('catalogPricing.sections.basic')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.name')}</span>
              <Input {...form.register('name', { required: true })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.slug')}</span>
              <Input {...form.register('slug')} placeholder="auto" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.planType')}</span>
              <Select {...form.register('plan_type')}>
                {PLAN_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`catalogPricing.planType.${pt}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" {...form.register('is_active')} />
              <span className="text-sm text-ase-text2">{t('catalogPricing.fields.isActive')}</span>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" {...form.register('is_default')} />
              <span className="text-sm text-ase-text2">{t('catalogPricing.fields.isDefault')}</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.description')}</span>
              <textarea
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                rows={3}
                {...form.register('description')}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            {t('catalogPricing.sections.price')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.price')}</span>
              <Input type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.currency')}</span>
              <Input {...form.register('currency')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.billingInterval')}</span>
              <Select {...form.register('billing_interval')} disabled={planType !== 'subscription'}>
                {INTERVALS.map((iv) => (
                  <option key={iv} value={iv}>
                    {t(`catalogPricing.interval.${iv}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.trialDays')}</span>
              <Input type="number" {...form.register('trial_days', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.setupFee')}</span>
              <Input type="number" step="0.01" {...form.register('setup_fee', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.discount')}</span>
              <Input
                type="number"
                step="0.01"
                {...form.register('discount_percentage', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            {t('catalogPricing.sections.access')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.accessDays')}</span>
              <Input
                type="number"
                {...form.register('access_duration_days', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.maxUsers')}</span>
              <Input type="number" {...form.register('max_users', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.maxDownloads')}</span>
              <Input
                type="number"
                {...form.register('max_downloads', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('catalogPricing.fields.supportLevel')}</span>
              <Select {...form.register('support_level')}>
                {SUPPORT.map((s) => (
                  <option key={s} value={s}>
                    {t(`catalogPricing.support.${s}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register('includes_updates')} />
              <span className="text-sm text-ase-text2">{t('catalogPricing.fields.includesUpdates')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register('includes_support')} />
              <span className="text-sm text-ase-text2">{t('catalogPricing.fields.includesSupport')}</span>
            </label>
          </div>
        </section>

        <StringListEditor
          label={t('catalogPricing.sections.features')}
          addLabel={t('catalogPricing.fields.addFeature')}
          items={form.watch('features')}
          onChange={(items) => form.setValue('features', items)}
        />
        <StringListEditor
          label={t('catalogPricing.sections.limitations')}
          addLabel={t('catalogPricing.fields.addLimitation')}
          items={form.watch('limitations')}
          onChange={(items) => form.setValue('limitations', items)}
        />

        {isEdit && initial ? (
          <section className="space-y-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-muted">
              {t('catalogPricing.sections.stripe')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-ase-muted">
              <div>
                <span className="block text-xs">{t('catalogPricing.fields.stripeProductId')}</span>
                <span className="text-ase-text2">{initial.stripe_product_id ?? '—'}</span>
              </div>
              <div>
                <span className="block text-xs">{t('catalogPricing.fields.stripePriceId')}</span>
                <span className="text-ase-text2">{initial.stripe_price_id ?? '—'}</span>
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('catalogPricing.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              (!isEdit && (catalogItems?.length ?? 0) > 0 && !catalogItemId)
            }
          >
            {t('catalogPricing.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
