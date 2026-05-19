import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export function AuthVisualPanel({
  badge,
  title,
  body,
  bullets,
}: {
  badge: any
  title: any
  body: any
  bullets: any
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 rounded-[44px] bg-gradient-to-tr from-ase-primary/14 via-ase-accent/10 to-transparent blur-3xl" />
      <div className="relative">
        <Badge variant="info" className="w-fit">
          {badge}
        </Badge>
        <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ase-text sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ase-text2 sm:text-lg">{body}</p>

        <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
          {(bullets as string[]).map((b) => (
            <Card key={b} className="rounded-3xl border-white/10 bg-white/[0.03] p-5 backdrop-blur" interactive>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-ase-primary shadow-[0_0_18px_rgba(56,189,248,0.30)]" />
                <div className="text-sm font-semibold text-ase-text">{b}</div>
              </div>
              <div className="mt-2 text-sm text-ase-text2">Enterprise-ready</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

