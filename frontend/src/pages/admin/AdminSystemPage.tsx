import { useSearchParams } from 'react-router-dom'
import { PremiumHero } from '../../components/admin/premium/PremiumHero'
import { AdminTabs } from '../../components/admin/premium/AdminTabs'
import { useI18n } from '../../i18n'
import { AdminSystemStatusPanel } from './AdminSystemStatusPage'
import { AdminErrorLogsPanel } from './AdminErrorLogsPage'
import { AdminDataResetPanel } from './AdminDataResetPage'
import { AdminDemoDataPanel } from './AdminDemoDataPage'

type TabKey = 'status' | 'errors' | 'reset' | 'demo'

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'status', labelKey: 'adminSystem.tabs.status' },
  { key: 'errors', labelKey: 'adminSystem.tabs.errors' },
  { key: 'reset', labelKey: 'adminSystem.tabs.reset' },
  { key: 'demo', labelKey: 'adminSystem.tabs.demo' },
]

const isTab = (v: string | null): v is TabKey => TABS.some((x) => x.key === v)

export function AdminSystemPage() {
  const { t } = useI18n()
  // La pestaña vive en la URL (?tab=errors) para poder enlazarla y conservarla al recargar.
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tab')
  const tab: TabKey = isTab(raw) ? raw : 'status'
  const setTab = (key: TabKey) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (key === 'status') next.delete('tab')
        else next.set('tab', key)
        return next
      },
      { replace: true },
    )

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="emerald"
        badge={t('adminSystem.heroBadge')}
        title={t('adminSystem.title')}
        subtitle={t('adminSystem.subtitle')}
      />

      <AdminTabs
        label={t('adminSystem.title')}
        tabs={TABS.map((x) => ({ key: x.key, label: t(x.labelKey) }))}
        active={tab}
        onChange={setTab}
      />

      {tab === 'status' && <AdminSystemStatusPanel onViewErrors={() => setTab('errors')} />}
      {tab === 'errors' && <AdminErrorLogsPanel />}
      {tab === 'reset' && <AdminDataResetPanel />}
      {tab === 'demo' && <AdminDemoDataPanel />}
    </div>
  )
}
