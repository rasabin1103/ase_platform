import { Link } from 'react-router-dom'
import { Badge } from '../../ui/Badge'
import { Card } from '../../ui/Card'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

type ActionId = 'createOrg' | 'inviteMember' | 'createProduct' | 'createPlan' | 'viewAudit'

const ACTIONS: Array<{ id: ActionId; to: string; icon: string }> = [
  { id: 'createOrg', to: '/organizations', icon: '⬡' },
  { id: 'inviteMember', to: '/users', icon: '◉' },
  { id: 'createProduct', to: '/products', icon: '◇' },
  { id: 'createPlan', to: '/plans', icon: '◈' },
  { id: 'viewAudit', to: '/audit-logs', icon: '○' },
]

export function QuickActionsGrid() {
  const { t } = useI18n()

  return (
    <section className="relative">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
            {t('dashboardPage.quickActions.badge')}
          </Badge>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{t('dashboardPage.quickActions.title')}</h2>
          <p className="mt-2 max-w-3xl text-sm text-ase-text2 sm:text-base">{t('dashboardPage.quickActions.subtitle')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ACTIONS.map((a) => (
          <Link key={a.id} to={a.to} className="block">
            <Card
              interactive
              className={cn(
                'group relative overflow-hidden rounded-3xl border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md',
                'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_55px_rgba(0,0,0,0.55)]',
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.10),transparent_55%)]" />
              </div>
              <div className="relative z-[1] flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-ase-text">
                  {a.icon}
                </span>
                <span className="mt-1 h-2 w-2 rounded-full bg-ase-accent/70 shadow-[0_0_18px_rgba(34,211,238,0.22)]" />
              </div>
              <div className="relative z-[1] mt-4 text-sm font-extrabold tracking-tight text-ase-text">
                {t(`dashboardPage.quickActions.items.${a.id}.title`)}
              </div>
              <p className="relative z-[1] mt-2 text-sm leading-relaxed text-ase-text2">
                {t(`dashboardPage.quickActions.items.${a.id}.body`)}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

