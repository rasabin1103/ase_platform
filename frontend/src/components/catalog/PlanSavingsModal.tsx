import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PiggyBank } from 'lucide-react'
import { getPlanSavings } from '../../api/plansCatalog.api'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useI18n } from '../../i18n'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

type Props = {
  open: boolean
  itemSlug: string
  onClose: () => void
  /** Proceeds with the individual-item purchase the modal was interrupting. */
  onBuyAlone: () => void
}

/** Shown right before checking out a single priced item, when at least one
 * plan would actually save the buyer money on it — see get_plan_savings on
 * the backend for the "sellable, non-empty, savings > 0" filter that decides
 * whether this modal has anything worth showing at all. Callers should only
 * render this once `getPlanSavings(itemSlug)` has resolved with a non-empty
 * list (see the enabled/skip logic wired in CatalogDetailPage). */
export function PlanSavingsModal({ open, itemSlug, onClose, onBuyAlone }: Props) {
  const { t } = useI18n()

  const savingsQuery = useQuery({
    queryKey: ['plan-savings', itemSlug],
    queryFn: () => getPlanSavings(itemSlug),
    enabled: open && Boolean(itemSlug),
    staleTime: 60_000,
  })

  const plans = savingsQuery.data ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('catalog.planSavings.title')}
      allowFullscreen={false}
      footer={
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button variant="outline" onClick={onBuyAlone}>
            {t('catalog.planSavings.buyAlone')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-ase-text2">{t('catalog.planSavings.body')}</p>

      <div className="mt-5 space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.planId}
            className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                  <PiggyBank className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-bold text-ase-text">{plan.name}</span>
              </div>
              <Badge className="border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
                {t('catalog.planSavings.savingsLabel')} {formatMoney(plan.savings, plan.currency)}
              </Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ase-text2">
              <dt>{t('catalog.planSavings.planValue')}</dt>
              <dd className="text-right font-semibold text-ase-text">
                {formatMoney(plan.includedItemsValue, plan.currency)}
                <span className="ml-1 font-normal text-ase-muted">
                  ({plan.includedItemCount} {t('catalog.planSavings.itemsIncludedLabel')})
                </span>
              </dd>
              <dt>{t('catalog.planSavings.planPrice')}</dt>
              <dd className="text-right font-semibold text-ase-text">
                {formatMoney(plan.price, plan.currency)}
                {t('catalog.planSavings.perMonth')}
              </dd>
            </dl>

            <Link to="/pricing" onClick={onClose} className="mt-3 inline-block">
              <Button variant="primary" className="h-9 px-3.5 text-xs">
                {t('catalog.planSavings.seePlan')}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </Modal>
  )
}
