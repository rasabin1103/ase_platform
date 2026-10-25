import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BadgeCheck, Download, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { certificatePdfUrl, verifyCertificate } from '../exam/examApi'
import { useAcademyLang } from '../i18n'
import { examDisclaimer } from '../exam/studyMap'

const COPY = {
  es: {
    locale: 'es-ES',
    print: 'Imprimir o guardar en PDF',
    pdf: 'Descargar PDF',
    verifying: 'Verificando certificado…',
    notFound: 'Certificado no encontrado',
    notFoundBody: (code: string) => [`No existe ningún certificado de ASE Academy con el código `, code, `. Revisa que esté bien escrito.`],
    aria: 'Certificado de finalización',
    title: 'Certificado de finalización',
    certifies: 'Se certifica que',
    bodyA: 'ha completado todas las misiones del curso ',
    bodyB: ' y ha aprobado su examen final con ',
    scoreOf: (s: number, t: number) => `${s} de ${t}`,
    bodyC: ' respuestas correctas.',
    issued: 'Emitido el',
    code: 'Código',
    verifiable: 'Verificable en',
    disclaimer:
      'Certificado de ASE Academy. No es una certificación oficial de ISTQB®; ISTQB® es una marca registrada del International Software Testing Qualifications Board.',
  },
  en: {
    locale: 'en-US',
    print: 'Print or save as PDF',
    pdf: 'Download PDF',
    verifying: 'Verifying certificate…',
    notFound: 'Certificate not found',
    notFoundBody: (code: string) => [`There is no ASE Academy certificate with the code `, code, `. Check that it is spelled correctly.`],
    aria: 'Certificate of completion',
    title: 'Certificate of completion',
    certifies: 'This certifies that',
    bodyA: 'has completed every mission of the course ',
    bodyB: ' and passed its final exam with ',
    scoreOf: (s: number, t: number) => `${s} out of ${t}`,
    bodyC: ' correct answers.',
    issued: 'Issued on',
    code: 'Code',
    verifiable: 'Verifiable at',
    disclaimer:
      'ASE Academy certificate. This is not an official ISTQB® certification; ISTQB® is a registered trademark of the International Software Testing Qualifications Board.',
  },
}

/**
 * /academy/certificado/:code — certificado público y verificable. Va fuera
 * de los layouts para que se imprima limpio (Imprimir → Guardar como PDF).
 */
export function AcademyCertificatePage() {
  const { code = '' } = useParams()
  const lang = useAcademyLang()
  const c = COPY[lang]
  const dateFmt = new Intl.DateTimeFormat(c.locale, { dateStyle: 'long' })
  const query = useQuery({ queryKey: ['academy-certificate', code, lang], queryFn: () => verifyCertificate(code, lang), retry: false })
  const cert = query.data
  const url = typeof window !== 'undefined' ? `${window.location.origin}/academy/certificado/${code}` : ''

  return (
    <div className="min-h-screen bg-ase-bg px-4 py-10 print:bg-white print:p-0">
      <style>{'@page { size: A4 landscape; margin: 0; } @media print { html, body { background: #fff !important; } }'}</style>
      <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center gap-3 print:hidden">
        <Link to="/academy" className="inline-flex items-center gap-1 text-body-sm text-ase-muted hover:text-ase-text">
          <ArrowLeft className="h-4 w-4" aria-hidden /> ASE Academy
        </Link>
        {cert ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <a
              href={certificatePdfUrl(cert.code, lang)}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 rounded-ase-md border border-ase-border px-4 py-2 text-body-sm font-semibold text-ase-text hover:border-ase-brand"
            >
              <Download className="h-4 w-4" aria-hidden /> {c.pdf}
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
            >
              <Printer className="h-4 w-4" aria-hidden /> {c.print}
            </button>
          </div>
        ) : null}
      </div>

      {query.isLoading ? (
        <p className="text-center text-ase-muted">{c.verifying}</p>
      ) : !cert ? (
        <div className="mx-auto max-w-xl rounded-ase-xl border border-ase-border bg-ase-surface p-8 text-center">
          <h1 className="font-display text-heading-lg text-ase-text">{c.notFound}</h1>
          <p className="mt-2 text-body-sm text-ase-text2">
            {c.notFoundBody(code)[0]}
            <span className="font-mono text-ase-text">{code}</span>
            {c.notFoundBody(code)[2]}
          </p>
        </div>
      ) : (
        <article
          className="mx-auto aspect-[1.414/1] max-w-4xl rounded-ase-xl bg-white p-[5%] text-slate-900 shadow-soft print:aspect-auto print:h-screen print:max-w-none print:rounded-none print:shadow-none"
          aria-label={c.aria}
        >
          <div className="flex h-full flex-col border-2 border-slate-900/80 p-[5%]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Arce Sabín Ingeniería</p>
                <p className="font-display text-xl font-semibold text-slate-900">ASE Academy</p>
              </div>
              <BadgeCheck className="h-10 w-10 text-[#4C7DFF]" aria-hidden />
            </div>
            <div className="my-auto text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">{c.title}</p>
              <p className="mt-6 text-sm text-slate-600">{c.certifies}</p>
              <h1 className="mt-2 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">{cert.holderName}</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-700">
                {c.bodyA}
                <strong className="text-slate-900">{cert.courseTitle}</strong>
                {c.bodyB}
                <strong className="text-slate-900">{c.scoreOf(cert.score, cert.total)}</strong>
                {c.bodyC}
              </p>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 text-xs text-slate-600">
              <div>
                <p>
                  {c.issued} {dateFmt.format(new Date(cert.issuedAt))}
                </p>
                <p className="mt-1">
                  {c.code} <span className="font-mono font-semibold text-slate-900">{cert.code}</span>
                </p>
              </div>
              <div className="max-w-sm text-right">
                <p>
                  {c.verifiable} {url}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {examDisclaimer(cert.courseKey, lang) ?? c.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  )
}
