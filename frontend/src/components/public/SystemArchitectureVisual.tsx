import { useQueries } from '@tanstack/react-query'
import { fetchPlatformHealth } from '../../api/health.api'
import { listPlansCatalog } from '../../api/plansCatalog.api'
import { listPublicServices } from '../../api/services.api'
import { useI18n } from '../../i18n'
import type { Plan } from '../../types/plan.types'
import type { Service, ServiceCategory } from '../../types/service.types'
import { formatPlanPrice } from './pricingFromPlans'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'

type PlanDotTone = 'gray' | 'blue' | 'purple'

const planDotToneClass: Record<PlanDotTone, string> = {
  gray: 'bg-white/40',
  blue: 'bg-ase-primary shadow-[0_0_14px_rgba(56,189,248,0.28)]',
  purple: 'bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.22)]',
}

function planDotTone(code: string): PlanDotTone {
  const slug = code.trim().toLowerCase()
  if (slug.includes('enterprise')) return 'purple'
  if (slug.includes('professional') || slug === 'pro' || slug.startsWith('pro_')) return 'blue'
  return 'gray'
}

function formatPlansCount(t: (key: string) => unknown, count: number): string {
  return (t('hero.preview.plansCount') as string).replace('{{count}}', String(count))
}

function serviceCategoryLabel(t: (key: string) => unknown, category: ServiceCategory): string {
  const key = `hero.preview.categories.${category}`
  const label = t(key)
  return typeof label === 'string' ? label : category
}

