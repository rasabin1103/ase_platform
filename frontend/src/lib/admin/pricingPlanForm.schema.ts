import { z } from 'zod'

type Translate = (key: string) => unknown

const paidPlanTypes = ['one_time', 'subscription', 'lifetime'] as const

const catalogTypes = ['product', 'course', 'book', 'resource'] as const

export function buildPricingPlanFormSchema(t: Translate, opts?: { requireScope?: boolean }) {
  const req = () => String(t('adminFormValidation.required') ?? 'Required')
  const currencyMsg = () => String(t('adminFormValidation.currency') ?? 'Invalid currency')
  const priceMsg = () => String(t('adminFormValidation.pricePositive') ?? 'Invalid price')

  return z
    .object({
      name: z.string().trim().min(1, req()).max(200),
      slug: z.string().max(160).optional().or(z.literal('')),
      description: z.string().optional().or(z.literal('')),
      plan_type: z.enum(['free', 'one_time', 'subscription', 'lifetime', 'request_quote']),
      billing_interval: z.enum(['none', 'monthly', 'quarterly', 'yearly']),
      price: z.coerce.number().min(0),
      currency: z
        .string()
        .trim()
        .min(3, currencyMsg())
        .max(3, currencyMsg())
        .transform((v) => v.toUpperCase()),
      trial_days: z.coerce.number().min(0).nullable().optional(),
      setup_fee: z.coerce.number().min(0).nullable().optional(),
      discount_percentage: z.coerce.number().min(0).max(100).nullable().optional(),
      is_active: z.boolean(),
      is_default: z.boolean(),
      max_users: z.coerce.number().min(0).nullable().optional(),
      max_downloads: z.coerce.number().min(0).nullable().optional(),
      access_duration_days: z.coerce.number().min(0).nullable().optional(),
      includes_updates: z.boolean(),
      includes_support: z.boolean(),
      support_level: z.enum(['none', 'basic', 'priority', 'enterprise']),
      features: z.array(z.string()),
      limitations: z.array(z.string()),
      catalog_item_id: z.number().int().positive().optional(),
      scope_catalog_types: z.array(z.enum(catalogTypes)).default([]),
      scope_categories: z.array(z.string()).default([]),
    })
    .superRefine((data, ctx) => {
      if (paidPlanTypes.includes(data.plan_type as (typeof paidPlanTypes)[number]) && data.price <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: priceMsg() })
      }
      if (opts?.requireScope && data.scope_catalog_types.length === 0 && !data.catalog_item_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scope_catalog_types'],
          message: String(t('adminFormValidation.scopeTypesRequired') ?? 'Select at least one catalog type'),
        })
      }
    })
}

export type PricingPlanFormSchemaValues = z.infer<ReturnType<typeof buildPricingPlanFormSchema>>
