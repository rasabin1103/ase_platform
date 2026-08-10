import { z } from 'zod'
import type { CatalogItemType } from '../../types/catalog.types'

type Translate = (key: string) => unknown

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function buildCatalogItemFormSchema(t: Translate) {
  const req = () => String(t('adminFormValidation.required') ?? 'Required')
  const slugMsg = () => String(t('adminFormValidation.slug') ?? 'Invalid slug')
  const currencyMsg = () => String(t('adminFormValidation.currency') ?? 'Invalid currency')

  return z.object({
    title: z.string().trim().min(1, req()).max(255),
    slug: z.string().trim().min(1, req()).max(160).regex(slugRegex, slugMsg()),
    type: z.enum(['product', 'course', 'book', 'resource'] as [CatalogItemType, ...CatalogItemType[]]),
    category: z.string().trim().min(1, req()).max(120),
    short_description: z.string().trim().min(1, req()).max(500),
    long_description: z.string().trim().min(1, req()),
    image_url: z.string().max(2048).default(''),
    preview_url: z.string().max(2048).nullable().optional(),
    price: z.coerce.number().min(0),
    currency: z
      .string()
      .trim()
      .min(3, currencyMsg())
      .max(3, currencyMsg())
      .transform((v) => v.toUpperCase()),
    status: z.enum(['published', 'draft', 'coming_soon', 'request_only']),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    duration: z.string().max(80).nullable().optional().or(z.literal('')),
    author: z.string().trim().min(1, req()).max(200),
    benefits: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    included_items: z.array(z.string()).optional(),
    audience: z.array(z.string()).optional(),
    benefits_text: z.string().optional(),
    requirements_text: z.string().optional(),
    included_items_text: z.string().optional(),
    audience_text: z.string().optional(),
    cover_image_url: z.string().max(2048).nullable().optional(),
    thumbnail_url: z.string().max(2048).nullable().optional(),
    amazon_url: z.string().max(2048).nullable().optional(),
    external_purchase_url: z.string().max(2048).nullable().optional(),
    purchase_provider: z.enum(['internal', 'amazon', 'external', 'request_only']).optional(),
    pdf_url: z.string().max(2048).nullable().optional(),
    preview_pdf_url: z.string().max(2048).nullable().optional(),
    preview_pages: z.coerce.number().min(0).nullable().optional(),
    sample_download_url: z.string().max(2048).nullable().optional(),
    rich_content_markdown: z.string().nullable().optional(),
    book_format: z.string().max(80).nullable().optional(),
  })
}

export type CatalogItemFormSchemaValues = z.infer<ReturnType<typeof buildCatalogItemFormSchema>>
