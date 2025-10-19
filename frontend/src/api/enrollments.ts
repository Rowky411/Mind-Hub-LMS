/**
 * Enrollments API client.
 *
 * Handles all enrollment-related API calls.
 */
import { apiClient } from './client'
import type {
  Enrollment,
  EnrollmentWithCourse,
  EnrollmentCreate,
  EnrollmentStats,
} from '@/types/enrollment'

/**
 * Enroll in a course.
 *
 * @param courseId - ID of the course to enroll in
 * @returns Created enrollment
 */
export const enrollInCourse = async (courseId: string): Promise<Enrollment> => {
  const payload: EnrollmentCreate = { course_id: courseId }
  const response = await apiClient.post<Enrollment>('/enrollments', payload)
  return response.data
}

/**
 * Get current user's enrollments with course details.
 *
 * @returns List of enrollments with nested course information
 */
export const getMyEnrollments = async (): Promise<EnrollmentWithCourse[]> => {
  const response = await apiClient.get<EnrollmentWithCourse[]>('/enrollments/my-courses')
  return response.data
}

/**
 * Unenroll from a course (soft delete).
 *
 * @param enrollmentId - ID of the enrollment to remove
 */
export const unenrollFromCourse = async (enrollmentId: string): Promise<void> => {
  await apiClient.delete(`/enrollments/${enrollmentId}`)
}

/**
 * Get course roster (instructor/admin only).
 *
 * @param courseId - ID of the course
 * @returns List of enrolled students with progress
 */
export const getCourseRoster = async (courseId: string): Promise<EnrollmentStats[]> => {
  const response = await apiClient.get<EnrollmentStats[]>(`/courses/${courseId}/roster`)
  return response.data
}
