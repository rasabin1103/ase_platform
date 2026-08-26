import { Eyebrow } from '../ui/Eyebrow'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'

export function WhyPillarsSection() {
  const { t } = useI18n()
  type Pillar = { title: string; desc: string; detail: string }
  const pillars = [t<Pillar>('why.pillars.p1'), t<Pillar>('why.pillars.p2'), t<Pillar>('why.pillars.p3')]

  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-28">
        <Eyebrow>{t('why.badge')}</Eyebrow>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
          {t('why.title')}
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-ase-text2 sm:text-lg">
          {t('why.subtitle')}
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pillars.map((p, idx) => (
            <Card
              key={p.title}
              interactive
              className="relative animate-fade-in-up overflow-hidden rounded-3xl border-white/10 bg-ase-surface p-8 transition duration-300 ease-out hover:-translate-y-1 hover:border-ase-brand/40 hover:shadow-glow-cyan"
              style={{ animationDelay: `${idx * 90}ms` }}
            >
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

