import { SectionNav } from '../../components/public/home/SectionNav'
import { PlatformHero } from '../../components/public/platform/v2/PlatformHero'
import {
  PlatformBilling,
  PlatformFlow,
  PlatformRbac,
  PlatformTenancy,
} from '../../components/public/platform/v2/PlatformSections'
import {
  PlatformAudit,
  PlatformAutomation,
  PlatformDashboard,
  PlatformFinalCta,
  PlatformStack,
} from '../../components/public/platform/v2/PlatformOps'
import { usePlatformCopy } from '../../components/public/platform/v2/usePlatformCopy'
import { usePageTitle } from '../../hooks/usePageTitle'

const SECTIONS = ['flow', 'tenancy', 'rbac', 'billing', 'audit', 'automation', 'dashboard', 'stack'] as const

/** «Plataforma» (/platform): la arquitectura detrás de ASE, módulo a módulo. */
export function PlatformPage() {
  const c = usePlatformCopy()
  usePageTitle(c.meta.title, c.meta.description)

  return (
    <div className="overflow-x-clip bg-ase-bg">
      <PlatformHero />
      <SectionNav label={c.nav.label} items={SECTIONS.map((id) => ({ id, label: c.nav[id] }))} />
      <PlatformFlow />
      <PlatformTenancy />
      <PlatformRbac />
      <PlatformBilling />
      <PlatformAudit />
      <PlatformAutomation />
      <PlatformDashboard />
      <PlatformStack />
      <PlatformFinalCta />
    </div>
  )
}
