import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { Button, ButtonLink } from '../ui/Button'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'

const navLinkBase =
  'text-sm font-medium text-ase-text2 transition-colors duration-200 hover:text-ase-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ase-bg rounded-md px-2 py-1.5'

const navLinkActive = 'text-ase-text bg-white/[0.04] border border-white/10'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { language, setLanguage, t } = useI18n()
  const auth = useAuth()

  const items = useMemo(
    () => [
      { to: '/', label: t('nav.home') as string },
      { to: '/services', label: t('nav.whatsIncluded') as string },
      { to: '/platform', label: t('nav.platform') as string },
      { to: '/catalog', label: t('publicCatalogShowcase.nav') as string },
      { to: '/pricing', label: t('nav.plans') as string },
      { to: '/blog', label: t('nav.blog') as string },
      { to: '/about', label: t('nav.about') as string },
      { to: '/contact', label: t('nav.contact') as string },
    ],
    [t],
  )

  return (
    // index.css forces backdrop-filter: none project-wide (no "glass" effects),
    // so the backdrop-blur + supports-[backdrop-filter] pair below was dead:
    // `supports` still resolves true (the browser understands the property)
    // even though the !important override blocks it, leaving the *lower*
    // opacity (/60) active with no blur to soften it — thinner and less
    // legible than intended. Using the solid fallback opacity (/80) directly
    // is what this header actually renders as today; this just names it.
    <header className="sticky top-0 z-40 border-b border-ase-border bg-ase-bg2/80">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-6 px-6 sm:px-8">
        <Link to="/" className="min-w-0 shrink-0">
          <BrandLogo variant="dark" size="sm" showText className="opacity-95" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 navfit:flex">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) => cn(navLinkBase, isActive && navLinkActive)}>
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 navfit:flex">
            <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  language === 'en' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  language === 'es' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
                )}
              >
                ES
              </button>
            </div>
            {auth.isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-ase-text2">
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-ase-success/80 shadow-[0_0_18px_rgba(34,197,94,0.12)]" />
                  {t('session.loggedIn')}
                </span>
                <span className="hidden max-w-[220px] truncate text-sm text-ase-text2 lg:inline">
                  {auth.currentUser?.display_name ?? auth.currentUser?.email}
                </span>
                <ButtonLink to="/dashboard" size="sm">
                  {t('session.dashboard')}
                </ButtonLink>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    auth.logout()
                    window.location.assign('/')
                  }}
                >
                  {t('session.logout')}
                </Button>
              </div>
            ) : (
              <>
                <ButtonLink to="/login" size="sm" variant="secondary">
                  {t('nav.clients')}
                </ButtonLink>
                <ButtonLink to="/pricing" size="sm">
                  {t('nav.cta')}
                </ButtonLink>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/60 navfit:hidden"
            aria-label={language === 'en' ? 'Open menu' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-ase-primary shadow-[0_0_14px_rgba(56,189,248,0.35)]" />
            {t('header.menu')}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/5 bg-ase-bg2/90 navfit:hidden">
          <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-4">
            <div className="mb-3 flex items-center justify-end">
              <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en')
                    setOpen(false)
                  }}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    language === 'en' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
                  )}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('es')
                    setOpen(false)
                  }}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    language === 'es' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
                  )}
                >
                  ES
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((it) => {
                const active = location.pathname === it.to
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition',
                      active
                        ? 'border-white/10 bg-white/[0.05] text-ase-text'
                        : 'border-transparent bg-white/[0.02] text-ase-text2 hover:bg-white/[0.05] hover:text-ase-text',
                    )}
                  >
                    {it.label}
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {auth.isAuthenticated ? (
                <>
                  <ButtonLink to="/dashboard" className="w-full" onClick={() => setOpen(false)}>
                    {t('session.dashboard')}
                  </ButtonLink>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      auth.logout()
                      setOpen(false)
                      window.location.assign('/')
                    }}
                  >
                    {t('session.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <ButtonLink to="/pricing" className="w-full" onClick={() => setOpen(false)}>
                    {t('nav.cta')}
                  </ButtonLink>
                  <ButtonLink to="/login" variant="secondary" className="w-full" onClick={() => setOpen(false)}>
                    {t('nav.clients')}
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
