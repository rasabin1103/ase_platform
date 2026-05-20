import type { LucideIcon } from 'lucide-react'
import { BookOpen, GraduationCap, KeyRound, Package, PlayCircle, Sparkles } from 'lucide-react'
import type { CapabilityId } from './types'

export const CAPABILITY_ICONS: Record<CapabilityId, LucideIcon> = {
  content_creator: Sparkles,
  publish_products: Package,
  publish_courses: GraduationCap,
  publish_books: BookOpen,
  private_demos: PlayCircle,
  catalog_access: KeyRound,
}
