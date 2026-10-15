import { ArrowLeft, Award, Check, ChevronRight, CircleAlert, Lock, Play, ShoppingCart } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { catalogItemPath } from '../api'
import { LEVEL_LABEL, LEVEL_LABEL_EN, getCourse } from '../content/registry'
import { useCourseAccess } from '../useCourseAccess'
import { CourseReviews } from '../CourseReviews'
import { useQuery } from '@tanstack/react-query'
import { listAcademyRuns } from '../api'
import { readMissionStatus, useAcademyUserKey } from '../useMissionRun'
import { EXAM_COURSES } from '../exam/studyMap'
import { useAcademyLang, type AcademyLang } from '../i18n'

const COPY = {
  es: {
    status: { new: 'Empezar', in_progress: 'Continuar', finished: 'Rejugar' },
    notFound: 'Este curso no existe o todavía no está publicado.',
    allCourses: 'Ver todos los cursos',
    freeCourse: 'Curso gratuito: todas las misiones están abiertas.',
    signInToSave: ' Inicia sesión para guardar tu progreso.',
    hasAccess: 'Tienes acceso al curso completo.',
    firstFree: 'La primera misión es gratuita. El curso completo cuesta',
    unlock: 'Desbloquear curso completo',
    alreadyBought: '¿Ya lo compraste? Inicia sesión',
    preparing: 'Curso en preparación: de momento puedes jugar la primera misión.',
    mission: 'Misión',
    free: 'Gratis',
    soon: 'Próximamente',
    included: 'Incluida en el curso completo',
    goToExam: 'Ir al simulacro',
    desktop: 'Recomendado en ordenador.',
    savedAccount: 'Tu progreso se guarda en tu cuenta.',
    signInAccount: 'Inicia sesión para guardar tu progreso en tu cuenta.',
  },
  en: {
    status: { new: 'Start', in_progress: 'Continue', finished: 'Replay' },
    notFound: "This course doesn't exist or hasn't been published yet.",
    allCourses: 'See all courses',
    freeCourse: 'Free course: all missions are open.',
    signInToSave: ' Sign in to save your progress.',
    hasAccess: 'You have access to the full course.',
    firstFree: 'The first mission is free. The full course costs',
    unlock: 'Unlock the full course',
    alreadyBought: 'Already bought it? Sign in',
    preparing: 'Course in preparation: for now you can play the first mission.',
    mission: 'Mission',
    free: 'Free',
    soon: 'Coming soon',
    included: 'Included in the full course',
    goToExam: 'Go to the mock exam',
    desktop: 'Best on a computer.',
    savedAccount: 'Your progress is saved to your account.',
    signInAccount: 'Sign in to save your progress to your account.',
  },
}

function formatPrice(price: string | number | null, currency: string | null, lang: AcademyLang): string {
  const n = Number(price ?? 0)
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-ES', { style: 'currency', currency: currency || 'EUR' }).format(n)
}

