import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'

const navLinkBase =
  'text-[12.5px] font-medium tracking-[0.01em] text-ase-text2 transition duration-200 ease-out hover:text-ase-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/50 rounded-lg px-2.5 py-2 lg:px-3'

const navLinkActive =
  'text-ase-text bg-white/[0.07] ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { language, setLanguage, t } = useI18n()
  const auth = useAuth()

  const items = useMemo(
    () => [
      { to: '/', label: t('nav.home') as string },
      { to: '/services', label: t('nav.services') as string },
      { to: '/platform', label: t('nav.platform') as string },
      { to: '/pricing', label: t('nav.pricing') as string },
      { to: '/about', label: t('nav.about') as string },
      { to: '/contact', label: t('nav.contact') as string },
    ],
    [t],
  )

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ase-bg2/75 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-ase-bg2/65">
      <div className="mx-auto flex min-h-[4.5rem] w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-2 sm:min-h-[5.25rem] sm:gap-6 sm:px-8 sm:py-2.5 lg:min-h-[5.5rem]">
        <Link
          to="/"
          className="group relative z-10 shrink-0 py-1 pr-2 transition duration-200 ease-out hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/50 rounded-xl"
          aria-label={t('nav.home') as string}
        >
          <BrandLogo
            placement="public-nav"
            className="opacity-100 transition duration-200 ease-out group-hover:scale-[1.02]"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex lg:px-4">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) => cn(navLinkBase, isActive && navLinkActive)}>
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <div className="hidden items-center gap-2.5 md:flex">
            <div className="inline-flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] p-0.5 ring-1 ring-white/[0.04]">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  'rounded-xl px-2.5 py-1.5 text-xs font-semibold tracking-wide transition duration-200 ease-out',
                  language === 'en' ? 'bg-white/[0.08] text-ase-text shadow-sm' : 'text-ase-text2 hover:text-ase-text',
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={cn(
                  'rounded-xl px-2.5 py-1.5 text-xs font-semibold tracking-wide transition duration-200 ease-out',
                  language === 'es' ? 'bg-white/[0.08] text-ase-text shadow-sm' : 'text-ase-text2 hover:text-ase-text',
                )}
              >
                ES
              </button>
            </div>
            {auth.isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ase-text2 ring-1 ring-white/[0.04]">
                  <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ase-success/90" />
                  {t('session.loggedIn')}
                </span>
                <span className="hidden max-w-[200px] truncate text-sm text-ase-text2 lg:inline">
                  {auth.currentUser?.display_name ?? auth.currentUser?.email}
                </span>
                <Link to="/dashboard">
                  <Button size="sm">{t('session.dashboard')}</Button>
                </Link>
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
                <Link to="/login">
                  <Button size="sm" variant="secondary">
                    {t('cta.clientLogin')}
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="sm">{t('cta.talkToUs')}</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-medium text-ase-text shadow-soft transition duration-200 ease-out hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/50 md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ase-primary/90" />
            {t('header.menu')}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/[0.06] bg-ase-bg2/92 backdrop-blur-lg md:hidden">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-4 sm:px-8">
            <div className="mb-3 flex items-center justify-end">
              <div className="inline-flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en')
                    setOpen(false)
                  }}
                  className={cn(
                    'rounded-xl px-2.5 py-1.5 text-xs font-semibold transition duration-200 ease-out',
                    language === 'en' ? 'bg-white/[0.08] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
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
                    'rounded-xl px-2.5 py-1.5 text-xs font-semibold transition duration-200 ease-out',
                    language === 'es' ? 'bg-white/[0.08] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
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
                      'rounded-2xl border px-3 py-2.5 text-sm font-medium transition duration-200 ease-out',
                      active
                        ? 'border-white/[0.1] bg-white/[0.07] text-ase-text ring-1 ring-white/[0.06]'
                        : 'border-transparent bg-white/[0.03] text-ase-text2 hover:bg-white/[0.06] hover:text-ase-text',
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
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <Button className="w-full">{t('session.dashboard')}</Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      auth.logout()
                      setOpen(false)
                      window.location.assign('/')
                    }}
                    className="w-full"
                  >
                    <Button variant="secondary" className="w-full">
                      {t('session.logout')}
                    </Button>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/contact" onClick={() => setOpen(false)}>
                    <Button className="w-full">{t('cta.talkToUs')}</Button>
                  </Link>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      {t('cta.clientLogin')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
