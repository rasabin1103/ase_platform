import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../ui/cn'
import { usePrefersReducedMotion } from '../../../utils/usePrefersReducedMotion'

/** Aparición suave al entrar en pantalla (una sola vez). Respeta reduced-motion. */
export function Reveal({
  children,
  className,
  delayMs = 0,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  delayMs?: number
  as?: 'div' | 'li' | 'section'
}) {
  const ref = useRef<HTMLElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen || reduced || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, reduced])

  const visible = seen || reduced || typeof IntersectionObserver === 'undefined'
  return (
    <Tag
      ref={ref as never}
      className={cn(
        'transition-all duration-700 ease-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      )}
      style={delayMs && !reduced ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}

/** Cabecera de sección coherente en toda la home. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
}) {
  return (
    <Reveal className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      <div className={cn('inline-flex items-center gap-2.5', align === 'center' && 'justify-center')}>
        <span className="h-px w-8 bg-ase-brand/60" />
        <span className="text-label font-semibold uppercase text-ase-brand">{eyebrow}</span>
        {align === 'center' && <span className="h-px w-8 bg-ase-brand/60" />}
      </div>
      <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ase-text sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="mt-5 text-base leading-relaxed text-ase-text2 sm:text-lg">{subtitle}</p>}
    </Reveal>
  )
}
