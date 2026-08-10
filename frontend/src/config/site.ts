/** Site-wide defaults — keep in sync with DESIGN.md */
export const site = {
  name: 'Arce Sabin Engineering',
  shortName: 'ASE',
  title: 'Arce Sabin Engineering',
  description:
    'Build reliable software platforms for companies that need speed, quality and control. Enterprise SaaS, QA automation and software architecture.',
  themeColor: '#020617',
  brandColor: '#38BDF8',
  locale: 'en_US',
  ogImagePath: '/og/ase-share.svg',
  twitterCard: 'summary_large_image' as const,
}

export function siteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

export function absoluteSiteUrl(path: string): string {
  const origin = siteOrigin()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return origin ? `${origin}${normalized}` : normalized
}
