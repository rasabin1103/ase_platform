import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import type { PublicBillingFilter } from './catalogPricingFilters'

type Props = {
  billing: PublicBillingFilter
  onChange: (value: PublicBillingFilter) => void
  disabled?: boolean
  className?: string
}

export function BillingPeriodToggle({ billing, onChange, disabled, className }: Props) {
  const { t } = useI18n()

  return (
    <div className={cn('flex flex-col gap-2.5 sm:items-end', className)}>
      <div
        role="group"
        aria-label={t('pricing.billingToggle')}
        className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 sm:w-auto sm:min-w-[280px]"
      >
        {(['monthly', 'yearly'] as const).map((period) => {
          const active = billing === period
          return (
            <button
              key={period}
              type="button"
              disabled={disabled}
              onClick={() => onChange(period)}
              className={cn(
                'relative isolate rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-200',
                active
                  ? 'text-ase-text shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                  : 'text-ase-muted hover:text-ase-text2',
                disabled && 'pointer-events-none opacity-60',
              )}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-transparent ring-1 ring-cyan-400/25"
                />
              ) : null}
              <span className="relative block whitespace-nowrap">
                {period === 'monthly' ? t('pricing.monthly') : t('pricing.yearly')}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-center text-xs text-cyan-300/75 sm:text-right">{t('pricing.annualHint')}</p>
    </div>
  )
}
