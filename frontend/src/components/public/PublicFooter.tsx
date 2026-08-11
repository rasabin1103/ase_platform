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
      className="text-sm text-ase-text2 transition-colors duration-200 hover:text-ase-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
    >
      {children}
    </Link>
  )
}

function FooterMailLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm text-ase-text2 transition-colors duration-200 hover:text-ase-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
    >
      {children}
    </a>
  )
}

export function PublicFooter() {
  const { t } = useI18n()

  return (
    <footer className="relative border-t border-white/5 bg-black">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-14">
          <div className="space-y-4">
            <BrandLogo variant="dark" size="sm" showText className="opacity-95" />
            <p className="max-w-sm text-sm leading-relaxed text-ase-text2">{t('footer.tagline')}</p>
            <p className="text-xs text-ase-muted">{t('footer.copyright')}</p>
          </div>

          <div className="space-y-4">
            <ColTitle>{t('footer.col2Title')}</ColTitle>
            <div className="flex flex-col gap-3">
              <FooterLink to="/services">{t('footer.link1')}</FooterLink>
              <FooterLink to="/platform">{t('footer.link2')}</FooterLink>
              <FooterLink to="/pricing">{t('footer.link3')}</FooterLink>
              <FooterLink to="/dashboard">{t('footer.link4')}</FooterLink>
              <FooterLink to="/redeem">{t('footer.linkRedeem')}</FooterLink>
            </div>
          </div>

          <div className="space-y-4">
            <ColTitle>{t('footer.col3Title')}</ColTitle>
            <div className="flex flex-col gap-3">
              <FooterLink to="/about">{t('footer.link5')}</FooterLink>
              <FooterLink to="/contact">{t('footer.link6')}</FooterLink>
              <FooterMailLink href="mailto:contact@arcesabinengineering.com">contact@arcesabinengineering.com</FooterMailLink>
              <p className="text-sm text-ase-muted">{t('footer.response')}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
