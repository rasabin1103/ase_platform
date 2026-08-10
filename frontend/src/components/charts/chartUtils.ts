export type ChartPoint = { month: string; value: number; label: string }

/** Last N month keys aligned with backend analytics (`YYYY-MM`). */
export function buildFallbackMonthKeys(months = 6): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function monthKeyToLabel(month: string, locale?: string): string {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return month
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(Date.UTC(y, m - 1, 1)))
  } catch {
    return month.slice(5) || month
  }
}

export function buildFallbackChartData(months = 6, locale?: string): ChartPoint[] {
  return buildFallbackMonthKeys(months).map((month) => ({
    month,
    value: 0,
    label: monthKeyToLabel(month, locale),
  }))
}

/**
 * Maps API time-series (from DB aggregates) onto fixed month buckets.
 * Missing months get value 0 — only for chart structure, not synthetic activity.
 */
export function normalizeChartSeries(
  raw: { month: string; value: number }[] | undefined | null,
  options?: { months?: number; locale?: string },
): ChartPoint[] {
  const months = options?.months ?? 6
  const locale = options?.locale
  const keys = buildFallbackMonthKeys(months)
  const byMonth = new Map<string, number>()

  if (raw?.length) {
    for (const p of raw) {
      byMonth.set(p.month, Number(p.value) || 0)
    }
  }

  return keys.map((month) => ({
    month,
    value: byMonth.get(month) ?? 0,
    label: monthKeyToLabel(month, locale),
  }))
}

export function chartYMax(data: ChartPoint[]): number {
  const max = Math.max(0, ...data.map((d) => d.value))
  return max === 0 ? 4 : Math.ceil(max * 1.15)
}
