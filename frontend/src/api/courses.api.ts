import { apiClient } from './client'
import type {
  Course,
  CourseCreateRequest,
  CourseDashboardStats,
  CourseListResponse,
  CourseStatus,
  CourseUpdateRequest,
} from '../types/course.types'

export async function listCourses(params?: {
  limit?: number
  offset?: number
  organization_id?: number | null
  organization_uuid?: string | null
  owner_user_id?: number | null
  owner_user_uuid?: string | null
  status?: CourseStatus | null
  search?: string | null
}) {
  const { data } = await apiClient.get<CourseListResponse>('/courses', { params })
  return data
}

export async function getCourseStatsSummary() {
  const { data } = await apiClient.get<CourseDashboardStats>('/courses/stats/summary')
  return data
}

export async function createCourse(payload: CourseCreateRequest) {
  const { data } = await apiClient.post<Course>('/courses', payload)
  return data
}

export async function updateCourse(course_id: number, payload: CourseUpdateRequest) {
  const { data } = await apiClient.patch<Course>(`/courses/${course_id}`, payload)
  return data
}

export async function deleteCourse(course_id: number) {
  const { data } = await apiClient.delete<Course>(`/courses/${course_id}`)
  return data
}

