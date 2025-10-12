/**
 * TypeScript types for API requests and responses.
 *
 * Provides type safety for all API interactions.
 */

/**
 * Common timestamp fields for all entities.
 */
export interface Timestamps {
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

/**
 * User role enumeration.
 */
export type UserRole = 'student' | 'instructor' | 'admin'

/**
 * User entity from API.
 */
export interface User extends Timestamps {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar: string | null
  bio?: string | null
  isActive: boolean
}

/**
 * Course entity from API.
 */
export interface Course extends Timestamps {
  id: string
  title: string
  description: string
  thumbnail: string | null
  instructorId: string
  instructor?: User
  categoryId?: string | null
  isPublished: boolean
  lessonCount?: number
  enrollmentCount?: number
  averageRating?: number
  duration?: number // Total duration in minutes
}

/**
 * Lesson type enumeration.
 */
export type LessonType = 'video' | 'text' | 'quiz'

/**
 * Lesson entity from API.
 */
export interface Lesson extends Timestamps {
  id: string
  courseId: string
  title: string
  description?: string | null
  type: LessonType
  content: string // URL for video, markdown for text, JSON for quiz
  duration?: number | null // Duration in minutes
  order: number
  isPublished: boolean
}

/**
 * Enrollment entity from API.
 */
export interface Enrollment extends Timestamps {
  id: string
  userId: string
  courseId: string
  user?: User
  course?: Course
  enrolledAt: string
  completedAt?: string | null
  progress: number // 0-100 percentage
  status: 'active' | 'completed' | 'dropped'
}

/**
 * Progress tracking entity from API.
 */
export interface Progress extends Timestamps {
  id: string
  userId: string
  lessonId: string
  enrollmentId: string
  isCompleted: boolean
  lastPosition?: number | null // For video lessons
  completedAt?: string | null
  timeSpent?: number // Time spent in minutes
}

/**
 * Assignment entity from API.
 */
export interface Assignment extends Timestamps {
  id: string
  courseId: string
  title: string
  description: string
  dueDate?: string | null
  maxScore: number
  attachments?: string[]
  isPublished: boolean
}

/**
 * Assignment submission entity from API.
 */
export interface Submission extends Timestamps {
  id: string
  assignmentId: string
  userId: string
  user?: User
  content: string
  attachments?: string[]
  submittedAt: string
  grade?: number | null
  feedback?: string | null
  gradedAt?: string | null
  gradedBy?: string | null
}

/**
 * Certificate entity from API.
 */
export interface Certificate extends Timestamps {
  id: string
  userId: string
  courseId: string
  user?: User
  course?: Course
  issuedAt: string
  certificateUrl: string
  verificationCode: string
}

/**
 * Category entity from API.
 */
export interface Category extends Timestamps {
  id: string
  name: string
  description?: string | null
  slug: string
  parentId?: string | null
  courseCount?: number
}

/**
 * Pagination parameters for list requests.
 */
export interface PaginationParams {
  page?: number
  perPage?: number
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Course filters for listing.
 */
export interface CourseFilters extends PaginationParams {
  search?: string
  instructorId?: string
  categoryId?: string
  isPublished?: boolean
  sortBy?: 'title' | 'createdAt' | 'enrollmentCount' | 'averageRating'
  sortOrder?: 'asc' | 'desc'
}

/**
 * User filters for listing.
 */
export interface UserFilters extends PaginationParams {
  search?: string
  role?: UserRole
  isActive?: boolean
  sortBy?: 'email' | 'firstName' | 'lastName' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Enrollment filters for listing.
 */
export interface EnrollmentFilters extends PaginationParams {
  userId?: string
  courseId?: string
  status?: 'active' | 'completed' | 'dropped'
  sortBy?: 'enrolledAt' | 'progress' | 'completedAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Assignment filters for listing.
 */
export interface AssignmentFilters extends PaginationParams {
  courseId?: string
  isPublished?: boolean
  sortBy?: 'title' | 'dueDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Login request payload.
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Login response payload.
 */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

/**
 * Register request payload.
 */
export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

/**
 * Register response payload (same as login).
 */
export type RegisterResponse = LoginResponse

/**
 * Refresh token request payload.
 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/**
 * Refresh token response payload.
 */
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

/**
 * API error response structure.
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  requestId?: string
}

/**
 * Course creation request payload.
 */
export interface CreateCourseRequest {
  title: string
  description: string
  thumbnail?: File | null
  categoryId?: string | null
  isPublished?: boolean
}

/**
 * Course update request payload.
 */
export type UpdateCourseRequest = Partial<CreateCourseRequest>

/**
 * Lesson creation request payload.
 */
export interface CreateLessonRequest {
  courseId: string
  title: string
  description?: string | null
  type: LessonType
  content: string
  duration?: number | null
  order: number
  isPublished?: boolean
}

/**
 * Lesson update request payload.
 */
export type UpdateLessonRequest = Partial<Omit<CreateLessonRequest, 'courseId'>>

/**
 * Progress update request payload.
 */
export interface UpdateProgressRequest {
  isCompleted?: boolean
  lastPosition?: number
  timeSpent?: number
}

/**
 * Assignment creation request payload.
 */
export interface CreateAssignmentRequest {
  courseId: string
  title: string
  description: string
  dueDate?: string | null
  maxScore: number
  attachments?: string[]
  isPublished?: boolean
}

/**
 * Assignment update request payload.
 */
export type UpdateAssignmentRequest = Partial<Omit<CreateAssignmentRequest, 'courseId'>>

/**
 * Submission creation request payload.
 */
export interface CreateSubmissionRequest {
  assignmentId: string
  content: string
  attachments?: File[]
}

/**
 * Grade submission request payload.
 */
export interface GradeSubmissionRequest {
  grade: number
  feedback?: string
}
