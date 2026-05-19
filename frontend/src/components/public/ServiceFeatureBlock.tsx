import { Card } from '../ui/Card'
import { cn } from '../ui/cn'

export type ServiceFeatureBlockProps = {
  icon: React.ReactNode
  index: number
  title: string
  description: string
  bullets: string[]
  reverse?: boolean
}

function IndexPill({ index }: { index: number }) {
  const s = String(index).padStart(2, '0')
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-ase-text2">
      <span className="h-1.5 w-1.5 rounded-full bg-ase-primary shadow-[0_0_14px_rgba(56,189,248,0.35)]" />
      <span className="font-semibold tracking-wide text-ase-text">{s}</span>
    </div>
  )
}

export function ServiceFeatureBlock({
  icon,
  index,
  title,
  description,
  bullets,
  reverse,
}: ServiceFeatureBlockProps) {
  return (
    <div className={cn('grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14', reverse && 'lg:[&>*:first-child]:order-2')}>
      {/* Visual */}
      <Card
        interactive
        className={cn(
          'relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface/70 p-8 backdrop-blur',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.55)]',
        )}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-ase-accent/10 blur-3xl" />
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              {icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-ase-text">{title}</div>
              <div className="mt-0.5 text-xs text-ase-muted">Delivery blueprint</div>
            </div>
          </div>
          <IndexPill index={index} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <MiniCard label="Outcome" value="Operational clarity" />
          <MiniCard label="Speed" value="Incremental releases" />
          <MiniCard label="Quality" value="Automation-first" />
          <MiniCard label="Control" value="Governed access" />
        </div>

        <div className="mt-6 h-px bg-white/5" />

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Chip>Design</Chip>
          <Chip>Build</Chip>
          <Chip>Automate</Chip>
          <Chip>Observe</Chip>
          <Chip>Scale</Chip>
          <Chip>Harden</Chip>
        </div>
      </Card>

      {/* Text */}
      <div>
        <IndexPill index={index} />
        <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{title}</h3>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ase-text2">{description}</p>
        <ul className="mt-6 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-sm text-ase-text2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ase-primary/80" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ase-bg2/40 px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-2 text-sm font-semibold text-ase-text">{value}</div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs font-semibold text-ase-text2">
      {children}
    </div>
  )
}

