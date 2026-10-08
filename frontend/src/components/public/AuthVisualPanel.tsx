import type { ReactNode } from 'react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export type AuthBenefit = { title: string; text: string }

export function AuthVisualPanel({
  badge,
  title,
  body,
  bullets,
}: {
  badge: ReactNode
  title: ReactNode
  body: ReactNode
  /** Beneficios para el usuario (título + explicación corta), no jerga técnica. */
  bullets: AuthBenefit[]
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 rounded-[44px] blur-3xl" />
      <div className="relative">
        <Badge variant="info" className="w-fit">
          {badge}
        </Badge>
        <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ase-text sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ase-text2 sm:text-lg">{body}</p>

        <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
          {bullets.map((b) => (
            <Card key={b.title} className="rounded-3xl border-white/10 bg-white/[0.03] p-5" interactive>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-ase-primary shadow-[0_0_18px_rgba(56,189,248,0.30)]" />
                <div className="text-sm font-semibold text-ase-text">{b.title}</div>
              </div>
              <div className="mt-2 text-sm text-ase-text2">{b.text}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
