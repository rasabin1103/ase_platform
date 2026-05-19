import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'

type Step = {
  index: number
  title: string
  desc: string
  icon: React.ReactNode
}

export function ProcessTimeline() {
  const { t } = useI18n()
  const steps: Step[] = [
    { index: 1, title: t('process.steps.s1.title'), desc: t('process.steps.s1.desc'), icon: <Dot tone="primary" /> },
    { index: 2, title: t('process.steps.s2.title'), desc: t('process.steps.s2.desc'), icon: <Dot tone="accent" /> },
    { index: 3, title: t('process.steps.s3.title'), desc: t('process.steps.s3.desc'), icon: <Dot tone="muted" /> },
    { index: 4, title: t('process.steps.s4.title'), desc: t('process.steps.s4.desc'), icon: <Dot tone="primary" /> },
    { index: 5, title: t('process.steps.s5.title'), desc: t('process.steps.s5.desc'), icon: <Dot tone="accent" /> },
  ]
  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-28">
        <Badge variant="info" className="w-fit">
          {t('process.badge')}
        </Badge>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
          {t('process.title')}
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-ase-text2 sm:text-lg">
          {t('process.subtitle')}
        </p>

        {/* Desktop: horizontal */}
        <div className="relative mt-14 hidden lg:block">
          <div className="pointer-events-none absolute left-0 top-8 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="grid grid-cols-5 gap-6">
            {steps.map((s) => (
              <div key={s.title} className="relative">
                <div className="absolute left-1/2 top-8 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ase-primary/30 shadow-[0_0_18px_rgba(56,189,248,0.18)]" />
                <Card className="rounded-3xl border-white/10 bg-ase-surface/65 p-7 backdrop-blur" interactive>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                      {String(s.index).padStart(2, '0')}
                    </div>
                    {s.icon}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-ase-text">{s.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-ase-text2">{s.desc}</div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/tablet: vertical */}
        <div className="relative mt-14 lg:hidden">
          <div className="pointer-events-none absolute left-4 top-0 h-full w-px bg-white/10" />
          <div className="space-y-5">
            {steps.map((s) => (
              <div key={s.title} className="relative pl-10">
                <div className="absolute left-4 top-8 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ase-primary/30 shadow-[0_0_18px_rgba(56,189,248,0.18)]" />
                <Card className="rounded-3xl border-white/10 bg-ase-surface/65 p-7 backdrop-blur" interactive>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                      {String(s.index).padStart(2, '0')}
                    </div>
                    {s.icon}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-ase-text">{s.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-ase-text2">{s.desc}</div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Dot({ tone }: { tone: 'primary' | 'accent' | 'muted' }) {
  return (
    <span
      className={cn(
        'h-3 w-3 rounded-full',
        tone === 'primary' && 'bg-ase-primary shadow-[0_0_18px_rgba(56,189,248,0.30)]',
        tone === 'accent' && 'bg-ase-accent shadow-[0_0_18px_rgba(34,211,238,0.22)]',
        tone === 'muted' && 'bg-white/35',
      )}
    />
  )
}

