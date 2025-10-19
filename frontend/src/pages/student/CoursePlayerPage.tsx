/**
 * CoursePlayerPage
 *
 * Main course learning interface where students can:
 * - View course modules and content
 * - Play videos
 * - Read documents
 * - Track progress
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCourse } from '@/api/courses'
import { Button } from '@/components/ui/Button'

export const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => getCourse(courseId!),
    enabled: !!courseId,
  })

  const handleBackToCourses = () => {
    navigate('/my-courses')
  }

  if (!courseId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center p-12">
          <p className="text-red-600">Course ID not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToCourses}>
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to My Courses
            </Button>
            {course && (
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {course.title}
              </h1>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to load course'}
            </p>
            <Button onClick={handleBackToCourses}>Back to My Courses</Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading course content...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && course && (
        <div className="flex-1 flex overflow-hidden">
          {/* Content Player - Left Side (2/3) */}
          <div className="flex-1 bg-gray-900 flex items-center justify-center">
            {selectedContentId ? (
              <div className="text-white">
                {/* Video/Document player will go here */}
                <p>Content player for ID: {selectedContentId}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Video and document players coming in next phase
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-400 p-8">
                <svg
                  className="w-20 h-20 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-lg">Select a lesson to start learning</p>
              </div>
            )}
          </div>

          {/* Course Sidebar - Right Side (1/3) */}
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Course Content</h2>

              {/* Course description */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">{course.description}</p>
              </div>

              {/* Placeholder for modules and content */}
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  <p>Modules and content items will be displayed here.</p>
                  <p className="mt-2">
                    This requires the modules and content items to be loaded from the API.
                  </p>
                  <p className="mt-2 text-xs">
                    Note: Full course content structure (modules, videos, documents) will be
                    integrated in the next development phase.
                  </p>
                </div>

                {/* Example module structure (placeholder) */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Example Module</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedContentId('example-1')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedContentId === 'example-1'
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
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
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Example Lesson (Placeholder)</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
