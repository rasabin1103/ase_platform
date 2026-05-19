import { Badge } from '../ui/Badge'
import { ServiceFeatureBlock } from './ServiceFeatureBlock'
import { useI18n } from '../../i18n'

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="text-ase-text">{children}</span>
}

export function ServicesSection() {
  const { t } = useI18n()
  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="info" className="w-fit">
              {t('services.sectionBadge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('services.title')}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-ase-text2 sm:text-lg">
              {t('services.subtitle')}
            </p>
          </div>
        </div>

        <div className="mt-16 space-y-20">
          <ServiceFeatureBlock
            icon={<Icon>◼</Icon>}
            index={1}
            title={t('services.blocks.s1.title')}
            description={t('services.blocks.s1.description')}
            bullets={t('services.blocks.s1.bullets')}
          />
          <ServiceFeatureBlock
            icon={<Icon>◆</Icon>}
            index={2}
            title={t('services.blocks.s2.title')}
            description={t('services.blocks.s2.description')}
            bullets={t('services.blocks.s2.bullets')}
            reverse
          />
          <ServiceFeatureBlock
            icon={<Icon>●</Icon>}
            index={3}
            title={t('services.blocks.s3.title')}
            description={t('services.blocks.s3.description')}
            bullets={t('services.blocks.s3.bullets')}
          />
          <ServiceFeatureBlock
            icon={<Icon>▲</Icon>}
            index={4}
            title={t('services.blocks.s4.title')}
            description={t('services.blocks.s4.description')}
            bullets={t('services.blocks.s4.bullets')}
            reverse
          />
        </div>
      </div>
    </section>
  )
}

