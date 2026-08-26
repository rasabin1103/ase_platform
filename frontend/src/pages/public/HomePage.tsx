import { HeroSection } from '../../components/public/HeroSection'
import { ServicesSection } from '../../components/public/ServicesSection'
import { PlatformModulesMap } from '../../components/public/PlatformModulesMap'
import { ProcessTimeline } from '../../components/public/ProcessTimeline'
import { WhyPillarsSection } from '../../components/public/WhyPillarsSection'
import { PricingSection } from '../../components/public/PricingSection'
import { CTASection } from '../../components/public/CTASection'
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
    <div>
      <JsonLd data={organizationJsonLd} />
      <HeroSection />
      <div className="bg-ase-bg2/40">
        <ServicesSection />
      </div>
      <PlatformModulesMap />
      <div className="bg-ase-bg2/40">
        <ProcessTimeline />
      </div>
      <WhyPillarsSection />
      <div className="bg-ase-bg2/40">
        <PricingSection compact />
      </div>
      <CTASection />
    </div>
  )
}

