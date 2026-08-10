export type CapabilityStatus = 'available' | 'active' | 'pending' | 'restricted' | 'coming_soon'

export type CapabilityId =
  | 'content_creator'
  | 'publish_products'
  | 'publish_courses'
  | 'publish_books'
  | 'private_demos'
  | 'catalog_access'

export type UserCapability = {
  id: CapabilityId
  status: CapabilityStatus
}
