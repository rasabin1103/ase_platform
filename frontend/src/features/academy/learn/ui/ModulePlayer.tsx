import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Award, Check, Circle, CloudOff, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCourse } from '../../content/courseList'
import { RichText } from '../../ui'
import { useAcademyUserKey } from '../../useMissionRun'
import type { LessonModule } from '../types'
import { useModuleRun } from '../useModuleRun'
import { ExampleView, ExerciseView, PredictView } from './blocks'

/**
 * Reproductor de un módulo de un curso instructivo: índice de lecciones a la
 * izquierda, la lección (bloques) en el centro y el progreso arriba.
 */

const T = {
  es: {
    module: 'Módulo',
    finalModule: 'Proyecto final',
    goals: 'Vas a aprender',
    lessons: 'Lecciones',
    min: 'min',
    prev: 'Lección anterior',
    next: 'Siguiente lección',
    back: 'Volver al curso',
    progress: (d: number, t: number) => `${d} de ${t} actividades superadas`,
    score: (s: number, p: number) => `Nota: ${s}/100 · apruebas con ${p}`,
    doneTitle: '¡Módulo completado!',
    doneText: 'Has superado todas las actividades del módulo.',
    examDone: '¡Examen práctico aprobado!',
    examText: 'Ya puedes hacer el test final para conseguir el certificado.',
    nextModule: 'Siguiente módulo',
    toTest: 'Ir al test final',
    syncError: 'No se ha podido guardar en tu cuenta; tu progreso sigue guardado en este navegador.',
  },
  en: {
    module: 'Module',
    finalModule: 'Final project',
    goals: "You'll learn",
    lessons: 'Lessons',
    min: 'min',
    prev: 'Previous lesson',
    next: 'Next lesson',
    back: 'Back to the course',
    progress: (d: number, t: number) => `${d} of ${t} activities passed`,
    score: (s: number, p: number) => `Score: ${s}/100 · pass mark ${p}`,
    doneTitle: 'Module completed!',
    doneText: "You've passed every activity in this module.",
    examDone: 'Practical exam passed!',
    examText: 'You can now take the final test to get your certificate.',
    nextModule: 'Next module',
    toTest: 'Go to the final test',
    syncError: "Couldn't save to your account; your progress is still saved in this browser.",
  },
}

