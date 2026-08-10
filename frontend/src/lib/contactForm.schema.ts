import { z } from 'zod'

export const INQUIRY_TYPES = [
  'tech_consulting',
  'qa_automation',
  'software_architecture',
  'technical_training',
  'saas_platform',
  'books_content',
  'other',
] as const

export type InquiryType = (typeof INQUIRY_TYPES)[number]

export function buildContactFormSchema(messages: {
  nameRequired: string
  emailInvalid: string
  subjectRequired: string
  messageMin: string
  messageMax: string
}) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(200),
    email: z.string().trim().email(messages.emailInvalid).max(320),
    company: z.string().trim().max(200).optional().or(z.literal('')),
    subject: z.string().trim().min(1, messages.subjectRequired).max(300),
    inquiry_type: z.union([z.enum(INQUIRY_TYPES), z.literal('')]).optional(),
    message: z
      .string()
      .trim()
      .min(20, messages.messageMin)
      .max(5000, messages.messageMax),
  })
}

export type ContactFormValues = z.infer<ReturnType<typeof buildContactFormSchema>>
