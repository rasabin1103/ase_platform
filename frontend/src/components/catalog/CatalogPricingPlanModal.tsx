import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import type { CatalogItemAdmin } from '../../api/catalogAdmin.api'
import type {
  CatalogItemTypeScope,
  PricingBillingInterval,
  PricingPlan,
  PricingPlanPayload,
  PricingPlanType,
  PricingSupportLevel,
} from '../../api/pricingAdmin.api'
import { buildPricingPlanFormSchema } from '../../lib/admin/pricingPlanForm.schema'
import { Button } from '../ui/Button'
import { FieldError, FormFieldLabel } from '../ui/FormFieldLabel'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { StringListEditor } from './StringListEditor'

const CATALOG_TYPES: CatalogItemTypeScope[] = ['product', 'course', 'book', 'resource']

const PLAN_TYPES: PricingPlanType[] = [
  'free',
  'one_time',
  'subscription',
  'lifetime',
  'request_quote',
]
const INTERVALS: PricingBillingInterval[] = ['none', 'monthly', 'quarterly', 'yearly']
const SUPPORT: PricingSupportLevel[] = ['none', 'basic', 'priority', 'enterprise']

type FormValues = z.infer<ReturnType<typeof buildPricingPlanFormSchema>>

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
  scope_catalog_types: [],
  scope_categories: [],
}

function inputErrorClass(hasError: boolean) {
  return cn(hasError && 'border-ase-error/50 ring-1 ring-ase-error/30')
}

type PlanFieldProps = {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}

