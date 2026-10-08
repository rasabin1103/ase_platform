import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  catalogShowcaseItemPath,
  listCatalogShowcaseItems,
  type CatalogShowcaseItem,
} from '../../../api/catalogShowcase.api'
import { useI18n } from '../../../i18n'
import { localizedCatalogText } from '../../../utils/localizedCatalogText'
import { AuthenticatedImage } from '../../ui/AuthenticatedImage'
import { ButtonLink } from '../../ui/Button'
import { Reveal, SectionHeading } from './Reveal'
import { useHomeCopy } from './useHomeCopy'
import { cn } from '../../ui/cn'

function formatPrice(price: string, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

export function HomeCatalogStrip() {
  const c = useHomeCopy().catalog
  const query = useQuery({
    queryKey: ['home', 'catalog-top-rated'],
    queryFn: () => listCatalogShowcaseItems({ limit: 8, sort: 'top_rated' }),
    staleTime: 5 * 60_000,
  })
  const items = query.data?.items ?? []
  const trackRef = useRef<HTMLUListElement | null>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])

  // Recalcula los extremos al cargar los datos y al cambiar el tamaño de la ventana.
  useEffect(() => {
    const el = trackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateEdges, items.length])

  const move = (dir: -1 | 1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('li')
    const step = card ? card.getBoundingClientRect().width + 20 : 280
    // Avanza tantas tarjetas como quepan enteras en pantalla (mínimo una).
    const perPage = Math.max(1, Math.floor(el.clientWidth / step))
    el.scrollBy({ left: dir * step * perPage, behavior: 'smooth' })
  }

  if (query.isError || (query.isSuccess && items.length === 0)) return null

  return (
    <section className="py-24 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} align="left" />
          <Reveal className="flex shrink-0 items-center gap-3">
            <div className="flex gap-2">
              <ArrowButton label={c.prev} disabled={edges.start} onClick={() => move(-1)}>
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </ArrowButton>
              <ArrowButton label={c.next} disabled={edges.end} onClick={() => move(1)}>
                <ChevronRight className="h-5 w-5" aria-hidden />
              </ArrowButton>
            </div>
            <ButtonLink to="/catalog" variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
              {c.cta}
            </ButtonLink>
          </Reveal>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1400px]">
        <ul
          ref={trackRef}
          onScroll={updateEdges}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-6 sm:scroll-px-8 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {query.isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-[330px] w-[260px] shrink-0 animate-pulse rounded-2xl bg-white/[0.04]" />
              ))
            : items.map((item) => (
                <CatalogCard
                  key={`${item.type}-${item.slug}`}
                  item={item}
                  freeLabel={c.free}
                  reviewsLabel={c.reviews}
                />
              ))}
        </ul>
      </div>
    </section>
  )
}

function CatalogCard({
  item,
  freeLabel,
  reviewsLabel,
}: {
  item: CatalogShowcaseItem
  freeLabel: string
  reviewsLabel: string
}) {
  const { t, language } = useI18n()
  const title = localizedCatalogText(language, item.title, item.titleEn)
  return (
    <li className="w-[260px] shrink-0 snap-start">
      <Link
        to={catalogShowcaseItemPath(item)}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ase-surface/60 transition duration-300 hover:-translate-y-1 hover:border-ase-brand/40 hover:shadow-glow-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-ase-bg2">
          <AuthenticatedImage
            src={item.imageUrl}
            alt=""
            fit="contain"
            className="h-full w-full transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-lg border border-white/15 bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-ase-text">
            {t(`publicCatalogShowcase.type.${item.type}`)}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-ase-text">{title}</h3>
          <div className="mt-auto flex items-center justify-between pt-4">
            {item.averageRating ? (
              <span className="inline-flex items-center gap-1 text-xs text-ase-text2">
                <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" aria-hidden />
                <span className="font-semibold">{item.averageRating.toFixed(1)}</span>
                <span className="text-ase-muted">
                  ({item.reviewCount} {reviewsLabel})
                </span>
              </span>
            ) : (
              <span />
            )}
            <span className="text-sm font-bold text-ase-text">{formatPrice(item.price, item.currency, freeLabel)}</span>
          </div>
        </div>
      </Link>
    </li>
  )
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-ase-text transition',
        'hover:border-ase-brand/50 hover:bg-ase-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
        'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/15 disabled:hover:bg-white/[0.04]',
      )}
    >
      {children}
    </button>
  )
}
