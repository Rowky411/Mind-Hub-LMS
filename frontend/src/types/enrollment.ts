/**
 * TypeScript types for enrollment-related data
 */

import type { Course } from './course'

/**
 * Enrollment entity
 */
export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrollment_date: string
  completion_percentage: number
  is_completed: boolean
  completion_date: string | null
  unenrollment_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Enrollment with full course details
 * Used in my-courses endpoint
 */
export interface EnrollmentWithCourse extends Enrollment {
  course: Course
}

/**
 * Request payload for creating an enrollment
 */
export interface EnrollmentCreate {
  course_id: string
}

/**
 * Enrollment statistics for course roster
 */
export interface EnrollmentStats {
  student_id: string
  student_name: string
  student_email: string
  enrollment_date: string
  completion_percentage: number
  is_completed: boolean
  last_activity: string | null
}
