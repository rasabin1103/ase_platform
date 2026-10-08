import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, ArrowUpRight, ClipboardCheck, MessageSquare, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { listAdminAccessRequests } from '../../../api/access_requests.api'
import { getErrorLogsSummary } from '../../../api/errorLogs.api'
import { listAllSuggestions } from '../../../api/suggestions.api'
import { useI18n } from '../../../i18n'
import { cn } from '../../ui/cn'

const COPY = {
  es: {
    title: 'Pendiente de revisar',
    requests: 'Solicitudes de acceso',
    escalated: 'Escaladas por organizaciones',
    suggestions: 'Sugerencias nuevas',
    errors: 'Errores en 24 h',
    clear: 'Todo al día',
    review: 'Revisar',
    create: 'Crear contenido',
    newPost: 'Nuevo artículo',
    newJob: 'Nueva oferta',
    newItem: 'Nuevo ítem del catálogo',
  },
  en: {
    title: 'Waiting for review',
    requests: 'Access requests',
    escalated: 'Escalated by organizations',
    suggestions: 'New suggestions',
    errors: 'Errors in 24 h',
    clear: 'All caught up',
    review: 'Review',
    create: 'Create content',
    newPost: 'New article',
    newJob: 'New job posting',
    newItem: 'New catalog item',
  },
} as const

/**
 * Cola de pendientes del dashboard admin: solicitudes y sugerencias sin
 * revisar y errores recientes, cada uno enlazando a su pantalla, más
 * accesos directos para crear contenido. Una tarjeta cuya consulta falla
 * se oculta en lugar de mostrar un dato falso.
 */
export function AdminPendingQueue() {
  const { language } = useI18n()
  const c = language === 'en' ? COPY.en : COPY.es

  const requests = useQuery({
    queryKey: ['admin-pending', 'requests'],
    queryFn: () => listAdminAccessRequests({ status: 'pending', limit: 1 }),
    staleTime: 60_000,
  })
  const escalated = useQuery({
    queryKey: ['admin-pending', 'escalated'],
    queryFn: () => listAdminAccessRequests({ status: 'pending', escalated: true, limit: 1 }),
    staleTime: 60_000,
  })
  const suggestions = useQuery({
    queryKey: ['admin-pending', 'suggestions'],
    queryFn: () => listAllSuggestions({ status: 'pending', limit: 1 }),
    staleTime: 60_000,
  })
  const errors = useQuery({
    queryKey: ['admin-pending', 'errors'],
    queryFn: getErrorLogsSummary,
    staleTime: 60_000,
  })

  const cards = [
    {
      key: 'requests',
      label: c.requests,
      value: requests.data?.total,
      ok: !requests.isError,
      to: '/requests',
      Icon: ClipboardCheck,
    },
    {
      key: 'escalated',
      label: c.escalated,
      value: escalated.data?.total,
      ok: !escalated.isError,
      to: '/requests?escalated=1',
      Icon: ArrowUpRight,
    },
    {
      key: 'suggestions',
      label: c.suggestions,
      value: suggestions.data?.total,
      ok: !suggestions.isError,
      to: '/admin/suggestions',
      Icon: MessageSquare,
    },
    {
      key: 'errors',
      label: c.errors,
      value: errors.data?.last_24h,
      ok: !errors.isError,
      to: '/admin/system',
      Icon: AlertTriangle,
      danger: true,
    },
  ].filter((card) => card.ok)

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="rounded-3xl border border-white/10 bg-ase-surface/80 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{c.title}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ key, label, value, to, Icon, danger }) => {
            const loading = value === undefined
            const pending = (value ?? 0) > 0
            return (
              <li key={key}>
                <Link
                  to={to}
                  className={cn(
                    'group flex h-full flex-col rounded-2xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
                    pending
                      ? danger
                        ? 'border-rose-400/30 bg-rose-400/[0.07] hover:border-rose-400/50'
                        : 'border-amber-400/30 bg-amber-400/[0.06] hover:border-amber-400/50'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        pending ? (danger ? 'text-rose-300' : 'text-amber-300') : 'text-emerald-300',
                      )}
                      aria-hidden
                    />
                    <ArrowRight
                      className="h-4 w-4 text-ase-muted transition group-hover:translate-x-0.5 group-hover:text-ase-text"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-ase-text">
                    {loading ? '—' : value}
                  </p>
                  <p className="mt-1 text-sm text-ase-text2">{label}</p>
                  {!loading && (
                    <p
                      className={cn(
                        'mt-2 text-xs font-semibold',
                        pending ? (danger ? 'text-rose-300' : 'text-amber-300') : 'text-emerald-300',
                      )}
                    >
                      {pending ? c.review : c.clear}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-3xl border border-white/10 bg-ase-surface/80 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{c.create}</p>
        <div className="mt-4 grid gap-2">
          <QuickCreate to="/admin/blog/new">{c.newPost}</QuickCreate>
          <QuickCreate to="/admin/job-postings/new">{c.newJob}</QuickCreate>
          <QuickCreate to="/admin/catalog">{c.newItem}</QuickCreate>
        </div>
      </div>
    </section>
  )
}

function QuickCreate({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm font-medium text-ase-text transition hover:border-ase-brand/40 hover:bg-ase-brand/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ase-brand/15 text-sky-300">
        <Plus className="h-4 w-4" aria-hidden />
      </span>
      {children}
    </Link>
  )
}
