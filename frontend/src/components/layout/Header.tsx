import { useNavigate } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '../ui/Button'
import { BrandLogo } from '../brand/BrandLogo'
import { NotificationBell } from './NotificationBell'
import { GlobalAdminSearch } from './GlobalAdminSearch'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

export function Header({
  sidebarCollapsed,
  onToggleSidebar,
}: {
  /** Whether the private-area sidebar is currently hidden — undefined on
   * layouts that don't render a collapsible sidebar at all (e.g. public
   * pages reusing this Header), in which case the toggle button is omitted. */
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}) {
  const navigate = useNavigate()
  const auth = useAuth()
  const { t, language, setLanguage } = useI18n()
  const isSuperAdmin = Boolean(auth.currentUser?.is_superuser)

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-ase-border bg-ase-bg2/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-ase-bg2/60">
      <div className="flex min-w-0 items-center gap-3">
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={(sidebarCollapsed ? t('session.expandSidebar') : t('session.collapseSidebar')) as string}
            title={(sidebarCollapsed ? t('session.expandSidebar') : t('session.collapseSidebar')) as string}
            className="flex shrink-0 items-center rounded-lg border border-white/10 bg-white/[0.03] p-2 text-ase-text2 transition hover:bg-white/[0.06] hover:text-ase-text"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        ) : null}
        <BrandLogo variant="horizontal" size="sm" showText subtitle="Enterprise dashboard" className="min-w-0" />
      </div>
      {isSuperAdmin ? <GlobalAdminSearch /> : null}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
              language === 'en' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
            )}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('es')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
              language === 'es' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
            )}
          >
            ES
          </button>
        </div>
        <Button variant="ghost" onClick={() => navigate('/')}>
          {t('session.publicSite')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            auth.logout()
            navigate('/', { replace: true })
          }}
        >
          {t('session.logout')}
        </Button>
      </div>
    </header>
  )
}

