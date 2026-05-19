export type CourseStatus = 'draft' | 'published' | 'archived'

export type Course = {
  id: number
  organization_id: number | null
  owner_user_id: number | null
  title: string
  slug: string
  description: string | null
  cover_image_url?: string | null
  category?: string | null
  status: CourseStatus
  created_at: string
  updated_at: string
  /** Present on list responses; omitted on single-course GET/PATCH. */
  enrollment_count?: number
  instructor_display_name?: string | null
  instructor_email?: string | null
}

export type CourseListResponse = {
  items: Course[]
  limit: number
  offset: number
  total: number
}

export type CourseCreateRequest = {
  organization_id?: number | null
  organization_uuid?: string | null
  owner_user_id?: number | null
  owner_user_uuid?: string | null
  title: string
  slug: string
  description?: string | null
  cover_image_url?: string | null
  category?: string | null
  status?: CourseStatus
}

export type CourseStatusCount = { status: CourseStatus; count: number }

export type CourseTopItem = {
  course_id: number
  title: string
  slug: string
  enrollment_count: number
}

export type CourseRecentActivityItem = {
  course_id: number
  title: string
  slug: string
  updated_at: string
}

export type CourseEnrollmentMonthBucket = { month: string; count: number }

export type CourseDashboardStats = {
  total_courses: number
  published_count: number
  draft_count: number
  archived_count: number
  total_enrollments: number
  by_status: CourseStatusCount[]
  enrollments_by_month: CourseEnrollmentMonthBucket[]
  top_courses: CourseTopItem[]
  recent_activity: CourseRecentActivityItem[]
}

/** PATCH body: explicit ``null`` clears nullable fields where the API supports it. */
export type CourseUpdateRequest = Partial<{
  organization_id: number | null
  organization_uuid: string | null
  owner_user_id: number | null
  owner_user_uuid: string | null
  title: string | null
  slug: string | null
  description: string | null
  cover_image_url: string | null
  category: string | null
  status: CourseStatus | null
}>

