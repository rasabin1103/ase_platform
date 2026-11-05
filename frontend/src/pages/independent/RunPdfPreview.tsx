import { useQuery } from '@tanstack/react-query'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { getTestRunPdf } from '../../api/testExecution.api'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n'

/** PDF que genera el workflow del producto (p. ej. ReportFlow), mostrado en
 * pantalla con descarga. Se pide a ASE (que lo toma del artefacto) y se
 * convierte en URL de objeto; al estar en caché no se vuelve a descargar. */
export function RunPdfPreview({ runUuid }: { runUuid: string }) {
  const { t } = useI18n()
  const query = useQuery({
    queryKey: ['test-execution-pdf', runUuid],
    queryFn: async () => {
      const blob = await getTestRunPdf(runUuid)
      return { url: URL.createObjectURL(blob), size: blob.size }
    },
    staleTime: Infinity,
    retry: false,
  })

  return (
    <section aria-label={t('testExecution.report.pdfTitle') as string} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ase-text">
          <FileText className="h-4 w-4 text-cyan-300" strokeWidth={1.75} aria-hidden="true" />
          {t('testExecution.report.pdfTitle')}
          {query.data ? (
            <span className="text-xs font-normal text-ase-muted">
              · {Math.max(1, Math.round(query.data.size / 1024))} KB
            </span>
          ) : null}
        </h3>
        {query.data ? (
          <div className="flex flex-wrap gap-2">
            <a
              href={query.data.url}
              download="report.pdf"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-ase-primary px-3 text-sm font-medium text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/60"
            >
              <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {t('testExecution.report.pdfDownload')}
            </a>
            <a
              href={query.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-sm text-ase-text transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/60"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {t('testExecution.report.pdfOpen')}
            </a>
          </div>
        ) : null}
      </div>
      {query.isLoading ? (
        <div aria-live="polite">
          <p className="mb-2 text-sm text-ase-muted">{t('testExecution.report.pdfLoading')}</p>
          <Skeleton className="h-[34rem] rounded-2xl" />
        </div>
      ) : null}
      {query.isError ? (
        <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          {t('testExecution.report.pdfError')}
        </p>
      ) : null}
      {query.data ? (
        <iframe
          title={t('testExecution.report.pdfFrameTitle') as string}
          src={query.data.url}
          className="h-[36rem] w-full rounded-2xl border border-white/10 bg-white"
        />
      ) : null}
    </section>
  )
}
