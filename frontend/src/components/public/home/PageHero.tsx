import type { ReactNode } from 'react'
import { cn } from '../../ui/cn'

/**
 * Cabecera común de las páginas públicas interiores (Planes, Catálogo…):
 * mismo fondo con halos y retícula, eyebrow, titular con frase en degradado.
 */
export function PageHero({
  eyebrow,
  titleBefore,
  titleHighlight,
  titleAfter,
  subtitle,
  children,
  align = 'center',
  compact,
}: {
  eyebrow: string
  titleBefore: string
  titleHighlight: string
  titleAfter: string
  subtitle: string
  children?: ReactNode
  align?: 'center' | 'left'
  compact?: boolean
}) {
  const center = align === 'center'
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-ase-brand/20 blur-[120px] motion-safe:animate-home-drift" />
        <div
          className="absolute -right-32 -top-10 h-[26rem] w-[26rem] rounded-full bg-ase-brand-strong/15 blur-[120px] motion-safe:animate-home-drift"
          style={{ animationDelay: '-9s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 50% 0%, black 25%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 25%, transparent 70%)',
          }}
        />
      </div>
      <div
        className={cn(
          'mx-auto max-w-[1400px] px-5 sm:px-8',
          compact ? 'pb-8 pt-12 sm:pt-16' : 'pb-12 pt-14 sm:pt-20',
          center && 'text-center',
        )}
      >
        <div className={cn('inline-flex animate-fade-in-up items-center gap-2.5', center && 'justify-center')}>
          <span className="h-px w-8 bg-ase-brand/60" />
          <span className="text-label font-semibold uppercase text-ase-brand">{eyebrow}</span>
          {center && <span className="h-px w-8 bg-ase-brand/60" />}
        </div>
        <h1
          className={cn(
            'mt-6 animate-fade-in-up font-display text-[2.4rem] font-semibold leading-[1.06] tracking-tight text-ase-text sm:text-display-lg',
            center ? 'mx-auto max-w-4xl' : 'max-w-4xl',
          )}
          style={{ animationDelay: '80ms' }}
        >
          {titleBefore} <span className="ase-text-gradient">{titleHighlight}</span>
          {titleAfter.startsWith('.') ? titleAfter : ` ${titleAfter}`}
        </h1>
        <p
          className={cn(
            'mt-6 max-w-2xl animate-fade-in-up text-base leading-relaxed text-ase-text2 sm:text-lg',
            center && 'mx-auto',
          )}
          style={{ animationDelay: '160ms' }}
        >
          {subtitle}
        </p>
        {children && (
          <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
