import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

const reasons = [
  {
    title: 'Engineering discipline',
    desc: 'Schema integrity, migrations, and clean interfaces that teams can maintain and evolve.',
  },
  {
    title: 'Quality-first mindset',
    desc: 'Automation and test strategy as a product feature, not an afterthought.',
  },
  {
    title: 'Business-oriented automation',
    desc: 'We translate workflows into tools that reduce cost and operational friction.',
  },
  {
    title: 'Scalable architecture from day one',
    desc: 'Tenant boundaries, RBAC, and auditability baked in — ready for enterprise scale.',
  },
]

export function WhySection() {
  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-7xl px-6 py-20">
        <Badge variant="info" className="w-fit">
          Why ASE
        </Badge>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
          A partner that feels human — and ships like an engineering team
        </h2>
        <p className="mt-4 max-w-3xl text-base text-ase-text2">
          We care about clarity, trust and outcomes. Your platform should be safe to operate and easy to evolve.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => (
            <Card key={r.title} className="p-7" interactive>
              <div className="text-sm font-semibold text-ase-text">{r.title}</div>
              <div className="mt-3 text-sm leading-relaxed text-ase-text2">{r.desc}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

