import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getFlAccess } from '../../api/freelance.api'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { CalendarTab } from './CalendarTab'
import { ClientsTab } from './ClientsTab'
import { DashboardTab } from './DashboardTab'
import { ExpensesTab } from './ExpensesTab'
import { InvoicesTab } from './InvoicesTab'
import { SettingsTab } from './SettingsTab'
import { SimulatorTab } from './SimulatorTab'
import { SummaryTab } from './SummaryTab'
import { WealthTab } from './WealthTab'
import { useFt } from './useFt'

const SECTIONS = {
  summary: SummaryTab,
  invoices: InvoicesTab,
  clients: ClientsTab,
  expenses: ExpensesTab,
  dashboard: DashboardTab,
  calendar: CalendarTab,
  simulator: SimulatorTab,
  wealth: WealthTab,
  settings: SettingsTab,
} as const
type Section = keyof typeof SECTIONS

/** Gestión de autónomo nativa. Cada sección es una entrada del submenú lateral
 * (`/freelance/<sección>`). El acceso lo decide el servidor: administrador,
 * compra del producto o plan que lo incluya. */
export function FreelancePage() {
  const { ft } = useFt()
  const { section } = useParams()
  const navigate = useNavigate()
  const access = useQuery({ queryKey: ['fl-access'], queryFn: getFlAccess, staleTime: 60_000 })

  if (!section) return <Navigate to="/freelance/summary" replace />
  if (!(section in SECTIONS)) return <Navigate to="/freelance/summary" replace />
  const Current = SECTIONS[section as Section]

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-ase-text">{ft('title')} · {ft(`tabs.${section}`)}</h1>
        <p className="mt-1 max-w-3xl text-sm text-ase-muted">{ft('intro')}</p>
      </header>
      {access.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {access.data === false ? (
        <EmptyState
          title={ft('noAccess')}
          actionLabel={ft('seePlans')}
          onAction={() => navigate('/pricing')}
          secondaryActionLabel={ft('seeCatalog')}
          onSecondaryAction={() => navigate('/catalog/products')}
        />
      ) : null}
      {access.data === true ? <Current /> : null}
      <p className="text-xs text-ase-muted">
        {ft('disclaimer')} <Link to="/freelance/settings" className="underline">{ft('tabs.settings')}</Link>
      </p>
    </div>
  )
}
