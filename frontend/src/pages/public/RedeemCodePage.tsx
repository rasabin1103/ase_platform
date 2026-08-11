import { Link } from 'react-router-dom'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { RedeemCodeForm } from '../../components/catalog/RedeemCodeForm'
import { useI18n } from '../../i18n'

export function RedeemCodePage() {
  const { t } = useI18n()

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <Eyebrow>{t('redeemCode.heroBadge')}</Eyebrow>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
        {t('redeemCode.title')}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-ase-text2">{t('redeemCode.subtitle')}</p>

      <div className="mt-10">
        <RedeemCodeForm
          footer={
            <p className="text-sm text-ase-text2">
              {t('redeemCode.loginCta')}{' '}
              <Link to="/login" className="font-semibold text-ase-brand hover:underline">
                {t('redeemCode.loginCtaLink')}
              </Link>
            </p>
          }
        />
      </div>
    </div>
  )
}
