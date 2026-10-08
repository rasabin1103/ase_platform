import { Lock } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { RouteLoadingFallback } from '../../../components/layout/RouteLoadingFallback'
import { getCourse, getMission, isFreeMission } from '../content/registry'
import { MissionPlayer } from '../MissionPlayer'
import { useCourseAccess } from '../useCourseAccess'
import { useAcademyUserKey } from '../useMissionRun'

export function AcademyPlayerPage() {
  const { courseKey = '', missionId = '' } = useParams()
  const mission = getMission(courseKey, missionId)
  const isFree = isFreeMission(getCourse(courseKey), missionId)
  const { userKey, authReady } = useAcademyUserKey()
  const { access, isLoading } = useCourseAccess(courseKey, !!mission && !isFree && authReady)

  if (!mission) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ase-bg text-ase-text">
        <p>Esta misión todavía no está disponible.</p>
        <Link to={`/academy/${courseKey}`} className="text-ase-brand hover:underline">
          Volver al curso
        </Link>
      </div>
    )
  }

  if (!authReady) return <RouteLoadingFallback />

  if (!isFree) {
    if (isLoading) return <RouteLoadingFallback />
    if (!access.hasAccess) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-ase-bg px-4 text-ase-text">
          <div className="max-w-md space-y-4 rounded-ase-xl border border-ase-border bg-ase-surface p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-ase-muted" />
            <p className="text-body-md">Esta misión forma parte del curso completo.</p>
            <Link
              to={`/academy/${courseKey}`}
              className="inline-block rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
            >
              Ver cómo desbloquearlo
            </Link>
          </div>
        </div>
      )
    }
  }

  // `key` reinicia el estado al cambiar de misión o de usuario.
  return <MissionPlayer key={`${userKey}:${mission.id}`} mission={mission} />
}
