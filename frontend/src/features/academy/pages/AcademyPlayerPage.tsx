import { Lock } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { RouteLoadingFallback } from '../../../components/layout/RouteLoadingFallback'
import { getCourse, getMission, isFreeMission } from '../content/registry'
import { MissionPlayer } from '../MissionPlayer'
import { useCourseAccess } from '../useCourseAccess'
import { useAcademyUserKey } from '../useMissionRun'
import { useAcademyLang } from '../i18n'
import { usePageTitle } from '../../../hooks/usePageTitle'

const COPY = {
  es: {
    unavailable: 'Esta misión todavía no está disponible.',
    back: 'Volver al curso',
    locked: 'Esta misión forma parte del curso completo.',
    unlock: 'Ver cómo desbloquearlo',
    freeLocked: 'Este curso es gratis: crea tu cuenta para jugar todas sus misiones y guardar tu progreso.',
    register: 'Crear cuenta gratis',
    signIn: 'Ya tengo cuenta',
  },
  en: {
    unavailable: 'This mission is not available yet.',
    back: 'Back to the course',
    locked: 'This mission is part of the full course.',
    unlock: 'See how to unlock it',
    freeLocked: 'This course is free: create your account to play every mission and save your progress.',
    register: 'Create a free account',
    signIn: 'I already have an account',
  },
}

export function AcademyPlayerPage() {
  const { courseKey = '', missionId = '' } = useParams()
  const lang = useAcademyLang()
  const mission = getMission(courseKey, missionId, lang)
  usePageTitle(mission ? `${mission.title} · ASE Academy` : '', mission?.subtitle)
  const c = COPY[lang]
  const isFree = isFreeMission(getCourse(courseKey), missionId)
  const { userKey, authReady } = useAcademyUserKey()
  const { access, isLoading } = useCourseAccess(courseKey, !!mission && !isFree && authReady)

  if (!mission) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ase-bg text-ase-text">
        <p>{c.unavailable}</p>
        <Link to={`/academy/${courseKey}`} className="text-ase-brand hover:underline">
          {c.back}
        </Link>
      </div>
    )
  }

  if (!authReady) return <RouteLoadingFallback />

  if (!isFree) {
    if (isLoading) return <RouteLoadingFallback />
    if (!access.hasAccess && access.linked && access.isFree && !access.authenticated) {
      // Curso gratis con registro: la cuenta es lo único que falta.
      const next = encodeURIComponent(`/academy/${courseKey}/${missionId}`)
      return (
        <div className="flex min-h-dvh items-center justify-center bg-ase-bg px-4 text-ase-text">
          <div className="max-w-md space-y-4 rounded-ase-xl border border-ase-border bg-ase-surface p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-ase-muted" />
            <p className="text-body-md">{c.freeLocked}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/register" className="inline-block rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong">
                {c.register}
              </Link>
              <Link to={`/login?next=${next}`} className="text-body-sm text-ase-brand hover:underline">
                {c.signIn}
              </Link>
            </div>
          </div>
        </div>
      )
    }
    if (!access.hasAccess) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-ase-bg px-4 text-ase-text">
          <div className="max-w-md space-y-4 rounded-ase-xl border border-ase-border bg-ase-surface p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-ase-muted" />
            <p className="text-body-md">{c.locked}</p>
            <Link
              to={`/academy/${courseKey}`}
              className="inline-block rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
            >
              {c.unlock}
            </Link>
          </div>
        </div>
      )
    }
  }

  // `key` reinicia el estado al cambiar de misión o de usuario.
  return <MissionPlayer key={`${userKey}:${mission.id}:${mission.lang ?? 'es'}`} mission={mission} />
}
