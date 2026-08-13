import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react'
import type { Language } from './translations'
import { translations } from './translations'

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

  const t = useCallback(
    <T = string,>(key: string): T => {
      const dict = translations[language]
      const hit = getValueByPath(dict, key)
      if (hit !== undefined) return hit as T
      const fallback = getValueByPath(translations[DEFAULT_LANGUAGE], key)
      return (fallback !== undefined ? fallback : key) as T
    },
    [language],
  )

  const value = useMemo<I18nContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}

