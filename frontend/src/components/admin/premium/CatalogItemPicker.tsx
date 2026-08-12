import { useMemo, useState } from 'react'
import type { CatalogItemAdmin } from '../../../api/catalogAdmin.api'
import { Input } from '../../ui/Input'
import { Badge } from '../../ui/Badge'
import { useI18n } from '../../../i18n'

type Props = {
  items: CatalogItemAdmin[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

/** Checkbox list used by the plan create/edit form to pick which real
 * catalog items a plan includes — replaces the old free-text feature
 * bullets with a selection sourced straight from the app's catalog. */
export function CatalogItemPicker({ items, selectedIds, onChange }: Props) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
  }, [items, search])

  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
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
            const checked = selectedIds.includes(item.id)
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.04]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="shrink-0" />
                  <span className="truncate text-ase-text2">{item.title}</span>
                </span>
                <Badge variant="default" className="shrink-0">
                  {item.type}
                </Badge>
              </label>
            )
          })
        )}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-[11px] text-ase-muted">
          {String(t('plansPage.create.helpers.selectedCount')).replace('{{count}}', String(selectedIds.length))}
        </p>
      )}
    </div>
  )
}
