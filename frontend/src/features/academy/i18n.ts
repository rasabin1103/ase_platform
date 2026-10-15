import { useOptionalI18n } from '../../i18n'
import type { Mission } from './engine/types'

/**
 * Idioma de ASE Academy. El contenido de cada misión existe en español
 * (content/courses/<curso>/) y en inglés (content/courses/<curso>/en/),
 * con la misma estructura (ver content/i18nParity.test.ts).
 */
export type AcademyLang = 'es' | 'en'

/** Idioma de la interfaz (selector global de la web). */
export function useAcademyLang(): AcademyLang {
  return useOptionalI18n()?.language === 'en' ? 'en' : 'es'
}

/** Idioma de una misión: el motor y las apps lo usan para sus textos. */
export function missionLang(mission: Pick<Mission, 'lang'> | undefined | null): AcademyLang {
  return mission?.lang === 'en' ? 'en' : 'es'
}

/** Elige el texto según el idioma. */
export function tr<T>(lang: AcademyLang, es: T, en: T): T {
  return lang === 'en' ? en : es
}
