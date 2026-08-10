import { isAxiosError } from 'axios'

type PricingPlanDeleteDetail = {
  code?: string
  reasons?: string[]
  plan_name?: string
  subscriber_count?: number
}

function applyDeleteErrorPlaceholders(
  template: string,
  detail: PricingPlanDeleteDetail,
): string {
  return template
    .replaceAll('{planName}', detail.plan_name ?? '')
    .replaceAll('{count}', String(detail.subscriber_count ?? 0))
}

/** Maps FastAPI pricing-plan delete errors to catalogPricing.deleteErrors i18n keys. */
export function resolvePricingPlanDeleteError(
  err: unknown,
  t: (key: string) => string,
): string {
  if (!isAxiosError(err)) {
    return t('adminConfirm.delete.error')
  }

  const raw = err.response?.data?.detail
  if (typeof raw === 'string') {
    return raw
  }

  if (!raw || typeof raw !== 'object') {
    return t('adminConfirm.delete.error')
  }

  const detail = raw as PricingPlanDeleteDetail
  const reasons = detail.reasons?.length
    ? detail.reasons
    : detail.code
      ? [detail.code]
      : []

  const messages = reasons
    .map((reason) => {
      const key = `catalogPricing.deleteErrors.${reason}`
      const translated = t(key)
      if (translated === key) {
        return null
      }
      return applyDeleteErrorPlaceholders(translated, detail)
    })
    .filter((msg): msg is string => Boolean(msg))

  if (messages.length > 0) {
    return messages.join(' ')
  }

  return t('adminConfirm.delete.error')
}
