import { cn } from '../ui/cn'

// Embedded playback for a book's audiobook_url — an external link (Drive,
// S3, an unlisted YouTube video...) never stored in the repo, since
// audiobook files are typically far too large for the GitHub Contents API
// this platform already uses for the rest of a book's editions. Detects a
// YouTube link and renders the official iframe embed; anything else is
// assumed to be a direct audio file URL and gets a native <audio> element
// with the book's cover shown above it (a plain <audio> has no artwork of
// its own) — no extra dependency either way, same "let the browser do it"
// approach as PdfViewer.

function extractYouTubeId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, '')
  if (host === 'youtu.be') {
    return parsed.pathname.slice(1) || null
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') return parsed.searchParams.get('v')
    if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.replace('/embed/', '') || null
    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.replace('/shorts/', '') || null
  }
  return null
}

export function AudiobookPlayer({
  url,
  coverUrl,
  maximized,
}: {
  url: string
  coverUrl?: string
  maximized?: boolean
}) {
  const youTubeId = extractYouTubeId(url)

  if (youTubeId) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-white/10 bg-black',
          maximized ? 'h-[80vh]' : 'aspect-video',
        )}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youTubeId}`}
          title="Audiobook"
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className={cn(
            'mx-auto w-full rounded-lg border border-white/10 object-cover',
            maximized ? 'max-h-[60vh]' : 'max-h-80',
          )}
        />
      ) : null}
      <audio controls className="w-full" src={url}>
        <a href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
      </audio>
    </div>
  )
}
