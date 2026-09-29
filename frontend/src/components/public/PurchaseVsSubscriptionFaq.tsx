import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Eyebrow } from '../ui/Eyebrow'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'

const QUESTION_KEYS = ['access', 'ownership', 'downloads', 'cancellation'] as const

/** One collapsible Q/A row — owns its own open state (see
 * PlanIncludedGroup in PricingSection.tsx for the same pattern) so it never
 * snaps shut on an unrelated parent re-render. */
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

/** "Compra individual vs suscripción" — resolves the doubts a visitor has
 * right before paying: whether they'll actually own what they buy, what
 * happens to it if they cancel a plan, whether they can download it, and
 * what cancelling actually stops. Lives only on /pricing (see PricingPage,
 * which renders it side-by-side with SubscriptionPolicyFaq inside a shared
 * section), not inside PricingSection itself, so it doesn't also show up
 * wherever PricingSection is embedded compact (e.g. the home page). Renders
 * just its own content — no outer <section>/border/max-width — so the
 * parent page controls the shared section wrapper and column layout. */
export function PurchaseVsSubscriptionFaq() {
  const { t } = useI18n()
  return (
    <div>
      <Eyebrow>{t('pricing.faq.badge')}</Eyebrow>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
        {t('pricing.faq.title')}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ase-text2 sm:text-base">{t('pricing.faq.subtitle')}</p>

      <div className="mt-8 space-y-3">
        {QUESTION_KEYS.map((key, index) => (
          <FaqItem
            key={key}
            question={t(`pricing.faq.items.${key}.question`) as string}
            answer={t(`pricing.faq.items.${key}.answer`) as string}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </div>
  )
}
