import { Link } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

const SIDEBAR_WIDTH_CLASS = 'lg:w-72'

function ColTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{children}</div>
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-sm text-ase-text2 transition hover:text-ase-primary hover:underline hover:decoration-ase-primary/40 hover:underline-offset-4"
    >
      {children}
    </Link>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-ase-text2 transition hover:text-ase-primary hover:underline hover:decoration-ase-primary/40 hover:underline-offset-4"
    >
      {children}
    </a>
  )
}

type FooterVariant = 'public' | 'app'

type Props = {
  variant?: FooterVariant
}

function FooterBody({ isApp }: { isApp: boolean }) {
  const { t } = useI18n()

  return (
    <div
      className={cn(
        isApp ? 'px-4 py-12 sm:px-8 lg:px-10' : 'px-6 py-24 sm:px-8 lg:px-10',
      )}
    >
      <div className={isApp ? 'grid grid-cols-1 gap-10 lg:grid-cols-12' : 'grid grid-cols-1 gap-14 lg:grid-cols-12'}>
        <div className="lg:col-span-4">
          <BrandLogo placement="footer" className="opacity-95" />
          <div className="mt-4 text-sm font-semibold text-ase-text">Arce Sabin Engineering</div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ase-text2">{t('footer.brandDescription')}</p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
          <div className="space-y-4">
            <ColTitle>{t('footer.company')}</ColTitle>
            <div className="flex flex-col gap-3">
              <FooterLink to="/about">{t('footer.about')}</FooterLink>
              <FooterLink to="/contact">{t('footer.contact')}</FooterLink>
            </div>
          </div>

          <div className="space-y-4">
            <ColTitle>{t('footer.platform')}</ColTitle>
            <div className="flex flex-col gap-3">
              {isApp ? <FooterLink to="/dashboard">{t('footer.myWorkspace')}</FooterLink> : null}
              <FooterLink to="/platform">{t('footer.platform')}</FooterLink>
              <FooterLink to="/pricing">{t('footer.pricing')}</FooterLink>
              {isApp ? (
                <FooterLink to="/profile">{t('footer.myProfile')}</FooterLink>
              ) : (
                <FooterLink to="/login">{t('footer.clientLogin')}</FooterLink>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <ColTitle>{t('footer.services')}</ColTitle>
            <div className="flex flex-col gap-3">
              <span className="text-sm text-ase-text2">{t('footer.saasPlatformEngineering')}</span>
              <span className="text-sm text-ase-text2">{t('footer.qaAutomationArchitecture')}</span>
              <span className="text-sm text-ase-text2">{t('footer.businessProcessAutomation')}</span>
              <span className="text-sm text-ase-text2">{t('footer.technicalTraining')}</span>
            </div>
          </div>

          <div className="space-y-4">
            <ColTitle>{t('footer.contact')}</ColTitle>
            <div className="flex flex-col gap-3">
              <span className="text-sm text-ase-text2">{t('footer.location')}</span>
              <a
                className="text-sm text-ase-text2 transition hover:text-ase-primary hover:underline hover:decoration-ase-primary/40 hover:underline-offset-4"
                href="mailto:contact@arcesabin.engineering"
              >
                contact@arcesabin.engineering
              </a>
              <ExternalLink href="https://www.linkedin.com/">{t('footer.linkedin')}</ExternalLink>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          isApp
            ? 'mt-10 flex flex-col gap-4 border-t border-white/[0.08] pt-6 text-xs text-ase-muted sm:flex-row sm:items-center sm:justify-between'
            : 'mt-16 flex flex-col gap-4 border-t border-white/[0.08] pt-8 text-xs text-ase-muted sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <div>{t('footer.rights')}</div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span>{t('footer.securityFirst')}</span>
          <span>{t('footer.rbacReady')}</span>
          <span>{t('footer.enterpriseGrade')}</span>
        </div>
      </div>
    </div>
  )
}

export function PublicFooter({ variant = 'public' }: Props) {
  const isApp = variant === 'app'

  return (
    <footer
      className={cn(
        'relative z-20 w-full shrink-0',
        'bg-ase-bg2/[0.97] backdrop-blur-xl',
        !isApp && 'border-t border-white/[0.06]',
      )}
    >
      {/* Soft fade from page content into footer */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ase-bg/0 via-ase-bg2/40 to-ase-bg2/[0.97]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent"
        aria-hidden
      />

      {isApp ? (
        <div className="relative flex w-full">
          {/* Sidebar zone — blends with menu, no hard edge */}
          <div
            className={cn('relative hidden shrink-0 lg:block', SIDEBAR_WIDTH_CLASS)}
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-ase-bg2/90 via-ase-bg2/[0.97] to-ase-bg2/[0.98]" />
            <div
              className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ase-bg2/[0.98] via-ase-bg2/70 to-transparent"
              aria-hidden
            />
            <div
              className="absolute right-0 top-0 h-20 w-20 bg-[radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.06),transparent_70%)]"
              aria-hidden
            />
          </div>
          <div className="relative min-w-0 flex-1">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-ase-bg2/80 to-transparent"
              aria-hidden
            />
            <FooterBody isApp />
          </div>
        </div>
      ) : (
        <FooterBody isApp={false} />
      )}
    </footer>
  )
}
