/**
 * CourseDetailsPage.
 *
 * Page displaying detailed course information, modules, and content.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ModuleList } from '@/components/courses/ModuleList'
import { getCourse } from '@/api/courses'
import type { CourseWithInstructor, Module } from '@/types/course'

export const CourseDetailsPage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<CourseWithInstructor | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        const courseData = await getCourse(courseId)
        setCourse(courseData)
        // TODO: Fetch modules when module API is implemented
        setModules([])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load course'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleEnroll = () => {
    // TODO: Implement enrollment when enrollment API is ready
    console.log('Enroll in course:', courseId)
    alert('Enrollment feature coming soon!')
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading course...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-600">{error || 'Course not found'}</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/courses')}
            className="mt-4"
          >
            Back to Catalog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/courses')}
        className="text-blue-600 hover:text-blue-700 mb-6 flex items-center"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Header */}
          <div>
            {/* Thumbnail */}
            {course.thumbnail_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Title and Category */}
            <div className="mb-4">
              <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                {course.category}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-4">
                {course.title}
              </h1>

              {/* Instructor Info */}
              <div className="flex items-center text-gray-600">
                <svg
                  className="w-5 h-5 mr-2"
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
                <span>Instructor: {course.instructor_name}</span>
              </div>
            </div>

            {/* Description */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About This Course</h2>
                <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
              </div>
            </Card>
          </div>

          {/* Course Content */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Content</h2>
            {modules.length > 0 ? (
              <ModuleList modules={modules} />
            ) : (
              <Card>
                <div className="p-8 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
                  <p className="text-gray-600">
                    Course content is being prepared by the instructor.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enroll in Course</h3>

              <div className="space-y-3 mb-6">
                {/* Enrollment Capacity */}
                {course.enrollment_capacity && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 mr-2"
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
                    <span>Max {course.enrollment_capacity} students</span>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{course.is_published ? 'Active' : 'Coming Soon'}</span>
                </div>

                {/* Featured Badge */}
                {course.is_featured && (
                  <div className="flex items-center text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured Course
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleEnroll}
                disabled={!course.is_published}
                className="w-full"
              >
                {course.is_published ? 'Enroll Now' : 'Coming Soon'}
              </Button>

              {!course.is_published && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This course is not yet available for enrollment
                </p>
              )}
            </div>
          </Card>

          {/* Course Info */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <p className="text-gray-600 mt-1">{course.category}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Visibility:</span>
                  <p className="text-gray-600 mt-1 capitalize">{course.visibility}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p className="text-gray-600 mt-1">
                    {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <p className="text-gray-600 mt-1">
                    {new Date(course.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Instructor Card */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor</h3>
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                  {course.instructor_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{course.instructor_name}</p>
                  <p className="text-sm text-gray-500">{course.instructor_email}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
