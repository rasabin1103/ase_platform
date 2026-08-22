import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Headphones } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAudiobookChapterContent, listAudiobookChapters } from '../../api/consumerCatalog.api'
import { base64ToArrayBuffer } from '../../utils/base64'
import { useI18n } from '../../i18n'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'
import { cn } from '../ui/cn'

// Platform-hosted audiobook: repo_path's "audiolibro" subfolder holds one
// audio file per chapter (see ConsumerCatalogService.list_audiobook_chapters)
// — smaller and cheaper to store in the shared repo than a single
// full-length file, and never handed out as a raw shareable link the way
// `audiobookUrl` is: each chapter is fetched through the same
// ownership-gated endpoint the PDF viewer/downloads already use.

function ChapterAudio({ slug, name }: { slug: string; name: string }) {
  const { t } = useI18n()
  const chapterQuery = useQuery({
    queryKey: ['consumer-catalog', slug, 'audiobook-chapter', name],
    queryFn: () => getAudiobookChapterContent(slug, name),
  })

  // Same synchronous-blob-then-cleanup-effect pattern as PdfViewer /
  // AudiobookPlayer: Blob/createObjectURL is synchronous, so it belongs in
  // useMemo, not a setState-in-effect body.
  const url = useMemo(() => {
    if (!chapterQuery.data) return null
    const blob = new Blob([base64ToArrayBuffer(chapterQuery.data.contentBase64)], {
      type: chapterQuery.data.mimeType,
    })
    return URL.createObjectURL(blob)
  }, [chapterQuery.data])

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  if (chapterQuery.isLoading) return <Skeleton className="h-12 w-full rounded-lg" />
  if (chapterQuery.isError || !url) {
    return <p className="text-xs text-rose-300">{t('catalog.resource.chapterLoadError')}</p>
  }
  return (
    <audio controls autoPlay className="w-full" src={url}>
      {name}
    </audio>
  )
}

export function PlatformAudiobookPlayer({
  slug,
  coverUrl,
  maximized,
}: {
  slug: string
  coverUrl?: string
  maximized?: boolean
}) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<number | null>(null)

  const chaptersQuery = useQuery({
    queryKey: ['consumer-catalog', slug, 'audiobook-chapters'],
    queryFn: () => listAudiobookChapters(slug),
  })

  const chapters = chaptersQuery.data ?? []

  if (chaptersQuery.isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />
  }

  if (chaptersQuery.isError) {
    return <p className="text-xs text-rose-300">{t('catalog.resource.chapterLoadError')}</p>
  }

  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={<Headphones className="h-5 w-5" strokeWidth={1.75} />}
        title={t('catalog.resource.noChapters') as string}
      />
    )
  }

  const currentIndex = selected ?? 0
  const current = chapters[currentIndex]

  return (
    <div className="space-y-3">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className={cn(
            'mx-auto w-full rounded-lg border border-white/10 object-cover',
            maximized ? 'max-h-[50vh]' : 'max-h-64',
          )}
        />
      ) : null}
      {current ? <ChapterAudio slug={slug} name={current.name} /> : null}
      {chapters.length > 1 ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChevronLeft className="h-4 w-4" strokeWidth={1.75} />}
              disabled={currentIndex <= 0}
              onClick={() => setSelected(Math.max(0, currentIndex - 1))}
            >
              {t('catalog.resource.previousChapter')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex >= chapters.length - 1}
              onClick={() => setSelected(Math.min(chapters.length - 1, currentIndex + 1))}
            >
              {t('catalog.resource.nextChapter')}
              <ChevronRight className="ml-1.5 h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>
          <div
            className={cn(
              'space-y-1 overflow-y-auto rounded-lg border border-white/10 p-2',
              maximized ? 'max-h-[30vh]' : 'max-h-56',
            )}
          >
            {chapters.map((chapter, index) => (
              <button
                key={chapter.name}
                type="button"
                onClick={() => setSelected(index)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition',
                  index === currentIndex
                    ? 'bg-ase-brand/15 text-ase-text'
                    : 'text-ase-text2 hover:bg-white/[0.04] hover:text-ase-text',
                )}
              >
                <Headphones className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{chapter.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
