import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

const capabilities = [
  { title: 'Multi-tenant organizations', desc: 'Clear tenant context and governance boundaries.' },
  { title: 'Users, roles and permissions', desc: 'RBAC designed for operators and auditors.' },
  { title: 'Plans and subscriptions', desc: 'Monetization primitives aligned with real business models.' },
  { title: 'Product access control', desc: 'Entitlements and access levels across modules.' },
  { title: 'Courses and training', desc: 'Enablement workflows and platform learning paths.' },
  { title: 'Audit logs and governance', desc: 'Traceability that supports compliance and accountability.' },
]

export function CapabilitiesSection() {
  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-7xl px-6 py-20">
        <Badge variant="info" className="w-fit">
          Platform capabilities
        </Badge>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
          Foundations that scale with your organization
        </h2>
        <p className="mt-4 max-w-3xl text-base text-ase-text2">
          The platform blueprint is built around predictable APIs and safe operations — so your team can move faster
          without chaos.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <Card key={c.title} className="p-7" interactive>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-ase-text">{c.title}</div>
                  <div className="mt-3 text-sm leading-relaxed text-ase-text2">{c.desc}</div>
                </div>
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-ase-primary/80 shadow-[0_0_18px_rgba(56,189,248,0.25)]" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

