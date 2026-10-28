import { useQuery } from '@tanstack/react-query'
import { listAcademyRuns } from './api'
import { getCourse } from './content/courseList'
import { courseProgress, lastTouched, remoteStatus } from './courseProgress'

/** Progreso guardado de un curso (requiere sesión) y a dónde volver. */
export function useAcademyResume(courseKey: string | null | undefined) {
  const course = courseKey ? getCourse(courseKey) : undefined
  const query = useQuery({
    queryKey: ['academy-runs', courseKey, 'resume'],
    queryFn: () => listAcademyRuns(courseKey!),
    enabled: !!course,
    staleTime: 30_000,
  })
  if (!course) return null
  const runs = query.data
  const progress = courseProgress(course, (id) => remoteStatus(runs?.find((r) => r.missionId === id)) ?? 'new', lastTouched(runs))
  // Directo a la misión a medias; si no hay ninguna, a la página del curso.
  const to = progress.next && progress.next.status === 'in_progress' ? `/academy/${course.key}/${progress.next.id}` : `/academy/${course.key}`
  return { course, progress, to }
}
