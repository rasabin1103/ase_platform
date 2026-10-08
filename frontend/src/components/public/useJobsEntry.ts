import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'

const JOBS_PATH = '/job-postings'

/**
 * Destino de los accesos a «Empleo» desde las páginas públicas: con sesión,
 * las ofertas de la plataforma; sin sesión, el login, que al entrar vuelve a
 * las ofertas (ver `next` en LoginPage). La etiqueta explica qué va a pasar.
 */
export function useJobsEntry() {
  const { isAuthenticated } = useAuth()
  const { language } = useI18n()
  const en = language === 'en'
  return isAuthenticated
    ? { to: JOBS_PATH, label: en ? 'See job postings' : 'Ver ofertas de empleo' }
    : {
        to: `/login?next=${encodeURIComponent(JOBS_PATH)}`,
        label: en ? 'Sign in to see job postings (free)' : 'Inicia sesión para ver las ofertas (gratis)',
      }
}
