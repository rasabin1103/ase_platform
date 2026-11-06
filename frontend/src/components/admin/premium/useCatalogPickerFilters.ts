import { useMemo, useState } from 'react'
import type { CatalogItemAdmin } from '../../../api/catalogAdmin.api'

export type PickerFilters = { search: string; type: string; category: string; level: string }
const EMPTY: PickerFilters = { search: '', type: '', category: '', level: '' }

/** Búsqueda + filtros (tipo, categoría, nivel) compartidos por los selectores de ítems de los planes. */
export function useCatalogPickerFilters(items: CatalogItemAdmin[]) {
  const [filters, setFilters] = useState<PickerFilters>(EMPTY)

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [items],
  )

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return items.filter(
      (item) =>
        (!q || item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)) &&
        (!filters.type || item.type === filters.type) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.level || item.level === filters.level),
    )
  }, [items, filters])

  const active = Boolean(filters.type || filters.category || filters.level)
  return { filters, setFilters, categories, filtered, active, reset: () => setFilters(EMPTY) }
}
