import { ArrowRight, Clock, Gamepad2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ACADEMY_COURSES } from '../../../features/academy/content/courseList'
import { ButtonLink } from '../../ui/Button'
import { Reveal, SectionHeading } from './Reveal'
import { useHomeCopy } from './useHomeCopy'

export function HomeAcademySpotlight() {
  const a = useHomeCopy().academy
  return (
    <section className="relative isolate overflow-hidden py-24 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-ase-brand-strong/15 blur-[140px]" />
      </div>
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow={a.eyebrow} title={a.title} subtitle={a.subtitle} align="left" />
            <Reveal delayMs={120} className="mt-10 space-y-4">
              {ACADEMY_COURSES.map((course) => {
                const playable = course.missions.filter((m) => m.available).length
                return (
                  <Link
                    key={course.key}
                    to={`/academy/${course.key}`}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-ase-brand/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl ase-gradient-brand text-white shadow-brand">
                      <Gamepad2 className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300/80">
                        {course.track}
                      </p>
                      <p className="mt-0.5 truncate font-semibold text-ase-text">{course.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ase-muted">
                        <span>
                          {playable} {a.missions}
                        </span>
                        <span>· {a.level[course.level]}</span>
                        <span className="inline-flex items-center gap-1">
                          · <Clock className="h-3 w-3" aria-hidden /> {course.estimatedHours} {a.hours}
                        </span>
                      </p>
                    </div>
                    <ArrowRight
                      className="h-5 w-5 shrink-0 text-ase-muted transition group-hover:translate-x-1 group-hover:text-ase-text"
                      aria-hidden
                    />
                  </Link>
                )
              })}
            </Reveal>
            <Reveal delayMs={200} className="mt-8">
              <ButtonLink to="/academy" size="lg">
                {a.cta}
              </ButtonLink>
            </Reveal>
          </div>

          <Reveal delayMs={100}>
            <div className="relative rounded-3xl border border-white/10 bg-ase-surface/70 p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] sm:p-9">
              <p className="text-label font-semibold uppercase text-ase-muted">{a.dayTitle}</p>
              <ol className="relative mt-7 space-y-7 border-l border-white/10 pl-7">
                {a.day.map((d, i) => (
                  <li key={d.time} className="relative">
                    <span
                      className={
                        'absolute -left-[33px] top-1 h-3 w-3 rounded-full ring-4 ring-ase-surface ' +
                        (i === a.day.length - 1 ? 'bg-emerald-400' : 'bg-ase-brand')
                      }
                      aria-hidden
                    />
                    <p className="font-mono text-xs font-semibold text-sky-300">{d.time}</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ase-text2">{d.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
