import { ArrowRight, Clock, Gamepad2, GraduationCap, Lock, Sparkles, Star, Target, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { getAcademyCourseAccess } from '../api'
import { ACADEMY_COURSES, LEVEL_LABEL, LEVEL_LABEL_EN, academyCourses } from '../content/courseList'
import { PageHero } from '../../../components/public/home/PageHero'
import { Reveal, SectionHeading } from '../../../components/public/home/Reveal'
import { ButtonLink } from '../../../components/ui/Button'
import { cn } from '../../../components/ui/cn'
import { useHomeCopy } from '../../../components/public/home/useHomeCopy'
import { useAcademyLang } from '../i18n'
import { usePageTitle } from '../../../hooks/usePageTitle'

const PLAYABLE = ACADEMY_COURSES.reduce((n, c) => n + c.missions.filter((m) => m.available).length, 0)
const HOURS = ACADEMY_COURSES.reduce((n, c) => n + c.estimatedHours, 0)

const HOW_ICONS = [Users, Target, Sparkles, Trophy]

const COPY = {
  es: {
    how: [
      { title: 'Entras a trabajar', text: 'Te incorporas a una empresa ficticia con compañeros, jefes y clientes que tienen sus propias prisas.' },
      { title: 'Decides bajo presión', text: 'Reuniones, chats y herramientas reales: tú eliges qué probar, qué reportar y qué dejar pasar.' },
      { title: 'Ves las consecuencias', text: 'Lo que no pruebes se convierte en un bug que verás nacer. Lo que evites, también queda registrado.' },
      { title: 'Debrief con estrellas', text: 'Rigor, comunicación, gestión del tiempo y visión de riesgo, más un test antes y después estilo ISTQB®.' },
    ],
    titleBefore: 'Aprende',
    titleHighlight: 'viviendo el trabajo real',
    subtitle:
      'Cursos-juego en los que entras a trabajar en una empresa ficticia, tomas decisiones con presión real y descubres sus consecuencias. Al final de cada misión, un debrief convierte lo que has vivido en teoría.',
    playFirst: 'Jugar la primera misión gratis',
    stats: { missions: 'misiones jugables', courses: 'cursos', practice: 'de práctica' },
    firstFree: '1.ª misión gratis',
    freeCourse: 'Curso gratis',
    missions: 'misiones',
    missionsAria: 'Misiones',
    soon: 'Próximamente',
    viewCourse: 'Ver curso',
    howEyebrow: 'Cómo funciona',
    howTitle: 'No vas a ver vídeos. Vas a trabajar.',
    insideEyebrow: 'Una misión por dentro',
    insideSubtitle: 'Cada misión dura una jornada simulada. El reloj avanza, los compañeros escriben y las decisiones se acumulan.',
    ctaTitle: 'La primera misión de cada curso es gratis.',
    ctaBody: 'Juega, equivócate sin consecuencias reales y decide después si quieres el curso completo o un plan.',
    startNow: 'Empezar ahora',
    plans: 'Ver planes',
  },
  en: {
    how: [
      { title: 'You start the job', text: 'You join a fictional company with teammates, managers and clients who all have their own deadlines.' },
      { title: 'You decide under pressure', text: 'Meetings, chats and real tools: you choose what to test, what to report and what to let go.' },
      { title: 'You see the consequences', text: "Whatever you don't test becomes a bug you'll watch being born. Whatever you prevent is recorded too." },
      { title: 'Debrief with stars', text: 'Rigor, communication, time management and risk awareness, plus an ISTQB®-style test before and after.' },
    ],
    titleBefore: 'Learn',
    titleHighlight: 'by living the real job',
    subtitle:
      'Course-games where you go to work at a fictional company, make decisions under real pressure and discover their consequences. At the end of each mission, a debrief turns what you lived through into theory.',
    playFirst: 'Play the first mission for free',
    stats: { missions: 'playable missions', courses: 'courses', practice: 'of practice' },
    firstFree: '1st mission free',
    freeCourse: 'Free course',
    missions: 'missions',
    missionsAria: 'Missions',
    soon: 'Coming soon',
    viewCourse: 'View course',
    howEyebrow: 'How it works',
    howTitle: "You won't watch videos. You'll work.",
    insideEyebrow: 'Inside a mission',
    insideSubtitle: 'Each mission lasts one simulated workday. The clock ticks, teammates message you and decisions pile up.',
    ctaTitle: 'The first mission of every course is free.',
    ctaBody: 'Play, make mistakes with no real consequences and then decide whether you want the full course or a plan.',
    startNow: 'Start now',
    plans: 'See plans',
  },
}

export function AcademyHomePage() {
  const day = useHomeCopy().academy
  const lang = useAcademyLang()
  const c = COPY[lang]
  usePageTitle(`ASE Academy: ${c.titleBefore.toLowerCase()} ${c.titleHighlight}`, c.subtitle)
  const COURSES = academyCourses(lang)
  const levelLabel = lang === 'en' ? LEVEL_LABEL_EN : LEVEL_LABEL
  // Cursos con precio 0: se anuncian como gratis enteros, no «1.ª misión gratis».
  const accessQueries = useQueries({
    queries: COURSES.map((course) => ({
      queryKey: ['academy-course-access-public', course.key],
      queryFn: () => getAcademyCourseAccess(course.key),
      staleTime: 5 * 60_000,
      retry: 1,
    })),
  })
  const isFreeCourse = (i: number) => {
    const a = accessQueries[i]?.data
    return !!a && a.linked && a.isFree
  }
  return (
    <div className="overflow-x-clip bg-ase-bg">
      <PageHero
        eyebrow="ASE Academy"
        titleBefore={c.titleBefore}
        titleHighlight={c.titleHighlight}
        titleAfter="."
        subtitle={c.subtitle}
      >
        <div className="flex flex-col items-center gap-6">
          <ButtonLink
            to={`/academy/${COURSES[0].key}`}
            size="lg"
            leftIcon={<Gamepad2 className="h-4 w-4" aria-hidden />}
          >
            {c.playFirst}
          </ButtonLink>
          <dl className="grid grid-cols-3 gap-6 sm:gap-12">
            {[
              { v: PLAYABLE, l: c.stats.missions },
              { v: COURSES.length, l: c.stats.courses },
              { v: `~${HOURS} h`, l: c.stats.practice },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <dd className="font-display text-3xl font-semibold text-ase-text sm:text-4xl">{s.v}</dd>
                <dt className="mt-1 text-xs text-ase-muted sm:text-sm">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </PageHero>

      {/* Cursos */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-5 sm:px-8 lg:grid-cols-2">
          {COURSES.map((course, ci) => {
            const playable = course.missions.filter((m) => m.available).length
            return (
              <Reveal key={course.key} delayMs={ci * 100}>
                <Link
                  to={`/academy/${course.key}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/80 transition duration-300 hover:-translate-y-1 hover:border-ase-brand/50 hover:shadow-[0_0_60px_-20px_rgba(76,125,255,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
                >
                  <div className="relative overflow-hidden border-b border-white/[0.07] px-7 pb-6 pt-7">
                    <div
                      aria-hidden
                      className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-ase-brand/25 blur-3xl"
                    />
                    <div className="relative flex items-start justify-between gap-4">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl ase-gradient-brand text-white shadow-brand">
                        <GraduationCap className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                        {isFreeCourse(ci) ? c.freeCourse : c.firstFree}
                      </span>
                    </div>
                    <p className="relative mt-5 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                      {course.track}
                    </p>
                    <h2 className="relative mt-1.5 font-display text-2xl font-semibold leading-tight text-ase-text">
                      {course.title}
                    </h2>
                    <p className="relative mt-3 text-sm leading-relaxed text-ase-text2">{course.description}</p>
                  </div>

                  <div className="flex flex-1 flex-col px-7 py-6">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ase-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5" aria-hidden /> {levelLabel[course.level]}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden /> ~{course.estimatedHours} h
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Gamepad2 className="h-3.5 w-3.5" aria-hidden /> {playable}/{course.missions.length} {c.missions}
                      </span>
                    </div>

                    {/* Mapa de misiones */}
                    <ol className="mt-5 flex flex-wrap gap-1.5" aria-label={c.missionsAria}>
                      {course.missions.map((m, i) => (
                        <li
                          key={m.id}
                          title={m.title}
                          className={cn(
                            'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[11px] font-bold',
                            !m.available
                              ? 'border border-dashed border-white/15 text-ase-muted'
                              : i === 0 && !isFreeCourse(ci)
                                ? 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40'
                                : 'bg-ase-brand/20 text-sky-200 ring-1 ring-ase-brand/40',
                          )}
                        >
                          {m.available ? i : <Lock className="h-3 w-3" aria-label={c.soon} />}
                        </li>
                      ))}
                    </ol>

                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-sky-300">
                      {c.viewCourse}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-white/5 bg-ase-bg2/40 py-20 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <SectionHeading eyebrow={c.howEyebrow} title={c.howTitle} />
          <ol className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.how.map(({ title, text }, i) => {
              const Icon = HOW_ICONS[i]
              return (
              <Reveal as="li" key={title} delayMs={i * 90}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-ase-brand/15 text-sky-300 ring-1 ring-ase-brand/30">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="font-display text-3xl font-semibold text-ase-brand/40">0{i + 1}</span>
                  </div>
                  <p className="mt-5 font-semibold text-ase-text">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ase-text2">{text}</p>
                </div>
              </Reveal>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Así es un día */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <SectionHeading
            eyebrow={c.insideEyebrow}
            title={day.dayTitle}
            subtitle={c.insideSubtitle}
            align="left"
          />
          <Reveal delayMs={100}>
            <ol className="relative space-y-6 rounded-3xl border border-white/10 bg-ase-surface/80 p-7 sm:p-9">
              {day.day.map((d, i) => (
                <li key={d.time} className="flex gap-4">
                  <span
                    className={cn(
                      'shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-semibold',
                      i === day.day.length - 1 ? 'bg-emerald-400/15 text-emerald-200' : 'bg-ase-brand/15 text-sky-200',
                    )}
                  >
                    {d.time}
                  </span>
                  <p className="text-[15px] leading-relaxed text-ase-text2">{d.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] p-px">
            <div aria-hidden className="absolute inset-0 ase-gradient-brand opacity-80" />
            <div className="relative rounded-[calc(2rem-1px)] bg-ase-bg px-6 py-14 text-center sm:px-12">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight text-ase-text sm:text-4xl">
                {c.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-ase-text2">
                {c.ctaBody}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink to={`/academy/${COURSES[0].key}`} size="lg">
                  {c.startNow}
                </ButtonLink>
                <ButtonLink to="/pricing" size="lg" variant="secondary">
                  {c.plans}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
