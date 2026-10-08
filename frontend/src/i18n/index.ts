import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Language } from './translations'
import { translations } from './translations'
import type { Plan } from '../types/plan.types'
import { derivePlanNames, fillPlanNames, type PlanNames } from '../utils/planNames'

const STORAGE_KEY = 'ase_language'
const DEFAULT_LANGUAGE: Language = 'es'

export type I18nContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  /** Generic so call sites reading structured content (arrays/objects from
   * the translation dictionaries, e.g. t<Item[]>('faq.items')) get a real
   * type instead of `any`, while the overwhelming majority of call sites
   * (plain UI strings) keep working unchanged via the `string` default. */
  t: <T = string>(key: string) => T
  /** Nombres de los planes de la base de datos (null mientras cargan). */
  planNames: PlanNames | null
  /** Rellena los marcadores {{plan:…}} de un texto con los planes reales. */
  fillPlans: (text: string) => string
  /** Lo usa PlanNamesSync para publicar el catálogo de planes. */
  setPlans: (plans: Plan[] | null) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getStoredLanguage(): Language {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'en' || raw === 'es') return raw
  return DEFAULT_LANGUAGE
}

function getValueByPath(obj: unknown, path: string): unknown {
  if (!path) return obj
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

/** Reads a translation path that must be a string array (e.g. highlights, framework nodes). */
export function tStringArray(t: (key: string) => unknown, key: string): string[] {
  const v = t(key)
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x))
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return getStoredLanguage()
    } catch {
      return DEFAULT_LANGUAGE
    }
  })

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }, [])

  // Keep the <html lang> attribute in sync with the active language so
  // screen readers and browser translation tools pick the right locale
  // instead of the static "es" baked into index.html.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])

  // Los nombres de planes de los textos vienen de la base de datos (ver
  // utils/planNames y PlanNamesSync): las traducciones solo llevan marcadores.
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const planNames = useMemo(() => derivePlanNames(plans ?? undefined, language), [plans, language])
  const fillPlans = useCallback((text: string) => fillPlanNames(text, planNames, language), [planNames, language])

  const t = useCallback(
    <T = string,>(key: string): T => {
      const dict = translations[language]
      const hit = getValueByPath(dict, key)
      const found = hit !== undefined ? hit : getValueByPath(translations[DEFAULT_LANGUAGE], key)
      if (found === undefined) return key as T
      return (typeof found === 'string' ? fillPlans(found) : found) as T
    },
    [language, fillPlans],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t, planNames, fillPlans, setPlans }),
    [language, setLanguage, t, planNames, fillPlans],
  )

  return createElement(I18nContext.Provider, { value }, children)
}

/** Igual que useI18n pero sin lanzar fuera del proveedor (componentes base como Modal). */
export function useOptionalI18n(): I18nContextValue | null {
  return useContext(I18nContext)
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}

