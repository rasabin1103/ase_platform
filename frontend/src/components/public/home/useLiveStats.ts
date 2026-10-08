import { useQuery } from '@tanstack/react-query'
import { listCatalogShowcaseItems } from '../../../api/catalogShowcase.api'
import { getPublicCatalogStats } from '../../../api/publicStats.api'
import { listPublicBlogPosts } from '../../../api/publicBlog.api'
import { ACADEMY_COURSES } from '../../../features/academy/content/courseList'

/** Misiones jugables: salen del código de los cursos, se actualizan al publicar misiones. */
export const PLAYABLE_MISSIONS = ACADEMY_COURSES.reduce((n, c) => n + c.missions.filter((m) => m.available).length, 0)

const FIVE_MIN = 5 * 60_000

/**
 * Contadores públicos en vivo. Cada valor es `undefined` mientras carga o si
 * su petición falla, para que quien lo pinte pueda ocultarlo en vez de mostrar 0.
 */
export function useLiveStats() {
  const catalog = useQuery({
    queryKey: ['live-stats', 'catalog-total'],
    queryFn: () => listCatalogShowcaseItems({ limit: 1 }),
    staleTime: FIVE_MIN,
  })
  const stats = useQuery({
    queryKey: ['live-stats', 'public-stats'],
    queryFn: getPublicCatalogStats,
    staleTime: FIVE_MIN,
  })
  const blog = useQuery({
    queryKey: ['live-stats', 'blog-latest'],
    queryFn: () => listPublicBlogPosts({ limit: 1 }),
    staleTime: FIVE_MIN,
  })

  return {
    missions: PLAYABLE_MISSIONS,
    catalogItems: catalog.data?.total,
    jobPostings: stats.data?.job_postings_active,
    blogPosts: blog.data?.total,
    latestPost: blog.data?.items[0],
  }
}