export function ModulePlayer({ module }: { module: LessonModule }) {
  const lang = module.lang
  const t = T[lang]
  const { userKey } = useAcademyUserKey()
  const { passed, progress, pass, sync } = useModuleRun(module)
  const [index, setIndex] = useState(0)
  const lesson = module.lessons[index]
  const backTo = `/academy/${module.courseKey}`
  const course = getCourse(module.courseKey, lang)
  const pos = course?.missions.findIndex((m) => m.id === module.id) ?? -1
  const nextModule = pos >= 0 ? course?.missions[pos + 1] : undefined
  const label = module.exam ? t.finalModule : `${t.module} ${module.number}`

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [index])

  const onPass = useCallback((id: string) => () => pass(id), [pass])
  const draft = (id: string) => `ase_learn_draft:${userKey}:${module.courseKey}:${module.id}:${id}`
  const lessonDone = (i: number) => {
    const ids = module.lessons[i].blocks.filter((b) => b.kind === 'predict' || b.kind === 'exercise').map((b) => (b as { id: string }).id)
    return ids.length > 0 && ids.every((id) => passed.has(id))
  }
  const pct = progress.total ? Math.round((progress.passed / progress.total) * 100) : 0

  return (
    <div className="min-h-dvh bg-ase-bg text-ase-text">
      <header className="sticky top-0 z-20 border-b border-ase-border bg-ase-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to={backTo} className="inline-flex items-center gap-1 text-body-sm text-ase-muted hover:text-ase-text">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
          <p className="min-w-0 flex-1 truncate font-semibold">
            <span className="text-ase-brand">{label}</span> · {module.title}
          </p>
          <div className="flex min-w-[200px] items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t.progress(progress.passed, progress.total)}>
              <div className="h-full rounded-full bg-ase-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-caption text-ase-muted" data-testid="module-progress">
              {module.exam && progress.score !== null ? t.score(progress.score, module.exam.passMark) : `${progress.passed}/${progress.total}`}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label={t.lessons} className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-label uppercase text-ase-muted">{t.lessons}</p>
          <ol className="space-y-1">
            {module.lessons.map((l, i) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`flex w-full items-center gap-2 rounded-ase-md px-2 py-1.5 text-left text-body-sm ${i === index ? 'bg-ase-brand/15 text-ase-text' : 'text-ase-text2 hover:bg-white/[0.04]'}`}
                >
                  {lessonDone(i) ? <Check className="h-4 w-4 shrink-0 text-ase-success" /> : <Circle className="h-4 w-4 shrink-0 text-ase-muted" />}
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  <span className="text-caption text-ase-muted">{l.minutes} {t.min}</span>
                </button>
              </li>
            ))}
          </ol>
          {sync === 'error' ? (
            <p className="mt-3 flex items-start gap-2 text-caption text-ase-warning">
              <CloudOff className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t.syncError}
            </p>
          ) : null}
        </nav>

        <main className="min-w-0 space-y-5">
          {index === 0 ? (
            <section className="space-y-3 rounded-ase-xl border border-ase-border bg-ase-surface p-5">
              <p className="text-label uppercase text-ase-brand">{label}</p>
              <h1 className="font-display text-heading-xl">{module.title}</h1>
              <p className="text-body-md text-ase-text2">{module.subtitle}</p>
              <div>
                <p className="mb-1 text-label uppercase text-ase-muted">{t.goals}</p>
                <ul className="ml-5 list-disc space-y-1 text-body-sm text-ase-text2">
                  {module.goals.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          <h2 className="font-display text-heading-lg" data-testid="lesson-title">{lesson.title}</h2>
          {lesson.blocks.map((b, i) => {
            const key = `${lesson.id}:${i}`
            if (b.kind === 'text') return <RichText key={key} text={b.md} className="text-body-md" />
            if (b.kind === 'example') return <ExampleView key={key} block={b} lang={lang} draftKey={draft(b.id)} />
            if (b.kind === 'predict') return <PredictView key={key} block={b} lang={lang} passed={passed.has(b.id)} onPass={onPass(b.id)} />
            return <ExerciseView key={key} block={b} lang={lang} passed={passed.has(b.id)} onPass={onPass(b.id)} draftKey={draft(b.id)} exam={!!module.exam} />
          })}

          {progress.finished && index === module.lessons.length - 1 ? (
            <section className="space-y-3 rounded-ase-xl border border-ase-success/40 bg-ase-success/5 p-5" data-testid="module-done">
              <p className="flex items-center gap-2 font-display text-heading-md text-ase-success">
                {module.exam ? <Award className="h-5 w-5" /> : <Trophy className="h-5 w-5" />} {module.exam ? t.examDone : t.doneTitle}
              </p>
              <p className="text-body-sm text-ase-text2">{module.exam ? t.examText : t.doneText}</p>
              <div className="flex flex-wrap gap-3">
                {module.exam ? (
                  <Link to={`${backTo}/simulacro`} className="inline-flex items-center gap-2 rounded-ase-md bg-ase-gold px-4 py-2 text-body-sm font-semibold text-ase-bg hover:bg-ase-gold-strong">
                    {t.toTest} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : nextModule?.available ? (
                  <Link to={`${backTo}/${nextModule.id}`} className="inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong">
                    {t.nextModule}: {nextModule.title} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
                <Link to={backTo} className="inline-flex items-center px-2 py-2 text-body-sm text-ase-muted hover:text-ase-text">
                  {t.back}
                </Link>
              </div>
            </section>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-ase-border pt-4">
            {index > 0 ? (
              <button type="button" onClick={() => setIndex(index - 1)} className="inline-flex items-center gap-2 text-body-sm text-ase-muted hover:text-ase-text">
                <ArrowLeft className="h-4 w-4" /> {t.prev}
              </button>
            ) : (
              <span />
            )}
            {index < module.lessons.length - 1 ? (
              <button type="button" onClick={() => setIndex(index + 1)} className="inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong">
                {t.next}: {module.lessons[index + 1].title} <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
