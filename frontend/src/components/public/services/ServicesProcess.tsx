import { ButtonLink } from '../../ui/Button'
import { Reveal, SectionHeading } from '../home/Reveal'
import { useConsultingCopy } from './useConsultingCopy'

/** Proceso de trabajo en cuatro etapas y cierre con llamada a la acción. */
export function ServicesProcess() {
  const { process } = useConsultingCopy()
  return (
    <section id="proceso" className="scroll-mt-16 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHeading eyebrow={process.eyebrow} title={process.title} subtitle={process.subtitle} />
        <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((s, i) => (
            <Reveal key={s.title} as="li" delayMs={i * 90}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full ase-gradient-brand text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-4 text-lg font-semibold text-ase-text">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ase-text2">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function ServicesFinalCta() {
  const { cta } = useConsultingCopy()
  return (
    <section className="pb-24 pt-4">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
        <Reveal>
          <div className="rounded-[2rem] border border-white/10 bg-ase-surface/70 px-6 py-12 text-center sm:px-12">
            <h2 className="font-display text-3xl font-semibold text-ase-text sm:text-4xl">{cta.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-ase-text2">{cta.text}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/contact">{cta.button}</ButtonLink>
              <ButtonLink to="/services" variant="secondary">
                {cta.secondary}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
