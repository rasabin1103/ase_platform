import { useEffect, useState } from 'react'
import { cn } from '../../ui/cn'

/**
 * Barra de secciones fija bajo la cabecera, con resaltado de la sección visible.
 * Se usa en las páginas largas («Qué incluye», «Plataforma»).
 */
export function SectionNav({ label, items }: { label: string; items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const ids = items.map((i) => i.id).join('|')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const els = ids
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-35% 0px -60% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [ids])

  // Mantiene visible la pestaña activa: solo desplaza la barra, nunca la página.
  useEffect(() => {
    const link = document.getElementById(`secnav-${active}`)
    const list = link?.closest('ul')
    if (!link || !list) return
    list.scrollTo({ left: link.offsetLeft - list.clientWidth / 2 + link.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  return (
    <nav aria-label={label} className="sticky top-16 z-30 border-y border-white/[0.06] bg-ase-bg/95">
      <ul className="relative mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-5 py-2.5 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
        {items.map(({ id, label: text }) => (
          <li key={id} className="shrink-0">
            <a
              id={`secnav-${id}`}
              href={`#${id}`}
              aria-current={active === id ? 'true' : undefined}
              className={cn(
                'block rounded-full px-3.5 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
                active === id
                  ? 'bg-ase-brand/15 font-semibold text-ase-text ring-1 ring-ase-brand/40'
                  : 'text-ase-muted hover:bg-white/[0.04] hover:text-ase-text',
              )}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
