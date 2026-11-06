import { Input } from '../../ui/Input'
import { useI18n } from '../../../i18n'
import type { PickerFilters } from './useCatalogPickerFilters'

const SELECT_CLS =
  'h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-ase-text2 outline-none focus:border-ase-brand'

type Props = {
  filters: PickerFilters
  categories: string[]
  active: boolean
  onChange: (f: PickerFilters) => void
  onReset: () => void
}

/** Búsqueda y filtros por tipo, categoría y nivel para los selectores de ítems de un plan. */
export function CatalogPickerFilters({ filters, categories, active, onChange, onReset }: Props) {
  const { t } = useI18n()
  const set = (patch: Partial<PickerFilters>) => onChange({ ...filters, ...patch })
  return (
    <div className="space-y-2">
      <Input
        placeholder={t('plansPage.create.placeholders.catalogSearch') as string}
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
      />
      <div className="flex flex-wrap gap-2">
        <select aria-label={t('plansPage.create.filters.type') as string} className={SELECT_CLS} value={filters.type} onChange={(e) => set({ type: e.target.value })}>
          <option value="">{t('plansPage.create.filters.allTypes')}</option>
          {(['course', 'book', 'product', 'resource'] as const).map((v) => (
            <option key={v} value={v}>{t(`plansPage.create.filters.types.${v}`)}</option>
          ))}
        </select>
        <select aria-label={t('plansPage.create.filters.category') as string} className={SELECT_CLS} value={filters.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">{t('plansPage.create.filters.allCategories')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select aria-label={t('plansPage.create.filters.level') as string} className={SELECT_CLS} value={filters.level} onChange={(e) => set({ level: e.target.value })}>
          <option value="">{t('plansPage.create.filters.allLevels')}</option>
          {(['beginner', 'intermediate', 'advanced'] as const).map((v) => (
            <option key={v} value={v}>{t(`plansPage.create.filters.levels.${v}`)}</option>
          ))}
        </select>
        {active ? (
          <button type="button" onClick={onReset} className="px-1 text-xs font-medium text-ase-brand hover:underline">
            {t('plansPage.create.filters.clear')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
