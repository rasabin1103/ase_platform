export type BillingCycle = 'monthly' | 'yearly' | 'one_time'

/** active: visible + purchasable. coming_soon: visible on the public
 * pricing page but checkout is refused — for announcing a plan before it's
 * ready to sell. inactive: fully hidden from the public site. */
export type PlanStatus = 'active' | 'coming_soon' | 'inactive'

export type PlanFeature = {
  id: number
  plan_id: number
  text: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PlanCatalogItem = {
  id: number
  catalog_item_id: number
  display_order: number
  title: string
  slug: string
  type: string
  short_description: string
}

/** One (catalog_item_id, discount_percent) pair for an item this plan does
 * NOT include — see PlanCatalogItemDiscountCreate/Read on the backend. */
export type PlanCatalogItemDiscount = {
  id: number
  catalog_item_id: number
  discount_percent: string | number
  title: string
  slug: string
  type: string
}

export type PlanCatalogItemDiscountInput = {
  catalog_item_id: number
  discount_percent: number
}

export type Plan = {
  id: number
  code: string
  name: string
  billing_cycle: BillingCycle
  price: string | null
  currency: string
  is_active: boolean
  status: PlanStatus
  created_at: string
  updated_at: string
  description?: string | null
  short_description?: string | null
  display_order?: number
  is_recommended?: boolean
  cta_label?: string | null
  /** Stripe Price id (price_...) this plan's subscription checkout uses. Null = not sellable via Stripe yet. */
  stripe_price_id?: string | null
  /** Annual price when catalog API exposes monthly + annual on one row (Railway public catalog). */
  annual_price?: string | null
  /** English mirror of name/short_description/description/cta_label — auto-translated by the backend, editable by the admin. */
  name_en?: string | null
  short_description_en?: string | null
  description_en?: string | null
  cta_label_en?: string | null
  /** Deprecated free-text bullets — only populated for plans created before the catalog picker existed. */
  features?: PlanFeature[]
  included_catalog_items?: PlanCatalogItem[]
  /** Shared monthly download quota across every included item — null means unlimited (every plan's default). */
  monthly_download_limit?: number | null
  /** Every loyalty_bonus_interval_months, this many extra downloads are added to that month's quota. */
  loyalty_bonus_downloads?: number | null
  loyalty_bonus_interval_months?: number | null
  /** Discounts on items this plan does NOT include — see PlanCatalogItemDiscount above. */
  discount_items?: PlanCatalogItemDiscount[]
}

export type PlanListResponse = {
  items: Plan[]
  limit: number
  offset: number
  total: number
}

export type PlanFeatureCreateRequest = {
  text: string
  display_order?: number
  is_active?: boolean
}

export type PlanCreateRequest = {
  code: string
  name: string
  billing_cycle?: BillingCycle
  price?: number | string | null
  currency?: string
  is_active?: boolean
  status?: PlanStatus
  description?: string | null
  short_description?: string | null
  display_order?: number
  is_recommended?: boolean
  cta_label?: string | null
  catalog_item_ids?: number[] | null
  stripe_price_id?: string | null
  name_en?: string | null
  short_description_en?: string | null
  description_en?: string | null
  cta_label_en?: string | null
  monthly_download_limit?: number | null
  loyalty_bonus_downloads?: number | null
  loyalty_bonus_interval_months?: number | null
  discount_items?: PlanCatalogItemDiscountInput[] | null
}


/** Matches backend PlanUpdate (app/modules/plans/schemas.py): every field is
 * independently nullable, not just optional — sending an explicit `null`
 * clears it, distinct from omitting the key entirely (unlike
 * PlanCreateRequest, where `code`/`name` are required strings). */
export type PlanUpdateRequest = {
  code?: string | null
  name?: string | null
  billing_cycle?: BillingCycle | null
  price?: number | string | null
  currency?: string | null
  is_active?: boolean | null
  status?: PlanStatus | null
  description?: string | null
  short_description?: string | null
  display_order?: number | null
  is_recommended?: boolean | null
  cta_label?: string | null
  catalog_item_ids?: number[] | null
  stripe_price_id?: string | null
  name_en?: string | null
  short_description_en?: string | null
  description_en?: string | null
  cta_label_en?: string | null
  monthly_download_limit?: number | null
  loyalty_bonus_downloads?: number | null
  loyalty_bonus_interval_months?: number | null
  discount_items?: PlanCatalogItemDiscountInput[] | null
  clear_monthly_download_limit?: boolean
  clear_loyalty_bonus?: boolean
}

