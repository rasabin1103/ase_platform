import { ArrowUpRight, Calculator, CreditCard, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../../i18n'
import { cn } from '../../ui/cn'

type Current = 'engine' | 'plans' | 'services'

const COPY = {
  es: {
    title: 'Precios en ASE',
    hint: 'Los precios se gestionan en tres sitios relacionados:',
    engine: 'Motor de precios',
    engineHint: 'Reglas y precio de cada ítem del catálogo',
    plans: 'Planes',
    plansHint: 'Suscripciones, ítems incluidos y descuentos',
    services: 'Servicios',
    servicesHint: 'Consultoría y servicios a medida',
    here: 'Estás aquí',
  },
  en: {
    title: 'Pricing in ASE',
    hint: 'Prices are managed in three related places:',
    engine: 'Pricing engine',
    engineHint: 'Rules and price of each catalog item',
    plans: 'Plans',
    plansHint: 'Subscriptions, included items and discounts',
    services: 'Services',
    servicesHint: 'Consulting and custom services',
    here: 'You are here',
  },
} as const

/** Mapa de dónde vive cada tipo de precio, para no perderse entre las tres pantallas. */
export function AdminPricingLinks({ current }: { current: Current }) {
  const { language } = useI18n()
  const c = language === 'en' ? COPY.en : COPY.es
  const items = [
    { key: 'engine' as const, to: '/admin/catalog?section=pricing', label: c.engine, hint: c.engineHint, Icon: Calculator },
    { key: 'plans' as const, to: '/admin/plans', label: c.plans, hint: c.plansHint, Icon: CreditCard },
    { key: 'services' as const, to: '/admin/services', label: c.services, hint: c.servicesHint, Icon: Wrench },
  ]
  return (
    <nav aria-label={c.title} className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <p className="text-xs text-ase-muted">
        <span className="font-semibold uppercase tracking-[0.18em]">{c.title}</span> · {c.hint}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {items.map(({ key, to, label, hint, Icon }) => {
          const here = key === current
          return (
            <li key={key}>
              <Link
                to={to}
                aria-current={here ? 'page' : undefined}
                className={cn(
                  'group flex h-full items-start gap-3 rounded-2xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
                  here
                    ? 'border-ase-brand/40 bg-ase-brand/[0.08]'
                    : 'border-white/[0.07] hover:border-white/20 hover:bg-white/[0.03]',
                )}
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', here ? 'text-sky-300' : 'text-ase-muted')} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ase-text">
                    {label}
                    {here ? (
                      <span className="rounded-full bg-ase-brand/20 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                        {c.here}
                      </span>
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 text-ase-muted transition group-hover:text-ase-text" aria-hidden />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-ase-muted">{hint}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
