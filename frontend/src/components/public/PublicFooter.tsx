import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldCheck, Undo2 } from 'lucide-react'
import { BrandLogo } from '../brand/BrandLogo'
import { useI18n } from '../../i18n'
import { pagesV2En, pagesV2Es } from '../../i18n/pagesV2.locale'

/**
 * Redes sociales del pie. Una red sin URL no se pinta, así que basta con
 * rellenar aquí el enlace para que aparezca.
 */
const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/arce-sabin-engineering',
} as const

function ColTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{children}</div>
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-sm text-sm text-ase-text2 transition-colors duration-200 hover:text-ase-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      {children}
    </Link>
  )
}

/** Glifo propio y sencillo (lucide no incluye logotipos de marca). */
function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <rect x="3" y="9" width="4" height="12" rx="0.5" />
      <circle cx="5" cy="4.5" r="2.3" />
      <path d="M11 9h4v2.2c.7-1.4 2.1-2.5 4.2-2.5 3.3 0 4.8 2 4.8 5.8V21h-4v-5.8c0-1.6-.6-2.7-2-2.7-1.1 0-1.8.8-2.1 1.5-.1.3-.1.6-.1 1V21h-4V9z" />
    </svg>
  )
}

export function PublicFooter() {
  const { t, language } = useI18n()
  const f = (language === 'en' ? pagesV2En : pagesV2Es).footer
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const seals = [
    { Icon: Lock, label: f.sealStripe },
    { Icon: ShieldCheck, label: f.sealGdpr },
    { Icon: Undo2, label: f.sealNoLockIn },
  ]

  return (
    <footer className="relative border-t border-white/5 bg-black">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20">
        {/* Boletín */}
        <div className="mb-14 grid grid-cols-1 items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ase-brand/15 text-sky-300 ring-1 ring-ase-brand/30">
              <Mail className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-xl font-semibold text-ase-text">{f.newsletterTitle}</p>
              <p className="mt-1 text-sm text-ase-text2">{f.newsletterText}</p>
            </div>
          </div>
          <form
            className="flex w-full flex-col gap-2 sm:flex-row lg:w-[26rem]"
            onSubmit={(e) => {
              e.preventDefault()
              // El boletín va ligado a la cuenta (gratuita): se continúa en el registro.
              navigate(`/register?newsletter=1${email ? `&email=${encodeURIComponent(email)}` : ''}`)
            }}
          >
            <label className="flex-1">
              <span className="sr-only">{f.newsletterPlaceholder}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={f.newsletterPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-ase-surface px-4 py-2.5 text-sm text-ase-text outline-none transition placeholder:text-ase-muted focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl ase-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:brightness-110"
            >
              {f.newsletterCta}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-14">
          <div className="space-y-4">
            <BrandLogo variant="dark" size="sm" showText className="opacity-95" />
            <p className="max-w-sm text-sm leading-relaxed text-ase-text2">{t('footer.tagline')}</p>
            {SOCIAL_LINKS.linkedin && (
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-ase-text2 transition hover:border-ase-brand/50 hover:text-ase-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
              >
                <LinkedInGlyph />
              </a>
            )}
          </div>

          <div className="space-y-4">
            <ColTitle>{t('footer.col2Title')}</ColTitle>
            <div className="flex flex-col gap-3">
              <FooterLink to="/services">{t('footer.link1')}</FooterLink>
              <FooterLink to="/platform">{t('footer.link2')}</FooterLink>
              <FooterLink to="/pricing">{t('footer.link3')}</FooterLink>
              <FooterLink to="/academy">{t('footer.linkAcademy')}</FooterLink>
              <FooterLink to="/catalog">{f.catalog}</FooterLink>
              <FooterLink to="/blog">{f.blog}</FooterLink>
              <FooterLink to="/dashboard">{t('footer.link4')}</FooterLink>
              <FooterLink to="/redeem">{t('footer.linkRedeem')}</FooterLink>
            </div>
          </div>

          <div className="space-y-4">
            <ColTitle>{t('footer.col3Title')}</ColTitle>
            <div className="flex flex-col gap-3">
              <FooterLink to="/about">{t('footer.link5')}</FooterLink>
              <FooterLink to="/contact">{t('footer.link6')}</FooterLink>
              <a
                href="mailto:contact@arcesabinengineering.com"
                className="rounded-sm text-sm text-ase-text2 transition-colors duration-200 hover:text-ase-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60"
              >
                contact@arcesabinengineering.com
              </a>
              <p className="text-sm text-ase-muted">{t('footer.response')}</p>
            </div>
          </div>
        </div>

        {/* Sellos de confianza */}
        <ul className="mt-12 flex flex-wrap gap-3">
          {seals.map(({ Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-ase-text2"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ase-muted">{t('footer.copyright')}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <FooterLink to="/privacy-policy">{t('footer.legalPrivacy')}</FooterLink>
            <FooterLink to="/terms-of-service">{t('footer.legalTerms')}</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
