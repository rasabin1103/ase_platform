import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { cn } from '../../components/ui/cn'
import { tStringArray, useI18n } from '../../i18n'

type HeroCardId = 'architecture' | 'automation' | 'quality' | 'scale'
const HERO_CARDS: HeroCardId[] = ['architecture', 'automation', 'quality', 'scale']

export function AboutPage() {
  const { t } = useI18n()

  const differentiators = useMemo(() => tStringArray(t, 'aboutPage.differentiators.items'), [t])
  const philosophy = useMemo(() => tStringArray(t, 'aboutPage.principles.cards.philosophy.bullets'), [t])

  const history = useMemo(() => t('aboutPage.history.items') as Array<{ year: string; body: string }>, [t])
  const whyTimeline = useMemo(
    () => t('aboutPage.why.timeline.items') as Array<{ title: string; desc: string }>,
    [t],
  )

  return (
    <div className="w-full bg-ase-bg">
      {/* HERO */}
      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
        <HeroAmbient />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(56,189,248,0.14),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="pointer-events-none absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-ase-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[24rem] w-[24rem] rounded-full bg-ase-accent/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
            <div className="lg:col-span-6">
              <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
                {t('aboutPage.hero.badge')}
              </Badge>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ase-text sm:text-5xl lg:text-6xl"
              >
                {t('aboutPage.hero.title')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: 0.05 }}
                className="mt-6 max-w-2xl text-base leading-relaxed text-ase-text2 sm:text-lg lg:text-xl"
              >
                {t('aboutPage.hero.subtitle')}
              </motion.p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/platform" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:min-w-[200px]">
                    {t('aboutPage.closing.ctas.platform')}
                  </Button>
                </Link>
                <Link to="/contact" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:min-w-[200px]">
                    {t('aboutPage.closing.ctas.talk')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {HERO_CARDS.map((id, idx) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 + idx * 0.06 }}
                  >
                    <Card
                      interactive
                      className={cn(
                        'group relative overflow-hidden rounded-3xl border-white/[0.10] bg-ase-surface/55 p-6 backdrop-blur-md',
                        'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_60px_rgba(0,0,0,0.55)]',
                      )}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                        <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]" />
                      </div>
                      <div className="pointer-events-none absolute -inset-10 opacity-60">
                        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ase-primary/10 blur-3xl" />
                        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-ase-accent/8 blur-3xl" />
                      </div>
                      <div className="relative z-[1] flex items-start gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-ase-text">
                          {t(`aboutPage.hero.cards.${id}.icon`)}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold tracking-tight text-ase-text">
                            {t(`aboutPage.hero.cards.${id}.title`)}
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-ase-text2">
                            {t(`aboutPage.hero.cards.${id}.description`)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
            <div className="lg:col-span-6">
              <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
                {t('aboutPage.why.badge')}
              </Badge>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('aboutPage.why.title')}</h2>
              <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-ase-text2 sm:text-lg">{t('aboutPage.why.body')}</p>
            </div>
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-6 backdrop-blur-md sm:p-8">
                <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
                <div className="relative z-[1]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('aboutPage.why.timeline.title')}</div>
                  <div className="mt-6 space-y-5">
                    {whyTimeline.map((it, i) => (
                      <div key={`sig-${i}`} className="relative pl-8">
                        <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-ase-primary/50 via-white/10 to-transparent" />
                        <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border border-white/10 bg-ase-bg2 shadow-[0_0_18px_rgba(56,189,248,0.18)]" />
                        <div className="text-sm font-semibold text-ase-text">{it.title}</div>
                        <div className="mt-1 text-sm leading-relaxed text-ase-text2">{it.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
        <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('aboutPage.principles.badge')}
            </Badge>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <BigCard
              title={t('aboutPage.principles.cards.mission.title') as string}
              body={t('aboutPage.principles.cards.mission.body') as string}
              icon={t('aboutPage.principles.cards.mission.icon') as string}
            />
            <BigCard
              title={t('aboutPage.principles.cards.vision.title') as string}
              body={t('aboutPage.principles.cards.vision.body') as string}
              icon={t('aboutPage.principles.cards.vision.icon') as string}
            />
            <Card className="relative overflow-hidden rounded-3xl border-white/[0.10] bg-ase-surface/55 p-7 backdrop-blur-md" interactive>
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ase-primary/10 blur-3xl" />
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-ase-text">
                  {t('aboutPage.principles.cards.philosophy.icon')}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold tracking-tight text-ase-text">{t('aboutPage.principles.cards.philosophy.title')}</div>
                  <ul className="mt-4 space-y-2">
                    {philosophy.map((b, i) => (
                      <li key={`ph-${i}`} className="flex gap-2 text-sm text-ase-text2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ase-accent/80" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* HOW WE BUILD */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
        <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('aboutPage.build.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('aboutPage.build.title')}</h2>
            <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('aboutPage.build.subtitle')}</p>
          </div>

          <div className="relative mt-12 grid gap-5 lg:grid-cols-12">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />
            <BuildBlock id="architecture" className="lg:col-span-3" />
            <BuildBlock id="automation" className="lg:col-span-3" />
            <BuildBlock id="product" className="lg:col-span-3" />
            <BuildBlock id="ux" className="lg:col-span-3" />
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
        <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('aboutPage.differentiators.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('aboutPage.differentiators.title')}
            </h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((it, i) => (
              <motion.div
                key={`diff-${i}`}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.03 }}
                className="rounded-2xl border border-white/[0.08] bg-ase-surface/40 px-5 py-4 text-sm text-ase-text2 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-ase-primary/70 shadow-[0_0_12px_rgba(56,189,248,0.18)]" />
                  <span>{it}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORY */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
        <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('aboutPage.history.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('aboutPage.history.title')}
            </h2>
          </div>

          <div className="mt-12 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-6 backdrop-blur-md sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative z-[1] grid gap-6 lg:grid-cols-4">
              {history.map((h, i) => (
                <div key={`yr-${i}`} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold text-ase-text">{h.year}</div>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-ase-accent/70 shadow-[0_0_16px_rgba(34,211,238,0.22)]" />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ase-text2">{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(56,189,248,0.14),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-[min(100%,1200px)] px-5 sm:px-8 lg:px-12">
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.10] bg-ase-surface/45 px-6 py-14 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:px-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('aboutPage.closing.title')}</h2>
            <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-ase-text2 sm:text-lg">
              {t('aboutPage.closing.body')}
            </p>
            <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/platform" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:min-w-[220px]">
                  {t('aboutPage.closing.ctas.platform')}
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:min-w-[220px]">
                  {t('aboutPage.closing.ctas.talk')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function BigCard({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <Card className="group relative overflow-hidden rounded-3xl border-white/[0.10] bg-ase-surface/55 p-7 backdrop-blur-md" interactive>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.16),transparent_55%)]" />
      </div>
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ase-primary/10 blur-3xl" />
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-ase-text">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-extrabold tracking-tight text-ase-text">{title}</div>
          <p className="mt-3 text-sm leading-relaxed text-ase-text2">{body}</p>
        </div>
      </div>
    </Card>
  )
}

function BuildBlock({ id, className }: { id: 'architecture' | 'automation' | 'product' | 'ux'; className?: string }) {
  const { t } = useI18n()
  return (
    <Card
      interactive
      className={cn(
        'group relative overflow-hidden rounded-3xl border-white/[0.10] bg-ase-surface/50 p-7 backdrop-blur-md',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -inset-16 bg-[radial-gradient(circle_at_25%_15%,rgba(56,189,248,0.14),transparent_55%)]" />
      </div>
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ase-primary/10 blur-3xl" />
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-ase-text">
          {t(`aboutPage.build.items.${id}.icon`)}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-extrabold tracking-tight text-ase-text">{t(`aboutPage.build.items.${id}.title`)}</div>
          <p className="mt-3 text-sm leading-relaxed text-ase-text2">{t(`aboutPage.build.items.${id}.body`)}</p>
        </div>
      </div>
    </Card>
  )
}

function HeroAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        aria-hidden
        className="absolute inset-0 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(900px 420px at 18% 18%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(800px 380px at 82% 30%, rgba(34,211,238,0.12), transparent 62%)',
        }}
        animate={{ opacity: [0.42, 0.62, 0.42] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* floating particles (subtle, low count) */}
      {[
        { left: '12%', top: '22%', s: 6, d: 0.0 },
        { left: '20%', top: '56%', s: 4, d: 0.6 },
        { left: '34%', top: '14%', s: 5, d: 1.1 },
        { left: '52%', top: '32%', s: 3, d: 0.3 },
        { left: '68%', top: '18%', s: 4, d: 0.9 },
        { left: '78%', top: '52%', s: 5, d: 0.2 },
        { left: '86%', top: '28%', s: 3, d: 1.3 },
        { left: '60%', top: '70%', s: 4, d: 0.7 },
      ].map((p, i) => (
        <motion.div
          // eslint-disable-next-line react/no-array-index-key
          key={`p-${i}`}
          className="absolute rounded-full bg-white/25 shadow-[0_0_18px_rgba(56,189,248,0.18)]"
          style={{ left: p.left, top: p.top, width: p.s, height: p.s }}
          initial={{ opacity: 0.12, y: 0 }}
          animate={{ opacity: [0.12, 0.22, 0.12], y: [0, -10, 0] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: p.d }}
        />
      ))}
    </div>
  )
}

