import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { logBlogShare, type BlogShareNetwork } from '../../api/publicBlog.api'
import { useI18n } from '../../i18n'
import { resolveMediaUrl } from '../../utils/mediaUrls'

/** lucide-react (this version) ships no brand/logo icons — these are small
 * original monochrome glyphs, not traces of the official logos, drawn just
 * to keep each share button visually distinct. */
function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <rect x="3" y="9" width="4" height="12" rx="0.5" />
      <circle cx="5" cy="4.5" r="2.3" />
      <path d="M11 9h4v2.2c.7-1.4 2.1-2.5 4.2-2.5 3.3 0 4.8 2 4.8 5.8V21h-4v-5.8c0-1.6-.6-2.7-2-2.7-1.1 0-1.8.8-2.1 1.5-.1.3-.1.6-.1 1V21h-4V9z" />
    </svg>
  )
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M4 4l7.2 8.6L4.3 21H7l5.6-6.7L17 21h4l-7.6-9.1L20.6 4H18l-5.2 6.2L8.4 4H4z" />
    </svg>
  )
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M14 21v-7.5h2.5l.4-3H14V8.4c0-.9.2-1.5 1.5-1.5H17V4.2C16.7 4.1 15.7 4 14.6 4 12.2 4 10.5 5.5 10.5 8.1v2.4H8v3h2.5V21H14z" />
    </svg>
  )
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm0 2a7 7 0 0 1 5.9 10.7l-.3.5.6 2.2-2.3-.6-.5.3A7 7 0 1 1 12 5Zm-2.7 3.1c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.7.7 3.1.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.4-.3-.1-1.6-.8-1.8-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5C10 9 9.4 7.7 9.1 7.1c-.2-.4-.4-.4-.6-.4h-.5Z" />
    </svg>
  )
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

type NetworkConfig = {
  network: BlogShareNetwork
  icon: ReactNode
  label: string
  buildUrl?: (params: { url: string; title: string }) => string
}

function extractSlug(fullUrl: string): string {
  try {
    const path = new URL(fullUrl).pathname
    const parts = path.split('/blog/')
    return parts[1] ?? ''
  } catch {
    return ''
  }
}

/** Turns a same-origin relative path (what resolveMediaUrl returns in local
 * dev, where the API base is just "/api/v1" behind the Vite proxy) into a
 * fully-qualified URL. Social networks fetch share links server-to-server,
 * so they can never resolve a relative path — this makes the same code work
 * whether the API base is relative (dev) or already absolute (prod). */
function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  if (typeof window === 'undefined') return pathOrUrl
  return new URL(pathOrUrl, window.location.origin).toString()
}

export function BlogShareBar({ title, url }: { title: string; url: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [instagramHint, setInstagramHint] = useState(false)

  const slug = extractSlug(url)

  // The article URL itself has no server-rendered Open Graph tags (this is a
  // client-rendered SPA — <title>/<meta> are set by usePageTitle only after
  // JS runs), so LinkedIn/Facebook/X/WhatsApp crawlers see nothing useful
  // and the share dialog looks like the link never got attached. This
  // dedicated backend endpoint renders real og:title/og:image/og:url tags
  // for the crawler and instantly redirects any human who clicks through
  // back to the real article — so it's what gets handed to every network's
  // share intent, while the visible/copy link below stays the real article
  // URL people actually want to see or paste elsewhere.
  const previewUrl = useMemo(
    () => (slug ? toAbsoluteUrl(resolveMediaUrl(`/api/v1/public/blog/${slug}/preview`) ?? url) : url),
    [slug, url],
  )

  const track = (network: BlogShareNetwork) => {
    if (!slug) return
    void logBlogShare(slug, network).catch(() => {})
  }

  const networks: NetworkConfig[] = [
    {
      network: 'linkedin',
      icon: <LinkedInGlyph />,
      label: 'LinkedIn',
      buildUrl: ({ url: u }) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
    },
    {
      network: 'twitter',
      icon: <XGlyph />,
      label: 'X',
      buildUrl: ({ url: u, title: ti }) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(ti)}`,
    },
    {
      network: 'facebook',
      icon: <FacebookGlyph />,
      label: 'Facebook',
      buildUrl: ({ url: u }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    },
    {
      network: 'whatsapp',
      icon: <WhatsAppGlyph />,
      label: 'WhatsApp',
      buildUrl: ({ url: u, title: ti }) => `https://wa.me/?text=${encodeURIComponent(`${ti} ${u}`)}`,
    },
  ]

  const handleShare = (config: NetworkConfig) => {
    track(config.network)
    if (config.buildUrl) {
      window.open(config.buildUrl({ url: previewUrl, title }), '_blank', 'noopener,noreferrer,width=600,height=600')
    }
  }

  const handleInstagram = async () => {
    track('instagram')
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // ignore — the hint still tells the user to copy manually
    }
    setInstagramHint(true)
    setTimeout(() => setInstagramHint(false), 4000)
  }

  const handleCopy = async () => {
    track('copy_link')
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const buttonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-ase-text2 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-ase-text'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ase-muted">{t('blogPage.share.label')}</span>
        {networks.map((n) => (
          <button key={n.network} type="button" title={n.label} aria-label={n.label} onClick={() => handleShare(n)} className={buttonClass}>
            {n.icon}
          </button>
        ))}
        <button type="button" title="Instagram" aria-label="Instagram" onClick={handleInstagram} className={buttonClass}>
          <InstagramGlyph />
        </button>
      </div>

      {/* Visible link + copy button — the icons above open share intents but
          never actually display the URL, so the article link needs its own
          row the user can see, select, or copy manually. */}
      <div className="flex max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <input
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={t('blogPage.share.linkLabel') as string}
          className="min-w-0 flex-1 truncate bg-transparent text-xs text-ase-text2 outline-none"
        />
        <button
          type="button"
          title={t('blogPage.share.copyLink') as string}
          aria-label={t('blogPage.share.copyLink') as string}
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-ase-text2 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-ase-text"
        >
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {t('blogPage.share.copyLink')}
        </button>
      </div>

      {instagramHint ? <p className="text-[11px] text-ase-muted">{t('blogPage.share.instagramHint')}</p> : null}
      {copied ? <p className="text-[11px] text-ase-muted">{t('catalog.share.copied')}</p> : null}
    </div>
  )
}
