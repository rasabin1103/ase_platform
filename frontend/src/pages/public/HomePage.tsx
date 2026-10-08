import { PricingSection } from '../../components/public/PricingSection'
import { HomeHero } from '../../components/public/home/HomeHero'
import { HomeStatsBand } from '../../components/public/home/HomeStatsBand'
import { HomeEcosystemBento } from '../../components/public/home/HomeEcosystemBento'
import { HomeAcademySpotlight } from '../../components/public/home/HomeAcademySpotlight'
import { HomeCatalogStrip } from '../../components/public/home/HomeCatalogStrip'
import { HomeAudiences, HomeFinalCta, HomeSteps } from '../../components/public/home/HomeAudiences'
import { JsonLd, SITE_URL } from '../../components/seo/JsonLd'

// Organization schema — describes the business behind the site to search
// engines (knowledge panel eligibility, richer link previews). Rendered
// once here since Home is the canonical entry point for the brand entity.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Arce Sabin Engineering',
  alternateName: 'ASE',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon-512.png`,
  email: 'contact@arcesabinengineering.com',
  founder: {
    '@type': 'Person',
    name: 'Roberto Arce Sabín',
  },
  description:
    'Plataformas SaaS fiables, automatización QA y arquitectura de software para empresas que necesitan velocidad, calidad y control.',
}

export function HomePage() {
  return (
    <div className="overflow-x-clip">
      <JsonLd data={organizationJsonLd} />
      <HomeHero />
      <HomeStatsBand />
      <HomeEcosystemBento />
      <div className="bg-ase-bg2/40">
        <HomeAcademySpotlight />
      </div>
      <HomeCatalogStrip />
      <div className="bg-ase-bg2/40">
        <HomeAudiences />
      </div>
      <HomeSteps />
      <div className="bg-ase-bg2/40">
        <PricingSection compact />
      </div>
      <HomeFinalCta />
    </div>
  )
}
