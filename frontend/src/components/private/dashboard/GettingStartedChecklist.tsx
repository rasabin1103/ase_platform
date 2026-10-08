import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyPurchases } from '../../../api/consumerCatalog.api'
import { getMyCvProfile } from '../../../api/jobPostings.api'
import { useAuth } from '../../../hooks/useAuth'
import { useI18n } from '../../../i18n'
import { cn } from '../../ui/cn'

const DISMISS_KEY = 'ase.getting_started_dismissed'

const COPY = {
  es: {
    eyebrow: 'Primeros pasos',
    title: 'Saca partido a tu cuenta',
    progress: (d: number, n: number) => `${d} de ${n} completados`,
    hide: 'Ocultar',
    steps: {
      profile: ['Completa tu perfil', 'Añade tu foto y tu nombre visible.'],
      security: ['Activa la verificación en dos pasos', 'Protege tu cuenta con un segundo factor.'],
      cv: ['Sube tu CV', 'Ordenamos las ofertas según lo que encajas.'],
      library: ['Consigue tu primer recurso', 'Hay recursos gratuitos para empezar.'],
    },
  },
  en: {
    eyebrow: 'Getting started',
    title: 'Make the most of your account',
    progress: (d: number, n: number) => `${d} of ${n} done`,
    hide: 'Hide',
    steps: {
      profile: ['Complete your profile', 'Add your photo and display name.'],
      security: ['Turn on two-step verification', 'Protect your account with a second factor.'],
      cv: ['Upload your CV', 'We rank job postings by how well you fit.'],
      library: ['Get your first resource', 'There are free resources to start with.'],
    },
  },
} as const

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Lista de primeros pasos del dashboard independiente. Cada paso se marca
 * solo a partir de datos reales de la cuenta; la tarjeta desaparece al
 * completarlos todos o si el usuario la oculta.
 */
export function GettingStartedChecklist() {
  const { language } = useI18n()
  const c = language === 'en' ? COPY.en : COPY.es
  const { currentUser } = useAuth()
  const [dismissed, setDismissed] = useState(readDismissed)
  const cv = useQuery({ queryKey: ['job-postings-my-cv'], queryFn: getMyCvProfile, retry: false })
  const purchases = useQuery({ queryKey: ['my-purchases'], queryFn: listMyPurchases })

  if (dismissed || !currentUser || cv.isLoading || purchases.isLoading) return null

  const steps = [
    { key: 'profile', to: '/profile', done: Boolean(currentUser.has_avatar && currentUser.display_name) },
    { key: 'security', to: '/profile', done: Boolean(currentUser.two_factor_enabled) },
    { key: 'cv', to: '/job-postings', done: Boolean(cv.data?.has_cv) },
    { key: 'library', to: '/catalog/resources', done: (purchases.data?.items.length ?? 0) > 0 },
  ] as const
  const doneCount = steps.filter((s) => s.done).length
  if (doneCount === steps.length) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* sin almacenamiento: se oculta solo en esta visita */
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-ase-surface/80 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2.5 text-label font-semibold uppercase text-sky-300">
            <span className="h-px w-6 bg-sky-400/60" />
            {c.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-ase-text">{c.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ase-muted">{c.progress(doneCount, steps.length)}</span>
          <button
            type="button"
            onClick={dismiss}
            aria-label={c.hide}
            className="grid h-8 w-8 place-items-center rounded-lg text-ase-muted transition hover:bg-white/[0.06] hover:text-ase-text"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
      >
        <div className="h-full rounded-full ase-gradient-brand" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map(({ key, to, done }, i) => {
          const [label, hint] = c.steps[key]
          const body = (
            <>
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold',
                  done ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40' : 'bg-white/[0.05] text-ase-text2 ring-1 ring-white/10',
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-sm font-semibold', done ? 'text-ase-muted line-through' : 'text-ase-text')}>
                  {label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ase-muted">{hint}</span>
              </span>
              {!done ? (
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ase-muted transition group-hover:translate-x-0.5 group-hover:text-ase-text" aria-hidden />
              ) : null}
            </>
          )
          return (
            <li key={key}>
              {done ? (
                <div className="flex h-full items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">{body}</div>
              ) : (
                <Link
                  to={to}
                  className="group flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-ase-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
                >
                  {body}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
