import { HeroSection } from '../../components/public/HeroSection'
import { ServicesSection } from '../../components/public/ServicesSection'
import { PlatformModulesMap } from '../../components/public/PlatformModulesMap'
import { ProcessTimeline } from '../../components/public/ProcessTimeline'
import { WhyPillarsSection } from '../../components/public/WhyPillarsSection'
import { PricingSection } from '../../components/public/PricingSection'
import { CTASection } from '../../components/public/CTASection'

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <PlatformModulesMap />
      <ProcessTimeline />
      <WhyPillarsSection />
      <PricingSection compact />
      <CTASection />
    </div>
  )
}

