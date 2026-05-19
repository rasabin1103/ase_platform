import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'

export function WhyPillarsSection() {
  const { t } = useI18n()
  const pillars = [t('why.pillars.p1'), t('why.pillars.p2'), t('why.pillars.p3')] as Array<{
    title: string
    desc: string
    detail: string
  }>

  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-28">
        <Badge variant="info" className="w-fit">
          {t('why.badge')}
        </Badge>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
          {t('why.title')}
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-ase-text2 sm:text-lg">
          {t('why.subtitle')}
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pillars.map((p) => (
            <Card
              key={p.title}
              interactive
              className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface/70 p-8 backdrop-blur"
            >
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/10 blur-3xl" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-ase-text">{p.title}</div>
                  <div className="mt-3 text-sm leading-relaxed text-ase-text2">{p.desc}</div>
                </div>
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-ase-accent/70 shadow-[0_0_18px_rgba(34,211,238,0.22)]" />
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold text-ase-text2">
                {p.detail}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

