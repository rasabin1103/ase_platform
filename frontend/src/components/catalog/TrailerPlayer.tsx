import { Play } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { parseTrailer, youtubeEmbedUrl, youtubeThumbnail } from './trailer'

type Props = {
  /** Valor de `trailerUrl`; si está vacío o no es válido no se pinta nada. */
  url: string | null | undefined
  /** Título accesible del vídeo (p. ej. «Tráiler · Karate Framework»). */
  title: string
  className?: string
}

/**
 * Tráiler del ítem. YouTube se carga como «fachada»: miniatura + botón y el
 * reproductor (youtube-nocookie) solo al pulsar, para no pesar en la página
 * ni poner cookies de terceros antes de que el usuario quiera verlo.
 */
export function TrailerPlayer({ url, title, className = '' }: Props) {
  const { language } = useI18n()
  const [playing, setPlaying] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)
  const trailer = parseTrailer(url)
  if (!trailer) return null
  const playLabel = language === 'en' ? `Play trailer: ${title}` : `Ver tráiler: ${title}`
  const frame = `relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg ${className}`

  if (trailer.kind === 'file') {
    return (
      <div className={frame}>
        <video className="h-full w-full" src={trailer.src} controls preload="metadata" playsInline aria-label={title} />
      </div>
    )
  }

  return (
    <div className={frame}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={youtubeEmbedUrl(trailer.id)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={playLabel}
          className="group absolute inset-0 h-full w-full"
        >
          {thumbFailed ? null : (
            <img
              src={youtubeThumbnail(trailer.id)}
              onError={() => setThumbFailed(true)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
            />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl transition group-hover:scale-110 group-focus-visible:ring-4 group-focus-visible:ring-sky-400">
            <Play className="ml-1 h-7 w-7" fill="currentColor" aria-hidden />
          </span>
          <span className="absolute bottom-3 left-4 text-sm font-semibold text-white drop-shadow">
            {language === 'en' ? 'Watch the trailer' : 'Ver el tráiler'}
          </span>
        </button>
      )}
    </div>
  )
}
