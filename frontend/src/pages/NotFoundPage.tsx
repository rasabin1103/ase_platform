import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import { Button } from '../components/ui/Button'
import { PublicFooter } from '../components/public/PublicFooter'
import { PublicHeader } from '../components/public/PublicHeader'
import { ScrollToTop } from '../components/layout/ScrollToTop'
import { useI18n } from '../i18n'

/** Branded 404 — see DESIGN.md § Página 404 */
export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <div className="relative min-h-full overflow-x-hidden bg-ase-bg text-ase-text">
      <ScrollToTop />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(51,65,85,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.35)_1px,transparent_1px)] [background-size:56px_56px]" />
      <PublicHeader />
      <main className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[1440px] flex-col items-center justify-center px-6 py-24 text-center sm:px-8">
        <p className="font-mono text-label uppercase tracking-[0.2em] text-ase-brand">{t('notFound.badge')}</p>
        <h1 className="mt-6 font-display text-[clamp(5rem,18vw,9rem)] font-bold leading-none tracking-tight text-ase-text">
          404
        </h1>
        <p className="mt-6 max-w-lg text-heading-sm text-ase-text sm:text-heading-md">{t('notFound.title')}</p>
        <p className="mt-4 max-w-md text-body-md text-ase-text2">{t('notFound.subtitle')}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/">
            <Button size="lg">{t('notFound.home')}</Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="secondary">
              {t('notFound.contact')}
            </Button>
          </Link>
        </div>
        <div className="mt-16 opacity-60">
          <BrandLogo variant="monochrome" size="sm" />
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
