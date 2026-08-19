import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { cn } from '../../components/ui/cn'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { AdminCatalogCategoriesPanel } from './AdminCatalogCategoriesPage'
import { AdminPricingEnginePanel } from './AdminPricingEnginePage'

type TabKey = 'categories' | 'pricing'

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'categories', labelKey: 'adminCatalogSettings.tabs.categories' },
  { key: 'pricing', labelKey: 'adminCatalogSettings.tabs.pricing' },
]

export function AdminCatalogSettingsPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<TabKey>('categories')

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="cyan"
        badge={t('adminCatalogSettings.heroBadge')}
        title={t('adminCatalogSettings.title')}
        subtitle={t('adminCatalogSettings.subtitle')}
      />

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-semibold transition',
                tab === item.key
                  ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                  : 'border-white/10 bg-white/[0.03] text-ase-muted hover:text-ase-text',
              )}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </Card>

      {tab === 'categories' && <AdminCatalogCategoriesPanel />}
      {tab === 'pricing' && <AdminPricingEnginePanel />}
    </div>
  )
}
