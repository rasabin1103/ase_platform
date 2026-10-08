import { useQuery } from '@tanstack/react-query'
import { getAcademyCourseAccess, type AcademyCourseAccess } from './api'
import { useAcademyUserKey } from './useMissionRun'

/**
 * Acceso a un curso del simulador. Si el backend no responde, se trata como
 * "no vinculado": las misiones gratuitas siguen siendo jugables.
 */
export function useCourseAccess(courseKey: string, enabled = true) {
  const { userKey, authReady } = useAcademyUserKey()
  const query = useQuery({
    queryKey: ['academy-course-access', courseKey, userKey],
    queryFn: () => getAcademyCourseAccess(courseKey),
    enabled: enabled && authReady && !!courseKey,
    retry: 1,
    staleTime: 60_000,
  })
  const fallback: AcademyCourseAccess = {
    courseKey,
    linked: false,
    catalogSlug: null,
    catalogType: null,
    catalogStatus: null,
    title: null,
    price: null,
    currency: null,
    isFree: false,
    authenticated: false,
    hasAccess: false,
  }
  return { access: query.data ?? fallback, isLoading: query.isLoading, isError: query.isError }
}
