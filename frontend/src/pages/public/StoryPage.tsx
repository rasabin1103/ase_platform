import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useI18n } from '../../i18n'

const milestones = [
  {
    title: 'Clarity first',
    desc: 'Start with roles, boundaries and a tenant model. It eliminates hidden coupling and late-stage rewrites.',
  },
  {
    title: 'Build for operators',
    desc: 'Admin workflows, audit trails and predictable error states reduce load on support and engineering.',
  },
  {
    title: 'Ship responsibly',
    desc: 'Deliver in increments with measurable outcomes, security posture and observability from day one.',
  },
]

export function StoryPage() {
  const { t } = useI18n()
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14">
      <Badge variant="info" className="w-fit">
        {t('pages.story.badge')}
      </Badge>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
        {t('pages.story.title')}
      </h1>
      <p className="mt-4 max-w-3xl text-base text-ase-text2">
        {t('pages.story.body')}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {milestones.map((m) => (
          <Card key={m.title} className="p-6" interactive>
            <div className="text-sm font-semibold text-ase-text">{m.title}</div>
            <div className="mt-2 text-sm text-ase-text2">{m.desc}</div>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link to="/about">
          <Button variant="secondary" className="w-full sm:w-auto">
            {t('pages.story.about')}
          </Button>
        </Link>
        <Link to="/contact">
          <Button className="w-full sm:w-auto">{t('pages.story.contact')}</Button>
        </Link>
      </div>
    </div>
  )
}

