import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { BrandLogo } from '../brand/BrandLogo'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

export function Header() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { t, language, setLanguage } = useI18n()

  return (
    <header className="flex h-16 items-center justify-between border-b border-ase-border bg-ase-bg2/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-ase-bg2/60">
      <BrandLogo variant="horizontal" size="sm" showText className="min-w-0" />
      <div className="flex items-center gap-2">
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

