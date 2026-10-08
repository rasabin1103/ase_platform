import {
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Gamepad2,
  MessagesSquare,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../ui/cn'
import { Reveal, SectionHeading } from './Reveal'
import { useHomeCopy } from './useHomeCopy'
import { useJobsEntry } from '../useJobsEntry'

export function HomeEcosystemBento() {
  const e = useHomeCopy().ecosystem
  const t = e.tiles
  const jobs = useJobsEntry()
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-32">
      <SectionHeading eyebrow={e.eyebrow} title={e.title} subtitle={e.subtitle} />

      <div className="mt-16 grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 md:grid-cols-6 lg:gap-5">
        {/* Catálogo — grande */}
        <Tile
          to="/catalog"
          className="md:col-span-4"
          icon={<BookOpen />}
          title={t.catalog.title}
          desc={t.catalog.desc}
          accent="brand"
        >
          <div className="mt-6 flex flex-wrap gap-2">
            {t.catalog.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-ase-text2"
              >
                {chip}
              </span>
            ))}
          </div>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300">
            {t.catalog.cta}
            <ArrowUpRight
              className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Tile>

        {/* Academy */}
        <Tile
          to="/academy"
          className="md:col-span-2 md:row-span-2"
          icon={<Gamepad2 />}
          title={t.academy.title}
          desc={t.academy.desc}
          accent="violet"
        >
          <div className="mt-6 space-y-2" aria-hidden>
            {['09:15', '11:30', '13:00', '17:00'].map((h, i) => (
              <div key={h} className="flex items-center gap-3">
                <span className="w-11 font-mono text-[11px] text-ase-muted">{h}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-ase-brand" style={{ width: `${[45, 70, 30, 90][i]}%` }} />
                </div>
              </div>
            ))}
          </div>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300">
            {t.academy.cta}
            <ArrowUpRight
              className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Tile>

        <Tile
          to={jobs.to}
          className="md:col-span-2"
          icon={<Briefcase />}
          title={t.jobs.title}
          desc={t.jobs.desc}
          accent="cyan"
        >
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-sky-300">
            {jobs.label}
            <ArrowUpRight
              className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Tile>
        <Tile
          to="/services"
          className="md:col-span-2"
          icon={<ShieldCheck />}
          title={t.consulting.title}
          desc={t.consulting.desc}
          accent="emerald"
        />

        <Tile
          to="/pricing"
          className="md:col-span-2"
          icon={<Award />}
          title={t.loyalty.title}
          desc={t.loyalty.desc}
          accent="gold"
        >
          <div className="mt-5 flex gap-1.5" aria-hidden>
            {t.loyalty.levels.map((l, i) => (
              <span
                key={l}
                className={cn(
                  'flex-1 rounded-md py-1 text-center text-[10px] font-semibold',
                  [
                    'bg-slate-300/15 text-slate-200',
                    'bg-amber-400/20 text-amber-200',
                    'bg-cyan-300/15 text-cyan-100',
                    'bg-violet-400/20 text-violet-200',
                  ][i],
                )}
              >
                {l}
              </span>
            ))}
          </div>
        </Tile>
        <Tile
          to="/blog"
          className="md:col-span-2"
          icon={<MessagesSquare />}
          title={t.community.title}
          desc={t.community.desc}
          accent="brand"
        />
        <Tile
          to="/platform"
          className="md:col-span-2"
          icon={<Building2 />}
          title={t.teams.title}
          desc={t.teams.desc}
          accent="violet"
        />
        <Tile
          to="/services"
          className="md:col-span-6 lg:col-span-6"
          icon={<Workflow />}
          title={t.frameworks.title}
          desc={t.frameworks.desc}
          accent="cyan"
          horizontal
        />
      </div>
    </section>
  )
}

const ACCENTS = {
  brand: {
    icon: 'text-sky-300 bg-ase-brand/15 ring-ase-brand/30',
    glow: 'group-hover:shadow-[0_0_50px_-12px_rgba(76,125,255,0.55)]',
  },
  violet: {
    icon: 'text-violet-300 bg-violet-500/15 ring-violet-400/30',
    glow: 'group-hover:shadow-[0_0_50px_-12px_rgba(124,92,255,0.55)]',
  },
  cyan: {
    icon: 'text-cyan-300 bg-cyan-500/10 ring-cyan-400/30',
    glow: 'group-hover:shadow-[0_0_50px_-12px_rgba(34,211,238,0.45)]',
  },
  emerald: {
    icon: 'text-emerald-300 bg-emerald-500/10 ring-emerald-400/30',
    glow: 'group-hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.45)]',
  },
  gold: {
    icon: 'text-amber-300 bg-amber-400/10 ring-amber-400/30',
    glow: 'group-hover:shadow-[0_0_50px_-12px_rgba(245,158,11,0.45)]',
  },
} as const

function Tile({
  to,
  className,
  icon,
  title,
  desc,
  accent,
  horizontal,
  children,
}: {
  to: string
  className?: string
  icon: ReactNode
  title: string
  desc: string
  accent: keyof typeof ACCENTS
  horizontal?: boolean
  children?: ReactNode
}) {
  const a = ACCENTS[accent]
  return (
    <Reveal className={className}>
      <Link
        to={to}
        className={cn(
          'group relative flex h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
          horizontal ? 'flex-col gap-5 sm:flex-row sm:items-center' : 'flex-col',
          a.glow,
        )}
      >
        <span
          className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 [&>svg]:h-5 [&>svg]:w-5', a.icon)}
          aria-hidden
        >
          {icon}
        </span>
        <div className={cn(!horizontal && 'mt-5')}>
          <h3 className="text-lg font-semibold text-ase-text">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ase-text2">{desc}</p>
        </div>
        {children}
      </Link>
    </Reveal>
  )
}