export function AcademyCoursePage() {
  const { courseKey = '' } = useParams()
  const lang = useAcademyLang()
  const c = COPY[lang]
  const course = getCourse(courseKey, lang)
  const { access, isLoading } = useCourseAccess(courseKey, !!course)
  const { userKey, authenticated } = useAcademyUserKey()
  const runsQuery = useQuery({
    queryKey: ['academy-runs', courseKey, userKey],
    queryFn: () => listAcademyRuns(courseKey),
    enabled: authenticated && !!course,
  })
  const statusOf = (missionId: string): 'new' | 'in_progress' | 'finished' => {
    const remote = runsQuery.data?.find((r) => r.missionId === missionId)
    if (remote) return remote.finished ? 'finished' : remote.actionsCount > 0 ? 'in_progress' : 'new'
    return readMissionStatus({ courseKey, id: missionId }, userKey)
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="mb-4 text-ase-text2">{c.notFound}</p>
        <Link to="/academy" className="text-ase-brand hover:underline">
          {c.allCourses}
        </Link>
      </div>
    )
  }

  const buyPath = catalogItemPath(access)

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Link to="/academy" className="mb-6 inline-flex items-center gap-1 text-body-sm text-ase-muted hover:text-ase-text">
        <ArrowLeft className="h-4 w-4" /> ASE Academy
      </Link>
      <header className="mb-8 max-w-3xl space-y-2">
        <p className="text-caption text-ase-muted">
          {course.track} · {(lang === 'en' ? LEVEL_LABEL_EN : LEVEL_LABEL)[course.level]} · ~{course.estimatedHours} h
        </p>
        <h1 className="font-display text-display-lg">{course.title}</h1>
        <p className="text-body-lg text-ase-text2">{course.description}</p>
      </header>

      {!isLoading && (
        <div className="mb-8 rounded-ase-lg border border-ase-border bg-ase-surface p-4 text-body-sm">
          {access.linked && access.isFree ? (
            <p className="flex items-center gap-2 text-ase-success">
              <Check className="h-4 w-4" /> {c.freeCourse}
              {!access.authenticated && c.signInToSave}
            </p>
          ) : access.hasAccess ? (
            <p className="flex items-center gap-2 text-ase-success">
              <Check className="h-4 w-4" /> {c.hasAccess}
            </p>
          ) : access.linked && buyPath ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-ase-text2">
                {c.firstFree} <strong className="text-ase-text">{formatPrice(access.price, access.currency, lang)}</strong>.
              </p>
              <Link
                to={buyPath}
                className="ml-auto inline-flex items-center gap-2 rounded-ase-md bg-ase-gold px-3 py-1.5 font-semibold text-ase-bg hover:bg-ase-gold-strong"
              >
                <ShoppingCart className="h-4 w-4" /> {c.unlock}
              </Link>
              {!access.authenticated && (
                <Link to="/login" className="text-ase-brand hover:underline">
                  {c.alreadyBought}
                </Link>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-ase-muted">
              <CircleAlert className="h-4 w-4" /> {c.preparing}
            </p>
          )}
        </div>
      )}

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {course.missions.map((m, i) => {
          const free = i === 0
          const unlocked = free || access.hasAccess
          const status = m.available ? statusOf(m.id) : 'new'
          return (
            <li
              key={m.id}
              className={`flex flex-col justify-between gap-3 rounded-ase-lg border p-4 ${
                m.available && unlocked ? 'border-ase-brand/50 bg-ase-brand/5' : 'border-ase-border bg-ase-bg2'
              }`}
            >
              <div>
                <p className="text-caption text-ase-muted">
                  {c.mission} {i}
                  {(free || (access.linked && access.isFree)) && (
                    <span className="ml-2 rounded bg-ase-success/15 px-1.5 text-ase-success">{c.free}</span>
                  )}
                </p>
                <p className="font-medium text-ase-text">{m.title}</p>
              </div>
              {!m.available ? (
                <span className="flex items-center gap-2 text-caption text-ase-muted">
                  <Lock className="h-3.5 w-3.5" /> {c.soon}
                </span>
              ) : unlocked ? (
                <Link
                  to={`/academy/${course.key}/${m.id}`}
                  className="flex items-center justify-center gap-2 rounded-ase-md bg-ase-brand px-3 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
                >
                  <Play className="h-4 w-4" /> {c.status[status]}
                </Link>
              ) : (
                <span className="flex items-center gap-2 text-caption text-ase-muted">
                  <Lock className="h-3.5 w-3.5" /> {c.included}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {EXAM_COURSES[course.key] ? (
        <Link
          to={`/academy/${course.key}/simulacro`}
          className="mt-4 flex flex-wrap items-center gap-3 rounded-ase-lg border border-ase-gold/40 bg-ase-gold/5 p-4 transition hover:border-ase-gold/70"
        >
          <Award className="h-6 w-6 shrink-0 text-ase-gold" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ase-text">{lang === 'en' ? EXAM_COURSES[course.key].titleEn : EXAM_COURSES[course.key].title}</p>
            <p className="text-caption text-ase-muted">{lang === 'en' ? EXAM_COURSES[course.key].labelEn : EXAM_COURSES[course.key].label}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-ase-gold">
            {c.goToExam} <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      ) : null}
      <p className="mt-6 flex items-center gap-2 text-caption text-ase-muted">
        <CircleAlert className="h-3.5 w-3.5" /> {c.desktop} {authenticated ? c.savedAccount : c.signInAccount}
      </p>
      <CourseReviews access={access} />
    </div>
  )
}
