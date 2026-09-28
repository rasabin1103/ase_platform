import { useMemo, useState } from 'react'
import type { CatalogItemAdmin } from '../../../api/catalogAdmin.api'
import type { PlanCatalogItemDiscountInput } from '../../../types/plan.types'
import { Input } from '../../ui/Input'
import { Badge } from '../../ui/Badge'
import { useI18n } from '../../../i18n'

type Props = {
  items: CatalogItemAdmin[]
  /** Items already included in the plan are excluded from the picker —
   * an included item is always free to the subscriber, never sold at a
   * discount (see product decision: "siempre van a poder visualizarse
   * dentro del plan, la limitación va a ser la descarga"). */
  excludedIds: number[]
  value: PlanCatalogItemDiscountInput[]
  onChange: (value: PlanCatalogItemDiscountInput[]) => void
}

/** Checkbox list + per-item percentage input used by the plan create/edit
 * form to define discounts on items the plan does NOT include — mirrors
 * CatalogItemPicker's layout, but each selected row also carries a
 * discount_percent value. */
export function CatalogItemDiscountPicker({ items, excludedIds, value, onChange }: Props) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')

  const excluded = useMemo(() => new Set(excludedIds), [excludedIds])
  const eligible = useMemo(() => items.filter((item) => !excluded.has(item.id)), [items, excluded])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return eligible
    return eligible.filter((item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
  }, [eligible, search])

  const byId = useMemo(() => new Map(value.map((d) => [d.catalog_item_id, d])), [value])

  const toggle = (id: number) => {
    if (byId.has(id)) {
      onChange(value.filter((d) => d.catalog_item_id !== id))
    } else {
      onChange([...value, { catalog_item_id: id, discount_percent: 10 }])
    }
  }

  const setPercent = (id: number, percent: number) => {
    onChange(value.map((d) => (d.catalog_item_id === id ? { ...d, discount_percent: percent } : d)))
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder={t('plansPage.create.placeholders.catalogSearch') as string}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-2">
        {filtered.length === 0 ? (
          <p className="p-2 text-xs text-ase-muted">{t('plansPage.create.helpers.noCatalogItems')}</p>
        ) : (
          filtered.map((item) => {
            const discount = byId.get(item.id)
            const checked = Boolean(discount)
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.04]"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="shrink-0" />
                  <span className="truncate text-ase-text2">{item.title}</span>
                  <Badge variant="default" className="shrink-0">
                    {item.type}
                  </Badge>
                </label>
                {checked ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={discount!.discount_percent}
                      onChange={(e) => setPercent(item.id, Number(e.target.value))}
                      className="h-8 w-16 px-2 text-xs"
                    />
                    <span className="text-xs text-ase-muted">%</span>
                  </span>
                ) : null}
              </div>
            )
          })
        )}
      </div>
      {value.length > 0 && (
        <p className="text-[11px] text-ase-muted">
          {String(t('plansPage.create.helpers.selectedCount')).replace('{{count}}', String(value.length))}
        </p>
      )}
    </div>
  )
}
