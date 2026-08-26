import { useI18n } from '../../i18n'

/**
 * Accessible "skip to content" link. Visually hidden until it receives
 * keyboard focus (Tab from the very top of the page), then jumps straight
 * to the `#main-content` landmark so keyboard/screen-reader users don't have
 * to tab through the header/sidebar on every single page.
 */
export function SkipLink() {
  const { t } = useI18n()

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ase-md focus:bg-ase-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ase-ink focus:shadow-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ase-bg"
    >
      {t('a11y.skipToContent')}
    </a>
  )
}