function PlanField({ label, required, error, className, children }: PlanFieldProps) {
  return (
    <label className={cn('block', className)}>
      <FormFieldLabel label={label} required={required} />
      {children}
      <FieldError message={error} />
    </label>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  initial?: PricingPlan | null
  onSubmit: (payload: PricingPlanPayload) => Promise<void>
  isSubmitting?: boolean
  catalogItems?: CatalogItemAdmin[]
  catalogItemId?: number
  onCatalogItemIdChange?: (id: number) => void
  /** When true, plan scope is catalog types/categories instead of a single item. */
  bundleMode?: boolean
  categoryOptions?: string[]
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
  bundleMode = false,
  categoryOptions = [],
}: Props) {
  const { t } = useI18n()
  const isEdit = Boolean(initial)
  const requireCatalogItem = !bundleMode && !isEdit && Boolean(catalogItems?.length)
  const schema = useMemo(
    () => buildPricingPlanFormSchema(t, { requireScope: bundleMode && !isEdit }),
    [t, bundleMode, isEdit],
  )
  const [catalogItemError, setCatalogItemError] = useState<string | undefined>()
  const form = useForm<FormValues>({
    defaultValues: defaults,
    resolver: zodResolver(schema) as Resolver<FormValues>,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const planType = form.watch('plan_type')
  const paidPlan = planType === 'one_time' || planType === 'subscription' || planType === 'lifetime'
  const { errors } = form.formState

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
        catalog_item_id: initial.catalog_item_id ?? undefined,
        scope_catalog_types: initial.scope_catalog_types ?? [],
        scope_categories: initial.scope_categories ?? [],
      })
    } else {
      form.reset({
        ...defaults,
        catalog_item_id: bundleMode ? undefined : catalogItemId,
      })
    }
    setCatalogItemError(undefined)
  }, [open, initial, form, catalogItemId, bundleMode])

  const scopeTypes = form.watch('scope_catalog_types')
  const scopeCategories = form.watch('scope_categories')

  const toggleScopeType = (type: CatalogItemTypeScope) => {
    const next = scopeTypes.includes(type)
      ? scopeTypes.filter((t) => t !== type)
      : [...scopeTypes, type]
    form.setValue('scope_catalog_types', next, { shouldValidate: true })
  }

  const toggleScopeCategory = (category: string) => {
    const next = scopeCategories.includes(category)
      ? scopeCategories.filter((c) => c !== category)
      : [...scopeCategories, category]
    form.setValue('scope_categories', next)
  }

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
          if (requireCatalogItem && !catalogItemId) {
            setCatalogItemError(String(t('adminFormValidation.selectCatalogItem')))
            return
          }
          setCatalogItemError(undefined)
          await onSubmit({
            ...values,
            catalog_item_id: bundleMode ? null : values.catalog_item_id ?? catalogItemId ?? null,
            scope_catalog_types: bundleMode ? values.scope_catalog_types : undefined,
            scope_categories: bundleMode ? values.scope_categories : [],
            slug: values.slug?.trim() || undefined,
            description: values.description?.trim() || null,
          })
          onClose()
        })}
      >
        {!isEdit && catalogItems?.length && !bundleMode ? (
          <label className="block">
            <FormFieldLabel
              label={t('adminPricingPlans.selectCatalogItem') as string}
              required
            />
            <Select
              className={inputErrorClass(Boolean(catalogItemError))}
              value={catalogItemId ?? ''}
              onChange={(e) => {
                onCatalogItemIdChange?.(Number(e.target.value))
                setCatalogItemError(undefined)
              }}
            >
              <option value="">—</option>
              {catalogItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.type})
                </option>
              ))}
            </Select>
            <FieldError message={catalogItemError} />
          </label>
        ) : null}

        {bundleMode ? (
          <section className="space-y-4 rounded-xl border border-violet-300/20 bg-violet-500/5 p-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-300/90">
                {t('catalogPricing.scope.section')}
              </h3>
              <p className="mt-1 text-xs text-ase-muted">{t('catalogPricing.scope.typesHint')}</p>
            </div>
            <PlanField
              label={t('catalogPricing.scope.types') as string}
              required
              error={errors.scope_catalog_types?.message}
            >
              <div className="flex flex-wrap gap-2">
                {CATALOG_TYPES.map((type) => {
                  const active = scopeTypes.includes(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        active
                          ? 'border-violet-300/50 bg-violet-500/20 text-violet-100'
                          : 'border-white/15 text-ase-muted hover:border-white/25',
                      )}
                      onClick={() => toggleScopeType(type)}
                    >
                      {t(`catalogPricing.scope.typeLabels.${type}`)}
                    </button>
                  )
                })}
              </div>
            </PlanField>
            {categoryOptions.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-ase-text2">{t('catalogPricing.scope.categories')}</p>
                <p className="mt-0.5 text-xs text-ase-muted">{t('catalogPricing.scope.categoriesHint')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categoryOptions.map((category) => {
                    const active = scopeCategories.includes(category)
                    return (
                      <button
                        key={category}
                        type="button"
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition',
                          active
                            ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100'
                            : 'border-white/15 text-ase-muted hover:border-white/25',
                        )}
                        onClick={() => toggleScopeCategory(category)}
                      >
                        {category}
                      </button>
                    )
                  })}
                </div>
                {scopeCategories.length === 0 ? (
                  <p className="mt-2 text-xs text-ase-muted">{t('catalogPricing.scope.allCategories')}</p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            {t('catalogPricing.sections.basic')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <PlanField
              label={t('catalogPricing.fields.name') as string}
              required
              error={errors.name?.message}
              className="sm:col-span-2"
            >
              <Input className={inputErrorClass(Boolean(errors.name))} {...form.register('name')} />
            </PlanField>
            <PlanField label={t('catalogPricing.fields.slug') as string}>
              <Input {...form.register('slug')} placeholder="auto" />
            </PlanField>
            <PlanField label={t('catalogPricing.fields.planType') as string} required>
              <Select {...form.register('plan_type')}>
                {PLAN_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`catalogPricing.planType.${pt}`)}
                  </option>
                ))}
              </Select>
            </PlanField>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" {...form.register('is_active')} />
              <span className="text-sm text-ase-text2">{t('catalogPricing.fields.isActive')}</span>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" {...form.register('is_default')} />
              <span className="text-sm text-ase-text2">{t('catalogPricing.fields.isDefault')}</span>
            </label>
            <PlanField label={t('catalogPricing.fields.description') as string} className="sm:col-span-2">
              <textarea
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                rows={3}
                {...form.register('description')}
              />
            </PlanField>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            {t('catalogPricing.sections.price')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <PlanField
              label={t('catalogPricing.fields.price') as string}
              required={paidPlan}
              error={errors.price?.message}
            >
              <Input
                type="number"
                step="0.01"
                className={inputErrorClass(Boolean(errors.price))}
                {...form.register('price')}
              />
            </PlanField>
            <PlanField
              label={t('catalogPricing.fields.currency') as string}
              required
              error={errors.currency?.message}
            >
              <Input className={inputErrorClass(Boolean(errors.currency))} {...form.register('currency')} />
            </PlanField>
            <PlanField label={t('catalogPricing.fields.billingInterval') as string}>
              <Select {...form.register('billing_interval')} disabled={planType !== 'subscription'}>
                {INTERVALS.map((iv) => (
                  <option key={iv} value={iv}>
                    {t(`catalogPricing.interval.${iv}`)}
                  </option>
                ))}
              </Select>
            </PlanField>
            <PlanField label={t('catalogPricing.fields.trialDays') as string}>
              <Input
                type="number"
                {...form.register('trial_days', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </PlanField>
            <PlanField label={t('catalogPricing.fields.setupFee') as string}>
              <Input
                type="number"
                step="0.01"
                {...form.register('setup_fee', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </PlanField>
            <PlanField label={t('catalogPricing.fields.discount') as string}>
              <Input
                type="number"
                step="0.01"
                {...form.register('discount_percentage', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              />
            </PlanField>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            {t('catalogPricing.sections.access')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <PlanField label={t('catalogPricing.fields.accessDays') as string}>
              <Input
                type="number"
                {...form.register('access_duration_days', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                })}
              />
            </PlanField>
            <PlanField label={t('catalogPricing.fields.maxUsers') as string}>
              <Input
                type="number"
                {...form.register('max_users', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </PlanField>
            <PlanField label={t('catalogPricing.fields.maxDownloads') as string}>
              <Input
                type="number"
                {...form.register('max_downloads', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </PlanField>
            <PlanField label={t('catalogPricing.fields.supportLevel') as string}>
              <Select {...form.register('support_level')}>
                {SUPPORT.map((s) => (
                  <option key={s} value={s}>
                    {t(`catalogPricing.support.${s}`)}
                  </option>
                ))}
              </Select>
            </PlanField>
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
          <Button type="submit" disabled={isSubmitting}>
            {t('catalogPricing.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
