/** Canonical site origin, matching `index.html`'s `<link rel="canonical">`. */
export const SITE_URL = 'https://www.arcesabinengineering.com'

/**
 * Renders a JSON-LD `<script type="application/ld+json">` block for
 * structured data (schema.org). Kept as a tiny dedicated component instead
 * of inlining `dangerouslySetInnerHTML` at each call site so the one
 * necessary escaping rule (never let `</script` appear literally inside the
 * JSON, which would close the tag early and break the rest of the page)
 * lives in exactly one place.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
