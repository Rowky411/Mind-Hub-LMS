/**
 * Courses API client.
 *
 * Handles all course-related API calls.
 */
import { apiClient } from './client'
import type {
  Course,
  CourseCreate,
  CourseUpdate,
  CourseListResponse,
  CourseWithInstructor,
} from '@/types/course'

/**
 * Create a new course.
 */
export const createCourse = async (courseData: CourseCreate): Promise<Course> => {
  const response = await apiClient.post<Course>('/courses', courseData)
  return response.data
}

/**
 * Get list of published courses with pagination and filters.
 */
export const getCourses = async (params?: {
  page?: number
  per_page?: number
  category?: string
  visibility?: string
  is_featured?: boolean
}): Promise<CourseListResponse> => {
  const response = await apiClient.get<CourseListResponse>('/courses', { params })
  return response.data
}

/**
 * Get list of courses created by current instructor.
 */
export const getMyCourses = async (params?: {
  page?: number
  per_page?: number
}): Promise<CourseListResponse> => {
  const response = await apiClient.get<CourseListResponse>('/courses/my-courses', { params })
  return response.data
}

/**
 * Get course details by ID.
 */
export const getCourse = async (courseId: string): Promise<CourseWithInstructor> => {
  const response = await apiClient.get<CourseWithInstructor>(`/courses/${courseId}`)
  return response.data
}

/**
 * Update an existing course.
 */
export const updateCourse = async (
  courseId: string,
  courseData: CourseUpdate
): Promise<Course> => {
  const response = await apiClient.put<Course>(`/courses/${courseId}`, courseData)
  return response.data
}

/**
 * Delete a course (soft delete).
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  await apiClient.delete(`/courses/${courseId}`)
}
