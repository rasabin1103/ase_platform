import { ServiceScene } from '../../components/public/services/ServiceScene'
import { ServicesHero } from '../../components/public/services/ServicesHero'
import { ServicesFinalCta, ServicesProcess } from '../../components/public/services/ServicesProcess'
import { useConsultingCopy } from '../../components/public/services/useConsultingCopy'
import { usePageTitle } from '../../hooks/usePageTitle'

/**
 * «Servicios» (/consulting): consultoría QA y frameworks, cada servicio como
 * una vista explosionada de capas que se abre con el scroll.
 */
export function ConsultingPage() {
  const copy = useConsultingCopy()
  usePageTitle(copy.meta.title, copy.meta.description)

  return (
    <div className="overflow-x-clip bg-ase-bg">
      <ServicesHero />
      {copy.services.map((s, i) => (
        <ServiceScene key={s.id} service={s} index={i} />
      ))}
      <ServicesProcess />
      <ServicesFinalCta />
    </div>
  )
}
