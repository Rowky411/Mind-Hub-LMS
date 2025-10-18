/**
 * TypeScript types for Course domain.
 *
 * Defines types for courses, modules, content items, and related entities.
 */

/**
 * Course visibility options.
 */
export enum CourseVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DRAFT = 'draft',
}

/**
 * Content type options.
 */
export enum ContentType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  TEXT = 'text',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}

/**
 * Course category (common categories).
 */
export type Category =
  | 'programming'
  | 'design'
  | 'business'
  | 'marketing'
  | 'data-science'
  | 'personal-development'
  | 'other'

/**
 * Base course interface.
 */
export interface Course {
  id: string
  instructor_id: string
  title: string
  description: string
  category: string
  visibility: CourseVisibility
  enrollment_capacity: number | null
  thumbnail_url: string | null
  is_featured: boolean
  created_at: string
  updated_at: string
  is_published: boolean
  is_public: boolean
}

/**
 * Course with instructor details.
 */
export interface CourseWithInstructor extends Course {
  instructor_name: string
  instructor_email: string
}

/**
 * Course creation request.
 */
export interface CourseCreate {
  title: string
  description: string
  category: string
  visibility?: CourseVisibility
  enrollment_capacity?: number | null
  thumbnail_url?: string | null
  is_featured?: boolean
}

/**
 * Course update request.
 */
export interface CourseUpdate {
  title?: string
  description?: string
  category?: string
  visibility?: CourseVisibility
  enrollment_capacity?: number | null
  thumbnail_url?: string | null
  is_featured?: boolean
}

/**
 * Paginated course list response.
 */
export interface CourseListResponse {
  courses: Course[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

/**
 * Module for organizing course content.
 */
export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

/**
 * Module creation request.
 */
export interface ModuleCreate {
  course_id: string
  title: string
  description?: string | null
  order_index: number
}

/**
 * Module update request.
 */
export interface ModuleUpdate {
  title?: string
  description?: string | null
  order_index?: number
}

/**
 * Content item (video, document, text, etc.).
 */
export interface ContentItem {
  id: string
  course_id: string
  module_id: string | null
  title: string
  description: string | null
  content_type: ContentType
  file_url: string | null
  file_size: number | null
  mime_type: string | null
  text_content: string | null
  duration_seconds: number | null
  order_index: number
  is_required: boolean
  created_at: string
  updated_at: string
  is_file_based: boolean
  is_text_based: boolean
}

/**
 * Content item creation request.
 */
export interface ContentItemCreate {
  course_id: string
  module_id?: string | null
  title: string
  description?: string | null
  content_type: ContentType
  text_content?: string | null
  duration_seconds?: number | null
  order_index: number
  is_required?: boolean
}

/**
 * Content item update request.
 */
export interface ContentItemUpdate {
  title?: string
  description?: string | null
  text_content?: string | null
  duration_seconds?: number | null
  order_index?: number
  is_required?: boolean
}

/**
 * Content upload response.
 */
export interface ContentItemUploadResponse {
  content_item: ContentItem
  upload_url: string | null
}

/**
 * Form data for content upload.
 */
export interface ContentUploadFormData {
  file: File
  course_id: string
  title: string
  content_type: ContentType
  order_index: number
  description?: string
  module_id?: string
  text_content?: string
  duration_seconds?: number
  is_required?: boolean
}
