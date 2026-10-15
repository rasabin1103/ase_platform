import { SITE_URL } from './JsonLd'

/**
 * Piezas comunes de los datos estructurados de producto (schema.org) para
 * que Google Search Console no marque errores en «Fichas de comerciante»:
 * imagen obligatoria, política de devoluciones y envío (producto digital:
 * entrega inmediata, sin coste) y validez del precio.
 *
 * La política refleja los Términos del servicio: contenido digital con
 * acceso inmediato, sin derecho de desistimiento ni reembolsos salvo que la
 * ley lo exija (ver «Derecho de desistimiento en contenido digital»).
 */

/** Imágenes de marca en las proporciones que recomienda Google (16:9, 4:3, 1:1). */
export const BRAND_IMAGES = [
  `${SITE_URL}/og/ase-share.png`,
  `${SITE_URL}/og/ase-share-4x3.png`,
  `${SITE_URL}/og/ase-share-1x1.png`,
]

/** Países donde se vende (ISO 3166-1 alfa-2). */
const COUNTRY = 'ES'

/** URL absoluta en el dominio público (las rutas /api/... las sirve Vercel desde el backend). */
export function absoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

/** 31 de diciembre del año siguiente (Google recomienda priceValidUntil). */
export function priceValidUntil(now = new Date()): string {
  return `${now.getFullYear() + 1}-12-31`
}

/** Envío y devoluciones de un producto digital (entrega inmediata, sin devolución). */
export function digitalOfferDetails(currency: string) {
  return {
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: COUNTRY },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
      },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: COUNTRY,
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      merchantReturnLink: `${SITE_URL}/terms-of-service`,
    },
  }
}

export const SELLER = { '@type': 'Organization', name: 'Arce Sabin Engineering', url: SITE_URL }
