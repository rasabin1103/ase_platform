import { Link } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { useI18n } from '../../i18n'

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

export function PublicFooter() {
  const { t } = useI18n()

  return (
    <footer className="relative border-t border-white/5 bg-ase-bg2/60">
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-24">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandLogo variant="monochrome" size="md" className="opacity-90" />
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
                <FooterLink to="/platform">{t('footer.platform')}</FooterLink>
                <FooterLink to="/pricing">{t('footer.pricing')}</FooterLink>
                <FooterLink to="/login">{t('footer.clientLogin')}</FooterLink>
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

        <div className="mt-16 flex flex-col gap-4 border-t border-white/5 pt-8 text-xs text-ase-muted sm:flex-row sm:items-center sm:justify-between">
          <div>{t('footer.rights')}</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>{t('footer.securityFirst')}</span>
            <span>{t('footer.rbacReady')}</span>
            <span>{t('footer.enterpriseGrade')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
