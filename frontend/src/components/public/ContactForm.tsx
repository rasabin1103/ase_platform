import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitContactForm } from '../../api/publicContact.api'
import { buildContactFormSchema, INQUIRY_TYPES, type ContactFormValues } from '../../lib/contactForm.schema'
import { Button } from '../ui/Button'
import { FieldError, FormFieldLabel } from '../ui/FormFieldLabel'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'

const textareaClass =
  'min-h-40 w-full resize-y rounded-xl border border-white/10 bg-ase-bg2/60 px-4 py-3 text-sm text-ase-text outline-none transition placeholder:text-ase-muted focus-visible:border-cyan-400/40 focus-visible:ring-2 focus-visible:ring-cyan-400/20'

const inputClass =
  'h-12 rounded-xl border-white/10 bg-ase-bg2/60 text-sm focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20'

export function ContactForm() {
  const { t } = useI18n()
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle')

  const schema = useMemo(
    () =>
      buildContactFormSchema({
        nameRequired: String(t('pages.contact.validation.nameRequired')),
        emailInvalid: String(t('pages.contact.validation.emailInvalid')),
        subjectRequired: String(t('pages.contact.validation.subjectRequired')),
        messageMin: String(t('pages.contact.validation.messageMin')),
        messageMax: String(t('pages.contact.validation.messageMax')),
      }),
    [t],
  )

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      subject: '',
      inquiry_type: '',
      message: '',
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    setSubmitState('idle')
    try {
      await submitContactForm({
        name: values.name,
        email: values.email,
        company: values.company?.trim() || undefined,
        subject: values.subject,
        inquiry_type: values.inquiry_type
          ? String(t(`pages.contact.inquiryTypes.${values.inquiry_type}`))
          : undefined,
        message: values.message,
      })
      setSubmitState('success')
      reset()
    } catch {
      setSubmitState('error')
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.75rem] border border-white/[0.08] bg-ase-surface/55 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-10"
      noValidate
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <FormFieldLabel label={String(t('pages.contact.fields.name'))} required />
          <Input className={cn(inputClass, errors.name && 'border-ase-error/50')} {...register('name')} />
          <FieldError message={errors.name?.message} />
        </label>
        <label className="block sm:col-span-1">
          <FormFieldLabel label={String(t('pages.contact.fields.email'))} required />
          <Input
            type="email"
            className={cn(inputClass, errors.email && 'border-ase-error/50')}
            placeholder="name@company.com"
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </label>
        <label className="block sm:col-span-2">
          <FormFieldLabel label={String(t('pages.contact.fields.company'))} />
          <Input
            className={cn(inputClass, errors.company && 'border-ase-error/50')}
            placeholder={String(t('pages.contact.fields.companyPh'))}
            {...register('company')}
          />
          <FieldError message={errors.company?.message} />
        </label>
        <label className="block sm:col-span-1">
          <FormFieldLabel label={String(t('pages.contact.fields.inquiryType'))} />
          <Select className={cn('mt-0 h-12 rounded-xl', inputClass)} {...register('inquiry_type')}>
            <option value="">{t('pages.contact.fields.inquiryTypePlaceholder')}</option>
            {INQUIRY_TYPES.map((key) => (
              <option key={key} value={key}>
                {t(`pages.contact.inquiryTypes.${key}`)}
              </option>
            ))}
          </Select>
          <FieldError message={errors.inquiry_type?.message} />
        </label>
        <label className="block sm:col-span-1">
          <FormFieldLabel label={String(t('pages.contact.fields.subject'))} required />
          <Input
            className={cn(inputClass, errors.subject && 'border-ase-error/50')}
            {...register('subject')}
          />
          <FieldError message={errors.subject?.message} />
        </label>
        <label className="block sm:col-span-2">
          <FormFieldLabel label={String(t('pages.contact.fields.message'))} required />
          <textarea
            className={cn(textareaClass, errors.message && 'border-ase-error/50')}
            placeholder={String(t('pages.contact.fields.messagePh'))}
            {...register('message')}
          />
          <FieldError message={errors.message?.message} />
        </label>
      </div>

      {submitState === 'success' ? (
        <p
          className="mt-6 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
          role="status"
        >
          {t('pages.contact.success')}
        </p>
      ) : null}
      {submitState === 'error' ? (
        <p
          className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {t('pages.contact.error')}
        </p>
      ) : null}

      <div className="mt-8">
        <Button
          type="submit"
          size="lg"
          className="w-full shadow-[0_0_32px_rgba(56,189,248,0.18)] sm:w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('pages.contact.submitting') : t('pages.contact.submit')}
        </Button>
      </div>
    </form>
  )
}
