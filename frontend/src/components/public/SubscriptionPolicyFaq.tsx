import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Eyebrow } from '../ui/Eyebrow'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'

const QUESTION_KEYS = [
  'accumulation',
  'repeatDownload',
  'individualPurchase',
  'rewardExpiry',
  'discountStacking',
  'downgradeTiming',
  'upgradeTiming',
] as const

/** One collapsible Q/A row — owns its own open state, same pattern as
 * PurchaseVsSubscriptionFaq's FaqItem, duplicated locally on purpose so
 * each FAQ section stays independent. */
function FaqItem({ question, answer, defaultOpen }: { question: string; answer: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-ase-text transition hover:bg-white/[0.03] sm:text-base"
      >
        <span>{question}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-ase-text2 transition-transform', open && 'rotate-180')}
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <p className="border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-ase-text2">{answer}</p>
      ) : null}
    </div>
  )
}

/** "Política general de suscripciones" — the seven hard rules governing
 * every plan (download rollover, repeat-download and individual-purchase
 * quota behavior, 60-day reward expiry, discount stacking, and
 * upgrade/downgrade timing), phrased as an FAQ so a visitor can resolve
 * doubts before subscribing rather than discovering them after. Lives only
 * on /pricing (see PricingPage), alongside — not replacing —
 * PurchaseVsSubscriptionFaq. */
export function SubscriptionPolicyFaq() {
  const { t } = useI18n()
  return (
    <section className="border-t border-white/5">
      <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:px-8">
        <Eyebrow>{t('pricing.policyFaq.badge')}</Eyebrow>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
          {t('pricing.policyFaq.title')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ase-text2 sm:text-base">{t('pricing.policyFaq.subtitle')}</p>

        <div className="mt-8 space-y-3">
          {QUESTION_KEYS.map((key, index) => (
            <FaqItem
              key={key}
              question={t(`pricing.policyFaq.items.${key}.question`) as string}
              answer={t(`pricing.policyFaq.items.${key}.answer`) as string}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
