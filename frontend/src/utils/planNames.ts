import type { Plan } from '../types/plan.types'

/**
 * Nombres de planes en los textos de la web, anclados a los planes de la
 * base de datos. Los textos no escriben nombres de planes a mano: usan
 * marcadores que se rellenan con el catálogo público de planes.
 *
 *   {{plan:free}}    primer plan gratuito (precio 0)
 *   {{plan:top}}     último plan por orden (el de empresas / consultoría)
 *   {{plan:popular}} plan marcado como recomendado
 *   {{plan:others}}  todos los planes salvo el gratuito, en lista («A, B o C»)
 *   {{plan:all}}     todos los planes, en lista
 *   {{plan:N}}       el plan N-ésimo por orden (1 = el primero)
 *
 * Mientras el catálogo carga, o si no responde, se usa una expresión
 * genérica en lugar del nombre para no mostrar nunca un plan inexistente.
 */

export type PlanLanguage = 'es' | 'en'

export type PlanNames = {
  /** Nombres en orden de visualización. */
  all: string[]
  free: string | null
  top: string | null
  popular: string | null
  others: string[]
}

const FALLBACK = {
  es: { free: 'el plan gratuito', top: 'superior', popular: 'recomendado', others: 'un plan de pago', all: 'nuestros planes', nth: 'un plan superior' },
  en: { free: 'the free plan', top: 'top-tier', popular: 'recommended', others: 'a paid plan', all: 'our plans', nth: 'a higher tier' },
} as const

function planName(plan: Plan, language: PlanLanguage): string {
  const en = (plan as Plan & { name_en?: string | null }).name_en
  return (language === 'en' && en ? en : plan.name).trim()
}

export function derivePlanNames(plans: Plan[] | undefined, language: PlanLanguage): PlanNames | null {
  if (!plans || plans.length === 0) return null
  const active = plans
    .filter((p) => p.is_active !== false)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  if (active.length === 0) return null
  const freePlan = active.find((p) => p.price !== null && p.price !== undefined && Number(p.price) === 0) ?? null
  const all = active.map((p) => planName(p, language))
  const free = freePlan ? planName(freePlan, language) : null
  const popularPlan = active.find((p) => p.is_recommended)
  return {
    all,
    free,
    top: all[all.length - 1] ?? null,
    popular: popularPlan ? planName(popularPlan, language) : null,
    others: active.filter((p) => p !== freePlan).map((p) => planName(p, language)),
  }
}

function joinList(items: string[], language: PlanLanguage, type: 'disjunction' | 'conjunction'): string {
  try {
    return new Intl.ListFormat(language === 'en' ? 'en' : 'es', { style: 'long', type }).format(items)
  } catch {
    return items.join(', ')
  }
}

/** Sustituye los marcadores {{plan:…}} de un texto por los nombres reales. */
export function fillPlanNames(text: string, names: PlanNames | null, language: PlanLanguage): string {
  if (!text.includes('{{plan:')) return text
  const fb = language === 'en' ? FALLBACK.en : FALLBACK.es
  return text.replace(/\{\{plan:([a-z0-9]+)\}\}/g, (_, key: string) => {
    if (/^\d+$/.test(key)) return names?.all[Number(key) - 1] ?? fb.nth
    switch (key) {
      case 'free':
        return names?.free ?? fb.free
      case 'top':
        return names?.top ?? fb.top
      case 'popular':
        return names?.popular ?? fb.popular
      case 'others':
        return names && names.others.length ? joinList(names.others, language, 'disjunction') : fb.others
      case 'all':
        return names ? joinList(names.all, language, 'conjunction') : fb.all
      default:
        return ''
    }
  })
}

/** Aplica `fill` a todas las cadenas de un objeto de textos (copias tipadas). */
export function fillPlanNamesDeep<T>(value: T, fill: (text: string) => string): T {
  if (typeof value === 'string') return (value.includes('{{plan:') ? fill(value) : value) as T
  if (Array.isArray(value)) return value.map((v) => fillPlanNamesDeep(v, fill)) as T
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = fillPlanNamesDeep(v, fill)
    return out as T
  }
  return value
}
