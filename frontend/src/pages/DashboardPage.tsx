import { DashboardHero } from '../components/private/dashboard/DashboardHero'
import { MetricsOverview } from '../components/private/dashboard/MetricsOverview'
import { PlatformActivityCharts } from '../components/private/dashboard/PlatformActivityCharts'
import { SystemHealthPanel } from '../components/private/dashboard/SystemHealthPanel'
import { RecentActivityFeed } from '../components/private/dashboard/RecentActivityFeed'
import { DashboardInsights } from '../components/private/dashboard/DashboardInsights'
import { QuickActionsGrid } from '../components/private/dashboard/QuickActionsGrid'

export function DashboardPage() {
  return (
    <div className="space-y-10">
      <DashboardHero />
      <MetricsOverview />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PlatformActivityCharts />
        </div>
        <div className="lg:col-span-4">
          <DashboardInsights />
        </div>
      </div>
      <SystemHealthPanel />
      <RecentActivityFeed />
      <QuickActionsGrid />
    </div>
  )
}