export function SystemArchitectureVisual() {
  const { t } = useI18n()

  const [plansQuery, servicesQuery, healthQuery] = useQueries({
    queries: [
      {
        queryKey: ['hero-preview', 'plans'],
        queryFn: listPlansCatalog,
        staleTime: 60_000,
        retry: 1,
      },
      {
        queryKey: ['hero-preview', 'services'],
        queryFn: () => listPublicServices({ limit: 3 }),
        staleTime: 60_000,
        retry: 1,
      },
      {
        queryKey: ['hero-preview', 'health'],
        queryFn: fetchPlatformHealth,
        staleTime: 30_000,
        retry: 1,
      },
    ],
  })

  const isLoading = plansQuery.isLoading || servicesQuery.isLoading || healthQuery.isLoading
  const plans = plansQuery.data ?? []
  const services = servicesQuery.data ?? []
  const health = healthQuery.data
  const systemLive = health?.backendOk === true

  return (
    <div className="relative w-full min-w-0" aria-label="ASE Platform Preview">
      <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-gradient-to-tr from-ase-primary/10 via-ase-accent/8 to-transparent blur-2xl sm:-inset-8" />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-ase-primary/10 blur-3xl sm:h-48 sm:w-48" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-ase-accent/8 blur-3xl sm:h-44 sm:w-44" />

      <Card
        interactive
        className={cn(
          'relative overflow-hidden rounded-2xl border-white/[0.06] bg-ase-surface p-4 sm:p-5 lg:p-6',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_16px_48px_rgba(0,0,0,0.45)]',
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="text-sm font-semibold text-ase-text">{t('hero.preview.title')}</div>
              {isLoading ? (
                <div className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
              ) : (
                <Badge
                  variant="info"
                  className={cn(
                    'text-xs sm:text-[13px]',
                    systemLive
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                      : 'border-amber-400/30 bg-amber-400/10 text-amber-300',
                  )}
                >
                  {systemLive ? t('hero.preview.liveBadge') : t('hero.preview.maintenanceBadge')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent lg:mt-5">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] lg:[background-size:28px_28px]" />

          <div className="relative z-[1] space-y-4 p-4 sm:p-5 lg:space-y-5 lg:p-6">
            {isLoading ? (
              <PreviewSkeleton />
            ) : (
              <>
                <PlansSection
                  plans={plans}
                  failed={plansQuery.isError}
                  perMonth={t('hero.preview.perMonth') as string}
                  title={t('hero.preview.plansTitle') as string}
                  unavailable={t('hero.preview.unavailable') as string}
                />

                <ServicesSection
                  services={services}
                  failed={servicesQuery.isError}
                  title={t('hero.preview.servicesTitle') as string}
                  unavailable={t('hero.preview.unavailable') as string}
                  categoryLabel={(category) => serviceCategoryLabel(t, category)}
                />

                <StatusSection
                  health={health}
                  healthFailed={healthQuery.isError}
                  plansFailed={plansQuery.isError}
                  apiActive={!plansQuery.isError}
                  title={t('hero.preview.statusTitle') as string}
                  labels={{
                    backend: t('hero.preview.status.backend') as string,
                    db: t('hero.preview.status.db') as string,
                    api: t('hero.preview.status.api') as string,
                    plans: t('hero.preview.status.plans') as string,
                  }}
                  values={{
                    ok: t('hero.preview.statusValues.ok') as string,
                    error: t('hero.preview.statusValues.error') as string,
                    active: t('hero.preview.statusValues.active') as string,
                  }}
                  plansCountLabel={formatPlansCount(t, plans.length)}
                  unavailable={t('hero.preview.unavailable') as string}
                />
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function PreviewSkeleton() {
  return (
    <div className="space-y-4 lg:space-y-5" aria-busy="true" aria-live="polite">
      <div>
        <div className="mb-3 h-3 w-16 animate-pulse rounded bg-white/10" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]" />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 h-3 w-20 animate-pulse rounded bg-white/10" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]" />
        ))}
      </div>
    </div>
  )
}

function PlansSection({
  plans,
  failed,
  perMonth,
  title,
  unavailable,
}: {
  plans: Plan[]
  failed: boolean
  perMonth: string
  title: string
  unavailable: string
}) {
  return (
    <div className={cn(failed && 'opacity-60')}>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ase-muted">{title}</div>
      {failed ? (
        <UnavailablePanel message={unavailable} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="group relative rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 transition duration-200 hover:border-white/12 hover:bg-white/[0.045] sm:px-4"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5',
                    planDotToneClass[planDotTone(plan.code)],
                  )}
                />
                <div className="min-w-0 text-sm font-semibold leading-snug text-ase-text">{plan.name}</div>
              </div>
              <div className="mt-2 pl-[1.125rem] text-sm font-extrabold tracking-tight text-ase-text sm:pl-[1.375rem]">
                {formatPlanPrice(plan)}
                <span className="ml-1 text-xs font-semibold text-ase-muted">{perMonth}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServicesSection({
  services,
  failed,
  title,
  unavailable,
  categoryLabel,
}: {
  services: Service[]
  failed: boolean
  title: string
  unavailable: string
  categoryLabel: (category: ServiceCategory) => string
}) {
  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-3.5', failed && 'opacity-60')}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{title}</span>
        {!failed ? (
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ase-accent/70 shadow-[0_0_12px_rgba(34,211,238,0.2)]" />
        ) : null}
      </div>
      {failed ? (
        <div className="mt-2">
          <UnavailablePanel message={unavailable} compact />
        </div>
      ) : services.length === 0 ? (
        <div className="mt-2">
          <UnavailablePanel message={unavailable} compact />
        </div>
      ) : (
        <div className="mt-2 space-y-1.5">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-ase-bg2/30 px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2"
            >
              <div className="min-w-0 truncate text-xs font-medium text-ase-text2">{service.name}</div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-ase-text2 sm:text-[11px]">
                {categoryLabel(service.category)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusSection({
  health,
  healthFailed,
  plansFailed,
  apiActive,
  title,
  labels,
  values,
  plansCountLabel,
  unavailable,
}: {
  health?: { backendOk: boolean; dbOk: boolean }
  healthFailed: boolean
  plansFailed: boolean
  apiActive: boolean
  title: string
  labels: { backend: string; db: string; api: string; plans: string }
  values: { ok: string; error: string; active: string }
  plansCountLabel: string
  unavailable: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 sm:p-3.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{title}</div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <StatusRow
          label={labels.backend}
          value={healthFailed ? values.error : health?.backendOk ? values.ok : values.error}
          state={!healthFailed && health?.backendOk ? 'ok' : 'error'}
          muted={healthFailed}
        />
        <StatusRow
          label={labels.db}
          value={healthFailed ? values.error : health?.dbOk ? values.ok : values.error}
          state={!healthFailed && health?.dbOk ? 'ok' : 'error'}
          muted={healthFailed}
        />
        <StatusRow
          label={labels.api}
          value={apiActive ? values.active : values.error}
          state={apiActive ? 'ok' : 'error'}
          muted={!apiActive}
        />
        <StatusRow
          label={labels.plans}
          value={plansFailed ? unavailable : plansCountLabel}
          state={plansFailed ? 'error' : 'ok'}
          muted={plansFailed}
        />
      </div>
    </div>
  )
}

function StatusRow({
  label,
  value,
  state,
  muted,
}: {
  label: string
  value: string
  state: 'ok' | 'error'
  muted?: boolean
}) {
  const isOk = state === 'ok'

  return (
    <div
      className={cn(
        'rounded-lg border border-white/[0.06] bg-ase-bg2/30 px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2',
        muted && 'opacity-60',
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2',
            isOk
              ? 'bg-ase-success/80 shadow-[0_0_12px_rgba(34,197,94,0.12)]'
              : 'bg-white/30',
          )}
        />
        <span className={cn('text-xs font-semibold', isOk ? 'text-ase-text2' : 'text-ase-muted')}>{value}</span>
      </div>
    </div>
  )
}

function UnavailablePanel({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.02] text-center text-xs text-ase-muted',
        compact ? 'px-3 py-2' : 'px-4 py-6',
      )}
    >
      {message}
    </div>
  )
}
