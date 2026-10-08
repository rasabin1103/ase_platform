import { ArrowRight, BookOpen, Briefcase, Gamepad2, Newspaper } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../../i18n'
import { CountUp } from './CountUp'
import { useLiveStats } from './useLiveStats'

type Labels = {
  live: string
  missions: string
  catalog: string
  jobs: string
  articles: string
  latestPost: string
  readPost: string
}

/**
 * Tarjetas con los contadores en vivo de la plataforma + el último artículo
 * publicado. Los contadores sin dato (cargando, error o 0) no se muestran.
 */
export function LivePlatformStats({ labels }: { labels: Labels }) {
  const live = useLiveStats()
  const { language } = useI18n()
  const cards = [
    { key: 'missions', value: live.missions, label: labels.missions, Icon: Gamepad2, to: '/academy' },
    { key: 'catalog', value: live.catalogItems, label: labels.catalog, Icon: BookOpen, to: '/catalog' },
    { key: 'jobs', value: live.jobPostings, label: labels.jobs, Icon: Briefcase, to: '/services#jobs' },
    { key: 'articles', value: live.blogPosts, label: labels.articles, Icon: Newspaper, to: '/blog' },
  ].filter((c) => (c.value ?? 0) > 0)

  const post = live.latestPost
  const date = post?.published_at
    ? new Date(post.published_at).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ key, value, label, Icon, to }) => (
          <li key={key}>
            <Link
              to={to}
              className="group block h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-ase-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-sky-300" aria-hidden />
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-glow-pulse"
                    aria-hidden
                  />
                  {labels.live}
                </span>
              </div>
              <p className="mt-5 font-display text-4xl font-semibold text-ase-text sm:text-5xl">
                <CountUp to={value ?? 0} />
              </p>
              <p className="mt-2 text-sm text-ase-text2">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      {post && (
        <Link
          to={`/blog/${post.slug}`}
          className="group flex flex-col gap-5 overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/70 p-5 transition hover:border-ase-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand sm:flex-row sm:items-center sm:p-6"
        >
          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt=""
              loading="lazy"
              className="h-32 w-full shrink-0 rounded-2xl object-cover sm:h-24 sm:w-40"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">
              {labels.latestPost}
              {date && <span className="ml-2 font-normal normal-case tracking-normal text-ase-muted">· {date}</span>}
            </p>
            <p className="mt-1.5 line-clamp-2 font-display text-lg font-semibold text-ase-text">{post.title}</p>
            {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-ase-text2">{post.excerpt}</p>}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-sky-300">
            {labels.readPost}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
      )}
    </div>
  )
}
