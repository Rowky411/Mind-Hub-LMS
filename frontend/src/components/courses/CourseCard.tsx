/**
 * CourseCard component.
 *
 * Displays course summary with thumbnail, title, and metadata.
 */
import { Card } from '@/components/ui/Card'
import type { Course, CourseWithInstructor } from '@/types/course'

interface CourseCardProps {
  course: Course | CourseWithInstructor
  onClick?: () => void
  showInstructor?: boolean
  showEnrollment?: boolean
}

const getVisibilityBadge = (visibility: string) => {
  const badges = {
    public: { label: 'Public', className: 'bg-green-100 text-green-800' },
    private: { label: 'Private', className: 'bg-yellow-100 text-yellow-800' },
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  }

  const badge = badges[visibility as keyof typeof badges] || badges.draft

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  )
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    programming: 'Programming',
    design: 'Design',
    business: 'Business',
    marketing: 'Marketing',
    'data-science': 'Data Science',
    'personal-development': 'Personal Development',
    other: 'Other',
  }

  return labels[category] || category
}

export const CourseCard = ({
  course,
  onClick,
  showInstructor = false,
  showEnrollment = false,
}: CourseCardProps) => {
  const instructorName = 'instructor_name' in course ? course.instructor_name : null

  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden transition-all hover:shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}

        {/* Featured Badge */}
        {course.is_featured && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
              Featured
            </span>
          </div>
        )}

        {/* Visibility Badge */}
        <div className="absolute top-2 right-2">
          {getVisibilityBadge(course.visibility)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <div className="mb-2">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            {getCategoryLabel(course.category)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {course.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2">
          {/* Instructor */}
          {showInstructor && instructorName && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {instructorName}
            </div>
          )}

          {/* Enrollment */}
          {showEnrollment && course.enrollment_capacity && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {course.enrollment_capacity} max students
            </div>
          )}

          {/* Publish Status */}
          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {course.is_published ? 'Published' : 'Unpublished'}
          </div>
        </div>
      </div>
    </Card>
  )
}
