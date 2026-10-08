import { ArrowLeft, Check, CircleAlert, Lock, Play, ShoppingCart } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { catalogItemPath } from '../api'
import { LEVEL_LABEL, getCourse } from '../content/registry'
import { useCourseAccess } from '../useCourseAccess'
import { CourseReviews } from '../CourseReviews'
import { useQuery } from '@tanstack/react-query'
import { listAcademyRuns } from '../api'
import { readMissionStatus, useAcademyUserKey } from '../useMissionRun'

const STATUS_LABEL = { new: 'Empezar', in_progress: 'Continuar', finished: 'Rejugar' } as const

function formatPrice(price: string | number | null, currency: string | null): string {
  const n = Number(price ?? 0)
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR' }).format(n)
}

export function AcademyCoursePage() {
  const { courseKey = '' } = useParams()
  const course = getCourse(courseKey)
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
        <p className="mb-4 text-ase-text2">Este curso no existe o todavía no está publicado.</p>
        <Link to="/academy" className="text-ase-brand hover:underline">
          Ver todos los cursos
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
          {course.track} · {LEVEL_LABEL[course.level]} · ~{course.estimatedHours} h
        </p>
        <h1 className="font-display text-display-lg">{course.title}</h1>
        <p className="text-body-lg text-ase-text2">{course.description}</p>
      </header>

      {!isLoading && (
        <div className="mb-8 rounded-ase-lg border border-ase-border bg-ase-surface p-4 text-body-sm">
          {access.linked && access.isFree ? (
            <p className="flex items-center gap-2 text-ase-success">
              <Check className="h-4 w-4" /> Curso gratuito: todas las misiones están abiertas.
              {!access.authenticated && ' Inicia sesión para guardar tu progreso.'}
            </p>
          ) : access.hasAccess ? (
            <p className="flex items-center gap-2 text-ase-success">
              <Check className="h-4 w-4" /> Tienes acceso al curso completo.
            </p>
          ) : access.linked && buyPath ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-ase-text2">
                La primera misión es gratuita. El curso completo cuesta{' '}
                <strong className="text-ase-text">{formatPrice(access.price, access.currency)}</strong>.
              </p>
              <Link
                to={buyPath}
                className="ml-auto inline-flex items-center gap-2 rounded-ase-md bg-ase-gold px-3 py-1.5 font-semibold text-ase-bg hover:bg-ase-gold-strong"
              >
                <ShoppingCart className="h-4 w-4" /> Desbloquear curso completo
              </Link>
              {!access.authenticated && (
                <Link to="/login" className="text-ase-brand hover:underline">
                  ¿Ya lo compraste? Inicia sesión
                </Link>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-ase-muted">
              <CircleAlert className="h-4 w-4" /> Curso en preparación: de momento puedes jugar la primera misión.
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
                  Misión {i}
                  {(free || (access.linked && access.isFree)) && (
                    <span className="ml-2 rounded bg-ase-success/15 px-1.5 text-ase-success">Gratis</span>
                  )}
                </p>
                <p className="font-medium text-ase-text">{m.title}</p>
              </div>
              {!m.available ? (
                <span className="flex items-center gap-2 text-caption text-ase-muted">
                  <Lock className="h-3.5 w-3.5" /> Próximamente
                </span>
              ) : unlocked ? (
                <Link
                  to={`/academy/${course.key}/${m.id}`}
                  className="flex items-center justify-center gap-2 rounded-ase-md bg-ase-brand px-3 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
                >
                  <Play className="h-4 w-4" /> {STATUS_LABEL[status]}
                </Link>
              ) : (
                <span className="flex items-center gap-2 text-caption text-ase-muted">
                  <Lock className="h-3.5 w-3.5" /> Incluida en el curso completo
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-6 flex items-center gap-2 text-caption text-ase-muted">
        <CircleAlert className="h-3.5 w-3.5" /> Recomendado en ordenador. {authenticated ? 'Tu progreso se guarda en tu cuenta.' : 'Inicia sesión para guardar tu progreso en tu cuenta.'}
      </p>
      <CourseReviews access={access} />
    </div>
  )
}
