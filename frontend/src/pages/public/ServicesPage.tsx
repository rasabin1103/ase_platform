import { IncludedHero, IncludedSectionNav } from '../../components/public/included/IncludedHero'
import {
  IncludedAcademy,
  IncludedBooks,
  IncludedCatalog,
  IncludedCode,
} from '../../components/public/included/IncludedLearn'
import {
  IncludedCommunityLoyalty,
  IncludedCompare,
  IncludedConsulting,
  IncludedFinalCta,
  IncludedJobs,
  IncludedOrgs,
} from '../../components/public/included/IncludedGrow'
import { useIncludedCopy } from '../../components/public/included/useIncludedCopy'
import { usePageTitle } from '../../hooks/usePageTitle'

/**
 * «Qué incluye» (/services): recorrido por todo lo que trae la suscripción,
 * un bloque por módulo con su visual, comparativa y cierre.
 */
export function ServicesPage() {
  const meta = useIncludedCopy().meta
  usePageTitle(meta.title, meta.description)

  return (
    <div className="overflow-x-clip bg-ase-bg">
      <IncludedHero />
      <IncludedSectionNav />
      <IncludedCatalog />
      <IncludedAcademy />
      <IncludedBooks />
      <IncludedCode />
      <IncludedJobs />
      <IncludedOrgs />
      <IncludedCommunityLoyalty />
      <IncludedConsulting />
      <IncludedCompare />
      <IncludedFinalCta />
    </div>
  )
}
